import { ArrowUpRight, Check, ClipboardPaste, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PlatformIcon } from '@/components/PlatformIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useFindLinks, useSaveLinks } from '@/hooks/useLinks';
import { detectPlatform, PLATFORM_BY_ID, PLATFORMS } from '@/lib/platforms';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

/**
 * Edit where a song streams. "Find automatically" searches Apple Music (and Spotify when keys are set);
 * pasting any streaming link files it under the right platform.
 */
export function StreamingLinksEditor({ song, open, onOpenChange }) {
  const [links, setLinks] = useState({});
  const [paste, setPaste] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [error, setError] = useState(null); // { field, message }
  const [suggestions, setSuggestions] = useState(null);
  const [isrc, setIsrc] = useState('');
  const save = useSaveLinks();
  const find = useFindLinks();

  useEffect(() => {
    if (open) {
      setLinks({ ...(song?.links ?? {}) });
      setIsrc(song?.isrc ?? '');
      setPaste('');
      setPasteError('');
      setError(null);
      setSuggestions(null);
    }
  }, [open, song]);

  if (!song) return null;
  const set = (id, value) => setLinks((l) => ({ ...l, [id]: value }));

  const addPasted = (value = paste) => {
    const url = value.trim();
    if (!url) return;
    const id = detectPlatform(url);
    if (!id) return setPasteError('That isn’t a link we recognise. Use an https link from one of the platforms below.');
    set(id, url);
    setPaste('');
    setPasteError('');
    toast.success(`Added to ${PLATFORM_BY_ID[id].name}`);
  };

  const runFind = () => find.mutate({ id: song._id, isrc: isrc.trim() || undefined }, {
    onSuccess: (d) => {
      setSuggestions(d);
      if (d.isrc && !isrc.trim()) setIsrc(d.isrc);
    },
    onError: (err) => toast.error(err.message),
  });

  const submit = () => {
    const bad = PLATFORMS.find((p) => links[p.id]?.trim() && detectPlatform(links[p.id]) !== p.id);
    if (bad) return setError({ field: bad.id, message: `This isn’t a ${bad.id === 'smartLink' ? 'smart link we support' : `${bad.name} link`}.` });
    setError(null);
    const body = Object.fromEntries(PLATFORMS.map((p) => [p.id, links[p.id]?.trim() || undefined]).filter(([, v]) => v));
    // Credit MusicLink on the song page when any link it found is kept.
    const credits = Object.entries(suggestions?.found ?? {}).some(([id, m]) => m.source === 'MusicLink' && body[id] === m.url) ? ['MusicLink'] : [];
    // Only send the ISRC if it was edited, so an editor opened without it can't wipe the saved one.
    const isrcChanged = isrc.trim() !== (song.isrc ?? '');
    save.mutate({ id: song._id, links: body, ...(isrcChanged ? { isrc: isrc.trim() } : {}), credits }, {
      onSuccess: () => {
        toast.success(`Saved streaming links for “${song.title}”`);
        onOpenChange(false);
      },
      onError: (err) => setError({ field: err.field, message: err.message }),
    });
  };

  const found = suggestions ? Object.entries(suggestions.found) : [];
  const fresh = found.filter(([id, m]) => links[id] !== m.url);
  const sources = suggestions?.sources;
  const sourceText = sources
    ? ['Apple Music', sources.musicLink && 'MusicLink (every platform)', sources.spotify && 'Spotify'].filter(Boolean).join(', ')
    : 'Apple Music, plus MusicLink or Spotify if their keys are set';

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Streaming links"
      description={`Where else people can listen to “${song.title}”. These show on its song page.`}
      footer={(
        <>
          <Button variant="ghost" asChild><a href={`/listen/${song.slug}`} target="_blank" rel="noreferrer"><ArrowUpRight className="size-4" /> View song page</a></Button>
          <Button onClick={submit} loading={save.isPending}><Check className="size-4" /> Save</Button>
        </>
      )}
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-subtle/40 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 flex-1">
              <label htmlFor="isrc" className="text-sm font-semibold">ISRC <span className="font-normal text-muted">(optional, from DistroKid)</span></label>
              <Input id="isrc" value={isrc} onChange={(e) => setIsrc(e.target.value.toUpperCase())} placeholder="e.g. QZTB52295123" className="mt-1 h-10 font-mono text-sm" maxLength={15} />
            </div>
            <Button variant="secondary" onClick={runFind} loading={find.isPending}><Sparkles className="size-4" /> Find links</Button>
          </div>
          <p className="mt-2 text-sm text-muted">Searches {sourceText}. With an ISRC, MusicLink can find the song even if it isn’t on Apple Music.</p>
          {suggestions && (
            <div className="mt-3 space-y-2">
              {!found.length && (
                <p className="text-sm text-muted">
                  No exact match found.{suggestions.needsSeed ? ' Add the ISRC or paste one link (Spotify, Apple Music, YouTube…), then search again to fill in the rest.' : ' Paste the links below instead.'}
                </p>
              )}
              {suggestions.errors?.map((e) => <p key={e} className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{e}</p>)}
              {fresh.length > 1 && (
                <Button size="sm" className="w-full" onClick={() => setLinks((l) => ({ ...l, ...Object.fromEntries(fresh.map(([id, m]) => [id, m.url])) }))}>
                  <Check className="size-4" /> Use all {fresh.length} links
                </Button>
              )}
              {found.map(([id, m]) => (
                <div key={id} className="flex items-center gap-3 rounded-xl bg-elevated p-2">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-subtle"><PlatformIcon id={id} className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{PLATFORM_BY_ID[id].name} <span className="font-normal text-muted">· via {m.source}</span></p>
                    <p className="truncate text-sm text-muted">{m.title} · {m.artist}{m.album ? ` · ${m.album}` : ''}</p>
                  </div>
                  {links[id] === m.url
                    ? <span className="px-2 text-sm font-semibold text-emerald-500">Added</span>
                    : <Button size="sm" variant={links[id] ? 'outline' : 'primary'} onClick={() => set(id, m.url)}>{links[id] ? 'Replace' : 'Use'}</Button>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="paste-link">Paste any streaming link</label>
          <div className="mt-1.5 flex gap-2">
            <Input
              id="paste-link"
              value={paste}
              onChange={(e) => { setPaste(e.target.value); setPasteError(''); }}
              onPaste={(e) => {
                const text = e.clipboardData.getData('text');
                if (detectPlatform(text)) {
                  e.preventDefault();
                  addPasted(text);
                }
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPasted())}
              placeholder="https://open.spotify.com/track/…"
              aria-invalid={!!pasteError || undefined}
            />
            <Button variant="secondary" onClick={() => addPasted()} aria-label="Add link"><ClipboardPaste className="size-4" /></Button>
          </div>
          <p className={cn('mt-1.5 text-sm', pasteError ? 'text-red-500' : 'text-muted')}>
            {pasteError || 'We work out which platform it is. Tip: your DistroKid HyperFollow link goes under “All platforms”.'}
          </p>
        </div>

        <ul className="space-y-2">
          {PLATFORMS.map((p) => (
            <li key={p.id}>
              <label className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-subtle"><PlatformIcon id={p.id} className="size-5" /></span>
                <span className="sr-only">{p.name}</span>
                <span className="min-w-0 flex-1">
                  <span className="mb-0.5 block text-xs font-semibold text-muted">{p.name}</span>
                  <span className="relative block">
                    <Input
                      value={links[p.id] ?? ''}
                      onChange={(e) => set(p.id, e.target.value)}
                      placeholder={p.example}
                      className="h-10 pr-9 text-sm"
                      aria-invalid={error?.field === p.id || undefined}
                    />
                    {links[p.id] && (
                      <button type="button" onClick={() => set(p.id, '')} aria-label={`Remove ${p.name} link`} className="absolute inset-y-0 right-0 grid w-9 cursor-pointer place-items-center text-muted hover:text-fg">
                        <X className="size-4" />
                      </button>
                    )}
                  </span>
                  {error?.field === p.id && <span className="mt-1 block text-sm text-red-500">{error.message}</span>}
                </span>
              </label>
            </li>
          ))}
        </ul>
        {error && !error.field && <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{error.message}</p>}
      </div>
    </Modal>
  );
}
