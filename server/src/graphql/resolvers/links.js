import { z } from 'zod';
import { findLinks, searchSources } from '../../lib/linkFinder.js';
import { cleanUrl, detectPlatform, PLATFORM_IDS } from '../../lib/platforms.js';
import { Album } from '../../models/Album.js';
import { Artist } from '../../models/Artist.js';
import { Song } from '../../models/Song.js';
import { limit, requireAdmin } from '../context.js';
import { fail } from '../errors.js';
import { editableSong } from '../permissions.js';
import { onlyFilled } from './shared.js';

const linksSchema = z.object(Object.fromEntries(PLATFORM_IDS.map((id) => [id, z.string().trim().max(500).optional().nullable()]))).strict();
const isrcSchema = z.string().trim().toUpperCase().transform((v) => v.replace(/[-\s]/g, ''))
  .refine((v) => v === '' || /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/.test(v), 'An ISRC looks like NG-A01-23-00001 (12 letters and numbers)');
const CREDITS = ['MusicLink'];

/** Keeps the credit list in step with the links: no links, no credits. */
function setCredits(song, add = []) {
  const has = PLATFORM_IDS.some((id) => song.links?.[id]);
  const next = has ? [...new Set([...(song.linkCredits ?? []), ...add.filter((c) => CREDITS.includes(c))])] : [];
  song.linkCredits = next.length ? next : undefined;
}

export const linkResolvers = {
  Query: {
    // Public song page: no sign-in needed.
    listen: async (_, { slug }) => {
      const song = await Song.findOne({ slug }).select('slug title artist artistId cover audio duration album links linkCredits').lean();
      if (!song) return null;
      const [album, artist] = await Promise.all([
        song.album ? Album.findById(song.album).select('title type').lean() : null,
        song.artistId ? Artist.findById(song.artistId).select('slug').lean() : null,
      ]);
      return {
        slug: song.slug,
        title: song.title,
        artist: song.artist,
        artistSlug: artist?.slug ?? null,
        cover: song.cover,
        preview: song.audio, // the page plays the first 30 seconds
        duration: song.duration,
        album: album && { title: album.title, type: album.type },
        links: onlyFilled(song.links),
        linkCredits: song.linkCredits ?? [],
      };
    },
  },
  Mutation: {
    listenClick: async (_, { slug, platform }, ctx) => {
      limit(ctx, 'click', 30, 60 * 1000);
      const p = z.enum(PLATFORM_IDS).parse(platform);
      await Song.updateOne({ slug, [`links.${p}`]: { $nin: [null, ''] } }, { $inc: { [`linkClicks.${p}`]: 1 } });
      return true;
    },
    saveLinks: async (_, args, ctx) => {
      const input = linksSchema.parse(args.links ?? {});
      const isrc = args.isrc === undefined || args.isrc === null ? undefined : isrcSchema.parse(args.isrc);
      const credits = z.array(z.string()).max(5).optional().nullable().parse(args.credits) ?? [];
      const song = await editableSong(ctx, args.songId);
      const next = {};
      for (const id of PLATFORM_IDS) {
        const value = input[id];
        if (!value) continue;
        if (detectPlatform(value) !== id) {
          throw fail(`That ${id === 'smartLink' ? 'smart link' : 'link'} doesn’t look right: ${value.slice(0, 80)}`, 'BAD_USER_INPUT', { field: id });
        }
        next[id] = cleanUrl(value);
      }
      for (const id of PLATFORM_IDS) song.links[id] = next[id] ?? undefined;
      if (isrc !== undefined) song.isrc = isrc || undefined;
      setCredits(song, credits);
      await song.save();
      return { links: onlyFilled(song.links), isrc: song.isrc ?? '' };
    },
    findLinks: async (_, args, ctx) => {
      const song = await editableSong(ctx, args.songId);
      const isrc = args.isrc ? isrcSchema.parse(args.isrc) : undefined;
      const result = await findLinks(song, { isrc: isrc || undefined });
      return { ...result, sources: searchSources() };
    },
    // Fills in every platform a song is missing. Links already set (by hand or earlier) are never replaced.
    adminFindAllLinks: async (_, __, ctx) => {
      await requireAdmin(ctx);
      const songs = await Song.find();
      const added = [];
      const errors = new Set();
      let needSeed = 0;
      for (const song of songs) {
        // Songs MusicLink has already filled in don't spend another lookup (the free plan has 300 a month).
        const done = song.links?.smartLink?.includes('musiclink.one');
        const result = await findLinks(song, { musicLink: !done });
        result.errors.forEach((e) => errors.add(e));
        if (result.needsSeed) needSeed++;
        const got = Object.keys(result.found).filter((id) => !song.links?.[id]);
        if (result.isrc && !song.isrc) song.isrc = result.isrc;
        if (!got.length && !song.isModified()) continue;
        for (const id of got) song.links[id] = result.found[id].url;
        setCredits(song, got.some((id) => result.found[id].source === 'MusicLink') ? ['MusicLink'] : []);
        await song.save();
        if (got.length) added.push({ title: song.title, platforms: got });
      }
      return { added, checked: songs.length, needSeed, errors: [...errors], sources: searchSources() };
    },
  },
};

