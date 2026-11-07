import { ArrowUpRight, Check, Pause, Play, Share2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { LogoMark, Logo } from '@/components/Logo';
import BlurText from '@/components/ui/BlurText';
import ClickSpark from '@/components/ui/ClickSpark';
import GlassIcons from '@/components/ui/GlassIcons';
import Grainient from '@/components/ui/Grainient';
import StarBorder from '@/components/ui/StarBorder';
import TiltedCard from '@/components/ui/TiltedCard';
import { trackClick, useListen } from '@/hooks/useLinks';
import { useCoverColors } from '@/lib/coverColors';
import { PLATFORM_BY_ID, songLinkUrl, STREAMING } from '@/lib/platforms';
import { cn, formatTime } from '@/lib/utils';

// Public page for one song (no sign-in), like a HyperFollow page, built from React Bits pieces:
// Grainient background in the artwork's colours, TiltedCard artwork with a preview button, BlurText title,
// StarBorder "Listen free on HitVerse", and every platform as a GlassIcons tile. ClickSpark adds sparks on tap.

const PREVIEW_SECONDS = 30;
const PREF = 'hv-dsp'; // the platform this visitor picked last time

// Glass tile colours per platform (the tile shows the logo in white on top).
const TILE = {
  spotify: 'linear-gradient(135deg, #3be477, #128a3e)',
  appleMusic: 'linear-gradient(135deg, #fb5c74, #e3173a)',
  youtubeMusic: 'linear-gradient(135deg, #ff4e4e, #c40000)',
  audiomack: 'linear-gradient(135deg, #ffc04d, #ff8a00)',
  boomplay: 'linear-gradient(135deg, #4d86ff, #1239b8)',
  youtube: 'linear-gradient(135deg, #ff3333, #b30000)',
  deezer: 'linear-gradient(135deg, #be6bff, #6b1fd1)',
  tidal: 'linear-gradient(135deg, #4a4a55, #111114)',
  amazonMusic: 'linear-gradient(135deg, #4fe6ee, #1592a8)',
  soundcloud: 'linear-gradient(135deg, #ff8f33, #ff3d00)',
};

function readPref() {
  try {
    return localStorage.getItem(PREF);
  } catch {
    return null;
  }
}
function savePref(id) {
  try {
    localStorage.setItem(PREF, id);
  } catch { /* private mode */ }
}

/** Puts the visitor's likely app first: their last pick, then Apple Music on Apple devices, Spotify elsewhere. */
function orderFor(available) {
  const last = readPref();
  const apple = /iPhone|iPad|Macintosh/.test(navigator.userAgent);
  const rank = (id) => (id === last ? -3 : apple && id === 'appleMusic' ? -2 : !apple && id === 'spotify' ? -2 : 0);
  return [...available].sort((a, b) => rank(a.id) - rank(b.id));
}

/** A platform's logo as a white glyph for the glass tile. */
function Glyph({ id }) {
  const p = PLATFORM_BY_ID[id];
  if (p.icon) return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={p.icon.path} /></svg>;
  return <span aria-hidden className="text-[150%] leading-none font-black">{p.letter}</span>;
}

export default function Listen() {
  const { slug } = useParams();
  const { data: song, isPending, isError } = useListen(slug);
  const colors = useCoverColors(song?.cover);

  useEffect(() => {
    if (song) document.title = `${song.title} by ${song.artist} | HitVerse`;
    return () => { document.title = 'HitVerse · Bringing smoke to music'; };
  }, [song]);

  return (
    <div className="dark relative isolate min-h-dvh overflow-hidden bg-[#0a0a0b] text-white">
      {song && (
        <div aria-hidden className="fixed inset-0 -z-10">
          {/* Blurred artwork underneath, in case WebGL is unavailable. */}
          <img src={song.cover} alt="" className="size-full scale-125 object-cover opacity-40 blur-3xl" />
          <div className="absolute inset-0 opacity-90">
            <Grainient
              colors={['#07060a', colors.shard, colors.accent, '#07060a']}
              type="radial"
              speed={0.35}
              grainAmount={0.07}
              contrast={1.05}
              interactive={false}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/50 to-black/85" />
        </div>
      )}

      <ClickSpark sparkColor={colors.accent} sparkCount={10} sparkRadius={26} glow={0.6}>
        <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-8 pb-10">
          <Link to="/" className="mx-auto mb-6 opacity-90 transition hover:opacity-100" aria-label="HitVerse home">
            <Logo className="h-7" tone="light" />
          </Link>

          {isPending && <PageSkeleton />}
          {isError && (
            <div className="my-auto text-center">
              <p className="font-display text-4xl">Song not found</p>
              <p className="mt-2 text-white/70">This link may be old. Find the music on HitVerse instead.</p>
              <Link to="/" className="mt-6 inline-flex rounded-full bg-white px-6 py-3 font-semibold text-black">Go to HitVerse</Link>
            </div>
          )}
          {song && <SongCard song={song} colors={colors} />}

          <p className="mt-auto pt-10 text-center text-sm text-white/50">
            <Link to="/" className="inline-flex items-center gap-1.5 hover:text-white"><LogoMark className="size-4" /> HitVerse · Bringing smoke to music</Link>
          </p>
        </main>
      </ClickSpark>
    </div>
  );
}

function SongCard({ song, colors }) {
  const available = useMemo(() => orderFor(STREAMING.filter((p) => song.links[p.id])), [song]);
  const more = song.links.smartLink || songLinkUrl(song.links);
  const last = readPref();
  const favourite = available.find((p) => p.id === last);

  const open = (id) => {
    trackClick(song.slug, id);
    if (id !== 'smartLink') savePref(id);
  };

  const tiles = available.map((p) => ({
    id: p.id,
    label: p.name,
    icon: <Glyph id={p.id} />,
    color: TILE[p.id] ?? 'graphite',
    href: song.links[p.id],
    target: '_blank',
    onClick: () => open(p.id),
  }));

  return (
    <>
      <Artwork song={song} />

      <h1 className="sr-only">{song.title} by {song.artist}</h1>
      <div aria-hidden className="mt-7 text-center">
        <BlurText
          key={song.slug}
          text={song.title}
          animateBy="letters"
          delay={45}
          direction="bottom"
          className="justify-center font-display text-5xl leading-none tracking-wide"
        />
      </div>
      <p className="mt-2 text-center text-lg text-white/80">{song.artist}</p>
      <p className="mt-1 text-center text-sm text-white/55">
        {song.album ? `From ${song.album.title}${song.album.type ? ` (${song.album.type})` : ''} · ` : ''}
        {available.length ? `Out on ${available.length + 1} platforms` : 'Streaming on HitVerse'}
      </p>

      <div className="mt-7 space-y-3">
        {favourite && (
          <a
            href={song.links[favourite.id]}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => open(favourite.id)}
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 font-semibold text-white shadow-xl transition hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: TILE[favourite.id] }}
          >
            <span className="grid size-8 place-items-center text-white [&>svg]:size-7"><Glyph id={favourite.id} /></span>
            <span className="flex-1">Open in {favourite.name}</span>
            <span className="text-sm font-medium text-white/80">Your app</span>
          </a>
        )}
        <StarBorder
          as={Link}
          to={`/app/songs?q=${encodeURIComponent(song.title)}`}
          color={colors.shard}
          trailColor={colors.accent}
          radius={16}
          thickness={1.5}
          glow={0.8}
          sparkle
          className="w-full"
        >
          <span className="flex w-full items-center gap-3 px-1 py-1.5">
            <LogoMark className="size-8" />
            <span className="flex-1 text-left">
              <span className="block text-lg font-semibold">Listen free on HitVerse</span>
              <span className="block text-sm text-white/65">Full song, lyrics and more</span>
            </span>
          </span>
        </StarBorder>
      </div>

      {tiles.length > 0 && (
        <section className="mt-10" aria-label="Choose your music app">
          <p className="mb-6 text-center text-xs font-semibold tracking-[0.3em] text-white/60 uppercase">Or pick your app</p>
          <GlassIcons
            items={tiles}
            columns={4}
            size={62}
            gap={22}
            labels="always"
            hover="lift"
            plate="tilt"
            theme="dark"
            className="[&_a]:text-[12px]"
          />
        </section>
      )}

      <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
        {more && (
          <a
            href={more}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => song.links.smartLink && trackClick(song.slug, 'smartLink')}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-5 py-2.5 font-semibold transition hover:bg-white/20"
          >
            More platforms <ArrowUpRight className="size-4" />
          </a>
        )}
        <ShareButton song={song} />
      </div>
      {song.linkCredits?.includes('MusicLink') && (
        <p className="mt-5 text-center text-xs text-white/40">
          Streaming links found with <a href="https://musiclink.one" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70">MusicLink</a>
        </p>
      )}
    </>
  );
}

