// Karaoke beats and DJ-mix analysis, done on our own server with the open-source Python tools in
// server/audio-tools: Demucs removes the vocals, librosa finds the tempo, beat grid and mix points.
// Jobs run one at a time in the background, so the API stays fast while a song is being processed.
import { spawn } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { config } from '../config.js';
import { Song } from '../models/Song.js';
import { decodeToWav, encodeForStreaming } from './audio.js';
import { notify, notifyAdmins } from './notify.js';
import { deleteFile, getBucket, mediaUrl, saveFile } from './storage.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const TOOLS = path.resolve(here, '../../audio-tools');
const CLIENT = path.resolve(here, '../../../client');
const VENV_PYTHON = path.join(TOOLS, '.venv/bin/python');

const pythonPath = () => config.audioToolsPython || (existsSync(VENV_PYTHON) ? VENV_PYTHON : '');
export const audioToolsReady = () => Boolean(pythonPath());

function runTool(script, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(pythonPath(), [path.join(TOOLS, script), ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err = (err + d).slice(-4000); });
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => {
      clearTimeout(timer);
      const last = out.trim().split('\n').at(-1);
      if (code === 0 && last) {
        try { return resolve(JSON.parse(last)); } catch { /* fall through */ }
      }
      reject(new Error(`${script} failed: ${err.trim().split('\n').at(-1) || `exit ${code}`}`));
    });
  });
}

/** Copies the song's audio to a local file the tools can read. Built-in songs are already on disk. */
async function songAudioFile(song, dir) {
  const stored = /^\/api\/media\/([a-f0-9]{24})$/.exec(song.audio ?? '');
  if (stored) {
    const file = path.join(dir, 'source');
    await pipeline(getBucket().openDownloadStream(new mongoose.Types.ObjectId(stored[1])), createWriteStream(file));
    return file;
  }
  if (song.audio?.startsWith('/media/')) {
    for (const base of [path.join(CLIENT, 'dist'), path.join(CLIENT, 'public')]) {
      const file = path.join(base, song.audio);
      if (file.startsWith(base + path.sep) && existsSync(file)) return file;
    }
  }
  throw new Error('The song’s audio file could not be found');
}

async function withTempDir(fn) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'hitverse-tools-'));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

// One job at a time: separating vocals uses the whole machine for a minute or two.
const queue = [];
const pending = new Set();
let busy = false;

function enqueue(key, job) {
  if (pending.has(key)) return false;
  pending.add(key);
  queue.push({ key, job });
  pump();
  return true;
}

async function pump() {
  if (busy) return;
  const next = queue.shift();
  if (!next) return;
  busy = true;
  try {
    await next.job();
  } catch (err) {
    console.error(`[audio-tools] ${next.key}:`, err.message);
  } finally {
    pending.delete(next.key);
    busy = false;
    pump();
  }
}

const shortError = (err) => String(err?.message ?? err).slice(0, 200);

/** Removes the vocals from a song (Demucs). The beat waits unpublished until the owner or an admin publishes it. */
export async function queueKaraoke(songId, requestedBy) {
  if (!audioToolsReady()) {
    throw Object.assign(new Error('Karaoke tools aren’t installed on this server yet. Upload the beat instead.'), { expose: true, status: 503 });
  }
  const key = `karaoke:${songId}`;
  if (pending.has(key)) return;
  await Song.updateOne({ _id: songId }, { $set: { 'karaoke.status': 'queued', 'karaoke.error': null, 'karaoke.updatedAt': new Date() } });
  enqueue(key, () => makeKaraoke(songId, requestedBy));
}

