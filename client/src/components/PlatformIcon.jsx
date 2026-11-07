import { Link2 } from 'lucide-react';
import { PLATFORM_BY_ID } from '@/lib/platforms';
import { cn } from '@/lib/utils';

/** A platform's logo in its brand colour (Simple Icons, CC0), or a lettered badge when there's no logo. */
export function PlatformIcon({ id, className, mono = false }) {
  const p = PLATFORM_BY_ID[id];
  if (!p) return null;
  const color = mono ? 'currentColor' : p.color;
  if (p.icon) {
    return (
      <svg viewBox="0 0 24 24" role="img" aria-label={p.name} className={cn('size-5 shrink-0', className)} fill={color}>
        <path d={p.icon.path} />
      </svg>
    );
  }
  if (p.letter) {
    return (
      <span role="img" aria-label={p.name} className={cn('grid size-5 shrink-0 place-items-center rounded-[28%] text-[0.7em] leading-none font-black text-black', className)} style={{ background: color }}>
        {p.letter}
      </span>
    );
  }
  return <Link2 aria-label={p.name} className={cn('size-5 shrink-0', className)} />;
}
