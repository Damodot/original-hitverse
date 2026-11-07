import { Check, ClipboardCopy, Download, Hand, Minus, Play, Plus, RotateCcw, Search, Undo2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { usePlayer } from '@/context/PlayerContext';
import { useLyrics } from '@/hooks/useLibrary';
import { useFindLyricsOnline, useSaveCredits, useSaveLyrics } from '@/hooks/useLyricsEdit';
import { Field } from '@/components/ui/input';
import { activeLine, parseLrc, stamp, toLrc } from '@/lib/lrc';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const TABS = [['write', 'Lyrics'], ['sync', 'Sync'], ['credits', 'Credits'], ['import', 'Import']];
const joinNames = (names) => (names ?? []).join(', ');
const linesOf = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean);

/**
 * Write a song's lyrics and sync them: play the song and tap (or press Enter) as each line starts.
 * Timings can also come from LRCLIB or a pasted LRC file.
 */
export function LyricsEditor({ song, open, onOpenChange }) {
  const { data } = useLyrics(open ? song?.slug : null);
  const save = useSaveLyrics();
  const saveCredits = useSaveCredits();
  const [writers, setWriters] = useState('');
  const [producers, setProducers] = useState('');
  const find = useFindLyricsOnline();
  const [tab, setTab] = useState('write');
  const [text, setText] = useState('');
  const [times, setTimes] = useState([]); // times[i] = start of the i-th non-empty line
  const [lrc, setLrc] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Load what's saved when the editor opens.
  useEffect(() => {
    if (!open) {
      setLoaded(false);
      return;
    }
    if (!data || loaded) return;
    const plain = data.lyrics ?? [];
    if (data.synced?.length) {
      const sameLines = linesOf(plain.join('\n')).join('\n') === data.synced.map((l) => l.text).join('\n');
      setText(sameLines ? plain.join('\n') : data.synced.map((l) => l.text).join('\n'));
      setTimes(data.synced.map((l) => l.t));
    } else {
      setText(plain.join('\n'));
      setTimes([]);
    }
    setWriters(joinNames(data.credits?.writers));
    setProducers(joinNames(data.credits?.producers));
    setTab(plain.length || data.synced?.length ? 'sync' : 'write');
    setLrc('');
    setLoaded(true);
  }, [open, data, loaded]);

  const lines = useMemo(() => linesOf(text), [text]);
  const timed = times.slice(0, lines.length).filter((t) => t != null).length;
  const allTimed = lines.length > 0 && timed === lines.length;
  const outOfOrder = times.findIndex((t, i) => i > 0 && i < lines.length && t != null && times[i - 1] != null && t < times[i - 1]);

  const apply = (synced, source) => {
    setText(synced.map((l) => l.text).join('\n'));
    setTimes(synced.map((l) => l.t));
    setTab('sync');
    toast.success(`Timings loaded from ${source}`, { description: `${synced.length} lines. Play it through to check them.` });
  };

  const submit = () => {
    if (outOfOrder > 0) return toast.error(`Line ${outOfOrder + 1} starts before the line above it. Fix it in Sync.`);
    const synced = allTimed ? lines.map((l, i) => ({ t: times[i], text: l })) : null;
    const creditsChanged = writers.trim() !== joinNames(data?.credits?.writers) || producers.trim() !== joinNames(data?.credits?.producers);
    save.mutate({ id: song._id, slug: song.slug, lines: text.split('\n'), synced }, {
      onSuccess: async () => {
        if (creditsChanged) {
          try {
            await saveCredits.mutateAsync({ id: song._id, slug: song.slug, writers, producers });
          } catch (err) {
            toast.error(err.message);
            return;
          }
        }
        toast.success(synced ? 'Synced lyrics saved' : 'Lyrics saved', {
          description: synced ? 'They now follow the song in the player.' : timed ? `${lines.length - timed} lines still need a time, so they're saved without sync.` : undefined,
        });
        onOpenChange(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  if (!song) return null;
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-2xl"
      title={`Lyrics & credits · ${song.title}`}
      description="Write the lyrics, sync them so each line lights up as it’s sung, and credit the writers and producers."
      footer={(
        <>
          <span className="mr-auto self-center text-sm text-muted">
            {!lines.length ? 'No lyrics yet' : allTimed ? `All ${lines.length} lines synced` : `${timed} of ${lines.length} lines synced`}
          </span>
          {data?.synced?.length > 0 && (
            <Button variant="ghost" onClick={() => setTimes([])}>Remove sync</Button>
          )}
          <Button onClick={submit} loading={save.isPending || saveCredits.isPending}><Check className="size-4" /> Save</Button>
        </>
      )}
    >
      <div role="tablist" className="mb-4 inline-flex rounded-full bg-subtle p-1">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={cn('cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition', tab === id ? 'bg-elevated text-fg shadow' : 'text-muted hover:text-fg')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'write' && (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={16}
            placeholder={'One line per line.\nLeave an empty line between verses.'}
            className="w-full resize-y rounded-xl border border-border bg-elevated/70 px-4 py-3 font-medium leading-relaxed outline-none focus:border-brand focus:ring-4 focus:ring-brand/20"
          />
          {timed > 0 && <p className="mt-2 text-sm text-amber-500">Adding or removing lines after syncing can shift the times. Check them in Sync.</p>}
        </div>
      )}

      {tab === 'credits' && (
        <div className="space-y-4">
          <p className="text-sm text-muted">Shown after the lyrics. When synced lyrics reach the end of the song, the credits take the spotlight.</p>
          <Field label="Written by" value={writers} onChange={(e) => setWriters(e.target.value)} placeholder="e.g. Adedotun Adedeji, Tolu Ade" maxLength={1000} />
          <Field label="Produced by" value={producers} onChange={(e) => setProducers(e.target.value)} placeholder="e.g. DJ Great" maxLength={1000} />
          <p className="text-xs text-muted">Separate names with commas or “&amp;”.</p>
        </div>
      )}

      {tab === 'sync' && <SyncTab song={song} lines={lines} times={times} setTimes={setTimes} outOfOrder={outOfOrder} />}

      {tab === 'import' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border p-4">
            <p className="font-semibold">Find synced lyrics online</p>
            <p className="mt-1 text-sm text-muted">Searches LRCLIB, a free, open library of synced lyrics. Independent releases often aren’t there yet; syncing it yourself takes one listen.</p>
            <Button className="mt-3" variant="secondary" loading={find.isPending}
              onClick={() => find.mutate(song._id, {
                onSuccess: (d) => {
                  if (!d.found) return toast('Not on LRCLIB yet', { description: 'Sync it yourself in the Sync tab.' });
                  if (d.synced?.length) return apply(d.synced, 'LRCLIB');
                  if (d.lines) {
                    setText(d.lines.join('\n'));
                    setTimes([]);
                    setTab('sync');
                    toast('Found the lyrics, but without timings', { description: 'Tap along in Sync to add them.' });
                  }
                },
                onError: (err) => toast.error(err.message),
              })}>
              <Search className="size-4" /> Search LRCLIB
            </Button>
          </div>
          <div className="rounded-2xl border border-border p-4">
            <p className="font-semibold">Paste an LRC file</p>
            <p className="mt-1 text-sm text-muted">Lines like <span className="font-mono text-fg">[00:12.40] First line</span>, from a lyrics app or another tool.</p>
            <textarea value={lrc} onChange={(e) => setLrc(e.target.value)} rows={6} placeholder="[00:12.40] First line"
              className="mt-3 w-full resize-y rounded-xl border border-border bg-elevated/70 px-4 py-3 font-mono text-sm outline-none focus:border-brand" />
            <Button className="mt-2" variant="secondary" disabled={!lrc.trim()}
              onClick={() => {
                const parsed = parseLrc(lrc);
                if (!parsed.length) return toast.error('No timed lines found. Each line needs a [mm:ss.xx] time.');
                apply(parsed, 'the LRC file');
              }}>
              Use these timings
            </Button>
          </div>
          {allTimed && (
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={async () => {
                await navigator.clipboard.writeText(toLrc(lines.map((l, i) => ({ t: times[i], text: l })))).catch(() => {});
                toast.success('LRC copied');
              }}><ClipboardCopy className="size-4" /> Copy as LRC</Button>
              <Button variant="ghost" size="sm" asChild>
                <a download={`${song.title}.lrc`} href={`data:text/plain;charset=utf-8,${encodeURIComponent(toLrc(lines.map((l, i) => ({ t: times[i], text: l }))))}`}>
                  <Download className="size-4" /> Download .lrc
                </a>
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/** Tap-to-sync: the song plays in the main player; tap (or press Enter) as each line starts. */
function SyncTab({ song, lines, times, setTimes, outOfOrder }) {
  const { current, isPlaying, playSong, seek, getTime, toggle } = usePlayer();
  const isCurrent = current?._id === song._id;
  // The next line waiting for a time (the first one without one).
  let target = 0;
  while (target < lines.length && times[target] != null) target++;
  const [now, setNow] = useState(0);
  const rows = useRef([]);

  // Clock for the "now singing" marker and the time readout.
  useEffect(() => {
    if (!isCurrent) return undefined;
    let raf = 0;
    const tick = () => { setNow(getTime()); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isCurrent, getTime]);

  useEffect(() => {
    rows.current[target]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [target]);

  const tap = () => {
    if (!isCurrent || !isPlaying || target >= lines.length) return;
    const t = Math.round(getTime() * 100) / 100;
    setTimes((prev) => {
      const next = [...prev];
      next[target] = t;
      return next;
    });
  };
  const undo = () => {
    const last = times.slice(0, lines.length).reduce((acc, t, i) => (t != null ? i : acc), -1);
    if (last < 0) return;
    setTimes((prev) => prev.map((t, i) => (i === last ? null : t)));
    // Go back a little to re-tap it, but never before the line above (or the next tap would land out of order).
    const before = times.slice(0, last).filter((t) => t != null).at(-1) ?? 0;
    if (isCurrent) seek(Math.max(before + 0.05, (times[last] ?? 0) - 3));
  };
  const nudge = (i, d) => setTimes((prev) => prev.map((t, j) => (j === i && t != null ? Math.max(0, Math.round((t + d) * 100) / 100) : t)));
  const start = () => {
    if (isCurrent) {
      seek(0);
      if (!isPlaying) toggle();
    } else playSong(song);
  };

  // Enter taps, Backspace undoes (Space still plays/pauses).
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('textarea, input')) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        tap();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!lines.length) return <p className="py-10 text-center text-muted">Add the lyrics in the Lyrics tab first.</p>;

  const singing = isCurrent ? activeLine(lines.map((l, i) => ({ t: times[i] ?? Infinity, text: l })).filter((l) => Number.isFinite(l.t)), now) : -1;
  return (
    <div>
      <div className="sticky top-0 z-10 -mx-5 -mt-1 mb-3 space-y-3 border-b border-border bg-elevated px-5 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={start}><Play className="size-4 fill-current" /> {isCurrent ? 'From the start' : 'Play the song'}</Button>
          <Button variant="ghost" size="sm" onClick={undo} disabled={!times.some((t) => t != null)}><Undo2 className="size-4" /> Undo</Button>
          <Button variant="ghost" size="sm" onClick={() => setTimes([])} disabled={!times.some((t) => t != null)}><RotateCcw className="size-4" /> Clear</Button>
          <span className="ml-auto font-mono text-sm text-muted tabular-nums">{isCurrent ? stamp(now) : '--:--.--'}</span>
        </div>
        <button
          type="button"
          onClick={tap}
          disabled={!isCurrent || !isPlaying || target >= lines.length}
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-brand px-4 py-4 text-lg font-bold text-brand-fg shadow-lg shadow-brand/25 transition active:scale-[0.98] disabled:cursor-default disabled:opacity-50"
        >
          <Hand className="size-5" />
          {target >= lines.length ? 'Every line has a time' : !isCurrent || !isPlaying ? 'Play the song, then tap as each line starts' : `Tap when “${lines[target]}” starts`}
        </button>
        <p className="text-xs text-muted">Tip: press <b>Enter</b> to tap, <b>Backspace</b> to undo, <b>Space</b> to pause. Use −/+ to nudge a line by a tenth of a second.</p>
        {outOfOrder > 0 && <p className="text-sm text-red-500">Line {outOfOrder + 1} starts before the line above it.</p>}
      </div>
      <ol className="space-y-1">
        {lines.map((l, i) => {
          const t = times[i];
          return (
            <li key={i} ref={(el) => { rows.current[i] = el; }}
              className={cn('flex items-center gap-2 rounded-xl px-2 py-1.5', i === target && 'bg-brand/10 ring-1 ring-brand/40', i === singing && 'bg-fg/5', i === outOfOrder && 'ring-1 ring-red-500')}>
              <button type="button" disabled={t == null || !isCurrent} onClick={() => seek(Math.max(0, t - 2))} title="Play from just before this line"
                className={cn('w-20 shrink-0 cursor-pointer rounded-lg px-2 py-1 text-left font-mono text-xs tabular-nums disabled:cursor-default', t != null ? 'bg-subtle text-fg hover:bg-border' : 'text-muted')}>
                {t != null ? stamp(t) : '--:--.--'}
              </button>
              <span className={cn('min-w-0 flex-1 truncate', i === singing ? 'font-bold text-brand' : t == null ? 'text-muted' : '')}>{l}</span>
              {t != null && (
                <span className="flex shrink-0 gap-0.5">
                  <Button variant="ghost" size="icon-sm" onClick={() => nudge(i, -0.1)} aria-label={`Line ${i + 1} earlier`}><Minus className="size-3.5" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => nudge(i, 0.1)} aria-label={`Line ${i + 1} later`}><Plus className="size-3.5" /></Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setTimes((prev) => prev.map((x, j) => (j === i ? null : x)))} aria-label={`Clear line ${i + 1}`}><X className="size-3.5" /></Button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
