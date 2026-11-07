// Karaoke beats and DJ-mix data. The work itself happens in lib/audioTools.js; uploads of an artist's own beat
// go through POST /api/artist/songs/:id/karaoke.
import mongoose from 'mongoose';
import { audioToolsReady, karaokeBusy, queueKaraoke, queueMixAnalysis } from '../../lib/audioTools.js';
import { hasPremium } from '../../lib/premium.js';
import { deleteFile } from '../../lib/storage.js';
import { Song } from '../../models/Song.js';
import { limit, requireAdmin, requireUser } from '../context.js';
import { fail, notFound } from '../errors.js';
import { editableSong } from '../permissions.js';
import { SONG_FIELDS } from './shared.js';

const reload = (id) => Song.findById(id).select(SONG_FIELDS).lean();

/** True for the song's uploader and admins. */
async function managesSong(song, ctx) {
  const user = await ctx.user();
  if (!user) return false;
  return user.role === 'admin' || Boolean(song.uploader && String(song.uploader) === String(user._id));
}

export const audioResolvers = {
  Query: {
    audioToolsReady: () => audioToolsReady(),
    song: async (_, { id }, ctx) => {
      await requireUser(ctx);
      if (!mongoose.isValidObjectId(id)) throw notFound('Song');
      return reload(id);
    },
  },
  Mutation: {
    // A fan wants to sing this song. A beat that's already made goes live; otherwise HitVerse makes one now and it
    // goes live when it's done (about a minute). The artist is told and can hide it or swap in their own beat.
    requestKaraoke: async (_, { songId }, ctx) => {
      const user = await requireUser(ctx);
      if (!hasPremium(user)) throw fail('Karaoke is a Premium feature', 'FORBIDDEN', { premium: true });
      if (!mongoose.isValidObjectId(songId)) throw notFound('Song');
      const song = await Song.findById(songId).select('title previewOnly karaoke');
      if (!song) throw notFound('Song');
      const k = song.karaoke ?? {};
      if (song.previewOnly) throw fail('This song only has a 30-second preview, so it can’t do karaoke yet.');
      if (k.hidden) throw fail('The artist turned karaoke off for this song.');
      if (k.status === 'ready') {
        if (!k.published) await Song.updateOne({ _id: song._id }, { $set: { 'karaoke.published': true, 'karaoke.updatedAt': new Date() } });
        return reload(song._id);
      }
      const asker = { $set: { 'karaoke.requested': true }, $addToSet: { 'karaoke.requestedBy': user._id } };
      if (['queued', 'processing'].includes(k.status) && karaokeBusy(song._id)) {
        await Song.updateOne({ _id: song._id }, asker);
        return reload(song._id);
      }
      if (!audioToolsReady()) throw fail('Karaoke isn’t available for this song yet.', 'UNAVAILABLE');
      limit(ctx, 'karaoke-request', 20, 60 * 60 * 1000); // each new beat takes real work on the server
      await Song.updateOne({ _id: song._id }, asker);
      await queueKaraoke(song._id, null);
      return reload(song._id);
    },
    makeKaraoke: async (_, { songId }, ctx) => {
      const song = await editableSong(ctx, songId, 'title previewOnly karaoke uploader');
      if (song.previewOnly) throw fail('Upload the full song first: a 30-second preview can’t be made into a karaoke beat.');
      if (['queued', 'processing'].includes(song.karaoke?.status)) throw fail('This beat is already being made');
      const user = await ctx.user();
      await queueKaraoke(song._id, user._id);
      return reload(song._id);
    },
    publishKaraoke: async (_, { songId, published }, ctx) => {
      const song = await editableSong(ctx, songId, 'karaoke');
      if (song.karaoke?.status !== 'ready') throw fail('There’s no karaoke beat to publish yet');
      // Hiding also stops fans from asking for a new one; publishing lifts that.
      await Song.updateOne({ _id: song._id }, { $set: { 'karaoke.published': published, 'karaoke.hidden': !published, 'karaoke.updatedAt': new Date() } });
      return reload(song._id);
    },
    deleteKaraoke: async (_, { songId }, ctx) => {
      const song = await editableSong(ctx, songId, 'karaoke');
      if (['queued', 'processing'].includes(song.karaoke?.status)) throw fail('Wait for the beat to finish, then remove it');
      await Song.updateOne({ _id: song._id }, { $set: { karaoke: { status: 'none' } } });
      await deleteFile(song.karaoke?.file);
      return reload(song._id);
    },
    analyzeMix: async (_, { songId }, ctx) => {
      const song = await editableSong(ctx, songId, 'previewOnly');
      if (song.previewOnly) throw fail('Upload the full song first');
      if (!(await queueMixAnalysis(song._id)) && !audioToolsReady()) throw fail('The audio tools aren’t installed on this server', 'UNAVAILABLE');
      return reload(song._id);
    },
    adminAnalyzeAllMixes: async (_, __, ctx) => {
      await requireAdmin(ctx);
      if (!audioToolsReady()) throw fail('The audio tools aren’t installed on this server', 'UNAVAILABLE');
      const songs = await Song.find({ previewOnly: { $ne: true } }).select('_id').lean();
      let queued = 0;
      for (const s of songs) if (await queueMixAnalysis(s._id)) queued++;
      return queued;
    },
  },
  Song: {
    // The beat fans can sing over: only once it's ready and published, and only for Premium listeners.
    karaoke: async (s, _, ctx) => (s.karaoke?.status === 'ready' && s.karaoke.published && hasPremium(await ctx.user()) ? s.karaoke.audio : null),
    // The full picture (status, unpublished beat to preview, errors) is for the owner and admins.
    karaokeInfo: async (s, _, ctx) => {
      if (!(await managesSong(s, ctx))) return null;
      const k = s.karaoke ?? {};
      return {
        status: k.status ?? 'none',
        source: k.source ?? null,
        audio: k.status === 'ready' ? k.audio : null,
        published: Boolean(k.published),
        hidden: Boolean(k.hidden),
        error: k.error ?? null,
        updatedAt: k.updatedAt ?? null,
      };
    },
    // What a fan's karaoke button can do: ready (published) | making | none (can ask for one) | failed (can ask
    // again) | off (the artist turned it off) | unavailable (a 30-second preview).
    karaokeState: (s) => {
      const k = s.karaoke ?? {};
      if (s.previewOnly) return 'unavailable';
      if (k.status === 'ready' && k.published) return 'ready';
      if (k.hidden) return 'off';
      if (k.status === 'queued' || k.status === 'processing') return 'making';
      if (k.status === 'failed') return 'failed';
      return 'none';
    },
    // DJ mode's beat grid: Premium only (without it the player can only do a plain fade).
    mix: async (s, _, ctx) => (s.mix?.status === 'ready' && hasPremium(await ctx.user())
      ? { bpm: s.mix.bpm ?? null, firstBeat: s.mix.firstBeat ?? 0, mixIn: s.mix.mixIn ?? 0, mixOut: s.mix.mixOut ?? null }
      : null),
    mixStatus: (s) => s.mix?.status ?? 'none',
  },
};
