// Live rooms: artists open group voice or video calls for fans they pick from their fan base.
import mongoose from 'mongoose';
import { z } from 'zod';
import { closeRoom, joinToken, kick, listPeople, MAX_PEOPLE, openRoom, setSpeaker } from '../../lib/live.js';
import { notify } from '../../lib/notify.js';
import { Artist } from '../../models/Artist.js';
import { Follow } from '../../models/Follow.js';
import { LiveRoom } from '../../models/LiveRoom.js';
import { User } from '../../models/User.js';
import { requireUser } from '../context.js';
import { fail, forbidden, notFound } from '../errors.js';

const isId = (id) => mongoose.isValidObjectId(id);
const same = (a, b) => String(a) === String(b);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const kindName = (kind) => (kind === 'video' ? 'video' : 'voice');

/** The artist profile the signed-in person may host for: their own, or any if they're an admin. */
async function hostableArtist(ctx, artistId) {
  const user = await requireUser(ctx);
  if (!isId(artistId)) throw notFound('Artist');
  const artist = await Artist.findById(artistId).lean();
  if (!artist) throw notFound('Artist');
  const own = artist.owner && same(artist.owner, user._id) && user.canUpload();
  if (!own && user.role !== 'admin') throw forbidden('Only the artist can host their live rooms');
  return { user, artist };
}

async function loadRoom(ctx, id) {
  const user = await requireUser(ctx);
  if (!isId(id)) throw notFound('Live room');
  const room = await LiveRoom.findById(id);
  if (!room) throw notFound('Live room');
  const isHost = same(room.host, user._id) || user.role === 'admin';
  const invited = room.invitees.some((u) => same(u, user._id)) && !room.removed.some((u) => same(u, user._id));
  return { user, room, isHost, invited };
}

async function hostRoom(ctx, id) {
  const found = await loadRoom(ctx, id);
  if (!found.isHost) throw forbidden('Only the host can do that');
  return found;
}

/** Keeps only real fans of this artist (people who joined the fan base). */
async function fansOnly(artistId, userIds) {
  const ids = [...new Set(userIds.filter(isId).map(String))];
  if (!ids.length) return [];
  const follows = await Follow.find({ artist: artistId, user: { $in: ids } }).select('user').lean();
  return follows.map((f) => f.user);
}

async function invite(room, artist, userIds) {
  if (!userIds.length) return;
  const when = room.status === 'scheduled' && room.startsAt
    ? ` on ${room.startsAt.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' })} (Lagos time)`
    : '';
  await notify(userIds, {
    type: 'live',
    title: room.status === 'live' ? `${artist.name} invited you to a live ${kindName(room.kind)} room` : `${artist.name} invited you to a ${kindName(room.kind)} room${when}`,
    body: room.title,
    link: `/app/live/${room._id}`,
  });
}

const roomInput = z.object({
  artistId: z.string(),
  title: z.string().trim().min(2, 'Give the room a title').max(80),
  kind: z.enum(['audio', 'video']),
  invitees: z.array(z.string()).min(1, 'Pick at least one fan to invite').max(200),
  fansCanSpeak: z.boolean().default(true),
  startsAt: z.coerce.date().nullish(),
});

