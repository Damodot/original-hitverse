import { z } from 'zod';
import { toCredits } from '../../lib/credits.js';
import { parseLrc } from '../../lib/lrc.js';
import { fail } from '../errors.js';
import { editableSong } from '../permissions.js';

const line = z.string().max(300, 'A lyric line is too long');
const lyricsSchema = z.object({
  lines: z.array(line).max(400, 'Too many lines'),
  // One time per non-empty line, in seconds; null or [] removes the sync.
  synced: z.array(z.object({ t: z.number().min(0).max(4 * 3600), text: line })).max(400).nullable().optional(),
});

export const lyricsResolvers = {
  Mutation: {
    // Save lyrics (and their timings). Admins: any song; artists: their own uploads.
    saveLyrics: async (_, args, ctx) => {
      const data = lyricsSchema.parse(args);
      const song = await editableSong(ctx, args.songId, '+lyrics +syncedLyrics');
      const lines = data.lines.map((l) => l.trimEnd());
      while (lines.length && !lines.at(-1)) lines.pop();
      const synced = (data.synced ?? []).map((s) => ({ t: Math.round(s.t * 100) / 100, text: s.text.trim() })).filter((s) => s.text);
      synced.sort((a, b) => a.t - b.t);
      if (synced.length && song.duration && synced.at(-1).t > song.duration + 5) throw fail('Some times are after the end of the song');
      song.lyrics = lines;
      song.hasLyrics = lines.some(Boolean);
      song.syncedLyrics = synced.length ? synced : undefined;
      song.hasSynced = synced.length > 0;
      song.lyricsEdited = true;
      await song.save();
      return { lyrics: song.lyrics, synced: song.syncedLyrics?.length ? song.syncedLyrics : null };
    },
    // Writer and producer credits, shown after the lyrics.
    saveCredits: async (_, args, ctx) => {
      const credits = toCredits({ writers: args.writers ?? [], producers: args.producers ?? [] });
      const song = await editableSong(ctx, args.songId);
      song.credits = credits;
      await song.save();
      return song.credits?.writers?.length || song.credits?.producers?.length ? song.credits : null;
    },
    // Look the song up on LRCLIB (lrclib.net), a free, open database of synced lyrics.
    findLyricsOnline: async (_, args, ctx) => {
      const song = await editableSong(ctx, args.songId);
      const artist = song.artist.split(/\s*(?:&|,|feat\.?|ft\.?)\s*/i)[0];
      const headers = { 'User-Agent': 'HitVerse (https://github.com/Damodot/original-hitverse)' };
      const get = async (path, params) => {
        const r = await fetch(`https://lrclib.net/api/${path}?${new URLSearchParams(params)}`, { headers, signal: AbortSignal.timeout(10000) });
        if (r.status === 404) return null;
        if (!r.ok) throw Object.assign(new Error(`LRCLIB lookup failed (${r.status})`), { expose: true });
        return r.json();
      };
      let hit = await get('get', { artist_name: artist, track_name: song.title, ...(song.duration ? { duration: String(Math.round(song.duration)) } : {}) });
      if (!hit) {
        const results = await get('search', { artist_name: artist, track_name: song.title });
        hit = results?.find((r) => r.syncedLyrics) ?? results?.[0] ?? null;
      }
      if (!hit) return { found: false };
      return {
        found: true,
        source: 'LRCLIB',
        match: { title: hit.trackName, artist: hit.artistName, duration: hit.duration },
        synced: hit.syncedLyrics ? parseLrc(hit.syncedLyrics) : null,
        lines: hit.plainLyrics ? hit.plainLyrics.split(/\r?\n/) : null,
      };
    },
  },
};
