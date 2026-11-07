import { ChevronUp, MicVocal } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { usePlayer } from '@/context/PlayerContext';
import { Controls, PlayPauseButton } from './Controls';
import { LikeButton } from './LikeButton';
import { DjButton, KaraokeButton, MixingNote } from './ModeButtons';
import { ProgressLine, Seekbar } from './Seekbar';
import { Volume } from './Volume';

/** Desktop: full control bar. Mobile: compact bar that opens the Now Playing screen. */
export function PlayerBar() {
  const { current, setExpanded } = usePlayer();
  const cover = current?.cover ?? '/media/img/cover-default.webp';

  return (
    <>
      {/* Mobile mini player */}
      <div className="mx-2 mb-2 overflow-hidden rounded-2xl border border-border bg-elevated/90 shadow-2xl backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-3 p-2" onClick={() => current && setExpanded(true)} role="button" tabIndex={-1}>
          <img src={cover} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{current?.title ?? 'Nothing playing'}</p>
            <p className="truncate text-sm text-muted">{current?.artist ?? 'Pick a song to start'}</p>
          </div>
          <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
            {current && <LikeButton song={current} />}
            <PlayPauseButton />
          </div>
        </div>
        <ProgressLine />
      </div>

      {/* Desktop bar */}
      <div className="hidden h-24 grid-cols-[1fr_minmax(0,40rem)_1fr] items-center gap-6 border-t border-border bg-elevated/85 px-5 backdrop-blur-xl md:grid">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" disabled={!current} onClick={() => setExpanded(true)} aria-label="Open now playing"
            className="group relative size-14 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-subtle disabled:cursor-default">
            <img src={cover} alt="" className="size-full object-cover" />
            {current && (
              <span className="absolute inset-0 grid place-items-center bg-black/50 text-white opacity-0 transition group-hover:opacity-100">
                <ChevronUp className="size-6" />
              </span>
            )}
          </button>
          <div className="min-w-0">
            <p className="truncate font-semibold">{current?.title ?? 'Nothing playing'}</p>
            <p className="truncate text-sm text-muted">{current?.artist ?? 'Pick a song to start'}</p>
            <MixingNote />
          </div>
          {current && <LikeButton song={current} />}
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Controls />
          <Seekbar />
        </div>
        <div className="flex items-center justify-end gap-1">
          <KaraokeButton />
          <DjButton />
          <Tooltip label="Lyrics">
            <button type="button" disabled={!current} onClick={() => setExpanded(true)} aria-label="Show lyrics"
              className="grid size-9 cursor-pointer place-items-center rounded-full text-muted hover:text-fg disabled:opacity-40">
              <MicVocal className="size-5" />
            </button>
          </Tooltip>
          <Volume />
        </div>
      </div>
    </>
  );
}
