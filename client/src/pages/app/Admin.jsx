import { AudioWaveform, Check, Crown, Search, Copy, ExternalLink, Inbox, ListMusic, Mic, MousePointerClick, Music2, Play, RefreshCw, Sparkles, Trash2, UserX, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Page, PageHeader } from '@/components/layout/PageHeader';
import { KaraokeEditor } from '@/components/KaraokeEditor';
import { PlatformIcon } from '@/components/PlatformIcon';
import { StreamingLinksEditor } from '@/components/StreamingLinksEditor';
import { UndoButton } from '@/components/UndoButton';
import { Button } from '@/components/ui/button';
import { Input, TextareaField } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlayer } from '@/context/PlayerContext';
import { useAdminArtists, useAdminDeleteSong, useAdminSongs, useAdminStorage, useDecide } from '@/hooks/useArtist';
import { useAdminProfiles, useSetArtistFlags } from '@/hooks/useArtists';
import { useAnalyzeAll, useAnalyzeMix, useAudioToolsReady, useKaraokeAdmin } from '@/hooks/useAudioTools';
import { usePremiumMembers, useSetPremium } from '@/hooks/usePremium';
import { useAdminLinks, useFindAllLinks } from '@/hooks/useLinks';
import { PLATFORMS } from '@/lib/platforms';
import { toast } from '@/lib/toast';
import { cn, formatTime } from '@/lib/utils';