/** Tilting artwork (TiltedCard) with a 30-second preview button floating on it. */
function Artwork({ song }) {
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const length = Math.min(PREVIEW_SECONDS, song.duration || PREVIEW_SECONDS);
  const size = 'min(20rem, calc(100vw - 3rem))';

  const toggle = (e) => {
    e.stopPropagation();
    const a = audio.current;
    if (!a) return;
    if (a.paused) {
      if (a.currentTime >= length) a.currentTime = 0;
      a.play().catch(() => {});
    } else a.pause();
  };

  const ring = 2 * Math.PI * 29;
  return (
    <div className="mx-auto">
      <TiltedCard
        imageSrc={song.cover}
        altText={`${song.title} artwork`}
        containerHeight={size}
        containerWidth={size}
        imageHeight={size}
        imageWidth={size}
        rotateAmplitude={10}
        scaleOnHover={1.04}
        showTooltip={false}
        flipOnClick={false}
        radius={18}
        displayOverlayContent
        overlayContent={(
          <div className="flex size-full items-end justify-between p-3">
            <span className={cn('rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold tabular-nums backdrop-blur-md transition-opacity', playing || t > 0 ? 'opacity-100' : 'opacity-0')}>
              {formatTime(t)} / {formatTime(length)}
            </span>
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? 'Pause preview' : `Play a ${length}-second preview`}
              className="relative grid size-16 cursor-pointer place-items-center rounded-full bg-black/60 backdrop-blur-md transition hover:scale-105"
            >
              <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden>
                <circle cx="32" cy="32" r="29" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                <circle cx="32" cy="32" r="29" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={ring} strokeDashoffset={ring * (1 - Math.min(1, t / length))} />
              </svg>
              {playing ? <Pause className="size-6 fill-current" /> : <Play className="ml-1 size-6 fill-current" />}
            </button>
          </div>
        )}
      />
      <audio
        ref={audio}
        src={song.preview}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const now = e.currentTarget.currentTime;
          setT(now);
          if (now >= length) e.currentTarget.pause();
        }}
      />
    </div>
  );
}

function ShareButton({ song }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href.split('?')[0];
    try {
      if (navigator.share) {
        await navigator.share({ title: `${song.title} by ${song.artist}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* share sheet closed */ }
  };
  return (
    <button type="button" onClick={share} className={cn('inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 font-semibold transition', copied ? 'bg-emerald-500 text-black' : 'bg-white/10 hover:bg-white/20')}>
      {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
      {copied ? 'Link copied' : 'Share'}
    </button>
  );
}

function PageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mx-auto aspect-square w-full max-w-[20rem] rounded-2xl bg-white/10" />
      <div className="mx-auto mt-7 h-12 w-56 rounded-lg bg-white/10" />
      <div className="mt-8 h-20 rounded-2xl bg-white/10" />
      <div className="mt-10 grid grid-cols-4 gap-6 px-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-square rounded-2xl bg-white/10" />)}</div>
    </div>
  );
}
