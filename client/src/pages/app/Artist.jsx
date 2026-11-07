import { Barcode, Sparkles, CircleAlert, Clock, FileAudio, ImagePlus, ListMusic, Mic, MicVocal, Music2, Pause, Play, Search, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { toast } from '@/lib/toast';
import { Page, PageHeader } from '@/components/layout/PageHeader';
import { Equalizer } from '@/components/player/Equalizer';
import { Button } from '@/components/ui/button';
import { KaraokeEditor } from '@/components/KaraokeEditor';
import { LyricsEditor } from '@/components/LyricsEditor';
import { StreamingLinksEditor } from '@/components/StreamingLinksEditor';
import { UndoButton } from '@/components/UndoButton';
import { PlatformIcon } from '@/components/PlatformIcon';
import { linkCount, STREAMING } from '@/lib/platforms';
import { Field, Input, TextareaField } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlayer } from '@/context/PlayerContext';
import { useAddByIsrc, useApply, useArtistMe, useDeleteMySong, useIsrcLookup, useReplaceAudio, useUploadSong } from '@/hooks/useArtist';
import { cn, formatTime } from '@/lib/utils';

// Keep in step with the server limits (MAX_AUDIO_MB / MAX_COVER_MB).
// Masters (WAV, FLAC, AIFF) are big; the server converts them to streaming quality.
const MAX_AUDIO_MB = 250;
const MAX_COVER_MB = 5;
const AUDIO_ACCEPT = '.wav,.flac,.aif,.aiff,.mp3,.m4a,.aac,audio/wav,audio/x-wav,audio/flac,audio/aiff,audio/x-aiff,audio/mpeg,audio/mp4,audio/x-m4a,audio/aac';
const AUDIO_EXT = /\.(wav|flac|aif|aiff|mp3|m4a|aac)$/i;

const karaokeTitle = (info) => ({
  queued: 'Karaoke: waiting to be made', processing: 'Karaoke: removing the vocals…', failed: 'Karaoke: try again',
  ready: info?.published ? 'Karaoke is live' : 'Karaoke: ready to check and publish',
}[info?.status] ?? 'Add karaoke');

/** Reads a file's length in the browser when it can (it can't for AIFF); the server checks the file either way. */
function readAudio(file, done) {
  const url = URL.createObjectURL(file);
  const probe = new Audio();
  probe.preload = 'metadata';
  const finish = (duration) => { URL.revokeObjectURL(url); done({ file, duration }); };
  probe.onloadedmetadata = () => finish(probe.duration);
  probe.onerror = () => finish(null);
  probe.src = url;
}
const COVER_ACCEPT = 'image/jpeg,image/png,image/webp';

export default function Artist() {
  const { data, isPending, isError, error } = useArtistMe();
  const user = data?.user;
  const status = user?.artist?.status ?? 'none';

  return (
    <Page>
      <PageHeader
        eyebrow="For artists"
        title={user?.canUpload ? 'Upload music' : 'Become an artist'}
        subtitle={user?.canUpload
          ? `Uploading as ${user.artist?.name || `${user.firstName} ${user.lastName}`}. Songs go live on HitVerse straight away.`
          : 'Put your music on HitVerse. Apply once, and you can upload as soon as we approve you.'}
      />
      {isPending && <Skeleton className="h-96" />}
      {isError && <p className="text-red-500">{error.message}</p>}
      {user?.canUpload && data.profile && <ProfileCard profile={data.profile} />}
      {user && (user.canUpload
        ? <Studio songs={data.songs} />
        : status === 'pending'
          ? <PendingCard artist={user.artist} />
          : <ApplyForm artist={user.artist} rejected={status === 'rejected'} />)}
    </Page>
  );
}

