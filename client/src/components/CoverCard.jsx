import { Pause, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Equalizer } from '@/components/player/Equalizer';
import GlareHover from '@/components/ui/GlareHover';
import { useCoverColors } from '@/lib/coverColors';
import { cn } from '@/lib/utils';

const EASE = 'ease-[cubic-bezier(0.22,1,0.36,1)]';

/**
 * Square artwork card. On hover a streak of light sweeps the artwork (React Bits' GlareHover), the card lifts
 * with a glow in the cover's colour, and a frosted play button rises in the middle. Everything is plain CSS on
 * the card itself, so nothing has to follow the card around the page.
 */
export function CoverCard({ to, cover, title, subtitle, onPlay, playing, className }) {
  const { shard } = useCoverColors(cover);
  const navigate = useNavigate();
  return (
    <div
      className={cn(
        `group relative rounded-2xl p-3 transition-[background-color,translate] duration-500 ${EASE} hover:bg-subtle [@media(hover:hover)]:hover:-translate-y-1 motion-reduce:translate-y-0!`,
        className,
      )}
      style={{ '--glow': shard }}
    >
      {/* GlareHover is its own layer, so it sits above the card's link; clicking the artwork opens the page here. */}
      <div className="relative z-[1] cursor-pointer" onClick={(e) => !e.target.closest('button') && navigate(to)}>
        <GlareHover
          width="100%"
          borderRadius="12px"
          glareColor="#ffffff"
          glareOpacity={0.4}
          glareAngle={-35}
          glareSize={45}
          transitionDuration={850}
          className={`aspect-square bg-subtle shadow-lg transition-shadow duration-500 ${EASE} group-hover:shadow-[0_18px_40px_-14px_var(--glow)]`}
        >
          <img
            src={cover}
            alt=""
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 size-full object-cover transition-[scale,filter] duration-700 ${EASE} [@media(hover:hover)]:group-hover:scale-[1.04] [@media(hover:hover)]:group-hover:brightness-[0.8] motion-reduce:scale-100!`}
          />
          {/* Soft colour wash from the bottom, in the cover's own colour. */}
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--glow)_55%,transparent),transparent_60%)] opacity-0 transition-opacity duration-500 ${EASE} [@media(hover:hover)]:group-hover:opacity-100`}
          />
          {playing && (
            <span className="absolute bottom-2.5 left-2.5 z-[3] grid size-8 place-items-center rounded-full bg-black/60 backdrop-blur-md [@media(hover:hover)]:hidden">
              <Equalizer playing />
            </span>
          )}
          {onPlay && (
            <button
              type="button"
              onClick={onPlay}
              aria-label={`${playing ? 'Pause' : 'Play'} ${title}`}
              className={cn(
                'absolute z-[3] grid cursor-pointer place-items-center rounded-full text-white',
                'bg-black/35 shadow-[0_8px_30px_-6px_var(--glow)] ring-2 ring-[color-mix(in_srgb,var(--glow)_70%,white)] backdrop-blur-md',
                // Pointer devices: centred, rises in on hover/focus; leaves quickly.
                '[@media(hover:hover)]:top-1/2 [@media(hover:hover)]:left-1/2 [@media(hover:hover)]:size-[30%] [@media(hover:hover)]:-translate-x-1/2 [@media(hover:hover)]:-translate-y-1/2',
                'transition-[opacity,scale,background-color] duration-200 ease-in hover:bg-black/50',
                '[@media(hover:hover)]:scale-75 [@media(hover:hover)]:opacity-0',
                '[@media(hover:hover)]:group-hover:scale-100 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-hover:delay-75 [@media(hover:hover)]:group-hover:duration-500 [@media(hover:hover)]:group-hover:ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                '[@media(hover:hover)]:group-focus-within:scale-100 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:focus-visible:outline-2 [@media(hover:hover)]:focus-visible:outline-offset-2 [@media(hover:hover)]:focus-visible:outline-white',
                // The playing card keeps its button (and pulsing ring) showing.
              playing && '[@media(hover:hover)]:scale-100 [@media(hover:hover)]:opacity-100',
              // Touch: no hover, so a small button stays in the corner.
                '[@media(hover:none)]:right-2.5 [@media(hover:none)]:bottom-2.5 [@media(hover:none)]:size-10',
              )}
            >
              {/* While playing, a slow ring pulses out in the cover's colour. */}
              {playing && <span aria-hidden className="absolute inset-0 animate-[ping_1.8s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full ring-2 ring-[var(--glow)] motion-reduce:hidden" />}
              {playing
                ? <Pause className="size-[38%] fill-current [@media(hover:none)]:size-4" />
                : <Play className="size-[38%] translate-x-[6%] fill-current [@media(hover:none)]:size-4" />}
            </button>
          )}
        </GlareHover>
      </div>
      <Link to={to} className="mt-3 block truncate font-semibold after:absolute after:inset-0">
        {title}
      </Link>
      {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
    </div>
  );
}
