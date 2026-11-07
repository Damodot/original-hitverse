// Finds a song's links on other streaming services.
// - Apple Music: always (iTunes Search API, no key).
// - MusicLink (musiclink.one): if MUSICLINK_API_KEY is set. Given the song's ISRC or one link it already has
//   (e.g. the Apple Music one), it returns Spotify, YouTube Music, Audiomack, Boomplay, Deezer, TIDAL and more.
// - Spotify: if SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set.
// Matches are strict (same title, same artist) so a similarly named artist is never picked.
import { cleanUrl, detectPlatform } from './platforms.js';

const norm = (s = '') => s
  .normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[([](feat|ft|with|prod)\.?[^)\]]*[)\]]/g, '')
  .replace(/\s-\s(single|ep)$/g, '')
  .replace(/[^a-z0-9]/g, '');
const artistsOf = (s = '') => s.split(/\s*(?:&|,|\+|\bx\b|\bfeat\.?|\bft\.?|\bwith\b|\band\b)\s*/i).map(norm).filter(Boolean);
const sameArtist = (a, b) => {
  const x = new Set(artistsOf(a));
  return artistsOf(b).some((n) => x.has(n));
};
// Stores often censor titles ("F****d up"), so a run of *s matches any letters ("Fcked Up" spells it differently).
function sameTitle(a, b) {
  if (norm(a) === norm(b)) return true;
  const [stars, plain] = a.includes('*') ? [a, b] : b.includes('*') ? [b, a] : [];
  if (!stars) return false;
  const pattern = stars.normalize('NFKD').toLowerCase().replace(/[^a-z0-9*]/g, '').replace(/\*+/g, '[a-z]*');
  return new RegExp(`^${pattern}$`).test(norm(plain));
}

const TIMEOUT = 8000;
const appleCache = new Map(); // artist -> { at, tracks }

const itunes = async (params) => {
  const res = await fetch(`https://itunes.apple.com/${params.lookup ? 'lookup' : 'search'}?${new URLSearchParams(params.q)}`, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) throw new Error(`Apple Music search failed (${res.status})`);
  return (await res.json()).results ?? [];
};

// Every song by the artist: find the artist, then list their songs (a plain name search misses some,
// e.g. songs credited "Damodot & DJ Great"). A name search is merged in as a fallback.
async function appleTracks(artist) {
  const key = norm(artist);
  const hit = appleCache.get(key);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return hit.tracks;
  // Some releases are only listed in one storefront, so look in a few at once.
  const countries = (process.env.APPLE_STOREFRONTS ?? 'us,ng,gb').split(',').map((c) => c.trim()).filter(Boolean);
  const pages = await Promise.allSettled(countries.map(async (country) => {
    const artists = await itunes({ q: { term: artist, entity: 'musicArtist', limit: '10', country } });
    const ids = artists.filter((a) => norm(a.artistName) === key).map((a) => a.artistId);
    const [byArtist, byName] = await Promise.all([
      Promise.all(ids.map((id) => itunes({ lookup: true, q: { id: String(id), entity: 'song', limit: '200', country } }))),
      itunes({ q: { term: artist, entity: 'song', limit: '200', country } }),
    ]);
    return [...byArtist.flat(), ...byName].filter((t) => t.wrapperType === 'track' || t.kind === 'song');
  }));
  if (pages.every((p) => p.status === 'rejected')) throw pages[0].reason;
  const tracks = pages.flatMap((p) => (p.status === 'fulfilled' ? p.value : []));
  appleCache.set(key, { at: Date.now(), tracks });
  return tracks;
}

export async function findApple(song) {
  // Search by the first credited artist; "Damodot & DJ Great" is listed under Damodot.
  const lead = song.artist.split(/\s*(?:&|,|feat\.?|ft\.?)\s*/i)[0];
  const tracks = await appleTracks(lead);
  const match = tracks.find((t) => sameTitle(t.trackName, song.title) && sameArtist(t.artistName, song.artist));
  if (!match) return null;
  // The storefront-free link opens in the listener's own country.
  const url = new URL(cleanUrl(match.trackViewUrl));
  url.pathname = url.pathname.replace(/^\/[a-z]{2}\//, '/');
  return { url: url.toString(), title: match.trackName, artist: match.artistName, album: match.collectionName, artwork: match.artworkUrl100 };
}

let spotifyToken = null;
async function spotifyAuth() {
  if (spotifyToken && spotifyToken.expires > Date.now() + 60_000) return spotifyToken.value;
  const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret } = process.env;
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) throw new Error(`Spotify sign-in failed (${res.status})`);
  const data = await res.json();
  spotifyToken = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 };
  return spotifyToken.value;
}

export const spotifyEnabled = () => Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);