/** The artist's public page: a setup prompt until it's filled in, then a shortcut to view or edit it. */
function ProfileCard({ profile }) {
  if (!profile.onboarded) {
    return (
      <div className="mb-8 flex flex-wrap items-center gap-4 rounded-3xl border border-brand/40 bg-brand/10 p-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-brand-fg"><Sparkles className="size-6" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold">Set up your artist page</p>
          <p className="text-muted">Add your photos, biography and your fan base’s name, so fans can join and get their welcome.</p>
        </div>
        <Button asChild><Link to={`/app/profile/${profile.slug}`}>Set it up</Link></Button>
      </div>
    );
  }
  return (
    <div className="mb-8 flex flex-wrap items-center gap-4 rounded-3xl border border-border bg-elevated/60 p-4">
      {profile.avatar ? <img src={profile.avatar} alt="" className="size-12 rounded-full object-cover" /> : <span className="grid size-12 place-items-center rounded-full bg-subtle font-bold">{profile.name[0]}</span>}
      <div className="min-w-0 flex-1">
        <p className="font-bold">{profile.name}</p>
        <p className="text-sm text-muted">{profile.followerCount.toLocaleString()} {profile.fanBase.name} · hitverse/a/{profile.slug}</p>
      </div>
      <Button asChild variant="secondary" size="sm"><Link to={`/a/${profile.slug}`}>View page</Link></Button>
      <Button asChild variant="ghost" size="sm"><Link to={`/app/profile/${profile.slug}`}>Edit</Link></Button>
    </div>
  );
}

