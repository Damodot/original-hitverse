import * as Dialog from '@radix-ui/react-dialog';
import { ChevronDown, Clock3, Disc3, Headphones, Heart, ListMusic, MicVocal, RotateCcw, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import FlipCard from '@/components/ui/FlipCard';
import PeekRating from '@/components/ui/PeekRating';
import { usePlayer } from '@/context/PlayerContext';
import { useTheme } from '@/context/ThemeContext';
import { averageRating, useAlbums, useLiveSong, useLyrics, useMyRatings, useRate } from '@/hooks/useLibrary';
import { useCoverColors } from '@/lib/coverColors';
import { cn, formatTime } from '@/lib/utils';
import { Controls } from './Controls';
import { Equalizer } from './Equalizer';
import { LikeButton } from './LikeButton';
import { DjButton, KaraokeButton, MixingNote } from './ModeButtons';
import { Seekbar } from './Seekbar';
import { SongMenu } from './SongMenu';
import { SongCredits } from './SongCredits';
import { SyncedLyrics } from './SyncedLyrics';
import { Volume } from './Volume';

// WebGPU background: its own chunk, loaded only when the full-screen player opens.
const AeroShards = lazy(() => import('@/components/ui/AeroShards'));
const hasWebGpu = typeof navigator !== 'undefined' && 'gpu' in navigator;

/** Full-screen player with lyrics and the up-next queue. */
export function NowPlaying() {
  const { current, expanded, setExpanded, isPlaying, karaoke, karaokeMaking } = usePlayer();
  const [tab, setTab] = useState('lyrics');
  const colors = useCoverColors(current?.cover);
  if (!current) return null;

  return (
    <Dialog.Root open={expanded} onOpenChange={setExpanded}>
      <AnimatePresence>
        {expanded && (
          <Dialog.Portal forceMount>
            <Dialog.Content asChild forceMount aria-describedby={undefined} onOpenAutoFocus={(e) => e.preventDefault()}>
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 300 }}
                className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg text-fg"
              >
                <Dialog.Title className="sr-only">Now playing: {current.title}</Dialog.Title>
                <Backdrop cover={current.cover} colors={colors} playing={isPlaying} />

                <header className="relative flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2 sm:px-8">
                  <Dialog.Close className="grid size-11 cursor-pointer place-items-center rounded-full hover:bg-fg/10" aria-label="Close player">
                    <ChevronDown className="size-7" />
                  </Dialog.Close>
                  <p className="text-xs font-semibold tracking-[0.3em] text-muted uppercase">Now playing</p>
                  <SongMenu song={current} onNavigate={() => setExpanded(false)} />
                </header>

                <div className="relative mx-auto grid min-h-0 w-full max-w-6xl flex-1 gap-8 overflow-y-auto px-6 pb-8 sm:px-10 lg:grid-cols-2 lg:gap-14 lg:overflow-hidden">
                  <section className="flex flex-col justify-center gap-6 lg:py-6">
                    <CoverFlip song={current} colors={colors} />
                    <div className="mx-auto flex w-full max-w-md items-center justify-between gap-4">
                      <div className="min-w-0">
                        <h2 className="truncate font-display text-3xl tracking-wide">{current.title}</h2>
                        {karaoke && current.karaoke && <p className="text-xs font-semibold tracking-[0.25em] text-brand uppercase">Karaoke · sing it</p>}
                        {karaoke && !current.karaoke && karaokeMaking.has(current._id) && <p className="text-xs font-semibold tracking-[0.25em] text-brand uppercase">Making the karaoke beat…</p>}
                        <p className="truncate text-muted">{current.artist}</p>
                        {current.previewOnly && (
                          <a href={`/listen/${current.slug}`} className="mt-1 inline-block text-sm font-semibold text-brand hover:underline">
                            30-second preview · hear the full song on other platforms
                          </a>
                        )}
                      </div>
                      <LikeButton song={current} size={24} pill />
                    </div>
                    <RateSong song={current} />
                    <div className="mx-auto w-full max-w-md space-y-3">
                      <Seekbar />
                      <Controls size="lg" />
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <KaraokeButton pill />
                        <DjButton pill />
                      </div>
                      <MixingNote className="justify-center" />
                      <div className="hidden justify-center pt-2 md:flex"><Volume wide /></div>
                    </div>
                  </section>

                  <section className="flex min-h-[24rem] flex-col rounded-2xl border border-fg/10 bg-fg/[0.04] backdrop-blur-sm lg:my-6 lg:min-h-0">
                    <div className="flex gap-1 border-b border-fg/10 p-2" role="tablist">
                      {[
                        ['lyrics', 'Lyrics', MicVocal],
                        ['queue', 'Up next', ListMusic],
                      ].map(([id, label, Icon]) => (
                        <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                          className={cn('flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 font-semibold text-muted transition',
                            tab === id ? 'bg-fg/10 text-fg' : 'hover:text-fg')}>
                          <Icon className="size-4" /> {label}
                        </button>
                      ))}
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
                      {tab === 'lyrics' ? <LyricsPanel song={current} /> : <QueuePanel />}
                    </div>
                  </section>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/** Shards of glass in the cover's colours, drifting while music plays. Falls back to the blurred cover without WebGPU. */
function Backdrop({ cover, colors, playing }) {
  const { theme } = useTheme();
  const [failed, setFailed] = useState(!hasWebGpu);
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <img src={cover} alt="" className={cn('size-full scale-125 object-cover blur-3xl transition-opacity duration-700', failed ? 'opacity-40 dark:opacity-30' : 'opacity-20 dark:opacity-15')} />
      {!failed && (
        <Suspense fallback={null}>
          <AeroShards
            className="absolute! inset-0"
            shardColor={colors.shard}
            accentColor={colors.accent}
            lightMode={theme === 'light'}
            paused={!playing}
            count={window.innerWidth < 640 ? 700 : 1200}
            dpr={1.5}
            holdToGather={false}
            onError={() => setFailed(true)}
          />
        </Suspense>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-bg/10 via-bg/30 to-bg/80" />
    </div>
  );
}

/** Measures a box so the flip card (which takes pixel sizes) can stay square and responsive. */
function useSquare(ref) {
  const [size, setSize] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => setSize(Math.floor(Math.min(el.clientWidth, 448, window.innerHeight * 0.46)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [ref]);
  return size;
}

/** The playing song's card (React Bits' FlipCard): artwork on the front, its numbers on the back. */
function CoverFlip({ song, colors }) {
  const box = useRef(null);
  const size = useSquare(box);
  const [flipped, setFlipped] = useState(false);
  const live = useLiveSong(song);
  const { data: albums } = useAlbums();
  const album = albums?.find((a) => a._id === song.album);
  useEffect(() => setFlipped(false), [song._id]);

  const avg = averageRating(live);
  const stats = [
    { icon: Heart, label: 'Likes', value: (live?.likeCount ?? 0).toLocaleString() },
    { icon: Star, label: 'Rating', value: live?.ratingCount ? `${avg.toFixed(1)} / 5` : 'Not rated', sub: live?.ratingCount ? `${live.ratingCount} ${live.ratingCount === 1 ? 'rating' : 'ratings'}` : '' },
    { icon: Headphones, label: 'Plays', value: (live?.plays ?? 0).toLocaleString() },
    { icon: Clock3, label: 'Length', value: formatTime(song.duration) },
  ];

  return (
    <div ref={box} className="mx-auto w-full max-w-[28rem]" style={{ height: size || undefined }}>
      {size > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={song._id}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.25 }}
            className="flex justify-center"
          >
            <FlipCard
              width={size}
              height={size}
              radius={20}
              flipped={flipped}
              onFlipChange={setFlipped}
              background={`linear-gradient(150deg, ${colors.shard}, ${colors.accent} 60%, #0b0a10)`}
              color="#ffffff"
              shadowColor={colors.shard}
              shadowOpacity={0.5}
              tiltMax={10}
              ariaLabel={flipped ? `Show ${song.title} artwork` : `Show details for ${song.title}`}
              front={<img src={song.cover} alt={`${song.title} artwork`} draggable={false} className="size-full object-cover" />}
              back={(
                <div className="flex size-full flex-col bg-black/35 p-[7%]">
                  <p className="text-xs font-semibold tracking-[0.25em] text-white/70 uppercase">Now playing</p>
                  <p className="mt-1 line-clamp-2 font-display leading-tight tracking-wide" style={{ fontSize: Math.max(22, size * 0.085) }}>{song.title}</p>
                  <p className="truncate text-white/80">{song.artist}</p>
                  {album && <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-white/70"><Disc3 className="size-4" /> {album.title}</p>}
                  <dl className="mt-auto grid grid-cols-2 gap-2.5">
                    {stats.map(({ icon: Icon, label, value, sub }) => (
                      <div key={label} className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                        <dt className="flex items-center gap-1.5 text-xs text-white/70"><Icon className="size-3.5" /> {label}</dt>
                        <dd className="mt-0.5 text-lg leading-tight font-bold">{value}</dd>
                        {sub && <dd className="text-xs text-white/60">{sub}</dd>}
                      </div>
                    ))}
                  </dl>
                  <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/60"><RotateCcw className="size-3" /> Tap to flip back</p>
                </div>
              )}
            />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

const RATING_LABELS = ['Not for me', 'It’s okay', 'Good', 'Really good', 'Love it'];

/** Your star rating for the song (React Bits' PeekRating), with everyone's average beside it. */
function RateSong({ song }) {
  const { data: mine } = useMyRatings();
  const rate = useRate();
  const live = useLiveSong(song);
  const value = mine?.[song._id] ?? 0;
  const avg = averageRating(live);
  return (
    <div className="mx-auto flex w-full max-w-md flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <PeekRating
        key={song._id}
        value={value}
        onChange={(v) => rate.mutate({ id: song._id, value: v })}
        labels={RATING_LABELS}
        size={26}
        activeColor="#f5b400"
        idleColor="color-mix(in srgb, var(--fg) 22%, transparent)"
        tipColor="var(--toast-bg)"
        tipTextColor="var(--fg)"
        ariaLabel={`Rate ${song.title}`}
      />
      <p className="text-sm text-muted">
        {live?.ratingCount
          ? <><span className="font-semibold text-fg">{avg.toFixed(1)}</span> average · {live.ratingCount} {live.ratingCount === 1 ? 'rating' : 'ratings'}</>
          : value ? 'You’re the first to rate it' : 'Be the first to rate it'}
      </p>
    </div>
  );
}

function LyricsPanel({ song }) {
  const { data, isPending, isError } = useLyrics(song.slug);
  if (isPending) return <p className="text-center text-muted">Loading lyrics…</p>;
  if (data?.synced?.length) return <SyncedLyrics song={song} synced={data.synced} credits={data.credits} className="py-[20vh] lg:py-[18vh]" />;
  if (isError || !data?.lyrics?.length) {
    return (
      <>
        <p className="mt-10 text-center text-muted">No lyrics for this track yet.</p>
        <SongCredits credits={data?.credits} />
      </>
    );
  }
  return (
    <>
      <div className="space-y-3 text-center text-xl leading-snug font-semibold sm:text-2xl">
        {data.lyrics.map((line, i) => <p key={i}>{line}</p>)}
      </div>
      <SongCredits credits={data.credits} />
    </>
  );
}

function QueuePanel() {
  const { queue, index, playAt, isPlaying } = usePlayer();
  return (
    <ol className="space-y-1">
      {queue.map((s, i) => (
        <li key={`${s._id}-${i}`}>
          <button type="button" onClick={() => playAt(i)}
            className={cn('flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition hover:bg-fg/10', i === index && 'bg-fg/10')}>
            <img src={s.cover} alt="" loading="lazy" className="size-11 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className={cn('truncate font-semibold', i === index && 'text-brand')}>{s.title}</p>
              <p className="truncate text-sm text-muted">{s.artist}</p>
            </div>
            {i === index && <Equalizer playing={isPlaying} className="mr-2" />}
          </button>
        </li>
      ))}
    </ol>
  );
}
