import { Blend, Crown, Disc3, LoaderCircle, Mic, Zap } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip } from '@/components/ui/tooltip';
import { usePlayer } from '@/context/PlayerContext';
import { cn } from '@/lib/utils';

const LENGTHS = [
  ['short', 'Short', '4 bars'],
  ['medium', 'Medium', '8 bars'],
  ['long', 'Long', '16 bars'],
];

/** Karaoke on/off: the song's beat without the vocals, with the lyrics up front. A missing beat is made on request. */
export function KaraokeButton({ pill = false, className }) {
  const { current, karaoke, toggleKaraoke, karaokeMaking, setExpanded, premium } = usePlayer();
  const blocked = ['off', 'unavailable'].includes(current?.karaokeState);
  const making = Boolean(current && karaoke && karaokeMaking.has(current._id));
  const on = karaoke && !blocked;
  const click = () => {
    toggleKaraoke();
    if (premium && !karaoke && !blocked) setExpanded(true); // straight to the lyrics
  };
  const label = !premium ? 'Karaoke (Premium)' : !current ? 'Karaoke'
    : current.karaokeState === 'off' ? 'The artist turned karaoke off for this song'
      : current.karaokeState === 'unavailable' ? 'No karaoke for 30-second previews'
        : making ? 'Making the karaoke beat…'
          : on ? 'Karaoke on' : 'Karaoke';
  if (pill) {
    return (
      <button type="button" onClick={click} disabled={!current} aria-pressed={on} title={label}
        className={cn('flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-40',
          on ? 'border-brand bg-brand text-brand-fg' : 'border-fg/15 bg-fg/5 hover:bg-fg/10', blocked && 'opacity-50', className)}>
        {making ? <LoaderCircle className="size-4 animate-spin" /> : <Mic className="size-4" />}
        {making ? 'Making the beat…' : on ? 'Karaoke on' : 'Karaoke'}
        {!premium && <Crown className="size-3.5 text-amber-400" aria-label="Premium" />}
      </button>
    );
  }
  return (
    <Tooltip label={label}>
      <button type="button" onClick={click} disabled={!current} aria-pressed={on} aria-label="Karaoke"
        className={cn('relative grid size-9 cursor-pointer place-items-center rounded-full transition disabled:opacity-40',
          on ? 'bg-brand text-brand-fg' : 'text-muted hover:text-fg', blocked && 'opacity-50', className)}>
        {making ? <LoaderCircle className="size-5 animate-spin" /> : <Mic className="size-5" />}
        {!premium && <PremiumDot />}
      </button>
    </Tooltip>
  );
}

/** DJ mode: songs blend into each other. Opens its settings and a "Mix now" button. */
export function DjButton({ pill = false, className }) {
  const { djMode, mixing, premium, toggleDj } = usePlayer();
  if (!premium) {
    // Not Premium: the button explains what DJ mode is and where to get it.
    return pill ? (
      <button type="button" onClick={toggleDj} aria-label="DJ mode (Premium)"
        className={cn('flex cursor-pointer items-center gap-2 rounded-full border border-fg/15 bg-fg/5 px-4 py-2 text-sm font-semibold transition hover:bg-fg/10', className)}>
        <Disc3 className="size-4" /> DJ mode <Crown className="size-3.5 text-amber-400" aria-label="Premium" />
      </button>
    ) : (
      <Tooltip label="DJ mode (Premium)">
        <button type="button" onClick={toggleDj} aria-label="DJ mode (Premium)"
          className={cn('relative grid size-9 cursor-pointer place-items-center rounded-full text-muted transition hover:text-fg', className)}>
          <Disc3 className="size-5" /><PremiumDot />
        </button>
      </Tooltip>
    );
  }
  const trigger = pill ? (
    <button type="button" aria-label="DJ mode settings"
      className={cn('flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
        djMode ? 'border-brand bg-brand text-brand-fg' : 'border-fg/15 bg-fg/5 hover:bg-fg/10', className)}>
      <Disc3 className={cn('size-4', mixing && 'animate-spin')} /> {djMode ? 'DJ mode on' : 'DJ mode'}
    </button>
  ) : (
    <button type="button" aria-label="DJ mode settings"
      className={cn('grid size-9 cursor-pointer place-items-center rounded-full transition',
        djMode ? 'bg-brand text-brand-fg' : 'text-muted hover:text-fg', className)}>
      <Disc3 className={cn('size-5', mixing && 'animate-spin')} />
    </button>
  );
  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent side="top">
        <DjPanel />
      </PopoverContent>
    </Popover>
  );
}

function DjPanel() {
  const { djMode, toggleDj, mixLength, setMixLength, beatMatch, setBeatMatch, mixNow, mixing, current, queue, index, shuffle } = usePlayer();
  const nextSong = !shuffle && queue.length ? queue[(index + 1) % queue.length] : null;
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-bold"><Disc3 className="size-5 text-brand" /> DJ mode</p>
          <p className="mt-0.5 text-sm text-muted">Each song blends into the next, beat on beat.</p>
        </div>
        <Switch checked={djMode} onChange={toggleDj} label="DJ mode" />
      </div>

      <div className={cn('space-y-4 transition', !djMode && 'pointer-events-none opacity-40')}>
        <div>
          <p className="mb-2 text-sm font-semibold">Mix length</p>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-subtle p-1" role="radiogroup" aria-label="Mix length">
            {LENGTHS.map(([id, label, bars]) => (
              <button key={id} type="button" role="radio" aria-checked={mixLength === id} onClick={() => setMixLength(id)}
                className={cn('cursor-pointer rounded-lg px-2 py-1.5 text-center text-sm font-semibold transition',
                  mixLength === id ? 'bg-elevated text-fg shadow' : 'text-muted hover:text-fg')}>
                {label}<span className="block text-[11px] font-normal text-muted">{bars}</span>
              </button>
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-start justify-between gap-3">
          <span>
            <span className="block text-sm font-semibold">Match tempos</span>
            <span className="block text-xs text-muted">Speeds the next song up or down (up to 8%) so the beats lock. Off: a quick filter fade.</span>
          </span>
          <Switch checked={beatMatch} onChange={() => setBeatMatch(!beatMatch)} label="Match tempos" />
        </label>

        {mixing ? (
          <p className="flex items-center gap-2 rounded-xl bg-brand/10 px-3 py-2.5 text-sm font-semibold text-brand">
            <Blend className="size-4 animate-pulse" /> Mixing into {mixing.to.title}…
          </p>
        ) : (
          <button type="button" onClick={mixNow} disabled={!current}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-fg px-4 py-2.5 font-semibold text-bg transition hover:opacity-90 disabled:opacity-40">
            <Zap className="size-4" /> Mix now{nextSong ? ` into ${nextSong.title}` : ''}
          </button>
        )}
      </div>
    </div>
  );
}

function Switch({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange}
      className={cn('relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition', checked ? 'bg-brand' : 'bg-border')}>
      <span className={cn('absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')} />
    </button>
  );
}

/** "Mixing into …" while two songs blend. */
export function MixingNote({ className }) {
  const { mixing } = usePlayer();
  if (!mixing) return null;
  return (
    <p className={cn('flex items-center gap-1.5 truncate text-xs font-semibold text-brand', className)}>
      <Blend className="size-3.5 shrink-0 animate-pulse" /> Mixing into {mixing.to.title}
    </p>
  );
}

function PremiumDot() {
  return (
    <span className="absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-amber-400 text-black" aria-hidden>
      <Crown className="size-2.5" />
    </span>
  );
}
