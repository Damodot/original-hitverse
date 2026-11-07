import { Play, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayer } from '@/context/PlayerContext';

export function Page({ children }) {
  return <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-10 sm:px-8 sm:pt-10">{children}</div>;
}

export function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-sm font-semibold tracking-[0.25em] text-brand uppercase">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-5xl tracking-wide sm:text-6xl">{title}</h1>
        {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}

/** "Play" and "Shuffle" buttons for a list of songs. */
export function PlayAllButtons({ songs }) {
  const { playList } = usePlayer();
  const disabled = !songs?.length;
  return (
    <div className="flex gap-2">
      <Button onClick={() => playList(songs, 0)} disabled={disabled}><Play className="size-4 fill-current" /> Play</Button>
      <Button variant="secondary" onClick={() => playList(songs, 0, { shuffle: true })} disabled={disabled}><Shuffle className="size-4" /> Shuffle</Button>
    </div>
  );
}
