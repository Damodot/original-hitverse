import { cn } from '@/lib/utils';

/** Animated bars shown next to the track that's playing. */
export function Equalizer({ playing = true, className }) {
  return (
    <span className={cn('inline-flex h-4 items-end gap-[3px]', className)} aria-label="Now playing">
      {[0, 0.2, 0.4].map((d) => (
        <span
          key={d}
          className={cn('w-[3px] origin-bottom rounded-full bg-brand', playing ? 'h-full animate-eq' : 'h-1/3')}
          style={{ animationDelay: `${d}s` }}
        />
      ))}
    </span>
  );
}
