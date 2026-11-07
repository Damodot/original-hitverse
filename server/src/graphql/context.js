import { readSession } from '../lib/auth.js';
import { Artist } from '../models/Artist.js';
import { User } from '../models/User.js';
import { forbidden, unauthenticated } from './errors.js';

/** Built for every GraphQL request: who's asking, plus small per-request caches. */
export function buildContext({ req, res }) {
  const userId = readSession(req);
  let userPromise;
  const artistCache = new Map();
  return {
    req,
    res,
    userId,
    ip: req.ip,
    /** The signed-in account (loaded once per request), or null. */
    user: () => (userPromise ??= userId ? User.findById(userId).exec() : Promise.resolve(null)),
    /** An artist profile by id, cached for the request (lists of songs share artists). */
    artist: (id) => {
      if (!id) return null;
      const key = String(id);
      if (!artistCache.has(key)) artistCache.set(key, Artist.findById(id).lean().exec());
      return artistCache.get(key);
    },
  };
}

export async function requireUser(ctx) {
  const user = await ctx.user();
  if (!user) throw unauthenticated();
  return user;
}

export async function requireAdmin(ctx) {
  const user = await requireUser(ctx);
  if (user.role !== 'admin') throw forbidden('Admins only');
  return user;
}

export async function requireArtist(ctx) {
  const user = await requireUser(ctx);
  if (!user.canUpload()) throw forbidden('Your artist account has to be approved first');
  return user;
}

// Simple per-IP limits for sensitive mutations (sign-in attempts, link clicks).
const buckets = new Map();
export function limit(ctx, key, max, windowMs) {
  const id = `${key}:${ctx.ip}`;
  const now = Date.now();
  const b = buckets.get(id);
  if (!b || now > b.reset) {
    buckets.set(id, { n: 1, reset: now + windowMs });
    return;
  }
  if (++b.n > max) throw forbidden('Too many attempts. Wait a few minutes and try again.');
}
setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (now > b.reset) buckets.delete(k);
}, 60_000).unref();