export async function findSpotify(song) {
  if (!spotifyEnabled()) return null;
  const q = `track:"${song.title}" artist:"${song.artist.split(/\s*(?:&|,)\s*/)[0]}"`;
  const res = await fetch(`https://api.spotify.com/v1/search?${new URLSearchParams({ q, type: 'track', limit: '10' })}`, {
    headers: { Authorization: `Bearer ${await spotifyAuth()}` },
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) throw new Error(`Spotify search failed (${res.status})`);
  const data = await res.json();
  const match = data.tracks?.items?.find((t) => sameTitle(t.name, song.title) && t.artists.some((a) => sameArtist(a.name, song.artist)));
  if (!match) return null;
  return { url: match.external_urls.spotify, title: match.name, artist: match.artists.map((a) => a.name).join(', '), album: match.album?.name, artwork: match.album?.images?.at(-1)?.url };
}

// MusicLink platform keys -> ours.
const MUSICLINK_KEYS = {
  spotify: 'spotify', apple_music: 'appleMusic', youtube_music: 'youtubeMusic', youtube: 'youtube', audiomack: 'audiomack',
  boomplay: 'boomplay', deezer: 'deezer', tidal: 'tidal', amazon_music: 'amazonMusic', soundcloud: 'soundcloud', musiclink: 'smartLink',
};
// Links MusicLink accepts as a starting point.
const MUSICLINK_SEEDS = ['spotify', 'appleMusic', 'youtubeMusic', 'youtube', 'deezer', 'tidal', 'soundcloud'];
export const musicLinkEnabled = () => Boolean(process.env.MUSICLINK_API_KEY);

const mlCache = new Map(); // q -> { at, item } (saves lookups from the monthly allowance)

/** One MusicLink lookup by link or ISRC. Returns the matched track, or null if MusicLink doesn't know it. */
export async function musicLinkResolve(q) {
  if (!musicLinkEnabled()) throw Object.assign(new Error('Add MUSICLINK_API_KEY to .env to look songs up by ISRC'), { status: 503, expose: true });
  const hit = mlCache.get(q);
  if (hit && Date.now() - hit.at < 15 * 60 * 1000) return hit.item;
  const url = `https://api.musiclink.one/v2/resolve?${new URLSearchParams({ q, type: 'track' })}`;
  const call = () => fetch(url, { headers: { Authorization: `Bearer ${process.env.MUSICLINK_API_KEY}` }, signal: AbortSignal.timeout(15000) });
  let res = await call();
  if (res.status === 429 && res.headers.get('retry-after')) {
    await new Promise((r) => setTimeout(r, Math.min(10, Number(res.headers.get('retry-after')) || 1) * 1000));
    res = await call();
  }
  if (res.status === 404) {
    mlCache.set(q, { at: Date.now(), item: null });
    return null;
  }
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error('MusicLink rejected the API key. Check MUSICLINK_API_KEY.');
  if (res.status === 429) throw new Error('MusicLink limit reached for now. Try again later or upgrade the plan.');
  if (!res.ok || !body.success) throw new Error(`MusicLink lookup failed (${res.status}${body.error ? `: ${body.error}` : ''})`);
  const item = body.data?.[0] ?? null;
  mlCache.set(q, { at: Date.now(), item });
  return item;
}

/** A MusicLink track's platform links, as ours, keeping only links on each platform's real domain. */
export function musicLinkPlatforms(item) {
  const found = {};
  for (const [key, ours] of Object.entries(MUSICLINK_KEYS)) {
    const link = item?.platforms?.[key];
    if (typeof link === 'string' && detectPlatform(link) === ours) found[ours] = cleanUrl(link);
  }
  return found;
}

export async function findMusicLink(song, extraSeeds = {}) {
  if (!musicLinkEnabled()) return null;
  const links = { ...(song.links?.toObject?.() ?? song.links ?? {}), ...extraSeeds };
  const q = song.isrc || MUSICLINK_SEEDS.map((id) => links[id]).find(Boolean);
  if (!q) return { needsSeed: true };
  const item = await musicLinkResolve(q);
  if (!item) return { found: {} };
  const found = Object.fromEntries(Object.entries(musicLinkPlatforms(item)).map(([id, url]) => [
    id, { url, title: item.title, artist: item.artist, artwork: item.image_url, source: 'MusicLink' },
  ]));
  return { found, isrc: item.isrc };
}

/**
 * Suggestions for one song: { found: { platform: { url, title, artist, album?, artwork?, source } }, errors, isrc? }.
 * One service failing doesn't stop the others.
 */
export async function findLinks(song, { isrc, musicLink = true } = {}) {
  const subject = isrc ? { ...(song.toObject?.() ?? song), isrc } : song;
  const out = {};
  const errors = [];
  let foundIsrc;
  const apple = await findApple(subject).catch((err) => { errors.push(err.message); return null; });
  if (apple) out.appleMusic = { ...apple, source: 'Apple Music' };
  const [ml, spotify] = await Promise.allSettled([
    musicLink ? findMusicLink(subject, apple ? { appleMusic: apple.url } : {}) : null,
    findSpotify(subject),
  ]);
  if (ml.status === 'fulfilled' && ml.value?.found) {
    for (const [id, v] of Object.entries(ml.value.found)) out[id] ??= v;
    foundIsrc = ml.value.isrc;
  }
  if (spotify.status === 'fulfilled' && spotify.value) out.spotify ??= { ...spotify.value, source: 'Spotify' };
  for (const r of [ml, spotify]) if (r.status === 'rejected') errors.push(r.reason.message);
  return { found: out, errors, isrc: foundIsrc, needsSeed: ml.status === 'fulfilled' && !!ml.value?.needsSeed };
}

export const searchSources = () => ({ appleMusic: true, musicLink: musicLinkEnabled(), spotify: spotifyEnabled() });

export const _test = { norm, sameArtist, sameTitle };
export { sameArtist };