function Steps({ current }) {
  const steps = ['Apply with your artist name', 'We review your application', 'Upload your songs'];
  return (
    <ol className="space-y-4">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-4">
          <span className={cn(
            'grid size-10 shrink-0 place-items-center rounded-full border text-sm font-bold',
            i < current ? 'border-brand bg-brand text-brand-fg' : i === current ? 'border-brand text-brand' : 'border-border text-muted',
          )}
          >
            {i + 1}
          </span>
          <span className={cn('text-lg', i === current ? 'font-semibold' : 'text-muted')}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

function ApplyForm({ artist, rejected }) {
  const apply = useApply();
  const [form, setForm] = useState({ name: artist?.name ?? '', bio: artist?.bio ?? '', link: artist?.link ?? '' });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'At least 2 characters';
    if (form.bio.trim().length < 20) errs.bio = 'Tell us a bit more (at least 20 characters)';
    if (form.link.trim() && !/^https?:\/\/\S+\.\S+/.test(form.link.trim())) errs.link = 'Enter a full link starting with https://';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    apply.mutate(form, {
      onSuccess: () => toast.success('Application sent. We’ll email you when it’s reviewed.'),
      onError: (err) => setErrors({ form: err.message }),
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
      <div className="space-y-6">
        <Steps current={0} />
        {rejected && (
          <div role="status" className="flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-semibold">Your last application wasn’t approved</p>
              {artist?.note && <p className="mt-1 text-muted">Reason: {artist.note}</p>}
              <p className="mt-1 text-muted">Update the details and send it again.</p>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={submit} noValidate className="space-y-4 rounded-3xl border border-border bg-elevated/60 p-6 sm:p-8">
        <Field label="Artist name" value={form.name} onChange={set('name')} error={errors.name} maxLength={60} placeholder="The name fans know you by" />
        <TextareaField
          label="About your music"
          value={form.bio}
          onChange={set('bio')}
          error={errors.bio}
          maxLength={1000}
          rows={5}
          placeholder="Your sound, where you’re from, what you’ve released"
        />
        <Field
          label="Link to your music or socials (optional)"
          type="url"
          value={form.link}
          onChange={set('link')}
          error={errors.link}
          placeholder="https://instagram.com/yourname"
        />
        {errors.form && <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{errors.form}</p>}
        <Button type="submit" size="lg" className="w-full" loading={apply.isPending}>
          {rejected ? 'Apply again' : 'Send application'}
        </Button>
      </form>
    </div>
  );
}

function PendingCard({ artist }) {
  const applied = artist?.appliedAt ? new Date(artist.appliedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
      <Steps current={1} />
      <div className="rounded-3xl border border-border bg-elevated/60 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-full bg-brand/15 text-brand"><Clock className="size-6" /></span>
          <div>
            <p className="text-xl font-bold">Application under review</p>
            {applied && <p className="text-muted">Sent on {applied}</p>}
          </div>
        </div>
        <p className="mt-5 text-muted">We’ll email you as soon as it’s reviewed. You can upload once you’re approved.</p>
        <dl className="mt-6 space-y-3 border-t border-border pt-5">
          <div><dt className="text-sm text-muted">Artist name</dt><dd className="font-semibold">{artist?.name}</dd></div>
          <div><dt className="text-sm text-muted">About</dt><dd className="whitespace-pre-line">{artist?.bio}</dd></div>
          {artist?.link && <div><dt className="text-sm text-muted">Link</dt><dd className="truncate">{artist.link}</dd></div>}
        </dl>
      </div>
    </div>
  );
}

// ---- Approved artists ----

function Studio({ songs }) {
  const [mode, setMode] = useState('file');
  return (
    <div className="grid gap-10 xl:grid-cols-[1.2fr_1fr]">
      <div>
        <div role="tablist" aria-label="How to add a song" className="mb-4 inline-flex rounded-full bg-subtle p-1">
          {[['file', 'Upload a file', Upload], ['isrc', 'Add by ISRC', Barcode]].map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={cn('flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 font-semibold transition', mode === id ? 'bg-elevated text-fg shadow' : 'text-muted hover:text-fg')}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
        {mode === 'file' ? <UploadForm /> : <IsrcImport />}
      </div>
      <MyUploads songs={songs} />
    </div>
  );
}

/**
 * Add a song that's already out in the stores: type its ISRC and the title, artwork and streaming links
 * are filled in from MusicLink. Audio is the full file (best) or the stores' 30-second preview.
 */
function IsrcImport() {
  const lookup = useIsrcLookup();
  const add = useAddByIsrc();
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [writers, setWriters] = useState('');
  const [producers, setProducers] = useState('');
  const [source, setSource] = useState('file'); // 'file' | 'preview'
  const [audio, setAudio] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const abortRef = useRef(null);

  const find = (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    lookup.mutate(code, {
      onSuccess: (d) => {
        setResult(d);
        setTitle(d.track.title);
        // The full song is what HitVerse needs, so ask for the file first; the preview is only a fallback.
        setSource('file');
        setAudio(null);
      },
      onError: (err) => setError(err.message),
    });
  };

  const pickAudio = (file) => {
    setError('');
    if (!file) return;
    if (file.size > MAX_AUDIO_MB * 1024 * 1024) return setError(`That file is ${mb(file.size)}. The limit is ${MAX_AUDIO_MB} MB.`);
    if (!AUDIO_EXT.test(file.name) && !file.type.startsWith('audio/')) return setError('Choose a WAV, FLAC, AIFF, MP3 or M4A file.');
    readAudio(file, setAudio);
  };

  const publish = () => {
    if (source === 'file' && !audio) return setError('Choose the song file, or use the 30-second preview.');
    const formData = new FormData();
    formData.append('isrc', result.track.isrc);
    if (title.trim()) formData.append('title', title.trim());
    if (lyrics.trim()) formData.append('lyrics', lyrics);
    if (writers.trim()) formData.append('writers', writers);
    if (producers.trim()) formData.append('producers', producers);
    if (source === 'preview') formData.append('usePreview', 'true');
    if (source === 'file') formData.append('audio', audio.file);
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress(0);
    setError('');
    add.mutate({ formData, onProgress: setProgress, signal: controller.signal }, {
      onSuccess: ({ song }) => {
        toast.success(`“${song.title}” is live on HitVerse`, { description: `Linked to ${linkCount(song.links)} other platforms` });
        setResult(null);
        setCode('');
        setLyrics('');
        setWriters('');
        setProducers('');
        setAudio(null);
      },
      onError: (err) => err.message !== 'Upload cancelled' && setError(err.message),
    });
  };

  const t = result?.track;
  const busy = add.isPending;
  return (
    <div className="space-y-5 rounded-3xl border border-border bg-elevated/60 p-5 sm:p-7">
      <div>
        <h2 className="text-2xl font-bold">Add a released song</h2>
        <p className="mt-1 text-muted">Type the song’s ISRC (DistroKid lists it under each track) or paste its Spotify or Apple Music link. We fill in the title, artwork and every streaming link; you add the song file (your WAV master is fine).</p>
      </div>
      <form onSubmit={find} className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(/^https?:/i.test(e.target.value) ? e.target.value : e.target.value.toUpperCase())}
          placeholder="ISRC (e.g. QZTB52295123) or a Spotify / Apple Music link"
          aria-label="ISRC or streaming link"
          className="font-mono text-sm"
          maxLength={500}
          disabled={busy}
        />
        <Button type="submit" loading={lookup.isPending} disabled={!code.trim() || busy}><Search className="size-4" /> Look up</Button>
      </form>

      {t && (
        <div className="space-y-5">
          <div className="flex gap-4 rounded-2xl bg-subtle/60 p-3">
            {t.artwork
              ? <img src={t.artwork} alt="" className="size-24 shrink-0 rounded-xl object-cover shadow-lg" />
              : <span className="grid size-24 shrink-0 place-items-center rounded-xl bg-subtle"><Music2 className="size-8 text-muted" /></span>}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xl font-bold">{t.title}</p>
              <p className="truncate text-muted">{t.artist}{t.duration ? ` · ${formatTime(t.duration)}` : ''}</p>
              <p className="mt-1 font-mono text-xs text-muted">{t.isrc}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label={`On ${linkCount(t.links)} platforms`}>
                {STREAMING.filter((p) => t.links[p.id]).map((p) => <PlatformIcon key={p.id} id={p.id} className="size-4" />)}
                <span className="text-xs text-muted">{linkCount(t.links)} platforms</span>
              </div>
            </div>
          </div>

          {result.existing && (
            <p className="rounded-xl bg-subtle px-4 py-3">
              “{result.existing.title}” is already on HitVerse.{' '}
              <a href={`/listen/${result.existing.slug}`} target="_blank" rel="noreferrer" className="font-semibold text-brand hover:underline">Open its song page</a>
            </p>
          )}
          {!result.existing && result.reason && <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{result.reason}</p>}

          {result.canAdd && (
            <>
              <Field label="Title on HitVerse" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} disabled={busy} />
              <div className={cn('rounded-2xl border p-4', source === 'preview' ? 'border-amber-500/40 bg-amber-500/5' : 'border-border')}>
                <p className="font-semibold">The full song</p>
                <p className="mt-1 text-sm text-muted">
                  The stores only share a 30-second preview, never the full song, so add your own file: the WAV or MP3 you sent to your distributor.
                  Everything else (title, artwork, links) is already filled in.
                </p>
                {source === 'preview' ? (
                  <p className="mt-3 text-sm">
                    Adding the <b>30-second preview</b> for now. Swap in the full song later with <b>Add full song</b> in Your uploads.{' '}
                    <button type="button" className="cursor-pointer font-semibold text-brand hover:underline" onClick={() => setSource('file')}>Add the full song instead</button>
                  </p>
                ) : (
                  <>
                    <div className="mt-3"><AudioDrop audio={audio} onPick={pickAudio} onClear={() => setAudio(null)} disabled={busy} /></div>
                    {t.hasPreview && !audio && (
                      <button type="button" className="mt-2 cursor-pointer text-sm text-muted hover:text-fg hover:underline" onClick={() => setSource('preview')} disabled={busy}>
                        Don’t have the file right now? Add it with the 30-second preview
                      </button>
                    )}
                  </>
                )}
              </div>
              <CreditFields writers={writers} producers={producers} setWriters={setWriters} setProducers={setProducers} disabled={busy} />
              <TextareaField label="Lyrics (optional)" value={lyrics} onChange={(e) => setLyrics(e.target.value)} maxLength={15000} rows={4} disabled={busy} />
              {busy ? (
                <div className="space-y-2" aria-live="polite">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{source === 'file' && progress < 1 ? 'Uploading…' : source === 'file' ? 'Converting to streaming quality…' : 'Adding to HitVerse…'}</span>
                    {source === 'file' && <span className="text-muted tabular-nums">{Math.round(progress * 100)}%</span>}
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-subtle">
                    <div className={cn('h-full rounded-full bg-brand transition-[width]', source === 'preview' && 'w-1/2 animate-pulse')} style={source === 'file' ? { width: `${progress * 100}%` } : undefined} />
                  </div>
                  {source === 'file' && <Button type="button" variant="ghost" size="sm" onClick={() => abortRef.current?.abort()}>Cancel upload</Button>}
                </div>
              ) : (
                <Button size="lg" className="w-full" onClick={publish} disabled={source === 'file' && !audio}>
                  <Upload className="size-5" /> {source === 'preview' ? 'Add with the preview' : audio ? 'Add the full song to HitVerse' : 'Choose the song file to continue'}
                </Button>
              )}
            </>
          )}
        </div>
      )}
      {error && <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</p>}
      <p className="text-xs text-muted">Only add songs you own or have the rights to. Song details and links come from MusicLink.</p>
    </div>
  );
}

const titleFromFile = (name) => name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function UploadForm() {
  const uploadSong = useUploadSong();
  const [audio, setAudio] = useState(null); // { file, duration }
  const [cover, setCover] = useState(null); // { file, url }
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [writers, setWriters] = useState('');
  const [producers, setProducers] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  useEffect(() => () => cover && URL.revokeObjectURL(cover.url), [cover]);

  const pickAudio = (file) => {
    setError('');
    if (!file) return;
    if (file.size > MAX_AUDIO_MB * 1024 * 1024) return setError(`That file is ${mb(file.size)}. The limit is ${MAX_AUDIO_MB} MB.`);
    if (!AUDIO_EXT.test(file.name) && !file.type.startsWith('audio/')) return setError('Choose a WAV, FLAC, AIFF, MP3 or M4A file.');
    readAudio(file, setAudio);
    if (!title) setTitle(titleFromFile(file.name));
  };

  const pickCover = (file) => {
    setError('');
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError('Cover art must be a JPG, PNG or WebP image.');
    if (file.size > MAX_COVER_MB * 1024 * 1024) return setError(`Cover art must be under ${MAX_COVER_MB} MB.`);
    setCover({ file, url: URL.createObjectURL(file) });
  };

  const reset = () => {
    setAudio(null);
    setCover(null);
    setTitle('');
    setLyrics('');
    setWriters('');
    setProducers('');
    setProgress(0);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!audio) return setError('Choose an audio file first.');
    if (!title.trim()) return setError('Give your song a title.');
    const formData = new FormData();
    formData.append('title', title.trim());
    if (lyrics.trim()) formData.append('lyrics', lyrics);
    if (writers.trim()) formData.append('writers', writers);
    if (producers.trim()) formData.append('producers', producers);
    if (cover) formData.append('cover', cover.file);
    formData.append('audio', audio.file); // last, so the text fields arrive first
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress(0);
    setError('');
    uploadSong.mutate(
      { formData, onProgress: setProgress, signal: controller.signal },
      {
        onSuccess: ({ song }) => {
          toast.success(`“${song.title}” is live on HitVerse`);
          reset();
        },
        onError: (err) => err.message !== 'Upload cancelled' && setError(err.message),
      },
    );
  };

  const busy = uploadSong.isPending;
  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-3xl border border-border bg-elevated/60 p-5 sm:p-7">
      <h2 className="text-2xl font-bold">New song</h2>
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <CoverPicker cover={cover} onPick={pickCover} onClear={() => setCover(null)} disabled={busy} />
        <AudioDrop audio={audio} onPick={pickAudio} onClear={() => setAudio(null)} disabled={busy} />
      </div>
      <Field label="Song title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} disabled={busy} />
      <CreditFields writers={writers} producers={producers} setWriters={setWriters} setProducers={setProducers} disabled={busy} />
      <TextareaField
        label="Lyrics (optional)"
        hint="One line per line. They show on the lyrics page and in the full-screen player."
        value={lyrics}
        onChange={(e) => setLyrics(e.target.value)}
        maxLength={15000}
        rows={6}
        disabled={busy}
      />
      {error && <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</p>}
      {busy ? (
        <div className="space-y-2" aria-live="polite">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{progress < 1 ? 'Uploading…' : 'Converting to streaming quality…'}</span>
            <span className="text-muted tabular-nums">{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-subtle">
            <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${progress * 100}%` }} />
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => abortRef.current?.abort()}>Cancel upload</Button>
        </div>
      ) : (
        <Button type="submit" size="lg" className="w-full"><Upload className="size-5" /> Publish song</Button>
      )}
    </form>
  );
}

/** "Written by" and "Produced by", shown after the lyrics. Names separated by commas or "&". */
function CreditFields({ writers, producers, setWriters, setProducers, disabled }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Written by (optional)" value={writers} onChange={(e) => setWriters(e.target.value)} placeholder="Names, separated by commas" maxLength={1000} disabled={disabled} />
      <Field label="Produced by (optional)" value={producers} onChange={(e) => setProducers(e.target.value)} placeholder="Names, separated by commas" maxLength={1000} disabled={disabled} />
    </div>
  );
}

function CoverPicker({ cover, onPick, onClear, disabled }) {
  const input = useRef(null);
  return (
    <div className="relative w-full max-w-40">
      <button
        type="button"
        disabled={disabled}
        onClick={() => input.current?.click()}
        className="group relative grid aspect-square w-full cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-border bg-subtle/50 text-muted transition hover:border-brand hover:text-brand"
        aria-label={cover ? 'Change cover art' : 'Add cover art'}
      >
        {cover ? (
          <img src={cover.url} alt="Cover preview" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 p-2 text-center text-sm"><ImagePlus className="size-7" /> Cover art<span className="text-xs">optional</span></span>
        )}
      </button>
      {cover && !disabled && (
        <button type="button" onClick={onClear} aria-label="Remove cover art" className="absolute top-2 right-2 grid size-8 cursor-pointer place-items-center rounded-full bg-black/70 text-white hover:bg-black">
          <X className="size-4" />
        </button>
      )}
      <input ref={input} type="file" accept={COVER_ACCEPT} className="sr-only" tabIndex={-1} onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

function AudioDrop({ audio, onPick, onClear, disabled }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  if (audio) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-subtle/50 p-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand"><FileAudio className="size-6" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{audio.file.name}</p>
          <p className="text-sm text-muted">{audio.duration ? `${formatTime(audio.duration)} · ` : ''}{mb(audio.file.size)}{audio.file.size > 30 * 1024 * 1024 || /\.(wav|flac|aiff?)$/i.test(audio.file.name) ? ' · converted to streaming quality on upload' : ''}</p>
        </div>
        {!disabled && <Button type="button" variant="ghost" size="icon-sm" onClick={onClear} aria-label="Remove audio file"><X className="size-4" /></Button>}
      </div>
    );
  }
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onPick(e.dataTransfer.files?.[0]); }}
      className={cn('grid min-h-40 place-items-center rounded-2xl border-2 border-dashed p-6 text-center transition', over ? 'border-brand bg-brand/10' : 'border-border bg-subtle/50')}
    >
      <div>
        <Music2 className="mx-auto size-8 text-brand" />
        <p className="mt-2 font-semibold">Drag your song here</p>
        <p className="text-sm text-muted">WAV, FLAC, AIFF, MP3 or M4A, up to {MAX_AUDIO_MB} MB</p>
        <Button type="button" variant="secondary" size="sm" className="mt-3" disabled={disabled} onClick={() => input.current?.click()}>Choose file</Button>
      </div>
      <input ref={input} type="file" accept={AUDIO_ACCEPT} className="sr-only" tabIndex={-1} onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

function MyUploads({ songs }) {
  const { current, isPlaying, playSong, toggle } = usePlayer();
  const del = useDeleteMySong();
  const replace = useReplaceAudio();
  const [editing, setEditing] = useState(null);
  const [lyricsFor, setLyricsFor] = useState(null);
  const [karaokeFor, setKaraokeFor] = useState(null); // song id, so the status stays fresh while it's made
  const [replacing, setReplacing] = useState(null); // { id, progress }
  const filePick = useRef(null);
  const target = useRef(null);
  const chooseFull = (song) => {
    target.current = song;
    filePick.current?.click();
  };
  const sendFull = (file) => {
    const song = target.current;
    if (!file || !song) return;
    if (file.size > MAX_AUDIO_MB * 1024 * 1024) return toast.error(`That file is ${mb(file.size)}. The limit is ${MAX_AUDIO_MB} MB.`);
    setReplacing({ id: song._id, progress: 0 });
    replace.mutate(
      { id: song._id, file, onProgress: (p) => setReplacing({ id: song._id, progress: p }) },
      { onSettled: () => setReplacing(null) },
    );
  };
  return (
    <section>
      <h2 className="mb-3 text-2xl font-bold">Your uploads <span className="text-muted">({songs.length})</span></h2>
      {!songs.length && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">Nothing yet. Your first song will show up here.</p>}
      <ul className="space-y-2">
        {songs.map((s) => {
          const active = current?._id === s._id;
          return (
            <li key={s._id} className={cn('flex items-center gap-3 rounded-2xl p-2 transition hover:bg-subtle', active && 'bg-subtle/70')}>
              <button
                type="button"
                onClick={() => (active ? toggle() : playSong(s, songs))}
                className="group relative size-14 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-subtle"
                aria-label={active && isPlaying ? `Pause ${s.title}` : `Play ${s.title}`}
              >
                <img src={s.cover} alt="" loading="lazy" className="size-full object-cover" />
                <span className={cn('absolute inset-0 grid place-items-center bg-black/50 text-white transition', active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
                  {active && isPlaying ? <span className="group-hover:hidden"><Equalizer playing /></span> : null}
                  <span className={cn(active && isPlaying && 'hidden group-hover:block')}>
                    {active && isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
                  </span>
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn('truncate font-semibold', active && 'text-brand')}>{s.title}{s.previewOnly && <span className="ml-2 rounded bg-subtle px-1.5 align-middle text-[11px] font-semibold tracking-wide text-muted uppercase">Preview</span>}</p>
                <p className="truncate text-sm text-muted">
                  {formatTime(s.duration)} · {s.plays} {s.plays === 1 ? 'play' : 'plays'} · {linkCount(s.links)
                    ? `on ${linkCount(s.links)} other ${linkCount(s.links) === 1 ? 'platform' : 'platforms'} · ${Object.values(s.linkClicks ?? {}).reduce((a, b) => a + (b || 0), 0)} link clicks`
                    : new Date(s.createdAt).toLocaleDateString()}
                </p>
              </div>
              {s.previewOnly && (
                replacing?.id === s._id
                  ? <span className="w-28 text-center text-sm font-semibold text-brand tabular-nums">{replacing.progress < 1 ? `Uploading ${Math.round(replacing.progress * 100)}%` : 'Saving…'}</span>
                  : <Button variant="secondary" size="sm" onClick={() => chooseFull(s)} disabled={!!replacing}><FileAudio className="size-4" /> Add full song</Button>
              )}
              <Button variant="ghost" size="icon-sm" onClick={() => setLyricsFor(s)} aria-label={`Lyrics for ${s.title}`} title={s.hasSynced ? 'Lyrics (synced)' : 'Lyrics & sync'}
                className={s.hasSynced ? 'text-brand' : undefined}><MicVocal className="size-4" /></Button>
              <Button variant="ghost" size="icon-sm" onClick={() => setKaraokeFor(s._id)} aria-label={`Karaoke for ${s.title}`}
                title={karaokeTitle(s.karaokeInfo)} className={cn(s.karaoke && 'text-brand', ['queued', 'processing'].includes(s.karaokeInfo?.status) && 'animate-pulse text-brand')}>
                <Mic className="size-4" />
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => setEditing(s)} aria-label={`Streaming links for ${s.title}`} title="Streaming links"><ListMusic className="size-4" /></Button>
              <UndoButton tone="danger" label="Delete" doneLabel="Deleted" icon={<Trash2 />} onConfirm={() => del.mutate(s)} />
            </li>
          );
        })}
      </ul>
      <StreamingLinksEditor song={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
      <LyricsEditor song={lyricsFor} open={!!lyricsFor} onOpenChange={(o) => !o && setLyricsFor(null)} />
      <KaraokeEditor song={songs.find((x) => x._id === karaokeFor)} open={!!karaokeFor} onOpenChange={(o) => !o && setKaraokeFor(null)} />
      <input ref={filePick} type="file" accept={AUDIO_ACCEPT} className="sr-only" tabIndex={-1} onChange={(e) => { sendFull(e.target.files?.[0]); e.target.value = ''; }} />
    </section>
  );
}
