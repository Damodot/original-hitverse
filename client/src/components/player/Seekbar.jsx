import { useEffect, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { usePlayer, useProgress } from '@/context/PlayerContext';
import { cn, formatTime } from '@/lib/utils';

export function Seekbar({ className, compact = false }) {
  const { seek, current: song } = usePlayer();
  const { current, duration } = useProgress();
  const [drag, setDrag] = useState(null);
  useEffect(() => setDrag(null), [song?._id]);
  const value = drag ?? current;
  const max = duration || song?.duration || 1;
  return (
    <div className={cn('flex w-full items-center gap-3 text-xs text-muted tabular-nums', className)}>
      {!compact && <span className="w-10 text-right">{formatTime(value)}</span>}
      <Slider
        aria-label="Seek"
        min={0}
        max={max}
        step={1}
        value={[Math.min(value, max)]}
        disabled={!song}
        onValueChange={([v]) => setDrag(v)}
        onValueCommit={([v]) => {
          seek(v);
          setDrag(null);
        }}
      />
      {!compact && <span className="w-10">{formatTime(song ? max : 0)}</span>}
    </div>
  );
}

/** A thin progress line for the mobile mini player. */
export function ProgressLine({ className }) {
  const { current: song } = usePlayer();
  const { current, duration } = useProgress();
  const pct = song ? (current / (duration || song.duration || 1)) * 100 : 0;
  return (
    <div className={cn('h-0.5 w-full bg-fg/10', className)}>
      <div className="h-full bg-brand transition-[width] duration-300 ease-linear" style={{ width: `${pct}%` }} />
    </div>
  );
}
