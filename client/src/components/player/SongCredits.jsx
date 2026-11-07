import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const ROWS = [['writers', 'Written by'], ['producers', 'Produced by']];
const list = (names) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} & ${names.at(-1)}` : names[0]);

/** Writer and producer credits from the song's owner, shown after the lyrics. `star` lights them up at the outro. */
export const SongCredits = forwardRef(function SongCredits({ credits, star = false, faded = false, className }, ref) {
  const rows = ROWS.filter(([key]) => credits?.[key]?.length);
  if (!rows.length) return null;
  return (
    <section
      ref={ref}
      aria-label="Credits"
      className={cn(
        'mx-auto mt-10 max-w-md space-y-3 border-t border-fg/10 pt-8 text-center',
        'transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
        star ? 'scale-[1.04] opacity-100' : faded ? 'opacity-40' : 'opacity-90',
        className,
      )}
    >
      <p className="text-xs font-semibold tracking-[0.3em] text-muted uppercase">Credits</p>
      {rows.map(([key, label]) => (
        <div key={key}>
          <p className="text-sm text-muted">{label}</p>
          <p
            className="text-lg font-bold transition-[text-shadow] duration-500"
            style={star ? { textShadow: '0 0 20px color-mix(in srgb, var(--lyric-glow, var(--brand)) 60%, transparent)' } : undefined}
          >
            {list(credits[key])}
          </p>
        </div>
      ))}
    </section>
  );
});
