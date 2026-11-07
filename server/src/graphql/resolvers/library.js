import mongoose from 'mongoose';
import { z } from 'zod';
import { Album } from '../../models/Album.js';
import { Rating } from '../../models/Rating.js';
import { Song } from '../../models/Song.js';
import { User } from '../../models/User.js';
import { requireUser } from '../context.js';
import { fail, notFound } from '../errors.js';
import { SONG_FIELDS } from './shared.js';

const songId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw fail('Invalid id');
  return id;
};
const likeCountOf = async (id) => (await Song.findById(id).select('likeCount').lean())?.likeCount ?? 0;

export const libraryResolvers = {
  Query: {
    songs: async (_, __, ctx) => {
      await requireUser(ctx);
      return Song.find().select(SONG_FIELDS).sort({ order: 1, createdAt: 1 }).lean();
    },
    albums: async (_, __, ctx) => {
      await requireUser(ctx);
      return Album.aggregate([
        { $sort: { order: 1 } },
        { $lookup: { from: 'songs', localField: '_id', foreignField: 'album', as: 'tracks' } },
        { $addFields: { trackCount: { $size: '$tracks' } } },
        { $project: { tracks: 0 } },
      ]);
    },
    album: async (_, { slug }, ctx) => {
      await requireUser(ctx);
      const album = await Album.findOne({ slug }).lean();
      if (!album) throw notFound('Album');
      const songs = await Song.find({ album: album._id }).select(SONG_FIELDS).sort({ trackNumber: 1 }).lean();
      return { album, songs };
    },
    lyrics: async (_, { slug }, ctx) => {
      await requireUser(ctx);
      const song = await Song.findOne({ slug }).select('slug title lyrics +syncedLyrics credits').lean();
      if (!song) throw notFound('Song');
      return {
        slug: song.slug,
        title: song.title,
        lyrics: song.lyrics ?? [],
        synced: song.syncedLyrics?.length ? song.syncedLyrics : null,
        credits: song.credits?.writers?.length || song.credits?.producers?.length ? song.credits : null,
      };
    },
    myLikes: async (_, __, ctx) => (await requireUser(ctx)).likes.map(String),
    myRatings: async (_, __, ctx) => {
      const user = await requireUser(ctx);
      const ratings = await Rating.find({ user: user._id }).select('song value').lean();
      return Object.fromEntries(ratings.map((r) => [String(r.song), r.value]));
    },
  },
  Mutation: {
    recordPlay: async (_, { songId: id }, ctx) => {
      await requireUser(ctx);
      await Song.updateOne({ _id: songId(id) }, { $inc: { plays: 1 } });
      return true;
    },
    // The like count only moves when the fan's like list actually changed, so double taps can't inflate it.
    like: async (_, { songId: id }, ctx) => {
      const user = await requireUser(ctx);
      songId(id);
      if (!(await Song.exists({ _id: id }))) throw notFound('Song');
      const r = await User.updateOne({ _id: user._id, likes: { $ne: id } }, { $push: { likes: id } });
      if (r.modifiedCount) await Song.updateOne({ _id: id }, { $inc: { likeCount: 1 } });
      return likeCountOf(id);
    },
    unlike: async (_, { songId: id }, ctx) => {
      const user = await requireUser(ctx);
      songId(id);
      const r = await User.updateOne({ _id: user._id, likes: id }, { $pull: { likes: id } });
      if (r.modifiedCount) await Song.updateOne({ _id: id, likeCount: { $gt: 0 } }, { $inc: { likeCount: -1 } });
      return likeCountOf(id);
    },
    rate: async (_, args, ctx) => {
      const user = await requireUser(ctx);
      const { value } = z.object({ value: z.number().int().min(0).max(5) }).parse(args);
      const id = songId(args.songId);
      if (!(await Song.exists({ _id: id }))) throw notFound('Song');
      const filter = { user: user._id, song: id };
      const prev = value
        ? await Rating.findOneAndUpdate(filter, { value }, { upsert: true, new: false }).lean()
        : await Rating.findOneAndDelete(filter).lean();
      const inc = value
        ? { ratingSum: value - (prev?.value ?? 0), ratingCount: prev ? 0 : 1 }
        : { ratingSum: -(prev?.value ?? 0), ratingCount: prev ? -1 : 0 };
      const song = await Song.findByIdAndUpdate(id, { $inc: inc }, { new: true }).select('ratingSum ratingCount').lean();
      return { value, ratingSum: song.ratingSum, ratingCount: song.ratingCount };
    },
  },
  Song: {
    artistProfile: (s, _, ctx) => ctx.artist(s.artistId),
    links: (s) => s.links ?? {},
    // Click counts are the owner's business (and admins').
    linkClicks: async (s, _, ctx) => {
      const user = await ctx.user();
      if (!user) return null;
      const own = s.uploader && String(s.uploader) === String(user._id);
      return own || user.role === 'admin' ? (s.linkClicks ?? {}) : null;
    },
  },
};
