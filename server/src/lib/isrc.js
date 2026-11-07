import { z } from 'zod';
import { Song } from '../models/Song.js';
import { largeArtwork } from './fetchAsset.js';
import { musicLinkPlatforms, musicLinkResolve, sameArtist } from './linkFinder.js';
import { cleanUrl, detectPlatform } from './platforms.js';

export const isrcField = z.string({ error: 'Enter an ISRC' }).trim().toUpperCase().transform((v) => v.replace(/[-\s]/g, ''))
  .refine((v) => /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(v), 'An ISRC has 12 letters and numbers, like QZTB52295123');

export const artistNameOf = (user) => user.artist?.name || `${user.firstName} ${user.lastName}`;

// The lookup box takes an ISRC or a link to the song on a streaming service.
const LINK_PLATFORMS = ['spotify', 'appleMusic', 'youtubeMusic', 'youtube', 'deezer', 'tidal', 'soundcloud'];
export function parseLookup(raw) {
  const text = String(raw ?? '').trim();
  if (!/^https?:\/\//i.test(text)) return isrcField.parse(text);
  const platform = detectPlatform(text);
  if (!LINK_PLATFORMS.includes(platform) && !/^https:\/\/(www\.)?musiclink\.one\//.test(text)) {
    throw Object.assign(new Error('Paste the song’s ISRC, or its Spotify, Apple Music, YouTube, Deezer, TIDAL or SoundCloud link'), { status: 400, expose: true });
  }
  return cleanUrl(text);
}

/** Looks the song up (by ISRC or link) and works out whether this account may add it. */
export async function lookupIsrc(user, query) {
  const item = await musicLinkResolve(query);
  if (!item) return { error: 'MusicLink doesn’t know this song yet. New releases can take a few days to reach the stores.', status: 404 };
  const isLink = /^https?:/i.test(query);
  if (!item.isrc && isLink) return { error: 'Found the song, but not its ISRC. Type the ISRC instead (DistroKid shows it under the track).', status: 422 };
  const code = (item.isrc || query).toUpperCase();
  const existing = await Song.findOne({ isrc: code }).select('slug title').lean();
  // Artists may only add their own releases; admins can add any.
  const own = user.role === 'admin' || sameArtist(item.artist ?? '', artistNameOf(user));
  return {
    item,
    track: {
      isrc: code,
      title: item.title,
      artist: item.artist,
      artwork: largeArtwork(item.image_url) ?? null,
      duration: item.duration_ms ? Math.round(item.duration_ms / 1000) : null,
      hasPreview: Boolean(item.preview_url),
      links: musicLinkPlatforms(item),
    },
    existing,
    own,
  };
}
