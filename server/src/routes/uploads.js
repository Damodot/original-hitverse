// File uploads stay as plain HTTP routes (GraphQL handles all other data): song files, cover art, and artist
// profile images. Everything else an artist does goes through /graphql.
import crypto from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import multer from 'multer';
import sharp from 'sharp';
import { z } from 'zod';
import { config } from '../config.js';
import { artistIdForSong } from '../lib/artists.js';
import { AUDIO_TYPES, inspectAudio, prepareUpload } from '../lib/audio.js';
import { queueMixAnalysis } from '../lib/audioTools.js';
import { toCredits } from '../lib/credits.js';
import { fetchAsset } from '../lib/fetchAsset.js';
import { artistNameOf, isrcField, lookupIsrc } from '../lib/isrc.js';
import { deleteFile, mediaUrl, saveFile } from '../lib/storage.js';
import { slugify } from '../lib/text.js';
import { approvedArtist, signedIn } from '../middleware/roles.js';
import { Artist } from '../models/Artist.js';
import { Song } from '../models/Song.js';
import { MY_SONG_FIELDS } from '../graphql/resolvers/shared.js';

const router = Router();

const MB = 1024 * 1024;
const DEFAULT_COVER = '/media/img/cover-default.webp';

// The role check runs before the files are read, so an unapproved account can't make the server buffer anything.
const uploadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });
// Uploads go to a temp folder (masters can be hundreds of MB) and are removed when the request ends.
const UPLOAD_DIR = path.join(os.tmpdir(), 'hitverse-uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });
const diskUpload = (fields, maxMb) => {
  const receive = multer({
    storage: multer.diskStorage({ destination: UPLOAD_DIR, filename: (req, file, cb) => cb(null, crypto.randomUUID()) }),
    limits: { fileSize: maxMb * MB, files: fields.length, fields: 8, fieldSize: 20 * 1024 },
  }).fields(fields.map((name) => ({ name, maxCount: 1 })));
  return (req, res, next) => {
    res.on('close', () => {
      for (const f of Object.values(req.files ?? {}).flat()) rm(f.path, { force: true }).catch(() => {});
    });
    receive(req, res, next);
  };
};
const songUpload = diskUpload(['audio', 'cover'], config.maxAudioMb);
const imageUpload = diskUpload(['image'], 15);

const toCover = (buffer) => sharp(buffer, { limitInputPixels: 64e6 }).rotate().resize(800, 800, { fit: 'cover' }).webp({ quality: 82 }).toBuffer();

/** Stores the files and creates the song. Used by both the file upload and the add-by-ISRC flow. */
async function createSong(req, res, { title, artist, lyricsText = '', audio, info, coverBuffer, extra = {} }) {
  const user = req.user;
  const credit = artist ?? artistNameOf(user);
  const slug = `${slugify(title)}-${crypto.randomBytes(3).toString('hex')}`;
  const meta = { uploader: user._id, slug };
  const audioId = await saveFile(audio, { filename: `${slug}.${info.ext}`, contentType: info.contentType, metadata: meta });
  let coverId = null;
  try {
    if (coverBuffer) coverId = await saveFile(coverBuffer, { filename: `${slug}.webp`, contentType: 'image/webp', metadata: meta });
    const lyrics = lyricsText.split(/\r?\n/).map((l) => l.trimEnd());
    while (lyrics.length && !lyrics.at(-1)) lyrics.pop();
    const song = await Song.create({
      slug,
      title,
      artist: credit,
      artistId: await artistIdForSong(user, credit),
      audio: mediaUrl(audioId),
      cover: coverId ? mediaUrl(coverId) : DEFAULT_COVER,
      duration: info.duration,
      lyrics,
      hasLyrics: lyrics.some(Boolean),
      order: 1000, // after the built-in catalog; ties fall back to upload time
      uploader: user._id,
      files: { audio: audioId, cover: coverId },
      ...extra,
    });
    res.status(201).json({ song: await Song.findById(song._id).select(MY_SONG_FIELDS).lean() });
    if (!extra.previewOnly) queueMixAnalysis(song._id).catch(() => {}); // tempo and mix points for DJ mode
  } catch (err) {
    await Promise.all([deleteFile(audioId), deleteFile(coverId)]);
    throw err;
  }
}

const songSchema = z.object({
  writers: z.string().max(1000).optional(),
  producers: z.string().max(1000).optional(),
  title: z.string({ error: 'Give your song a title' }).trim().min(1, 'Give your song a title').max(100),
  lyrics: z.string().max(15000, 'Lyrics are too long').optional().default(''),
});

router.post('/songs', uploadLimiter, approvedArtist, songUpload, async (req, res) => {
  const data = songSchema.parse(req.body ?? {});
  const audio = req.files?.audio?.[0];
  const cover = req.files?.cover?.[0];
  if (!audio) return res.status(400).json({ error: 'Choose an audio file to upload' });
  const prepared = await prepareUpload(audio.path);
  if (!prepared) return res.status(400).json({ error: `That file isn't audio we can use. Upload ${AUDIO_TYPES}.` });
  let coverBuffer = null;
  if (cover) {
    if (cover.size > config.maxCoverMb * MB) return res.status(400).json({ error: `Cover art must be under ${config.maxCoverMb} MB` });
    try {
      coverBuffer = await toCover(await readFile(cover.path));
    } catch {
      return res.status(400).json({ error: 'Cover art must be a JPG, PNG or WebP image' });
    }
  }
  await createSong(req, res, {
    title: data.title, lyricsText: data.lyrics, audio: prepared.buffer, info: prepared.info, coverBuffer,
    extra: { credits: toCredits(req.body) },
  });
});

// Add a released song by its ISRC: title, artwork and streaming links come from MusicLink.
const isrcSongSchema = z.object({
  isrc: isrcField,
  writers: z.string().max(1000).optional(),
  producers: z.string().max(1000).optional(),
  title: z.string().trim().max(100).optional(),
  lyrics: z.string().max(15000, 'Lyrics are too long').optional().default(''),
  usePreview: z.enum(['true', 'false']).optional(),
});

router.post('/songs/isrc', uploadLimiter, approvedArtist, songUpload, async (req, res) => {
  const data = isrcSongSchema.parse(req.body ?? {});
  const r = await lookupIsrc(req.user, data.isrc);
  if (r.error) return res.status(r.status).json({ error: r.error });
  if (r.existing) return res.status(409).json({ error: `“${r.existing.title}” is already on HitVerse` });
  if (!r.own) return res.status(403).json({ error: `This ISRC belongs to ${r.track.artist}. You can only add your own releases.` });

  // Audio: the full song file, or the stores' 30-second preview.
  const file = req.files?.audio?.[0];
  let audio;
  let info;
  let previewOnly = false;
  if (file) {
    const prepared = await prepareUpload(file.path);
    if (!prepared) return res.status(400).json({ error: `That file isn't audio we can use. Upload ${AUDIO_TYPES}.` });
    ({ buffer: audio, info } = prepared);
  } else if (data.usePreview === 'true' && r.item.preview_url) {
    try {
      audio = await fetchAsset(r.item.preview_url, { maxBytes: 15 * MB });
      previewOnly = true;
    } catch {
      return res.status(502).json({ error: 'Couldn’t download the preview. Upload the song file instead.' });
    }
  } else {
    return res.status(400).json({ error: 'Upload the song file, or choose the 30-second preview' });
  }
  info ??= await inspectAudio(audio);
  if (!info) return res.status(400).json({ error: `That file isn't audio we can use. Upload ${AUDIO_TYPES}.` });

  // Artwork: an uploaded cover wins, otherwise the stores' artwork.
  let coverBuffer = null;
  const cover = req.files?.cover?.[0];
  try {
    if (cover) coverBuffer = await toCover(await readFile(cover.path));
    else if (r.track.artwork) coverBuffer = await toCover(await fetchAsset(r.track.artwork, { maxBytes: 10 * MB }));
  } catch {
    coverBuffer = null; // fall back to the default cover rather than failing the whole add
  }

  await createSong(req, res, {
    title: data.title || r.track.title,
    artist: r.track.artist,
    lyricsText: data.lyrics,
    audio,
    info,
    coverBuffer,
    extra: { isrc: r.track.isrc, links: r.track.links, linkCredits: ['MusicLink'], previewOnly, credits: toCredits(req.body) },
  });
});

// Swap in the full song for a preview-only one (or replace any song's audio). Likes, plays, links and the
// song page all stay; only the audio file changes. Owners and admins only.
// Loads the song into req.song if the signed-in artist owns it (admins: any song).
async function ownSong(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const song = await Song.findById(req.params.id);
  if (!song) return res.status(404).json({ error: 'Song not found' });
  const own = song.uploader && String(song.uploader) === String(req.user._id);
  if (!own && req.user.role !== 'admin') return res.status(403).json({ error: 'You can only change your own songs' });
  req.song = song;
  next();
}

router.put('/songs/:id/audio', uploadLimiter, approvedArtist, ownSong, songUpload, async (req, res) => {
  const file = req.files?.audio?.[0];
  if (!file) return res.status(400).json({ error: 'Choose the song file' });
  const prepared = await prepareUpload(file.path);
  if (!prepared) return res.status(400).json({ error: `That file isn't audio we can use. Upload ${AUDIO_TYPES}.` });
  const { buffer, info } = prepared;
  const song = req.song;
  const audioId = await saveFile(buffer, { filename: `${song.slug}.${info.ext}`, contentType: info.contentType, metadata: { uploader: req.user._id, slug: song.slug } });
  const old = song.files?.audio;
  song.audio = mediaUrl(audioId);
  song.files = { ...(song.files?.toObject?.() ?? song.files ?? {}), audio: audioId };
  song.duration = info.duration;
  song.previewOnly = false;
  try {
    await song.save();
  } catch (err) {
    await deleteFile(audioId);
    throw err;
  }
  await deleteFile(old);
  // A beat made from the old audio no longer lines up; an uploaded one is the artist's call.
  if (song.karaoke?.source === 'auto') {
    await deleteFile(song.karaoke.file);
    await Song.updateOne({ _id: song._id }, { $set: { karaoke: { status: 'none' } } });
  }
  queueMixAnalysis(song._id).catch(() => {});
  res.json({ song: await Song.findById(song._id).select(MY_SONG_FIELDS).lean() });
});

// Karaoke: the artist's own instrumental (the beat without vocals). It has to match the song's length so the
// synced lyrics still line up. It replaces any beat HitVerse made and goes live straight away.
const beatUpload = diskUpload(['audio'], config.maxAudioMb);
router.post('/songs/:id/karaoke', uploadLimiter, approvedArtist, ownSong, beatUpload, async (req, res) => {
  const file = req.files?.audio?.[0];
  if (!file) return res.status(400).json({ error: 'Choose the beat (instrumental) file' });
  const song = req.song;
  if (song.previewOnly) return res.status(400).json({ error: 'Upload the full song before adding its karaoke beat' });
  const prepared = await prepareUpload(file.path);
  if (!prepared) return res.status(400).json({ error: `That file isn't audio we can use. Upload ${AUDIO_TYPES}.` });
  const { buffer, info } = prepared;
  if (song.duration && Math.abs(info.duration - song.duration) > 4) {
    return res.status(400).json({ error: `The beat is ${info.duration}s but the song is ${Math.round(song.duration)}s. Use the instrumental of this exact version so the lyrics line up.` });
  }
  const fileId = await saveFile(buffer, { filename: `${song.slug}-karaoke.${info.ext}`, contentType: info.contentType, metadata: { song: song._id, kind: 'karaoke' } });
  const old = song.karaoke?.file;
  await Song.updateOne({ _id: song._id }, {
    $set: { karaoke: { status: 'ready', source: 'upload', audio: mediaUrl(fileId), file: fileId, published: true, hidden: false, requested: false, error: null, updatedAt: new Date() } },
  });
  if (old) await deleteFile(old);
  res.json({ ok: true });
});

// Artist profile pictures: avatar (square) and banner (wide). The profile's owner or an admin.
const IMAGE_SIZES = { avatar: [600, 600], banner: [1920, 640] };
router.post('/profile/:artistId/image/:kind', uploadLimiter, signedIn, async (req, res, next) => {
  const { artistId, kind } = req.params;
  if (!IMAGE_SIZES[kind] || !mongoose.isValidObjectId(artistId)) return res.status(400).json({ error: 'Unknown image' });
  const artist = await Artist.findById(artistId);
  if (!artist) return res.status(404).json({ error: 'Artist not found' });
  const own = artist.owner && String(artist.owner) === String(req.user._id);
  if (!own && req.user.role !== 'admin') return res.status(403).json({ error: 'You can only change your own profile' });
  req.artist = artist;
  next();
}, imageUpload, async (req, res) => {
  const file = req.files?.image?.[0];
  if (!file) return res.status(400).json({ error: 'Choose an image' });
  const { kind } = req.params;
  const [w, h] = IMAGE_SIZES[kind];
  let buffer;
  try {
    buffer = await sharp(await readFile(file.path), { limitInputPixels: 80e6 }).rotate().resize(w, h, { fit: 'cover' }).webp({ quality: 84 }).toBuffer();
  } catch {
    return res.status(400).json({ error: 'Use a JPG, PNG or WebP image' });
  }
  const artist = req.artist;
  const id = await saveFile(buffer, { filename: `${artist.slug}-${kind}.webp`, contentType: 'image/webp', metadata: { artist: artist._id } });
  const old = artist.files?.[kind];
  artist[kind] = mediaUrl(id);
  artist.files = { ...(artist.files?.toObject?.() ?? artist.files ?? {}), [kind]: id };
  await artist.save();
  await deleteFile(old);
  res.json({ url: artist[kind] });
});

export default router;
