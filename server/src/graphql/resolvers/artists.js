import mongoose from 'mongoose';
import { z } from 'zod';
import { config } from '../../config.js';
import { follow, unfollow } from '../../lib/artists.js';
import { lookupIsrc, parseLookup } from '../../lib/isrc.js';
import { sendMail } from '../../lib/mailer.js';
import { notifyAdmins } from '../../lib/notify.js';
import { deleteSong } from '../../lib/songs.js';
import { escapeHtml } from '../../lib/text.js';
import { Artist } from '../../models/Artist.js';
import { Follow } from '../../models/Follow.js';
import { Song } from '../../models/Song.js';
import { User } from '../../models/User.js';
import { requireArtist, requireUser } from '../context.js';
import { fail, forbidden, notFound } from '../errors.js';
import { MY_SONG_FIELDS, SONG_FIELDS } from './shared.js';

const artistById = async (id) => {
  if (!mongoose.isValidObjectId(id)) throw notFound('Artist');
  const artist = await Artist.findById(id);
  if (!artist) throw notFound('Artist');
  return artist;
};

// Social links: full https links only, so a profile can't link to anything sneaky.
const url = z.string().trim().max(300).refine((v) => !v || /^https:\/\/\S+\.\S+/.test(v), 'Use a full link starting with https://');
const profileSchema = z.object({
  name: z.string().trim().min(2, 'Artist name must be at least 2 characters').max(60).optional(),
  bio: z.string().trim().max(3000).optional(),
  genre: z.string().trim().max(60).optional(),
  location: z.string().trim().max(80).optional(),
  socials: z.object({ instagram: url, tiktok: url, x: url, youtube: url, facebook: url, website: url }).partial().optional(),
  fanBaseName: z.string().trim().max(40).optional(),
  fanBaseMember: z.string().trim().max(40).optional(),
  welcome: z.string().trim().max(140).optional(),
});

const optionalUrl = z.string().trim().max(300).refine((v) => !v || /^https?:\/\/\S+\.\S+/.test(v), 'Enter a full link starting with https://');
const applySchema = z.object({
  name: z.string({ error: 'Enter your artist name' }).trim().min(2, 'Artist name must be at least 2 characters').max(60),
  bio: z.string({ error: 'Tell us about your music' }).trim().min(20, 'Tell us a bit more (at least 20 characters)').max(1000),
  link: optionalUrl.optional().nullable().transform((v) => v ?? ''),
});

