import mongoose from 'mongoose';
import { z } from 'zod';
import { config } from '../../config.js';
import { ensureArtistProfile } from '../../lib/artists.js';
import { searchSources } from '../../lib/linkFinder.js';
import { sendMail } from '../../lib/mailer.js';
import { notify } from '../../lib/notify.js';
import { deleteSong } from '../../lib/songs.js';
import { escapeHtml } from '../../lib/text.js';
import { Artist } from '../../models/Artist.js';
import { Song } from '../../models/Song.js';
import { User } from '../../models/User.js';
import { requireAdmin } from '../context.js';
import { notFound } from '../errors.js';
import { onlyFilled } from './shared.js';

const STATUSES = ['pending', 'approved', 'rejected'];
const decisionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  note: z.string().trim().max(500).optional().nullable().transform((v) => v ?? ''),
});

export const adminResolvers = {
  Query: {
    // Every admin field checks the role itself, so `admin` can return an empty object.
    admin: () => ({}),
  },
  Admin: {
    artists: async (_, { status: wanted }, ctx) => {
      await requireAdmin(ctx);
      const status = STATUSES.includes(wanted) ? wanted : 'pending';
      const [users, grouped, uploads] = await Promise.all([
        User.find({ 'artist.status': status })
          .select('firstName lastName email artist createdAt')
          .sort({ 'artist.appliedAt': status === 'pending' ? 1 : -1 }) // oldest request first, so nobody waits forever
          .lean(),
        User.aggregate([{ $match: { 'artist.status': { $in: STATUSES } } }, { $group: { _id: '$artist.status', n: { $sum: 1 } } }]),
        Song.countDocuments({ uploader: { $ne: null } }),
      ]);
      const [songCounts, profiles] = await Promise.all([
        Song.aggregate([{ $match: { uploader: { $in: users.map((a) => a._id) } } }, { $group: { _id: '$uploader', n: { $sum: 1 } } }]),
        Artist.find({ owner: { $in: users.map((a) => a._id) } }).lean(),
      ]);
      const countBy = new Map(songCounts.map((c) => [String(c._id), c.n]));
      const profileBy = new Map(profiles.map((p) => [String(p.owner), p]));
      const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
      for (const g of grouped) counts[g._id] = g.n;
      return {
        counts: { ...counts, uploads },
        artists: users.map((a) => ({
          ...a,
          artist: { status: a.artist?.status ?? 'none', ...a.artist },
          songCount: countBy.get(String(a._id)) ?? 0,
          profile: profileBy.get(String(a._id)) ?? null,
        })),
      };
    },
    songs: async (_, __, ctx) => {
      await requireAdmin(ctx);
      const songs = await Song.find({ uploader: { $ne: null } })
        .select('slug title artist audio cover duration plays createdAt uploader')
        .populate('uploader', 'firstName lastName email artist.name artist.status')
        .sort({ createdAt: -1 })
        .lean();
      return songs.map((s) => ({ ...s, uploader: s.uploader && { ...s.uploader, artist: { status: s.uploader.artist?.status ?? 'none', name: s.uploader.artist?.name } } }));
    },
    links: async (_, __, ctx) => {
      await requireAdmin(ctx);
      const songs = await Song.find().select('slug title artist artistId cover audio links linkClicks uploader order createdAt isrc').sort({ order: 1, createdAt: 1 }).lean();
      return { sources: searchSources(), songs: songs.map((s) => ({ ...s, links: onlyFilled(s.links), linkClicks: s.linkClicks ?? {} })) };
    },
    // How much database space the uploads use, for the meter on the admin page.
    storage: async (_, __, ctx) => {
      await requireAdmin(ctx);
      const [media] = await mongoose.connection.db.collection('media.files')
        .aggregate([{ $group: { _id: null, bytes: { $sum: '$length' }, files: { $sum: 1 } } }]).toArray();
      const stats = await mongoose.connection.db.stats();
      const limitMb = Number(process.env.STORAGE_LIMIT_MB ?? 512); // MongoDB Atlas free plan
      return {
        mediaBytes: media?.bytes ?? 0,
        mediaFiles: media?.files ?? 0,
        totalBytes: (stats.dataSize ?? 0) + (stats.indexSize ?? 0),
        limitBytes: limitMb * 1024 * 1024,
        songs: await Song.countDocuments({ 'files.audio': { $ne: null } }),
      };
    },
    profiles: async (_, __, ctx) => {
      await requireAdmin(ctx);
      return Artist.find().sort({ featured: -1, followerCount: -1, createdAt: 1 }).lean();
    },
  },
  Mutation: {
    adminDecideArtist: async (_, args, ctx) => {
      await requireAdmin(ctx);
      const { status, note } = decisionSchema.parse(args);
      if (!mongoose.isValidObjectId(args.userId)) throw notFound('Account');
      const user = await User.findById(args.userId);
      if (!user || !user.artist?.status || user.artist.status === 'none') throw notFound('Artist application');
      const wasApproved = user.artist.status === 'approved';
      user.artist.status = status;
      user.artist.reviewedAt = new Date();
      user.artist.note = status === 'rejected' ? note || undefined : undefined;
      await user.save();
      const approved = status === 'approved';
      // Approval gives the artist their public profile, ready to fill in.
      if (approved) await ensureArtistProfile(user);
      await notify(user._id, approved
        ? { type: 'approved', title: 'You’re approved as an artist', body: `Set up your artist page and upload music as ${user.artist.name}.`, link: '/app/artist' }
        : {
          type: 'rejected',
          title: wasApproved ? 'Your upload access was removed' : 'Your artist application wasn’t approved',
          body: note || 'You can update your details and apply again.',
          link: '/app/artist',
        });
      const link = `${config.clientUrl}/app/artist`;
      await sendMail({
        to: user.email,
        subject: approved ? 'You can now upload music on HitVerse' : 'Update on your HitVerse artist application',
        text: approved
          ? `Hi ${user.firstName},\n\nYour artist account "${user.artist.name}" is approved. Set up your artist page and upload your first song here:\n${link}`
          : `Hi ${user.firstName},\n\nYour artist application wasn't approved this time.${note ? `\n\nReason: ${note}` : ''}\n\nYou can update it and apply again here:\n${link}`,
        html: approved
          ? `<p>Hi ${escapeHtml(user.firstName)},</p><p>Your artist account <b>${escapeHtml(user.artist.name)}</b> is approved. <a href="${link}">Set up your artist page and upload your first song</a>.</p>`
          : `<p>Hi ${escapeHtml(user.firstName)},</p><p>Your artist application wasn't approved this time.</p>${note ? `<p>Reason: ${escapeHtml(note)}</p>` : ''}<p>You can <a href="${link}">update it and apply again</a>.</p>`,
      }).catch((err) => console.error('[mail] decision notice failed:', err.message));
      return user;
    },
    adminDeleteSong: async (_, { songId }, ctx) => {
      const admin = await requireAdmin(ctx);
      if (!mongoose.isValidObjectId(songId)) throw notFound('Song');
      const song = await Song.findOne({ _id: songId, uploader: { $ne: null } });
      if (!song) throw notFound('Song');
      await deleteSong(song);
      if (String(song.uploader) !== String(admin._id)) {
        await notify(song.uploader, { type: 'song-removed', title: `“${song.title}” was removed`, body: 'An admin removed this song from HitVerse.', link: '/app/artist' });
      }
      return true;
    },
    adminSetArtistFlags: async (_, { artistId, featured, verified }, ctx) => {
      await requireAdmin(ctx);
      if (!mongoose.isValidObjectId(artistId)) throw notFound('Artist');
      const update = {};
      if (typeof featured === 'boolean') update.featured = featured;
      if (typeof verified === 'boolean') update.verified = verified;
      const artist = await Artist.findByIdAndUpdate(artistId, update, { new: true }).lean();
      if (!artist) throw notFound('Artist');
      return artist;
    },
  },
};
