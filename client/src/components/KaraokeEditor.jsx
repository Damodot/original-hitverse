import { AudioLines, CircleAlert, Eye, EyeOff, LoaderCircle, Mic, Trash2, Upload, Wand2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { UndoButton } from '@/components/UndoButton';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useAudioToolsReady, useDeleteKaraoke, useMakeKaraoke, usePublishKaraoke, useUploadBeat } from '@/hooks/useAudioTools';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const MAX_MB = 250;
const ACCEPT = '.wav,.flac,.aif,.aiff,.mp3,.m4a,.aac,audio/*';

/**
 * Karaoke for one song: upload the artist's own beat (best quality), or let HitVerse remove the vocals.
 * Nothing reaches fans until it's published. Pass the song fresh from its list so the status stays live.
 */
export function KaraokeEditor({ song, open, onOpenChange }) {
  const tools = useAudioToolsReady();
  const make = useMakeKaraoke();
  const publish = usePublishKaraoke();
  const remove = useDeleteKaraoke();
  const uploadBeat = useUploadBeat();
  const [progress, setProgress] = useState(null);
  const pick = useRef(null);
  if (!song) return null;

  const info = song.karaokeInfo ?? { status: 'none' };
  const working = info.status === 'queued' || info.status === 'processing';
  const ready = info.status === 'ready';
  const busy = working || progress !== null;

  const send = (file) => {
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(`The beat must be under ${MAX_MB} MB`);
    setProgress(0);
    uploadBeat.mutate({ song, file, onProgress: setProgress }, { onSettled: () => setProgress(null) });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Karaoke: ${song.title}`}
      description="Fans hear the beat without the vocals and sing along. If there's no beat when a fan asks for karaoke, HitVerse makes one and publishes it, and you're told.">
      <div className="space-y-5">
        <Status info={info} progress={progress} />

        {ready && info.audio && (
          <div className="space-y-3 rounded-2xl border border-border p-4">
            <p className="flex items-center gap-2 text-sm font-semibold"><AudioLines className="size-4 text-brand" /> Listen before fans do</p>
            {/* A separate preview so checking the beat doesn't interrupt the main player. */}
            <audio controls preload="none" src={info.audio} className="w-full" />
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant={info.published ? 'secondary' : 'default'} loading={publish.isPending}
                onClick={() => publish.mutate({ song, published: !info.published })}>
                {info.published ? <><EyeOff className="size-4" /> Turn karaoke off</> : <><Eye className="size-4" /> Publish karaoke</>}
              </Button>
              <UndoButton tone="danger" label="Remove beat" doneLabel="Removed" icon={<Trash2 />} onConfirm={() => remove.mutate(song)} />
            </div>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" disabled={busy} onClick={() => pick.current?.click()}
            className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-border p-4 text-left transition hover:border-brand/60 hover:bg-brand/5 disabled:cursor-not-allowed disabled:opacity-50">
            <span className="grid size-10 place-items-center rounded-xl bg-brand/15 text-brand"><Upload className="size-5" /></span>
            <span className="font-semibold">Upload your beat</span>
            <span className="text-sm text-muted">The instrumental from your producer. Best quality, and it goes live straight away. It must be this exact version of the song.</span>
          </button>
          <button type="button" disabled={busy || !tools.data || song.previewOnly} onClick={() => make.mutate(song)}
            className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-border p-4 text-left transition hover:border-brand/60 hover:bg-brand/5 disabled:cursor-not-allowed disabled:opacity-50">
            <span className="grid size-10 place-items-center rounded-xl bg-brand/15 text-brand"><Wand2 className="size-5" /></span>
            <span className="font-semibold">{ready && info.source === 'auto' ? 'Remove the vocals again' : 'Remove the vocals for me'}</span>
            <span className="text-sm text-muted">
              {tools.data === false
                ? 'Not set up on this server yet. Upload your beat instead.'
                : 'HitVerse separates your voice from the beat (about a minute). You listen first, then publish.'}
            </span>
          </button>
        </div>
        {song.previewOnly && <p className="text-sm text-muted">Add the full song first: a 30-second preview can’t become a karaoke beat.</p>}
        <input ref={pick} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1}
          onChange={(e) => { send(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
    </Modal>
  );
}

function Status({ info, progress }) {
  if (progress !== null) {
    return <Banner icon={<LoaderCircle className="size-5 animate-spin" />} tone="brand" title={progress < 1 ? `Uploading your beat… ${Math.round(progress * 100)}%` : 'Saving your beat…'} />;
  }
  switch (info.status) {
    case 'queued':
      return <Banner icon={<LoaderCircle className="size-5 animate-spin" />} tone="brand" title="Waiting its turn" text="Other songs are being processed first." />;
    case 'processing':
      return <Banner icon={<LoaderCircle className="size-5 animate-spin" />} tone="brand" title="Removing the vocals…" text="Usually about a minute. You can close this; we’ll notify you." />;
    case 'failed':
      return <Banner icon={<CircleAlert className="size-5" />} tone="danger" title="That didn’t work" text={info.error || 'Try again, or upload your beat.'} />;
    case 'ready':
      if (info.published) return <Banner icon={<Mic className="size-5" />} tone="success" title="Karaoke is live" text={info.source === 'upload' ? 'Using the beat you uploaded.' : 'Using the beat HitVerse made. Upload your own any time to replace it.'} />;
      return info.hidden
        ? <Banner icon={<EyeOff className="size-5" />} tone="muted" title="Karaoke is off for this song" text="Fans can’t use it or ask for it. Publish it to turn it back on." />
        : <Banner icon={<Eye className="size-5" />} tone="brand" title="Ready for you to check" text="It goes live when you publish it, or as soon as a fan asks for karaoke." />;
    default:
      return <Banner icon={<Mic className="size-5" />} tone="muted" title="No beat yet" text="Fans can still ask for karaoke: HitVerse makes the beat when they do. Or pick an option below." />;
  }
}

const TONES = {
  brand: 'bg-brand/10 text-brand',
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  danger: 'bg-red-500/10 text-red-500',
  muted: 'bg-subtle text-muted',
};
function Banner({ icon, title, text, tone }) {
  return (
    <div className={cn('flex items-start gap-3 rounded-2xl p-4', TONES[tone])}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span>
        <span className="block font-semibold">{title}</span>
        {text && <span className="block text-sm opacity-80">{text}</span>}
      </span>
    </div>
  );
}
