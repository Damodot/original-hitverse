// One-time: copy the media the site uses from the original repo into client/public/media,
// shrinking images to WebP and re-encoding the background videos for the web.
// Songs are copied untouched so audio quality stays as released.
// Usage: node scripts/optimize-media.mjs [path/to/original-hitverse/public]
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const src = path.resolve(process.argv[2] ?? '../original-hitverse/public');
const out = path.resolve('client/public/media');
for (const d of ['img', 'audio', 'video']) mkdirSync(path.join(out, d), { recursive: true });

// [source file, output name, max width]
const images = [
  ['pexels-mark-angelo-sampan-738078-1587927.jpg', 'hero', 2000],
  ['DAMODOT.jpg', 'damodot', 1200],
  ['Damn.jpg', 'damn', 900],
  ['damo7.jpg', 'damo7', 1200],
  ['Damo1.jpg', 'damo1', 900],
  ['damo6.jpg', 'damo6', 900],
  ['damo3.jpg', 'damo3', 900],
  ['damio8.jpg', 'damo8', 900],
  ['soundCheck.jpg', 'cover-soundcheck', 800],
  ['IMG_3189.jpg', 'cover-pop', 800],
  ['IMG-9415.jpg', 'cover-killaman', 800],
  ['nobody.jpg', 'cover-nobody', 800],
  ['body bag.jpg', 'cover-bodybag', 800],
  ['dj great +++.jpg', 'cover-mashup', 800],
  ['default img.png', 'cover-default', 600],
];
const logos = [
  ['Music Platform.png', 'logo-wordmark', 800],
  ['Hitverse Logogogo.png', 'logo-wordmark-alt', 800],
  ['hitverse-logo.png', 'logo-mark', 512],
];
const audio = [
  'damodotMashup.mp3', 'onGod.mp3', 'koMaGbon.mp3', 'cumeAlong.mp3', 'wantingMore.mp3',
  'fckedUp.mp3', 'Mind.mp3', 'Oshey.mp3', 'Majo.mp3', 'bootyCall.mp3', 'bolo.mp3',
  'killaman.mp3', 'Nobody.mp3', 'bodyBag.mp3',
];
const videos = [
  ['comp1.mp4', 'showcase'],
  ['bacgVid.mp4', 'auth-bg'],
];

const kb = (f) => `${Math.round(statSync(f).size / 1024)} KB`;

for (const [file, name, width] of images) {
  const dest = path.join(out, 'img', `${name}.webp`);
  await sharp(path.join(src, file)).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toFile(dest);
  console.log(`img   ${file} -> ${name}.webp (${kb(dest)})`);
}
for (const [file, name, width] of logos) {
  const dest = path.join(out, 'img', `${name}.webp`);
  await sharp(path.join(src, file)).resize({ width, withoutEnlargement: true }).webp({ quality: 90 }).toFile(dest);
  console.log(`logo  ${file} -> ${name}.webp (${kb(dest)})`);
}
// Favicon
await sharp(path.join(src, 'hitverse-logo.png')).resize(64).png().toFile(path.resolve('client/public/favicon.png'));

for (const file of audio) {
  const dest = path.join(out, 'audio', file.toLowerCase());
  if (!existsSync(dest)) copyFileSync(path.join(src, file), dest);
  console.log(`audio ${file} (${kb(dest)})`);
}
for (const [file, name] of videos) {
  const dest = path.join(out, 'video', `${name}.mp4`);
  const poster = path.join(out, 'img', `${name}-poster.webp`);
  // Background videos play muted, so drop the audio track; 720p is plenty behind overlays.
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(src, file), '-an',
    '-vf', 'scale=-2:720', '-c:v', 'libx264', '-preset', 'slow', '-crf', '28',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', dest]);
  const frame = execFileSync('ffmpeg', ['-loglevel', 'error', '-ss', '1', '-i', dest, '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-']);
  await sharp(frame).webp({ quality: 70 }).toFile(poster);
  console.log(`video ${file} -> ${name}.mp4 (${kb(dest)})`);
}

// Light-mode wordmark: recolor the white parts (the "HIT" letters and mascot) to near-black, keep the purple.
{
  const { data, info } = await sharp(path.join(out, 'img', 'logo-wordmark.webp')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (Math.min(r, g, b) > 150 && Math.max(r, g, b) - Math.min(r, g, b) < 40) {
      data[i] = 18; data[i + 1] = 16; data[i + 2] = 21;
    }
  }
  await sharp(data, { raw: info }).webp({ quality: 90 }).toFile(path.join(out, 'img', 'logo-wordmark-dark.webp'));
  console.log('logo  logo-wordmark-dark.webp');
}
