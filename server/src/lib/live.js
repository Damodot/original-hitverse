// LiveKit (open-source call server) for live rooms: access tokens for the browser, and room controls for hosts.
import { AccessToken, RoomServiceClient, TrackSource } from 'livekit-server-sdk';
import { config } from '../config.js';

const { url, publicUrl, apiKey, apiSecret } = config.livekit;
export const liveConfigured = () => Boolean(url && apiKey && apiSecret);

let service;
const rooms = () => (service ??= new RoomServiceClient(url, apiKey, apiSecret));

export const roomName = (room) => `hitverse-${room._id}`;
export const MAX_PEOPLE = { audio: 50, video: 16 };

const offline = () => Object.assign(new Error('Live rooms are offline right now. Try again in a minute.'), { expose: true, status: 503 });

async function call(fn) {
  if (!liveConfigured()) throw offline();
  try {
    return await fn(rooms());
  } catch (err) {
    if (err?.status === 404 || /not found/i.test(err?.message ?? '')) return null; // room already closed
    console.error('[live]', err.message);
    throw offline();
  }
}

/** What a person may do in the room. Hosts run it; fans speak only if the room (or the host) allows. */
export function permissionsFor(room, { isHost, canSpeak }) {
  const sources = room.kind === 'video'
    ? [TrackSource.MICROPHONE, TrackSource.CAMERA, ...(isHost ? [TrackSource.SCREEN_SHARE, TrackSource.SCREEN_SHARE_AUDIO] : [])]
    : [TrackSource.MICROPHONE];
  const publish = isHost || canSpeak;
  return { canSubscribe: true, canPublish: publish, canPublishData: true, canPublishSources: publish ? sources : [] };
}

/** A short-lived pass for the browser to join this room. */
export async function joinToken(room, user, { isHost, artistName }) {
  if (!liveConfigured()) throw offline();
  const token = new AccessToken(apiKey, apiSecret, {
    identity: String(user._id),
    name: isHost ? artistName : `${user.firstName} ${user.lastName}`.trim(),
    ttl: '10m', // only for joining; the call itself can run longer
    metadata: JSON.stringify({ role: isHost ? 'host' : 'fan' }),
  });
  const perms = permissionsFor(room, { isHost, canSpeak: room.fansCanSpeak });
  token.addGrant({ room: roomName(room), roomJoin: true, canUpdateOwnMetadata: true, ...perms });
  return { token: await token.toJwt(), url: publicUrl };
}

export const openRoom = (room) => call((s) => s.createRoom({
  name: roomName(room),
  emptyTimeout: 10 * 60, // closes 10 minutes after everyone leaves
  maxParticipants: MAX_PEOPLE[room.kind] + 1,
}));
export const closeRoom = (room) => call((s) => s.deleteRoom(roomName(room)));
export const kick = (room, identity) => call((s) => s.removeParticipant(roomName(room), identity));
/** Lets a fan speak (or stops them), and lowers their hand. */
export const setSpeaker = (room, identity, canSpeak) => call((s) => s.updateParticipant(roomName(room), identity, {
  permission: { ...permissionsFor(room, { isHost: false, canSpeak }), canUpdateMetadata: true }, // all at once, so keep hand-raising
  attributes: { hand: '' },
}));
export const listPeople = (room) => call((s) => s.listParticipants(roomName(room))).then((p) => p ?? []);
