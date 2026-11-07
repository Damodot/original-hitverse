import { Pause, Play } from 'lucide-react';
import { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlayer } from '@/context/PlayerContext';
import { cn, formatTime } from '@/lib/utils';
import { Equalizer } from './Equalizer';
import { LikeButton } from './LikeButton';
import { SongMenu } from './SongMenu';

export function TrackList({ songs, loading, showCover = true, numbered = true, empty }) {
  const { current, isPlaying, playSong } = usePlayer();
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }
  if (!songs?.length) return empty ?? null;
  return (
    <ol className="-mx-2 sm:-mx-3">
      {songs.map((song, i) => (
        <TrackRow
          key={song._id}
          song={song}
          n={numbered ? song.trackNumber || i + 1 : null}
          showCover={showCover}
          active={current?._id === song._id}
          playing={current?._id === song._id && isPlaying}
          list={songs}
          onPlay={playSong}
        />
      ))}
    </ol>
  );
}

const TrackRow = memo(function TrackRow({ song, list, n, showCover, active, playing, onPlay: playSong }) {
  const onPlay = () => playSong(song, list);
  return (
    <li
      onClick={onPlay}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onPlay();
        }
      }}
      tabIndex={0}
      aria-current={active || undefined}
      className={cn(
        'group grid cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition outline-none hover:bg-subtle focus-visible:bg-subtle sm:px-3',
        // With artwork, phones skip the number column; the artwork shows what's playing instead.
        showCover ? 'grid-cols-[1fr_auto] sm:grid-cols-[2rem_1fr_auto]' : 'grid-cols-[2rem_1fr_auto]',
        active && 'bg-subtle/70',
      )}
    >
      <span className={cn('relative h-full place-items-center text-sm text-muted tabular-nums', showCover ? 'hidden sm:grid' : 'grid')}>
        {active ? <Equalizer playing={playing} /> : <span className="group-hover:hidden">{n ?? '•'}</span>}
        {!active && <Play className="hidden size-4 fill-current text-fg group-hover:block" aria-hidden />}
      </span>
      <div className="flex min-w-0 items-center gap-3">
        {showCover && (
          <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-subtle">
            <img src={song.cover} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
            {active && (
              <span className="absolute inset-0 grid place-items-center bg-black/50 text-white sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                <span className="sm:hidden"><Equalizer playing={playing} /></span>
                <span className="hidden sm:block">{playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}</span>
              </span>
            )}
          </div>
        )}
        <div className="min-w-0">
          <p className={cn('truncate text-[17px] font-semibold', active && 'text-brand')}>{song.title}</p>
          <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted">
            {song.previewOnly && <span className="shrink-0 rounded bg-subtle px-1.5 text-[11px] font-semibold tracking-wide uppercase">Preview</span>}
            <span className="truncate">{song.artist}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <LikeButton song={song} />
        <span className="hidden w-12 text-right text-sm text-muted tabular-nums sm:block">{formatTime(song.duration)}</span>
        <SongMenu song={song} />
      </div>
    </li>
  );
});
