import { useEffect, useState } from 'react';

// Picks two colours from a cover image: the colour covering most of it (shard) and a different one (accent).
// They stay true to the artwork's hue and saturation, only lifted enough to glow on a dark page.
const FALLBACK = { shard: '#7a1fd1', accent: '#d946ef' };
const cache = new Map();

const toHex = (r, g, b) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToHex(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => 255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))));
  return toHex(f(0), f(8), f(4));
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
/** Keeps the artwork's hue and saturation, lifting dark colours just enough to glow. */
const glow = ([h, sat, l]) => hslToHex(h, clamp(sat, 0.3, 0.88), clamp(l, 0.44, 0.66));

export function extractColors(img) {
  const n = 48;
  const canvas = document.createElement('canvas');
  canvas.width = n;
  canvas.height = n;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, n, n);
  const { data } = ctx.getImageData(0, 0, n, n);

  const BINS = 24; // 15° each
  const bins = Array.from({ length: BINS }, () => ({ w: 0, x: 0, y: 0, s: 0, l: 0 }));
  let pixels = 0;
  let colourful = 0;
  let lightSum = 0;
  // Small but vivid highlights (a gold halo on a white cover), used when the cover is otherwise colourless.
  const vivid = Array.from({ length: 24 }, () => ({ n: 0, x: 0, y: 0, s: 0, l: 0 }));
  let vividCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    pixels++;
    const [h, sat, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    lightSum += l;
    if (sat > 0.5 && l > 0.3 && l < 0.82) {
      vividCount++;
      const v = vivid[Math.floor(h / 15) % 24];
      v.n++; v.x += Math.cos((h * Math.PI) / 180); v.y += Math.sin((h * Math.PI) / 180); v.s += sat; v.l += l;
    }
    if (sat < 0.22 || l < 0.08 || l > 0.94) continue; // greys, near-black, near-white
    colourful++;
    // Every coloured pixel counts by the area it covers, a bit more when it's vivid.
    const w = 0.4 + sat;
    const b = bins[Math.floor(h / (360 / BINS)) % BINS];
    // Hue is an angle, so average it as a direction.
    b.w += w; b.x += Math.cos((h * Math.PI) / 180) * w; b.y += Math.sin((h * Math.PI) / 180) * w; b.s += sat * w; b.l += l * w;
  }
  // Mostly white, grey or black artwork gets a silver orb rather than an invented colour.
  if (!pixels || colourful / pixels < 0.1) {
    const bright = lightSum / Math.max(1, pixels) > 0.55;
    const silver = bright ? { shard: '#e6e6ee', accent: '#b9bccb' } : { shard: '#b9bccb', accent: '#e6e6ee' };
    // A vivid detail covering at least ~1.5% of the cover becomes its colour, with silver as the second tone.
    if (vividCount / Math.max(1, pixels) >= 0.015) {
      const top = vivid.reduce((a, b) => (b.n > a.n ? b : a));
      const hue = ((Math.atan2(top.y, top.x) * 180) / Math.PI + 360) % 360;
      return { shard: glow([hue, top.s / top.n, top.l / top.n]), accent: silver.shard };
    }
    return silver;
  }
  // Rank with each bin's neighbours added, so a colour split across two bins still wins,
  // but take the colour itself from the winning bin alone so nearby highlights don't tint it.
  const merged = bins.map((_, i) => [-1, 0, 1].map((d) => bins[(i + d + BINS) % BINS]).reduce((acc, b) => ({
    w: acc.w + b.w, x: acc.x + b.x, y: acc.y + b.y, s: acc.s + b.s, l: acc.l + b.l,
  }), { w: 0, x: 0, y: 0, s: 0, l: 0 }));
  const hslOf = (b) => [((Math.atan2(b.y, b.x) * 180) / Math.PI + 360) % 360, b.s / b.w, b.l / b.w];
  const ranked = merged.map((b, i) => ({ i, w: b.w, b })).filter((r) => r.w > 0).sort((p, q) => q.w - p.w);
  const top = ranked[0];
  const far = (r) => Math.min(Math.abs(r.i - top.i), BINS - Math.abs(r.i - top.i)) >= 4; // at least 60° apart
  const second = ranked.find((r) => far(r) && r.w > top.w * 0.15);
  const own = (r) => (bins[r.i].w ? bins[r.i] : r.b);
  const topHsl = hslOf(own(top));
  const accentHsl = second ? hslOf(own(second)) : [(topHsl[0] + 30) % 360, topHsl[1], Math.min(0.8, topHsl[2] + 0.15)];
  return { shard: glow(topHsl), accent: glow(accentHsl) };
}

/** Colours for a cover URL. Same-origin covers only (ours are), so the canvas can be read. */
export function useCoverColors(src) {
  const [colors, setColors] = useState(() => cache.get(src) ?? FALLBACK);
  useEffect(() => {
    if (!src) return undefined;
    if (cache.has(src)) {
      setColors(cache.get(src));
      return undefined;
    }
    let alive = true;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      let result = FALLBACK;
      try {
        result = extractColors(img);
      } catch {
        // A cross-origin image can't be read; keep the brand colours.
      }
      cache.set(src, result);
      if (alive) setColors(result);
    };
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);
  return colors;
}
