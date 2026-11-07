// Streaming platforms a song can link out to. A link is only accepted if its host belongs to that platform,
// so nobody can turn a "Listen on Spotify" button into a link to somewhere else.
export const PLATFORMS = [
  { id: 'spotify', hosts: ['open.spotify.com', 'spotify.link'] },
  { id: 'appleMusic', hosts: ['music.apple.com', 'geo.music.apple.com', 'itunes.apple.com'] },
  { id: 'youtubeMusic', hosts: ['music.youtube.com'] },
  { id: 'youtube', hosts: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'] },
  { id: 'audiomack', hosts: ['audiomack.com', 'www.audiomack.com'] },
  { id: 'boomplay', hosts: ['boomplay.com', 'www.boomplay.com', 'boomplay.page.link'] },
  { id: 'deezer', hosts: ['deezer.com', 'www.deezer.com', 'link.deezer.com', 'deezer.page.link'] },
  { id: 'tidal', hosts: ['tidal.com', 'listen.tidal.com'] },
  { id: 'amazonMusic', hosts: ['music.amazon.com', 'music.amazon.co.uk', 'music.amazon.de', 'music.amazon.fr', 'music.amazon.ca', 'amazon.com', 'www.amazon.com'] },
  { id: 'soundcloud', hosts: ['soundcloud.com', 'on.soundcloud.com', 'm.soundcloud.com'] },
  // A smart link that lists every platform, e.g. the release's DistroKid HyperFollow page.
  { id: 'smartLink', hosts: ['distrokid.com', 'song.link', 'album.link', 'odesli.co', 'linktr.ee', 'ffm.to', 'lnk.to', 'fanlink.tv', 'fanlink.to', 'push.fm', 'smarturl.it', 'hypeddit.com', 'show.co', 'too.fm', 'musiclink.one'] },
];
export const PLATFORM_IDS = PLATFORMS.map((p) => p.id);

/** Which platform a URL belongs to, or null. */
export function detectPlatform(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase();
  // music.youtube.com must win over youtube.com
  const hit = PLATFORMS.find((p) => p.hosts.some((h) => host === h)) ??
    PLATFORMS.find((p) => p.hosts.some((h) => host.endsWith(`.${h}`)));
  return hit?.id ?? null;
}

/** Drops tracking parameters that make links long and ugly. */
export function cleanUrl(raw) {
  const url = new URL(raw);
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|si$|uo$|app$|ls$|at$|ct$|fbclid|igsh|feature$)/i.test(key)) url.searchParams.delete(key);
  }
  return url.toString();
}
