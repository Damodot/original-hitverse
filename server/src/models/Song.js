import mongoose from 'mongoose';
import { PLATFORM_IDS } from '../lib/platforms.js';

const perPlatform = (type) => Object.fromEntries(PLATFORM_IDS.map((id) => [id, type]));

const songSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    artist: { type: String, default: 'Damodot' }, // display credit, e.g. "Damodot & DJ Great"
    artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', default: null, index: true },
    audio: { type: String, required: true },
    cover: { type: String, required: true },
    album: { type: mongoose.Schema.Types.ObjectId, ref: 'Album', default: null, index: true },
    trackNumber: { type: Number, default: 0 },
    order: { type: Number, default: 0, index: true },
    duration: { type: Number, default: 0 },
    lyrics: { type: [String], default: [], select: false },
    hasLyrics: { type: Boolean, default: false },
    // Synced lyrics: each line with the second it starts. Shown karaoke-style while the song plays.
    syncedLyrics: { type: [{ _id: false, t: Number, text: String }], default: undefined, select: false },
    hasSynced: { type: Boolean, default: false },
    // Set once lyrics are edited on the site, so re-running the seed never overwrites them.
    lyricsEdited: { type: Boolean, default: false },
    // Credits from the song's owner, shown after the lyrics.
    credits: {
      writers: { type: [String], default: undefined },
      producers: { type: [String], default: undefined },
    },
    // The artist account that uploaded this song. Null for the built-in catalog.
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    // GridFS ids behind `audio` and `cover`, so the files can be deleted with the song.
    files: {
      audio: { type: mongoose.Schema.Types.ObjectId, default: null },
      cover: { type: mongoose.Schema.Types.ObjectId, default: null },
    },
    plays: { type: Number, default: 0 },
    // Kept in step with users' likes and the Rating collection, so lists can show them without extra queries.
    likeCount: { type: Number, default: 0, min: 0 },
    ratingSum: { type: Number, default: 0, min: 0 },
    ratingCount: { type: Number, default: 0, min: 0 },
    // Where else the song is streaming, and how many times each "Listen on" button was clicked.
    links: perPlatform({ type: String, trim: true, maxlength: 500 }),
    // The recording's ISRC (from DistroKid etc.), used to look the song up on every platform at once.
    isrc: { type: String, trim: true, uppercase: true, match: /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/ },
    // Services that supplied links, for the credit on the song page (MusicLink's free plan asks for one).
    linkCredits: { type: [String], default: undefined },
    // Added by ISRC without the full file: plays the stores' 30-second preview.
    previewOnly: { type: Boolean, default: false },
    linkClicks: perPlatform({ type: Number, default: 0 }),
    // Karaoke: the song without the vocals. Either the artist uploads their own beat ('upload'), or HitVerse
    // makes one by removing the vocals with Demucs ('auto'). Fans hear it once it's published.
    // On demand: when a fan asks for karaoke, the beat is made and published straight away (`requested`),
    // unless the artist turned karaoke off for the song (`hidden`).
    karaoke: {
      status: { type: String, enum: ['none', 'queued', 'processing', 'ready', 'failed'], default: 'none' },
      source: { type: String, enum: ['upload', 'auto'] },
      audio: String,
      file: { type: mongoose.Schema.Types.ObjectId, default: null },
      published: { type: Boolean, default: false },
      hidden: { type: Boolean, default: false },
      requested: { type: Boolean, default: false },
      requestedBy: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: undefined },
      error: String,
      updatedAt: Date,
    },
    // DJ mode: the beat grid (beat n is at firstBeat + n * 60 / bpm) and where to mix in and out, in seconds.
    mix: {
      status: { type: String, enum: ['none', 'queued', 'ready', 'failed'], default: 'none' },
      bpm: Number,
      firstBeat: Number,
      mixIn: Number,
      mixOut: Number,
      analyzedAt: Date,
    },
  },
  { timestamps: true },
);

songSchema.index({ title: 'text' });
// One song per recording.
songSchema.index({ isrc: 1 }, { unique: true, partialFilterExpression: { isrc: { $type: 'string' } } });

export const Song = mongoose.model('Song', songSchema);
