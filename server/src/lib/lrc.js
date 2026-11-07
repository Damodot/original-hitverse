// LRC is the usual synced-lyrics format: "[01:23.45] a line". A line can carry several times
// (a repeated chorus), and an [offset:+250] tag shifts everything by milliseconds.
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
    const text = raw.replace(STAMP, '').trim();
    for (const [, m, s, frac = '0'] of times) {
      const t = Number(m) * 60 + Number(s) + Number(frac.padEnd(3, '0')) / 1000 + offset;
      out.push({ t: Math.max(0, Math.round(t * 100) / 100), text });
    }
  }
  return out.sort((a, b) => a.t - b.t);
}