const TABS = [
  { id: 'pending', label: 'Requests' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Not approved' },
  { id: 'uploads', label: 'Uploads' },
  { id: 'links', label: 'Streaming links' },
  { id: 'pages', label: 'Artist pages' },
  { id: 'karaoke', label: 'Karaoke & DJ' },
  { id: 'premium', label: 'Premium' },
];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export default function Admin() {
  const [params] = useSearchParams();
  const [tab, setTab] = useState(() => (TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'pending'));
  // Counts come with every artists list, so the tab badges stay current from any tab.
  const counts = useAdminArtists('pending').data?.counts;

  return (
    <Page>
      <PageHeader eyebrow="Admin" title="Artists" subtitle="Approve who can upload music, and remove uploads that don’t belong." />
      <div role="tablist" aria-label="Admin sections" className="-mx-1 mb-6 flex gap-1 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 font-semibold transition',
              tab === t.id ? 'bg-fg text-bg' : 'bg-subtle text-muted hover:text-fg',
            )}
          >
            {t.label}
            {counts?.[t.id] > 0 && (
              <span className={cn(
                'rounded-full px-2 text-xs leading-5 tabular-nums',
                t.id === 'pending' ? 'bg-brand text-brand-fg' : tab === t.id ? 'bg-bg/20' : 'bg-border',
              )}
              >
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {tab === 'uploads' ? <><StorageMeter /><Uploads /></> : tab === 'links' ? <LinksPanel /> : tab === 'pages' ? <ArtistPages /> : tab === 'karaoke' ? <KaraokePanel /> : tab === 'premium' ? <PremiumPanel /> : <ArtistList status={tab} />}
      </div>
    </Page>
  );
}

const EMPTY = {
  pending: 'No requests waiting. New artist applications show up here.',
  approved: 'No approved artists yet.',
  rejected: 'Nobody has been turned down.',
};

function ArtistList({ status }) {
  const { data, isPending, isError, error } = useAdminArtists(status);

  if (isPending) return <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-56 rounded-3xl" />)}</div>;
  if (isError) return <p className="text-red-500">{error.message}</p>;
  if (!data.artists.length) {
    return (
      <div className="grid place-items-center rounded-3xl border border-dashed border-border px-6 py-16 text-center text-muted">
        <Inbox className="mb-3 size-8" />
        {EMPTY[status]}
      </div>
    );
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {data.artists.map((a) => <ArtistCard key={a._id} a={a} status={status} />)}
    </ul>
  );
}

/** One application. Every decision runs on a short fuse with Undo before it's sent (and emailed). */
function ArtistCard({ a, status }) {
  const decide = useDecide();
  const [armed, setArmed] = useState(null); // which action is counting down
  const [showReason, setShowReason] = useState(false);
  const [note, setNote] = useState('');
  const armFor = (which) => (on) => setArmed((cur) => (on ? which : cur === which ? null : cur));
  const send = (next) => decide.mutate({ id: a._id, status: next, note: next === 'rejected' ? note : '', name: a.artist.name });

  return (
    <li className="flex flex-col rounded-3xl border border-border bg-elevated/60 p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-fuchsia-500 text-lg font-bold text-white">
          {a.artist.name?.[0]?.toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-bold">{a.artist.name}</p>
          <p className="truncate text-sm text-muted">{a.firstName} {a.lastName} · {a.email}</p>
        </div>
      </div>
      <p className="mt-4 line-clamp-5 whitespace-pre-line">{a.artist.bio}</p>
      {a.artist.link && (
        <a href={a.artist.link} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-flex max-w-full items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
          <ExternalLink className="size-4 shrink-0" /> <span className="truncate">{a.artist.link.replace(/^https?:\/\//, '')}</span>
        </a>
      )}
      <p className="mt-4 text-sm text-muted">
        Applied {fmtDate(a.artist.appliedAt)}
        {a.artist.reviewedAt && status !== 'pending' && ` · reviewed ${fmtDate(a.artist.reviewedAt)}`}
        {status === 'approved' && ` · ${a.songCount} ${a.songCount === 1 ? 'song' : 'songs'}`}
      </p>
      {status === 'rejected' && a.artist.note && <p className="mt-2 rounded-xl bg-subtle px-3 py-2 text-sm">Reason given: {a.artist.note}</p>}
      {status !== 'rejected' && (showReason ? (
        <TextareaField
          className="mt-4"
          label={status === 'approved' ? 'Reason for removing access (optional, sent to them)' : 'Reason for declining (optional, sent to them)'}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={2}
          disabled={!!armed}
        />
      ) : (
        <button type="button" onClick={() => setShowReason(true)} className="mt-3 self-start cursor-pointer text-sm font-semibold text-muted hover:text-fg">
          + Add a reason{status === 'approved' ? ' for removing access' : ' if declining'}
        </button>
      ))}
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        {status !== 'approved' && (
          <UndoButton tone="primary" label="Approve" doneLabel="Approved" icon={<Check />}
            disabled={armed && armed !== 'approve'} onArmedChange={armFor('approve')} onConfirm={() => send('approved')} />
        )}
        {status === 'pending' && (
          <UndoButton tone="danger" label="Decline" doneLabel="Declined" icon={<X />}
            disabled={armed && armed !== 'decline'} onArmedChange={armFor('decline')} onConfirm={() => send('rejected')} />
        )}
        {status === 'approved' && (
          <UndoButton tone="danger" label="Remove upload access" doneLabel="Access removed" icon={<UserX />}
            onArmedChange={armFor('remove')} onConfirm={() => send('rejected')} />
        )}
      </div>
    </li>
  );
}

function Uploads() {
  const { data, isPending, isError, error } = useAdminSongs();
  const { current, playSong } = usePlayer();
  const del = useAdminDeleteSong();

  if (isPending) return <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>;
  if (isError) return <p className="text-red-500">{error.message}</p>;
  if (!data.length) {
    return (
      <div className="grid place-items-center rounded-3xl border border-dashed border-border px-6 py-16 text-center text-muted">
        <Music2 className="mb-3 size-8" /> No artist uploads yet.
      </div>
    );
  }
  return (
    <>
      <ul className="-mx-2 space-y-1">
        {data.map((s) => (
          <li key={s._id} className={cn('flex items-center gap-3 rounded-2xl p-2 transition hover:bg-subtle', current?._id === s._id && 'bg-subtle/70')}>
            <button type="button" onClick={() => playSong(s, data)} aria-label={`Play ${s.title}`} className="group relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-subtle">
              <img src={s.cover} alt="" loading="lazy" className="size-full object-cover" />
              <span className="absolute inset-0 grid place-items-center bg-black/50 text-white opacity-0 transition group-hover:opacity-100"><Play className="size-5 fill-current" /></span>
            </button>
            <div className="min-w-0 flex-1">
              <p className={cn('truncate font-semibold', current?._id === s._id && 'text-brand')}>{s.title}</p>
              <p className="truncate text-sm text-muted">
                {s.artist} · {s.uploader?.email ?? 'deleted account'}
              </p>
            </div>
            <p className="hidden text-right text-sm text-muted tabular-nums sm:block">
              {formatTime(s.duration)} · {s.plays} plays<br />{fmtDate(s.createdAt)}
            </p>
            <UndoButton tone="danger" label="Delete" doneLabel="Deleted" icon={<Trash2 />} onConfirm={() => del.mutate(s)} />
          </li>
        ))}
      </ul>
    </>
  );
}

/** Every song's streaming links and how often each "Listen on" button was clicked. */
function LinksPanel() {
  const { data, isPending, isError, error } = useAdminLinks();
  const findAll = useFindAllLinks();
  const [editing, setEditing] = useState(null);

  if (isPending) return <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>;
  if (isError) return <p className="text-red-500">{error.message}</p>;

  const runFindAll = () => findAll.mutate(undefined, {
    onSuccess: (d) => {
      const n = d.added.length;
      const total = d.added.reduce((sum, a) => sum + a.platforms.length, 0);
      toast.success(n ? `Added ${total} ${total === 1 ? 'link' : 'links'} to ${n} ${n === 1 ? 'song' : 'songs'}` : 'No new matches found', {
        description: n ? d.added.map((a) => a.title).join(', ') : 'Paste links for the rest from each song’s Edit button.',
        duration: 7000,
      });
      if (d.sources.musicLink && d.needSeed) {
        toast(`${d.needSeed} ${d.needSeed === 1 ? 'song needs' : 'songs need'} an ISRC or one link first`, { description: 'Add it in the song’s Edit dialog, then run this again.', duration: 7000 });
      }
      if (d.errors.length) toast.error('A search service didn’t answer', { description: d.errors[0] });
    },
    onError: (err) => toast.error(err.message),
  });

  const copy = async (slug) => {
    await navigator.clipboard.writeText(`${window.location.origin}/listen/${slug}`).catch(() => {});
    toast.success('Song page link copied');
  };

  const hasLinks = (s) => Object.keys(s.links).some((k) => k !== 'smartLink');
  const withLinks = data.songs.filter(hasLinks).length;
  const missing = data.songs.filter((s) => !hasLinks(s));
  const ml = data.sources.musicLink;
  return (
    <>
      <div className="mb-5 space-y-4 rounded-3xl border border-border bg-elevated/60 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-lg font-bold">{withLinks} of {data.songs.length} songs are on other platforms</p>
            <p className="mt-1 text-sm text-muted">
              {ml
                ? 'Find links checks Apple Music, then MusicLink fills in Spotify, YouTube Music, Audiomack, Boomplay, Deezer, TIDAL and Amazon Music. It only fills platforms that are empty, so links you add yourself are kept.'
                : 'Find links checks Apple Music. Add MUSICLINK_API_KEY to .env (free at musiclink.one) to fill in Spotify, YouTube Music, Audiomack, Boomplay and the rest too.'}
              {' '}Every song’s public page is at <span className="font-mono text-fg">/listen/&lt;song&gt;</span>.
            </p>
            <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 font-semibold text-emerald-500">Apple Music: on</span>
              <span className={ml ? 'rounded-full bg-emerald-500/15 px-2.5 py-1 font-semibold text-emerald-500' : 'rounded-full bg-amber-500/15 px-2.5 py-1 font-semibold text-amber-500'}>
                MusicLink: {ml ? 'on' : 'add key'}
              </span>
              {data.sources.spotify && <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 font-semibold text-emerald-500">Spotify search: on</span>}
            </p>
          </div>
          <Button onClick={runFindAll} loading={findAll.isPending}><Sparkles className="size-4" /> Find links automatically</Button>
        </div>
        {missing.length > 0 && (
          <div className="rounded-2xl bg-subtle/70 p-4 text-sm">
            <p className="font-semibold">{missing.length} {missing.length === 1 ? 'song wasn’t' : 'songs weren’t'} found automatically</p>
            <p className="mt-1 text-muted">{missing.map((s) => s.title).join(', ')}</p>
            <p className="mt-2">
              They aren’t on Apple Music, so there’s nothing to start from. Press <b>Edit</b> on each, paste its ISRC from DistroKid, then <b>Find links</b>.
              Songs that were never released to stores stay HitVerse only.
            </p>
          </div>
        )}
        <p className="text-sm text-muted">
          Released a song that isn’t on HitVerse yet? <Link to="/app/artist" className="font-semibold text-brand hover:underline">Add it by ISRC</Link> from Upload music: the title, artwork and links fill in for you.
        </p>
      </div>
      <ul className="-mx-2 space-y-1">
        {data.songs.map((s) => {
          const clicks = Object.values(s.linkClicks ?? {}).reduce((a, b) => a + (b || 0), 0);
          const have = PLATFORMS.filter((p) => s.links[p.id]);
          return (
            <li key={s._id} className="flex flex-wrap items-center gap-3 rounded-2xl p-2 transition hover:bg-subtle sm:flex-nowrap">
              <img src={s.cover} alt="" loading="lazy" className="size-12 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{s.title}</p>
                <p className="truncate text-sm text-muted">{s.artist}{s.uploader ? ' · artist upload' : ''}</p>
              </div>
              <div className="flex min-w-0 items-center gap-1.5" aria-label={have.length ? `On ${have.map((p) => p.name).join(', ')}` : 'No other platforms yet'}>
                {have.length ? have.map((p) => (
                  <span key={p.id} title={`${p.name}: ${s.linkClicks?.[p.id] ?? 0} clicks`}><PlatformIcon id={p.id} className="size-5" /></span>
                )) : <span className="text-sm text-muted">Not found yet: add ISRC</span>}
              </div>
              <span className="hidden w-24 items-center justify-end gap-1 text-sm text-muted tabular-nums sm:flex" title="Clicks on Listen buttons">
                <MousePointerClick className="size-4" /> {clicks}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => copy(s.slug)} aria-label={`Copy song page link for ${s.title}`}><Copy className="size-4" /></Button>
                <Button variant="ghost" size="icon-sm" asChild><a href={`/listen/${s.slug}`} target="_blank" rel="noreferrer" aria-label={`Open song page for ${s.title}`}><ExternalLink className="size-4" /></a></Button>
                <Button variant="secondary" size="sm" onClick={() => setEditing(s)}><ListMusic className="size-4" /> Edit</Button>
              </div>
            </li>
          );
        })}
      </ul>
      <StreamingLinksEditor song={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
    </>
  );
}

const MB = 1024 * 1024;
const fmtMb = (b) => (b >= 100 * MB ? `${Math.round(b / MB)} MB` : `${(b / MB).toFixed(1)} MB`);

/** How full the database is. Uploaded songs are stored converted (about 6–8 MB each), never as WAV. */
function StorageMeter() {
  const { data } = useAdminStorage();
  if (!data) return null;
  const used = Math.min(1, data.totalBytes / data.limitBytes);
  const perSong = data.songs ? data.mediaBytes / data.songs : 7 * MB;
  const roomFor = Math.max(0, Math.floor((data.limitBytes - data.totalBytes) / perSong));
  const tone = used < 0.7 ? 'bg-emerald-500' : used < 0.9 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="mb-5 rounded-3xl border border-border bg-elevated/60 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-bold">Storage: {fmtMb(data.totalBytes)} of {fmtMb(data.limitBytes)} used</p>
        <p className="text-sm text-muted">Room for about {roomFor} more {roomFor === 1 ? 'song' : 'songs'}</p>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-subtle" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(used * 100)} aria-label="Storage used">
        <div className={`h-full rounded-full ${tone} transition-[width] duration-700`} style={{ width: `${Math.max(1, used * 100)}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted">
        {data.songs} uploaded {data.songs === 1 ? 'song uses' : 'songs use'} {fmtMb(data.mediaBytes)}. WAV masters are converted for streaming on upload (about 8× smaller), so the original is never stored.
      </p>
    </div>
  );
}

/** Every artist page: feature them on the HitVerse home page, verify them, view or edit their page. */
function ArtistPages() {
  const { data, isPending } = useAdminProfiles();
  const flags = useSetArtistFlags();
  if (isPending) return <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-20" />)}</div>;
  if (!data?.length) return <p className="py-16 text-center text-muted">No artist pages yet. Approving an artist creates one.</p>;
  return (
    <ul className="space-y-2">
      {data.map((a) => (
        <li key={a._id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-elevated/60 p-3 sm:flex-nowrap">
          {a.avatar ? <img src={a.avatar} alt="" className="size-12 rounded-full object-cover" /> : <span className="grid size-12 place-items-center rounded-full bg-subtle font-bold">{a.name[0]}</span>}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{a.name}{!a.onboarded && <span className="ml-2 rounded bg-amber-500/15 px-1.5 text-xs font-semibold text-amber-500">Not set up yet</span>}</p>
            <p className="truncate text-sm text-muted">{a.followerCount} {a.fanBase.name} · {a.songCount} songs · /a/{a.slug}</p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={a.featured} onChange={(e) => flags.mutate({ id: a._id, featured: e.target.checked })} className="size-4 accent-[var(--brand)]" /> Featured
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={a.verified} onChange={(e) => flags.mutate({ id: a._id, verified: e.target.checked })} className="size-4 accent-[var(--brand)]" /> Verified
          </label>
          <Button asChild variant="ghost" size="sm"><a href={`/a/${a.slug}`} target="_blank" rel="noreferrer">View</a></Button>
          <Button asChild variant="secondary" size="sm"><Link to={`/app/profile/${a.slug}`}>Edit</Link></Button>
        </li>
      ))}
    </ul>
  );
}

const KARAOKE_BADGE = {
  none: ['Made when a fan asks', 'bg-subtle text-muted'],
  off: ['Karaoke off', 'bg-subtle text-muted'],
  queued: ['Waiting', 'bg-brand/15 text-brand'],
  processing: ['Removing vocals…', 'bg-brand/15 text-brand animate-pulse'],
  failed: ['Failed', 'bg-red-500/15 text-red-500'],
  hidden: ['Ready to check', 'bg-amber-500/15 text-amber-600 dark:text-amber-400'],
  live: ['Karaoke live', 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'],
};

/** Every song's karaoke beat and DJ-mode analysis. Karaoke is made one song at a time, on purpose. */
function KaraokePanel() {
  const { data, isPending } = useKaraokeAdmin();
  const tools = useAudioToolsReady();
  const analyze = useAnalyzeMix();
  const analyzeAll = useAnalyzeAll();
  const [open, setOpen] = useState(null);
  if (isPending) return <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>;
  const songs = data ?? [];
  const live = songs.filter((s) => s.karaoke).length;
  const mixed = songs.filter((s) => s.mix).length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-elevated/60 p-4">
        <p className="flex-1 text-sm text-muted">
          <b className="text-fg">{live}</b> of {songs.length} songs have karaoke · <b className="text-fg">{mixed}</b> are ready for DJ mode
          {tools.data === false && <span className="block text-amber-600 dark:text-amber-400">The audio tools aren’t installed on this server: artists can still upload their own beats.</span>}
        </p>
        <Button variant="secondary" size="sm" disabled={!tools.data} loading={analyzeAll.isPending} onClick={() => analyzeAll.mutate()}>
          <RefreshCw className="size-4" /> Analyse all for DJ mode
        </Button>
      </div>
      <ul className="space-y-2">
        {songs.map((s) => {
          const k = s.karaokeInfo?.status ?? 'none';
          const [label, tone] = KARAOKE_BADGE[k === 'ready' ? (s.karaokeInfo.published ? 'live' : s.karaokeInfo.hidden ? 'off' : 'hidden') : k];
          return (
            <li key={s._id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-elevated/60 p-2.5 sm:flex-nowrap">
              <img src={s.cover} alt="" loading="lazy" className="size-12 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{s.title}</p>
                <p className="truncate text-sm text-muted">{s.artist}</p>
              </div>
              <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', tone)}>{label}</span>
              <span className="flex w-28 items-center gap-1.5 text-sm text-muted tabular-nums" title="Tempo, for DJ mode">
                <AudioWaveform className="size-4" />
                {s.mix?.bpm ? `${Math.round(s.mix.bpm)} BPM` : s.mixStatus === 'queued' ? 'Analysing…' : s.mixStatus === 'failed' ? 'Failed' : s.mix ? 'No beat' : 'Not analysed'}
              </span>
              <Button variant="ghost" size="icon-sm" title="Analyse again for DJ mode" aria-label={`Analyse ${s.title} for DJ mode`}
                disabled={!tools.data || s.previewOnly || s.mixStatus === 'queued'} onClick={() => analyze.mutate(s)}>
                <RefreshCw className="size-4" />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setOpen(s._id)}><Mic className="size-4" /> Karaoke</Button>
            </li>
          );
        })}
      </ul>
      <KaraokeEditor song={songs.find((x) => x._id === open)} open={!!open} onOpenChange={(o) => !o && setOpen(null)} />
    </div>
  );
}

/** Switch Premium on for people (until card payments are connected), add time, or end it. */
function PremiumPanel() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const { data, isFetching } = usePremiumMembers(query);
  const set = useSetPremium();
  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); }} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find an account by name or email" className="pl-9" aria-label="Find an account" />
        </div>
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      <p className="text-sm text-muted">{query ? `Accounts matching “${query}”` : 'Everyone on Premium now'}{isFetching ? '…' : ''}</p>
      {!data?.length && !isFetching && <p className="py-10 text-center text-muted">{query ? 'No accounts match.' : 'Nobody is on Premium yet. Search for an account to switch it on.'}</p>}
      <ul className="space-y-2">
        {data?.map((u) => {
          const name = `${u.firstName} ${u.lastName}`;
          const on = u.premium?.active;
          return (
            <li key={u._id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-elevated/60 p-3 sm:flex-nowrap">
              <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', on ? 'bg-amber-400 text-black' : 'bg-subtle text-muted')}><Crown className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{name}{u.role === 'admin' && <span className="ml-2 text-xs text-muted">admin</span>}</p>
                <p className="truncate text-sm text-muted">{u.email} · {on ? `Premium until ${fmtDate(u.premium.until)}` : u.premium?.until ? `Ended ${fmtDate(u.premium.until)}` : 'Not Premium'}</p>
              </div>
              <Button size="sm" variant="secondary" loading={set.isPending && set.variables?.id === u._id && set.variables?.days === 7} onClick={() => set.mutate({ id: u._id, days: 7, plan: 'gift', name })}>+1 week</Button>
              <Button size="sm" variant="secondary" loading={set.isPending && set.variables?.id === u._id && set.variables?.days === 30} onClick={() => set.mutate({ id: u._id, days: 30, plan: 'gift', name })}>+1 month</Button>
              <Button size="sm" variant="secondary" loading={set.isPending && set.variables?.id === u._id && set.variables?.days === 365} onClick={() => set.mutate({ id: u._id, days: 365, plan: 'gift', name })}>+1 year</Button>
              {on && <UndoButton tone="danger" label="End" doneLabel="Ended" icon={<X />} onConfirm={() => set.mutate({ id: u._id, days: 0, name })} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
