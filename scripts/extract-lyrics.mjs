// One-time: pull the lyrics out of the original hitverse.js into server/src/seed/lyrics.json
// so they live in MongoDB instead of being hard-coded HTML strings.
// Usage: node scripts/extract-lyrics.mjs [path/to/original-hitverse/public/hitverse.js]
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const file = path.resolve(process.argv[2] ?? '../original-hitverse/public/hitverse.js');
const js = readFileSync(file, 'utf8');
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

const out = {};
for (const [, name, body] of js.matchAll(/const lyrics(\w+)\s*=\s*`([\s\S]*?)`/g)) {
  const slug = name[0].toLowerCase() + name.slice(1);
  out[slug] = [...body.matchAll(/<h6[^>]*>([\s\S]*?)<\/h6>/g)].map((m) => decode(m[1]));
  console.log(`${slug}: ${out[slug].length} lines`);
}
writeFileSync(path.resolve('server/src/seed/lyrics.json'), JSON.stringify(out, null, 2) + '\n');
