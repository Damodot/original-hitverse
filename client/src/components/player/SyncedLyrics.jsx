import { Music } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useCoverColors } from '@/lib/coverColors';
import { activeLine } from '@/lib/lrc';
import { cn } from '@/lib/utils';
import { SongCredits } from './SongCredits';

const CREDITS_AFTER = 5; // seconds after the last line starts, the credits take over

/** The nearest scrolling box around an element (the lyrics panel, or the page). */
function scrollParent(el) {
  for (let node = el?.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node;
  }
  return document.scrollingElement;
}

/**
 * Synced lyrics. The line being sung is the star at all times: bold, full brightness, a little larger, with a soft
 * glow. Every other line is faded. The view keeps the star centred (unless you've just scrolled yourself), and
 * tapping a line jumps the song there.
 *
 * It only re-renders when the line changes, and every line keeps the same font and size in the layout (the star
 * grows with a transform), so nothing reflows or jumps while the song plays.
 */
export function SyncedLyrics({ song, synced, credits, className, size = 'lg' }) {
  const { current, isPlaying, getTime, seek, playSong } = usePlayer();
  const isCurrent = current?._id === song?._id;
  const [active, setActive] = useState(0);
  const lineRefs = useRef([]);
  const creditsRef = useRef(null);
  const { shard } = useCoverColors(song?.cover); // the glow takes the artwork's colour
  const userScrolledAt = useRef(0);

  // Before the first line is sung, it's already the star (it's next). After that, the last line that started;
  // and a few seconds after the last line, the credits (index = number of lines), if there are any.
  const hasCredits = Boolean(credits?.writers?.length || credits?.producers?.length);
  const lineAt = (t) => {
    if (hasCredits && t >= synced.at(-1).t + CREDITS_AFTER) return synced.length;
    return Math.max(0, activeLine(synced, t));
  };

  useEffect(() => {
    if (!isCurrent) {
      setActive(0);
      return undefined;
    }
    const update = () => {
      const i = lineAt(getTime());
      setActive((prev) => (prev === i ? prev : i));
    };
    update();
    // Every frame while playing; a few times a second while paused, to catch seeks.
    if (isPlaying) {
      let raf = 0;
      const tick = () => { update(); raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
    const id = setInterval(update, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCurrent, isPlaying, synced, getTime]);

  // Centre the star inside its own scroll box only (never scrolls the rest of the page).
  useEffect(() => {
    if (!isCurrent || Date.now() - userScrolledAt.current < 3000) return;
    const el = active === synced.length ? creditsRef.current : lineRefs.current[active];
    const box = scrollParent(el);
    if (!el || !box) return;
    const boxRect = box === document.scrollingElement ? { top: 0, height: innerHeight } : box.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const top = box.scrollTop + (r.top - boxRect.top) - boxRect.height / 2 + r.height / 2;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }, [active, isCurrent]);

  const markScrolled = () => { userScrolledAt.current = Date.now(); };

  return (
    <div onWheel={markScrolled} onTouchMove={markScrolled} className={cn('space-y-1.5', className)} style={{ '--lyric-glow': shard }}>
      {synced.map((l, i) => {
        const star = isCurrent && i === active;
        const past = isCurrent && i < active;
        return (
          <button
            key={`${i}-${l.t}`}
            ref={(el) => { lineRefs.current[i] = el; }}
            type="button"
            onClick={() => (isCurrent ? seek(l.t) : playSong(song))}
            aria-current={star ? 'true' : undefined}
            className="group block w-full cursor-pointer rounded-xl px-3 py-2 text-center outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <span
              className={cn(
                'inline-block origin-center leading-snug font-extrabold tracking-tight',
                'transition-[opacity,transform,filter,color,text-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl',
                star
                  ? 'scale-[1.08] text-fg opacity-100 [text-shadow:0_0_24px_color-mix(in_srgb,var(--lyric-glow)_70%,transparent),0_0_6px_color-mix(in_srgb,var(--lyric-glow)_45%,transparent)] motion-reduce:scale-100'
                  : cn(
                    'scale-[0.96] text-fg group-hover:opacity-60 motion-reduce:scale-100',
                    !isCurrent ? 'opacity-80' : past ? 'opacity-20 blur-[0.6px]' : 'opacity-30',
                  ),
              )}
            >
              {l.text || <Music className="inline size-[0.85em] align-[-0.08em]" aria-label="Instrumental" />}
            </span>
          </button>
        );
      })}
      <SongCredits ref={creditsRef} credits={credits} star={isCurrent && active === synced.length} faded={isCurrent && active < synced.length} />
    </div>
  );
}
