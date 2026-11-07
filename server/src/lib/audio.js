import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import { open, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseBuffer } from 'music-metadata';

// What artists can upload. Masters (WAV, FLAC, AIFF) and big files are converted to 256 kbps AAC for streaming;
// small MP3/M4A files are stored as they are. The type comes from the file's own bytes, never its name.
export const AUDIO_TYPES = 'WAV, FLAC, AIFF, MP3 or M4A';
const KEEP_AS_IS_BYTES = 30 * 1024 * 1024;
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
// Streaming quality for converted songs. 256k matches Apple Music; 192k saves about a quarter of the space.
const BITRATE = /^\d{2,3}k$/.test(process.env.AUDIO_BITRATE ?? '') ? process.env.AUDIO_BITRATE : '256k';

function sniff(buf) {
  const ascii = (a, b) => buf.subarray(a, b).toString('latin1');
  if (ascii(0, 3) === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0 && (buf[1] & 0x06) !== 0)) {
    return { contentType: 'audio/mpeg', ext: 'mp3' };
  }
  if (ascii(4, 8) === 'ftyp') return { contentType: 'audio/mp4', ext: 'm4a' };
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE') return { contentType: 'audio/wav', ext: 'wav' };
  return null;
}

/** Returns { contentType, ext, duration } or null if this isn't playable audio. */
export async function inspectAudio(buffer) {
  const kind = sniff(buffer);
  if (!kind) return null;
  try {
    const meta = await parseBuffer(buffer, { mimeType: kind.contentType, size: buffer.length }, { duration: true, skipCovers: true });
    const duration = meta.format.duration;
    if (!Number.isFinite(duration) || duration < 1) return null;
    // An M4A container can also hold video; only accept it when there's an audio codec and no video track.
    if (kind.ext === 'm4a' && meta.format.hasVideo) return null;
    return { ...kind, duration: Math.round(duration) };
  } catch {
    return null;
  }
}

/** Recognises the upload formats we accept (including masters we'll convert). */
function sniffUpload(buf) {
  const ascii = (a, b) => buf.subarray(a, b).toString('latin1');
  const playable = sniff(buf);
  if (playable) return playable;
  if (ascii(0, 4) === 'fLaC') return { ext: 'flac' };
  if (ascii(0, 4) === 'FORM' && ['AIFF', 'AIFC'].includes(ascii(8, 12))) return { ext: 'aiff' };
  if (ascii(0, 4) === 'OggS') return { ext: 'ogg' };
  return null;
}

async function readHead(file, n = 64) {
  const fh = await open(file);
  try {
    const buf = Buffer.alloc(n);
    await fh.read(buf, 0, n, 0);
    return buf;
  } finally {
    await fh.close();
  }
}

function run(cmd, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', (d) => { err = (err + d).slice(-2000); });
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e.code === 'ENOENT'
        ? Object.assign(new Error('This file has to be converted, but ffmpeg isn’t installed on the server. Upload an MP3 under 30 MB, or install ffmpeg.'), { status: 400, expose: true })
        : e);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      code === 0 ? resolve() : reject(new Error(`ffmpeg failed: ${err.trim().split('\n').at(-1) || code}`));
    });
  });
}

/**
 * Turns an uploaded file (on disk) into audio ready to stream: { buffer, info, converted } or null if it isn't audio.
 * Small MP3/M4A files are kept as they are; everything else is converted to AAC at AUDIO_BITRATE (256k by default).
 */
export async function prepareUpload(filePath) {
  const kind = sniffUpload(await readHead(filePath));
  if (!kind) return null;
  const { size } = await stat(filePath);
  if ((kind.ext === 'mp3' || kind.ext === 'm4a') && size <= KEEP_AS_IS_BYTES) {
    const buffer = await readFile(filePath);
    const info = await inspectAudio(buffer);
    return info && { buffer, info, converted: false };
  }
  try {
    const encoded = await encodeForStreaming(filePath);
    return encoded && { ...encoded, converted: true };
  } catch (err) {
    if (err.expose) throw err;
    return null; // ffmpeg couldn't read it: not audio we can use
  }
}

/** Converts any audio file ffmpeg can read to streaming AAC at AUDIO_BITRATE: { buffer, info }. */
export async function encodeForStreaming(filePath) {
  const out = path.join(os.tmpdir(), `hitverse-${crypto.randomUUID()}.m4a`);
  try {
    await run(FFMPEG, ['-v', 'error', '-nostdin', '-y', '-i', filePath, '-vn', '-map', '0:a:0',
      '-c:a', 'aac', '-b:a', BITRATE, '-ac', '2', '-ar', '44100', '-movflags', '+faststart', '-map_metadata', '-1', out], 180_000);
    const buffer = await readFile(out);
    const info = await inspectAudio(buffer);
    return info && { buffer, info };
  } finally {
    await rm(out, { force: true });
  }
}

/** Decodes audio to 44.1 kHz stereo 16-bit WAV (what the Python audio tools read). */
export function decodeToWav(input, output) {
  return run(FFMPEG, ['-v', 'error', '-nostdin', '-y', '-i', input, '-vn', '-map', '0:a:0', '-ac', '2', '-ar', '44100', '-c:a', 'pcm_s16le', output], 180_000);
}
