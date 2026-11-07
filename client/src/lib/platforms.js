import { siApplemusic, siAudiomack, siDeezer, siSoundcloud, siSpotify, siTidal, siYoutube, siYoutubemusic } from 'simple-icons';

// Same host rules as the server (server/src/lib/platforms.js), which has the final say.
// Order is the order buttons appear on a song page.
export const PLATFORMS = [
  { id: 'spotify', name: 'Spotify', icon: siSpotify, color: '#1ED760', hosts: ['open.spotify.com', 'spotify.link'], example: 'https://open.spotify.com/track/…' },
  { id: 'appleMusic', name: 'Apple Music', icon: siApplemusic, color: '#FA243C', hosts: ['music.apple.com', 'geo.music.apple.com', 'itunes.apple.com'], example: 'https://music.apple.com/…' },
  { id: 'youtubeMusic', name: 'YouTube Music', icon: siYoutubemusic, color: '#FF0000', hosts: ['music.youtube.com'], example: 'https://music.youtube.com/watch?v=…' },
  { id: 'audiomack', name: 'Audiomack', icon: siAudiomack, color: '#FFA200', hosts: ['audiomack.com', 'www.audiomack.com'], example: 'https://audiomack.com/…' },
  { id: 'boomplay', name: 'Boomplay', letter: 'B', color: '#2B6CFF', hosts: ['boomplay.com', 'www.boomplay.com', 'boomplay.page.link'], example: 'https://www.boomplay.com/songs/…' },
  { id: 'youtube', name: 'YouTube', icon: siYoutube, color: '#FF0000', hosts: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'], example: 'https://youtu.be/…' },
  { id: 'deezer', name: 'Deezer', icon: siDeezer, color: '#A238FF', hosts: ['deezer.com', 'www.deezer.com', 'link.deezer.com', 'deezer.page.link'], example: 'https://www.deezer.com/track/…' },
  { id: 'tidal', name: 'TIDAL', icon: siTidal, color: '#FFFFFF', hosts: ['tidal.com', 'listen.tidal.com'], example: 'https://tidal.com/track/…' },
  { id: 'amazonMusic', name: 'Amazon Music', letter: 'a', color: '#25D1DA', hosts: ['music.amazon.com', 'music.amazon.co.uk', 'music.amazon.de', 'music.amazon.fr', 'music.amazon.ca', 'amazon.com', 'www.amazon.com'], example: 'https://music.amazon.com/…' },
  { id: 'soundcloud', name: 'SoundCloud', icon: siSoundcloud, color: '#FF5500', hosts: ['soundcloud.com', 'on.soundcloud.com', 'm.soundcloud.com'], example: 'https://soundcloud.com/…' },
  { id: 'smartLink', name: 'All platforms', hosts: ['distrokid.com', 'song.link', 'album.link', 'odesli.co', 'linktr.ee', 'ffm.to', 'lnk.to', 'fanlink.tv', 'fanlink.to', 'push.fm', 'smarturl.it', 'hypeddit.com', 'show.co', 'too.fm', 'musiclink.one'], example: 'Your DistroKid HyperFollow link, or a Linktree / song.link page' },
];
export const PLATFORM_BY_ID = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));
export const STREAMING = PLATFORMS.filter((p) => p.id !== 'smartLink');

export function detectPlatform(raw) {
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase();
  const hit = PLATFORMS.find((p) => p.hosts.includes(host)) ?? PLATFORMS.find((p) => p.hosts.some((h) => host.endsWith(`.${h}`)));
  return hit?.id ?? null;
}

/** song.link's own page works out the other platforms from any one link. */
export const songLinkUrl = (links) => {
  const first = STREAMING.map((p) => links?.[p.id]).find(Boolean);
  return first ? `https://song.link/${first}` : null;
};

export const linkCount = (links) => STREAMING.filter((p) => links?.[p.id]).length;
