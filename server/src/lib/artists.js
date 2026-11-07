import { Artist } from '../models/Artist.js';
import { Follow } from '../models/Follow.js';
import { Song } from '../models/Song.js';
import { User } from '../models/User.js';
import { sameArtist } from './linkFinder.js';
import { slugify } from './text.js';

/** A free URL slug for an artist name: "damodot", or "damodot-2" if taken. */
export async function uniqueArtistSlug(name, exceptId) {
  const base = slugify(name, 'artist');
  for (let i = 1; ; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const taken = await Artist.exists({ slug, ...(exceptId ? { _id: { $ne: exceptId } } : {}) });
    if (!taken) return slug;
  }
}

/** The artist profile an account owns, creating it when an approved artist doesn't have one yet. */
export async function ensureArtistProfile(user) {
  const existing = await Artist.findOne({ owner: user._id });
  if (existing) return existing;
  const name = user.artist?.name || `${user.firstName} ${user.lastName}`;
  return Artist.create({
    slug: await uniqueArtistSlug(name),
    name,
    owner: user._id,
    bio: user.artist?.bio ?? '',
    socials: user.artist?.link ? { website: user.artist.link } : {},
  });
}

/** Which artist profile a new song belongs to: the uploader's own, or (for admins) the one matching the credit. */
export async function artistIdForSong(user, artistCredit) {
  const own = await Artist.findOne({ owner: user._id }).select('_id name').lean();
  if (own && (user.role !== 'admin' || !artistCredit || sameArtist(artistCredit, own.name))) return own._id;
  if (artistCredit) {
    const all = await Artist.find().select('_id name').lean();
    const match = all.find((a) => sameArtist(artistCredit, a.name));
    if (match) return match._id;
  }
  return own?._id ?? null;
}

/** Links songs and albums without an artist profile to the profile whose name matches their credit. */
export async function linkCatalogToArtists() {
  const artists = await Artist.find().select('_id name').lean();
  let linked = 0;
  for (const song of await Song.find({ artistId: null }).select('artist')) {
    const match = artists.find((a) => sameArtist(song.artist, a.name));
    if (match) {
      song.artistId = match._id;
      await song.save();
      linked++;
    }
  }
  return linked;
}

export async function follow(userId, artistId) {
  const r = await Follow.updateOne({ user: userId, artist: artistId }, { $setOnInsert: { user: userId, artist: artistId } }, { upsert: true });
  if (r.upsertedCount) await Artist.updateOne({ _id: artistId }, { $inc: { followerCount: 1 } });
  // First fan base followed becomes the one they rep.
  await User.updateOne({ _id: userId, repping: null }, { repping: artistId });
}

export async function unfollow(userId, artistId) {
  const r = await Follow.deleteOne({ user: userId, artist: artistId });
  if (r.deletedCount) await Artist.updateOne({ _id: artistId, followerCount: { $gt: 0 } }, { $inc: { followerCount: -1 } });
  const user = await User.findById(userId).select('repping');
  if (user && String(user.repping) === String(artistId)) {
    const next = await Follow.findOne({ user: userId }).sort({ createdAt: -1 }).select('artist').lean();
    user.repping = next?.artist ?? null;
    await user.save();
  }
}
