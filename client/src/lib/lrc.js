// LRC: "[01:23.45] a line". Same rules as the server (server/src/lib/lrc.js).
const STAMP = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

export function parseLrc(text) {
  let offset = 0;
  const out = [];
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const tag = /^\[offset:\s*([+-]?\d+)\]/i.exec(raw.trim());
    if (tag) {
      offset = Number(tag[1]) / 1000;
      continue;
    }
    const times = [...raw.matchAll(STAMP)];
    if (!times.length) continue;
    const line = raw.replace(STAMP, '').trim();
    for (const [, m, s, frac = '0'] of times) {
      const t = Number(m) * 60 + Number(s) + Number(frac.padEnd(3, '0')) / 1000 + offset;
      out.push({ t: Math.max(0, Math.round(t * 100) / 100), text: line });
    }
  }
  return out.sort((a, b) => a.t - b.t);
}

export const stamp = (t) => {
  const m = Math.floor(t / 60);
  const s = (t - m * 60).toFixed(2).padStart(5, '0');
  return `${String(m).padStart(2, '0')}:${s}`;
};

export const toLrc = (synced) => synced.map((l) => `[${stamp(l.t)}] ${l.text}`).join('\n');

/** Index of the line being sung at time t (-1 before the first line). */
export function activeLine(synced, t) {
  let lo = 0;
  let hi = synced.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (synced[mid].t <= t + 0.05) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
}
