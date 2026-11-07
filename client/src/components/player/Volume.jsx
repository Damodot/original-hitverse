import { Volume1, Volume2, VolumeX } from 'lucide-react';
import WakeSlider from '@/components/ui/WakeSlider';
import { usePlayer } from '@/context/PlayerContext';
import { cn } from '@/lib/utils';

/** Mute button plus React Bits' WakeSlider. `wide` is the larger version for the full-screen player. */
export function Volume({ wide = false, className }) {
  const { volume, setVolume, muted, setMuted } = usePlayer();
  const level = muted ? 0 : volume;
  const Icon = level === 0 ? VolumeX : level < 0.5 ? Volume1 : Volume2;
  return (
    <div className={cn('flex items-center gap-1', wide ? 'w-72' : 'w-44', className)}>
      <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Unmute' : 'Mute'}
        className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:text-fg">
        <Icon className="size-5" />
      </button>
      <WakeSlider
        value={Math.round(level * 100)}
        onChange={(v) => {
          setVolume(v / 100);
          if (muted && v > 0) setMuted(false);
        }}
        bars={wide ? 32 : 20}
        height={wide ? 36 : 26}
        restHeight={wide ? 8 : 6}
        gap={wide ? 4 : 3}
        fillColor="var(--fg)"
        trackColor="color-mix(in srgb, var(--fg) 16%, transparent)"
        crestColor="var(--brand)"
        ariaLabel="Volume"
        formatValue={(v) => `${v}%`}
      />
    </div>
  );
}
