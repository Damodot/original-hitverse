// Loads the catalog into MongoDB. Safe to run again: it upserts by slug and never touches users or likes.
import { readFileSync } from 'node:fs';
import mongoose from 'mongoose';
import { connectDb } from '../db.js';
import { linkCatalogToArtists } from '../lib/artists.js';
import { Album } from '../models/Album.js';
import { Artist } from '../models/Artist.js';
import { Rating } from '../models/Rating.js';
import { Song } from '../models/Song.js';
import { User } from '../models/User.js';
import { damodot } from './artists.js';
import { albums, songs } from './catalog.js';

const lyrics = JSON.parse(readFileSync(new URL('./lyrics.json', import.meta.url), 'utf8'));

await connectDb();

// Files already copied into MongoDB (npm run media:to-db) keep their database links.
// Songs whose lyrics were edited on the site keep them.
const lyricsEdited = new Set((await Song.find({ lyricsEdited: true }).select('slug').lean()).map((s) => s.slug));
const songsInDb = new Set((await Song.find({ audio: /^\/api\/media\// }).select('slug').lean()).map((s) => s.slug));
const albumsInDb = new Set((await Album.find({ cover: /^\/api\/media\// }).select('slug').lean()).map((a) => a.slug));

const albumIds = {};
for (const { cover, ...a } of albums) {
  const update = albumsInDb.has(a.slug) ? a : { ...a, cover };
  const doc = await Album.findOneAndUpdate({ slug: a.slug }, update, { upsert: true, new: true, setDefaultsOnInsert: true });
  albumIds[a.slug] = doc._id;
}

for (const [i, s] of songs.entries()) {
  const { audio, cover, ...rest } = s;
  await Song.updateOne(
    { slug: s.slug },
    {
      $set: {
        ...rest,
        ...(songsInDb.has(s.slug) ? {} : { audio, cover }),
        artist: s.artist ?? 'Damodot',
        album: s.album ? albumIds[s.album] : null,
        trackNumber: s.trackNumber ?? 0,
        order: i,
        ...(lyricsEdited.has(s.slug) ? {} : { lyrics: lyrics[s.slug] ?? [], hasLyrics: Boolean(lyrics[s.slug]?.length) }),
      },
    },
    { upsert: true },
  );
}

// Recount likes and ratings from the source data, so the counters on each song are always right.
const likes = await User.aggregate([{ $unwind: '$likes' }, { $group: { _id: '$likes', n: { $sum: 1 } } }]);
const ratings = await Rating.aggregate([{ $group: { _id: '$song', sum: { $sum: '$value' }, n: { $sum: 1 } } }]);
await Song.updateMany({}, { $set: { likeCount: 0, ratingSum: 0, ratingCount: 0 } });
const ops = [
  ...likes.map((l) => ({ updateOne: { filter: { _id: l._id }, update: { $set: { likeCount: l.n } } } })),
  ...ratings.map((r) => ({ updateOne: { filter: { _id: r._id }, update: { $set: { ratingSum: r.sum, ratingCount: r.n } } } })),
];
if (ops.length) await Song.bulkWrite(ops);

// DAMODOT's artist profile: created once, never overwritten (edits made on the site stay).
const profile = damodot;
const artist = await Artist.findOneAndUpdate(
  { slug: profile.slug },
  { $setOnInsert: profile },
  { upsert: true, new: true },
);
await Album.updateMany({ artistId: null, artist: /damodot/i }, { artistId: artist._id });
const linked = await linkCatalogToArtists();

console.log(`Seeded ${albums.length} albums and ${songs.length} songs; ${linked} songs linked to artist profiles.`);
await mongoose.disconnect();
