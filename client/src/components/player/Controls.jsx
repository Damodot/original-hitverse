import { LoaderCircle, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { usePlayer } from '@/context/PlayerContext';
import { cn } from '@/lib/utils';

const iconBtn = 'grid cursor-pointer place-items-center rounded-full transition hover:text-fg disabled:opacity-40';

export function PlayPauseButton({ className, size = 'md' }) {
  const { isPlaying, isLoading, toggle } = usePlayer();
  const big = size === 'lg';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isPlaying ? 'Pause' : 'Play'}
      className={cn(
        'grid cursor-pointer place-items-center rounded-full bg-fg text-bg shadow-lg transition hover:scale-105 active:scale-95',
        big ? 'size-16' : 'size-10',
        className,
      )}
    >
      {isLoading && isPlaying ? (
        <LoaderCircle className={cn('animate-spin', big ? 'size-7' : 'size-5')} />
      ) : isPlaying ? (
        <Pause className={cn('fill-current', big ? 'size-7' : 'size-5')} />
      ) : (
        <Play className={cn('translate-x-px fill-current', big ? 'size-7' : 'size-5')} />
      )}
    </button>
  );
}

export function Controls({ size = 'md', className }) {
  const { shuffle, setShuffle, repeat, cycleRepeat, next, prev, current } = usePlayer();
  const big = size === 'lg';
  const icon = big ? 'size-7' : 'size-5';
  const small = big ? 'size-5' : 'size-4';
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;
  return (
    <div className={cn('flex items-center justify-center text-muted', big ? 'gap-6' : 'gap-4', className)}>
      <Tooltip label={shuffle ? 'Shuffle on' : 'Shuffle off'}>
        <button type="button" onClick={() => setShuffle((s) => !s)} aria-pressed={shuffle} aria-label="Shuffle"
          className={cn(iconBtn, 'size-9', shuffle && 'text-brand hover:text-brand')}>
          <Shuffle className={small} />
        </button>
      </Tooltip>
      <button type="button" onClick={prev} disabled={!current} aria-label="Previous" className={cn(iconBtn, 'size-10 text-fg')}>
        <SkipBack className={cn(icon, 'fill-current')} />
      </button>
      <PlayPauseButton size={size} />
      <button type="button" onClick={() => next()} disabled={!current} aria-label="Next" className={cn(iconBtn, 'size-10 text-fg')}>
        <SkipForward className={cn(icon, 'fill-current')} />
      </button>
      <Tooltip label={repeat === 'off' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one'}>
        <button type="button" onClick={cycleRepeat} aria-label="Repeat" aria-pressed={repeat !== 'off'}
          className={cn(iconBtn, 'size-9', repeat !== 'off' && 'text-brand hover:text-brand')}>
          <RepeatIcon className={small} />
        </button>
      </Tooltip>
    </div>
  );
}