async function makeKaraoke(songId, requestedBy) {
  const song = await Song.findById(songId).select('title audio uploader karaoke previewOnly');
  if (!song) return;
  await Song.updateOne({ _id: songId }, { $set: { 'karaoke.status': 'processing', 'karaoke.updatedAt': new Date() } });
  try {
    if (song.previewOnly) throw new Error('This song only has a 30-second preview. Upload the full song first.');
    const encoded = await withTempDir(async (dir) => {
      const wav = path.join(dir, 'song.wav');
      const beat = path.join(dir, 'beat.wav');
      await decodeToWav(await songAudioFile(song, dir), wav);
      await runTool('separate.py', [wav, beat], 15 * 60_000);
      return encodeForStreaming(beat);
    });
    if (!encoded) throw new Error('The beat could not be encoded');
    const fileId = await saveFile(encoded.buffer, {
      filename: `${song._id}-karaoke.${encoded.info.ext}`,
      contentType: encoded.info.contentType,
      metadata: { song: song._id, kind: 'karaoke' },
    });
    // The song may have changed while we worked (an uploaded beat, or the beat removed): only replace an auto beat.
    const fresh = await Song.findById(songId).select('karaoke');
    if (!fresh || (fresh.karaoke?.source === 'upload' && fresh.karaoke?.status === 'ready')) {
      await deleteFile(fileId);
      return;
    }
    const old = fresh.karaoke?.file;
    const hidden = Boolean(fresh.karaoke?.hidden);
    // Fans asked for it: it goes live now (the artist can still hide or replace it). Otherwise it waits for a listen.
    const fansAsked = Boolean(fresh.karaoke?.requested);
    const fans = (fresh.karaoke?.requestedBy ?? []).map(String);
    await Song.updateOne({ _id: songId }, {
      $set: {
        karaoke: {
          status: 'ready', source: 'auto', audio: mediaUrl(fileId), file: fileId, published: fansAsked && !hidden,
          hidden, requested: false, error: null, updatedAt: new Date(),
        },
      },
    });
    if (old && String(old) !== String(fileId)) await deleteFile(old);
    if (fansAsked && !hidden) {
      const owner = {
        type: 'karaoke',
        title: `Fans asked for karaoke on “${song.title}”`,
        body: 'HitVerse removed the vocals and it’s live. Listen, swap in your own beat, or hide it.',
        link: song.uploader ? '/app/artist' : '/app/admin?tab=karaoke',
      };
      if (song.uploader) await notify(song.uploader, owner);
      else await notifyAdmins(owner);
      await notify(fans.filter((f) => f !== String(song.uploader)), {
        type: 'karaoke', title: `Karaoke is ready for “${song.title}”`, body: 'Play it and tap the microphone to sing along.', link: '/app/songs',
      });
      return;
    }
    const who = [song.uploader, requestedBy].filter(Boolean).map(String);
    await notify([...new Set(who)], {
      type: 'karaoke',
      title: `The karaoke beat for “${song.title}” is ready`,
      body: 'Have a listen, then publish it so fans can sing along.',
      link: song.uploader && String(song.uploader) === String(requestedBy) ? '/app/artist' : '/app/admin?tab=karaoke',
    });
  } catch (err) {
    await Song.updateOne({ _id: songId }, { $set: { 'karaoke.status': 'failed', 'karaoke.requested': false, 'karaoke.error': shortError(err), 'karaoke.updatedAt': new Date() } });
    throw err;
  }
}

/** True while a beat is waiting or being made. */
export const karaokeBusy = (songId) => pending.has(`karaoke:${songId}`);

/** Finds the tempo, beat grid and mix points for DJ mode (librosa). Quiet if the tools aren't installed. */
export async function queueMixAnalysis(songId) {
  if (!audioToolsReady()) return false;
  await Song.updateOne({ _id: songId }, { $set: { 'mix.status': 'queued' } });
  return enqueue(`mix:${songId}`, () => analyzeMix(songId));
}

async function analyzeMix(songId) {
  const song = await Song.findById(songId).select('audio previewOnly');
  if (!song) return;
  try {
    if (song.previewOnly) throw new Error('preview only');
    const result = await withTempDir(async (dir) => {
      const wav = path.join(dir, 'song.wav');
      await decodeToWav(await songAudioFile(song, dir), wav);
      return runTool('analyze.py', [wav], 5 * 60_000);
    });
    await Song.updateOne({ _id: songId }, {
      $set: {
        mix: {
          status: 'ready',
          bpm: result.bpm ?? null,
          firstBeat: result.firstBeat ?? 0,
          mixIn: result.mixIn ?? 0,
          mixOut: result.mixOut ?? null,
          analyzedAt: new Date(),
        },
      },
    });
  } catch (err) {
    await Song.updateOne({ _id: songId }, { $set: { 'mix.status': 'failed' } });
    throw err;
  }
}

/** After a restart: finish jobs that were cut off, and analyse any song DJ mode doesn't know yet. */
export async function resumeAudioJobs() {
  if (!audioToolsReady()) {
    console.log('[audio-tools] Python tools not installed: karaoke beats can still be uploaded; DJ mode uses plain crossfades.');
    return;
  }
  const unfinished = await Song.find({ 'karaoke.status': { $in: ['queued', 'processing'] } }).select('_id uploader').lean();
  for (const s of unfinished) await queueKaraoke(s._id, null);
  const unanalysed = await Song.find({ previewOnly: { $ne: true }, 'mix.status': { $nin: ['ready', 'failed'] } }).select('_id').lean();
  for (const s of unanalysed) await queueMixAnalysis(s._id);
  if (unfinished.length || unanalysed.length) {
    console.log(`[audio-tools] queued ${unfinished.length} karaoke and ${unanalysed.length} DJ-mix jobs`);
  }
}
