// Copies the built-in catalog's audio and cover files (client/public/media) into MongoDB GridFS,
// so the whole library lives in the database. Safe to run again: files already copied are skipped.
// Usage: npm run media:to-db
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { connectDb } from '../db.js';
import { getBucket, mediaUrl, saveFile } from '../lib/storage.js';
import { Album } from '../models/Album.js';
import { Song } from '../models/Song.js';

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../client/public');
const TYPES = { '.mp3': 'audio/mpeg', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };

await connectDb();
const copied = new Map(); // "/media/x.mp3" -> GridFS id (one copy per file, even when songs share a cover)

async function store(webPath) {
  if (!webPath?.startsWith('/media/')) return null;
  if (copied.has(webPath)) return copied.get(webPath);
  const [existing] = await getBucket().find({ 'metadata.sourcePath': webPath }).limit(1).toArray();
  let id = existing?._id;
  if (!id) {
    const buf = await readFile(path.join(publicDir, webPath));
    id = await saveFile(buf, {
      filename: path.basename(webPath),
      contentType: TYPES[path.extname(webPath)] ?? 'application/octet-stream',
      metadata: { sourcePath: webPath },
    });
    console.log(`  copied ${webPath} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
  }
  copied.set(webPath, id);
  return id;
}

let n = 0;
for (const song of await Song.find({ uploader: null, audio: /^\/media\// })) {
  const audioId = await store(song.audio);
  const coverId = await store(song.cover);
  song.audio = mediaUrl(audioId);
  if (coverId) song.cover = mediaUrl(coverId);
  // Shared catalog files are not deleted with a song, so don't record them as the song's own files.
  await song.save();
  n++;
}
for (const album of await Album.find({ cover: /^\/media\// })) {
  album.cover = mediaUrl(await store(album.cover));
  await album.save();
}
console.log(n ? `Moved ${n} songs into MongoDB.` : 'Every catalog song is already in MongoDB.');
await mongoose.disconnect();