export const artistResolvers = {
  Query: {
    artists: (_, { featured, limit }) => Artist.find(featured ? { featured: true } : {})
      .sort({ featured: -1, followerCount: -1, createdAt: 1 })
      .limit(Math.min(100, limit ?? 50))
      .lean(),
    artist: (_, { slug }) => Artist.findOne({ slug: String(slug).toLowerCase() }).lean(),
    myFanBases: async (_, __, ctx) => {
      const user = await requireUser(ctx);
      const follows = await Follow.find({ user: user._id }).sort({ createdAt: 1 }).select('artist').lean();
      const artists = await Artist.find({ _id: { $in: follows.map((f) => f.artist) } }).lean();
      const byId = new Map(artists.map((a) => [String(a._id), a]));
      return follows.map((f) => byId.get(String(f.artist))).filter(Boolean);
    },
    studio: async (_, __, ctx) => {
      const user = await requireUser(ctx);
      const songs = user.canUpload()
        ? await Song.find({ uploader: user._id }).select(MY_SONG_FIELDS).sort({ createdAt: -1 }).lean()
        : [];
      const profile = await Artist.findOne({ owner: user._id }).lean();
      return { user, songs, profile };
    },
    isrcLookup: async (_, { query }, ctx) => {
      const user = await requireArtist(ctx);
      const r = await lookupIsrc(user, parseLookup(query));
      if (r.error) throw fail(r.error, r.status === 404 ? 'NOT_FOUND' : 'BAD_USER_INPUT');
      return {
        track: r.track,
        existing: r.existing,
        canAdd: r.own && !r.existing,
        reason: r.existing ? 'already' : !r.own ? `This ISRC belongs to ${r.track.artist}. You can only add your own releases.` : null,
      };
    },
  },
  Mutation: {
    follow: async (_, { artistId }, ctx) => {
      const user = await requireUser(ctx);
      const artist = await artistById(artistId);
      await follow(user._id, artist._id);
      return Artist.findById(artist._id).lean();
    },
    unfollow: async (_, { artistId }, ctx) => {
      const user = await requireUser(ctx);
      const artist = await artistById(artistId);
      await unfollow(user._id, artist._id);
      return Artist.findById(artist._id).lean();
    },
    rep: async (_, { artistId }, ctx) => {
      const user = await requireUser(ctx);
      const artist = await artistById(artistId);
      // Repping a fan base you don't follow yet joins it first.
      await follow(user._id, artist._id);
      user.repping = artist._id;
      await user.save();
      return user;
    },
    applyAsArtist: async (_, args, ctx) => {
      const user = await requireUser(ctx);
      const data = applySchema.parse(args);
      if (user.artist?.status === 'pending') throw fail('Your application is already being reviewed', 'CONFLICT');
      if (user.canUpload()) throw fail('You can already upload music', 'CONFLICT');
      user.artist = { ...data, status: 'pending', appliedAt: new Date(), reviewedAt: undefined, note: undefined };
      await user.save();
      await notifyAdmins({
        type: 'application',
        title: `${data.name} wants to upload music`,
        body: `${user.firstName} ${user.lastName} applied to be an artist.`,
        link: '/app/admin',
      });
      const admins = await User.find({ role: 'admin' }).select('email').lean();
      const link = `${config.clientUrl}/app/admin`;
      await Promise.all(admins.map((a) => sendMail({
        to: a.email,
        subject: `New artist application: ${data.name}`,
        text: `${user.firstName} ${user.lastName} (${user.email}) wants to upload music as "${data.name}".\n\nReview it here: ${link}`,
        html: `<p><b>${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</b> (${escapeHtml(user.email)}) wants to upload music as <b>${escapeHtml(data.name)}</b>.</p><p><a href="${link}">Review the application</a></p>`,
      }).catch((err) => console.error('[mail] admin notice failed:', err.message))));
      return user;
    },
    updateArtistProfile: async (_, { artistId, input }, ctx) => {
      const user = await requireUser(ctx);
      const artist = await artistById(artistId);
      const own = artist.owner && String(artist.owner) === String(user._id);
      if (!own && user.role !== 'admin') throw forbidden('You can only edit your own profile');
      const data = profileSchema.parse(input ?? {});
      for (const key of ['name', 'bio', 'genre', 'location', 'welcome']) if (data[key] !== undefined) artist[key] = data[key];
      if (data.socials) artist.socials = { ...(artist.socials?.toObject?.() ?? {}), ...data.socials };
      if (data.fanBaseName !== undefined) artist.fanBase.name = data.fanBaseName;
      if (data.fanBaseMember !== undefined) artist.fanBase.member = data.fanBaseMember;
      // Onboarding is done once there's a bio and a fan base name.
      artist.onboarded = Boolean(artist.bio && artist.fanBase?.name && artist.fanBase?.member);
      await artist.save();
      return artist.toObject();
    },
    deleteMySong: async (_, { songId }, ctx) => {
      const user = await requireArtist(ctx);
      if (!mongoose.isValidObjectId(songId)) throw notFound('Song');
      const song = await Song.findOne({ _id: songId, uploader: user._id });
      if (!song) throw notFound('Song');
      await deleteSong(song);
      return true;
    },
  },
  Artist: {
    bio: (a) => a.bio ?? '',
    genre: (a) => a.genre ?? '',
    location: (a) => a.location ?? '',
    avatar: (a) => a.avatar ?? '',
    banner: (a) => a.banner ?? '',
    socials: (a) => a.socials ?? {},
    fanBase: (a) => ({ name: a.fanBase?.name || `${a.name} fans`, member: a.fanBase?.member || `${a.name} fan` }),
    welcome: (a) => a.welcome || `You’re an official ${a.fanBase?.member || `${a.name} fan`}`,
    gallery: (a) => a.gallery ?? [],
    showcaseVideo: (a) => a.showcaseVideo ?? '',
    showcasePoster: (a) => a.showcasePoster ?? '',
    songCount: (a) => Song.countDocuments({ artistId: a._id }),
    songs: (a) => Song.find({ artistId: a._id }).select(SONG_FIELDS).sort({ order: 1, createdAt: -1 }).lean(),
    isFollowing: async (a, _, ctx) => Boolean(ctx.userId && (await Follow.exists({ user: ctx.userId, artist: a._id }))),
    isRepping: async (a, _, ctx) => {
      const user = await ctx.user();
      return Boolean(user?.repping && String(user.repping) === String(a._id));
    },
    canEdit: async (a, _, ctx) => {
      const user = await ctx.user();
      return Boolean(user && (user.role === 'admin' || (a.owner && String(a.owner) === String(user._id))));
    },
  },
};