export const liveResolvers = {
  Query: {
    // Rooms I host or I'm invited to that haven't ended (plus ones that ended in the last day).
    liveRooms: async (_, __, ctx) => {
      const user = await requireUser(ctx);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return LiveRoom.find({
        $and: [
          { $or: [{ host: user._id }, { invitees: user._id, removed: { $ne: user._id } }] },
          { $or: [{ status: { $ne: 'ended' } }, { endedAt: { $gte: dayAgo } }] },
        ],
      }).sort({ status: 1, startsAt: 1, createdAt: -1 }).limit(50).lean();
    },
    liveRoom: async (_, { id }, ctx) => {
      const { room, isHost, invited } = await loadRoom(ctx, id);
      if (!isHost && !invited) throw forbidden('This room is invite-only');
      return room.toObject();
    },
    // The host picks fans to invite from their fan base.
    myFans: async (_, { artistId, search, limit }, ctx) => {
      await hostableArtist(ctx, artistId);
      const follows = await Follow.find({ artist: artistId }).sort({ createdAt: -1 }).limit(2000).select('user').lean();
      const filter = { _id: { $in: follows.map((f) => f.user) } };
      const q = search?.trim();
      if (q) {
        const re = new RegExp(escapeRegex(q.slice(0, 60)), 'i');
        filter.$or = [{ firstName: re }, { lastName: re }];
      }
      return User.find(filter).select('firstName lastName').sort({ firstName: 1 }).limit(Math.min(limit ?? 50, 200)).lean();
    },
  },
  Mutation: {
    createLiveRoom: async (_, { input }, ctx) => {
      const data = roomInput.parse(input);
      const { user, artist } = await hostableArtist(ctx, data.artistId);
      const invitees = await fansOnly(artist._id, data.invitees);
      if (!invitees.length) throw fail('Only fans in your fan base can be invited', 'BAD_USER_INPUT', { field: 'invitees' });
      if (invitees.length > MAX_PEOPLE[data.kind]) {
        throw fail(`A ${kindName(data.kind)} room holds up to ${MAX_PEOPLE[data.kind]} fans`, 'BAD_USER_INPUT', { field: 'invitees' });
      }
      const later = data.startsAt && data.startsAt.getTime() > Date.now() + 60_000;
      const room = await LiveRoom.create({
        artist: artist._id,
        host: user._id, // whoever opens the room runs it
        title: data.title,
        kind: data.kind,
        invitees,
        fansCanSpeak: data.fansCanSpeak,
        status: later ? 'scheduled' : 'live',
        startsAt: later ? data.startsAt : new Date(),
        startedAt: later ? null : new Date(),
      });
      if (!later) await openRoom(room);
      await invite(room, artist, invitees);
      return room.toObject();
    },
    startLiveRoom: async (_, { id }, ctx) => {
      const { room } = await hostRoom(ctx, id);
      if (room.status === 'ended') throw fail('This room has ended. Start a new one.');
      if (room.status === 'live') return room.toObject();
      room.status = 'live';
      room.startedAt = new Date();
      await room.save();
      await openRoom(room);
      const artist = await Artist.findById(room.artist).select('name').lean();
      await notify(room.invitees.filter((u) => !room.removed.some((r) => same(r, u))), {
        type: 'live', title: `${artist.name} is live now`, body: room.title, link: `/app/live/${room._id}`,
      });
      return room.toObject();
    },
    inviteToLiveRoom: async (_, { id, userIds }, ctx) => {
      const { room } = await hostRoom(ctx, id);
      if (room.status === 'ended') throw fail('This room has ended');
      const fans = (await fansOnly(room.artist, userIds)).filter((u) => !room.invitees.some((i) => same(i, u)));
      if (room.invitees.length + fans.length > MAX_PEOPLE[room.kind]) {
        throw fail(`A ${kindName(room.kind)} room holds up to ${MAX_PEOPLE[room.kind]} fans`);
      }
      room.invitees.push(...fans);
      room.removed = room.removed.filter((r) => !fans.some((f) => same(f, r)));
      await room.save();
      await invite(room, await Artist.findById(room.artist).select('name').lean(), fans);
      return room.toObject();
    },
    joinLiveRoom: async (_, { id }, ctx) => {
      const { user, room, isHost, invited } = await loadRoom(ctx, id);
      if (!isHost && !invited) throw forbidden('This room is invite-only');
      if (room.status === 'scheduled') throw fail('This room hasn’t started yet');
      if (room.status === 'ended') throw fail('This room has ended');
      const artist = await Artist.findById(room.artist).select('name').lean();
      // Admins can moderate any room, but only the person who opened it appears as the artist.
      const pass = await joinToken(room, user, { isHost: same(room.host, user._id), artistName: artist.name });
      return { ...pass, room: room.toObject() };
    },
    endLiveRoom: async (_, { id }, ctx) => {
      const { room } = await hostRoom(ctx, id);
      if (room.status !== 'ended') {
        room.status = 'ended';
        room.endedAt = new Date();
        await room.save();
        await closeRoom(room);
      }
      return room.toObject();
    },
    liveSetSpeaker: async (_, { id, userId, canSpeak }, ctx) => {
      const { room } = await hostRoom(ctx, id);
      if (room.status !== 'live') throw fail('This room isn’t live');
      if (same(userId, room.host)) throw fail('The host can always speak');
      await setSpeaker(room, String(userId), canSpeak);
      return true;
    },
    liveRemove: async (_, { id, userId }, ctx) => {
      const { room } = await hostRoom(ctx, id);
      if (same(userId, room.host)) throw fail('The host can’t be removed');
      if (!room.removed.some((r) => same(r, userId)) && isId(userId)) {
        room.removed.push(userId);
        await room.save();
      }
      await kick(room, String(userId));
      return true;
    },
  },
  LiveRoom: {
    artist: (r, _, ctx) => ctx.artist(r.artist),
    isHost: async (r, _, ctx) => {
      const user = await ctx.user();
      return Boolean(user && (same(r.host, user._id) || user.role === 'admin'));
    },
    inviteeCount: (r) => r.invitees.length - (r.removed?.length ?? 0),
    // Who's invited: only the host sees the list.
    invitees: async (r, _, ctx) => {
      const user = await ctx.user();
      if (!user || !(same(r.host, user._id) || user.role === 'admin')) return null;
      const removed = new Set((r.removed ?? []).map(String));
      return User.find({ _id: { $in: r.invitees.filter((i) => !removed.has(String(i))) } }).select('firstName lastName').lean();
    },
    // How many people are in the call right now (live rooms only).
    peopleInRoom: async (r) => (r.status === 'live' ? (await listPeople(r).catch(() => [])).length : 0),
  },
  LiveFan: {
    name: (u) => `${u.firstName} ${u.lastName}`.trim(),
  },
};
