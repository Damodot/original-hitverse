// Downloads artwork and preview clips that a music service pointed us to, safely: https only, only from the
// services' own media servers (so a crafted link can't make the server fetch anything else), with size and
// time limits, and every redirect checked the same way.
const HOSTS = [
  /(^|\.)scdn\.co$/, /(^|\.)spotifycdn\.com$/, // Spotify artwork and previews
  /(^|\.)mzstatic\.com$/, /(^|\.)itunes\.apple\.com$/, // Apple artwork and previews
  /(^|\.)dzcdn\.net$/, // Deezer
  /(^|\.)ytimg\.com$/, // YouTube thumbnails
  /(^|\.)musiclink\.one$/,
];

const allowed = (url) => url.protocol === 'https:' && HOSTS.some((h) => h.test(url.hostname));

export async function fetchAsset(raw, { maxBytes, timeoutMs = 20000 }) {
  let url = new URL(raw);
  for (let hop = 0; hop < 4; hop++) {
    if (!allowed(url)) throw new Error(`Won't download from ${url.hostname}`);
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location'), url);
      continue;
    }
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    if (Number(res.headers.get('content-length')) > maxBytes) throw new Error('File is too big');
    const chunks = [];
    let size = 0;
    for await (const chunk of res.body) {
      size += chunk.length;
      if (size > maxBytes) throw new Error('File is too big');
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
  throw new Error('Too many redirects');
}

/** Bigger artwork than a service's default thumbnail, when its URL scheme allows it. */
export function largeArtwork(url) {
  if (!url) return url;
  return url
    .replace(/(i\.scdn\.co\/image\/ab67616d)00001e02/, '$10000b273') // Spotify 300px -> 640px
    .replace(/\/\d+x\d+bb\.(jpg|png|webp)$/, '/1000x1000bb.$1'); // Apple
}
