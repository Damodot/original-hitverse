import { BadgeCheck, Check, Flame, MapPin, Music2, PencilLine, Play, Users } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { LazyVideo } from '@/components/LazyVideo';
import { ArtistSocials } from '@/components/site/ArtistSocials';
import { SiteFooter, SiteNav } from '@/components/site/SiteNav';
import { Button } from '@/components/ui/button';
import ParticleText from '@/components/ui/ParticleText';
import { useAuth } from '@/context/AuthContext';
import { useArtistPage, useFollow, useRep } from '@/hooks/useArtists';
import { cn, formatTime } from '@/lib/utils';

const FlexCarousel = lazy(() => import('@/components/ui/FlexCarousel'));

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: 'easeOut' },
};

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** An artist's public page on HitVerse: hero, fan base, video, bio, songs and photos. */
export default function ArtistPage() {
  const { slug } = useParams();
  const { data: artist, isPending, isError } = useArtistPage(slug);

  useEffect(() => {
    if (artist) document.title = `${artist.name} on HitVerse`;
    return () => { document.title = 'HitVerse · Bringing smoke to music'; };
  }, [artist]);

  if (isError) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
        <div>
          <p className="font-display text-5xl">Artist not found</p>
          <p className="mt-2 text-muted">This page may have moved.</p>
          <Button asChild className="mt-6"><Link to="/artists">See all artists</Link></Button>
        </div>
      </div>
    );
  }
  if (isPending) return <div className="min-h-dvh animate-pulse bg-bg" />;

  return (
    <div className="overflow-x-clip">
      <SiteNav />
      <Hero artist={artist} />
      {artist.showcaseVideo && (
        <section className="mx-auto mt-12 max-w-6xl px-4 sm:mt-20 sm:px-6">
          <motion.div {...fadeUp} className="overflow-hidden rounded-3xl border border-border shadow-2xl shadow-brand/20">
            <LazyVideo src={artist.showcaseVideo} poster={artist.showcasePoster || undefined} className="aspect-video w-full object-cover" />
          </motion.div>
        </section>
      )}
      <About artist={artist} />
      <Songs artist={artist} />
      {artist.gallery.length > 0 && <Gallery artist={artist} />}
      <SiteFooter><ArtistSocials socials={artist.socials} /></SiteFooter>
    </div>
  );
}

function JoinButtons({ artist, size = 'lg' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const follow = useFollow();
  const rep = useRep();

  // Came back from signing up via "Join": finish joining.
  useEffect(() => {
    if (user && params.get('join') === '1' && !artist.isFollowing && !follow.isPending) {
      follow.mutate({ artist, follow: true });
      params.delete('join');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params]);

  const join = () => {
    if (!user) return navigate('/signup', { state: { from: `${location.pathname}?join=1` } });
    follow.mutate({ artist, follow: true });
  };

  if (!artist.isFollowing) {
    return (
      <Button size={size} onClick={join} loading={follow.isPending}>
        <Users className="size-5" /> Join the {artist.fanBase.name}
      </Button>
    );
  }
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {artist.isRepping ? (
        <Button size={size} variant="glass" disabled className="opacity-100!"><Flame className="size-5 text-orange-400" /> Repping the {artist.fanBase.name}</Button>
      ) : (
        <Button size={size} onClick={() => rep.mutate({ artist })} loading={rep.isPending}><Flame className="size-5" /> Rep the {artist.fanBase.name}</Button>
      )}
      <Button size={size} variant="glass" onClick={() => follow.mutate({ artist, follow: false })} loading={follow.isPending} title="Leave this fan base">
        <Check className="size-5" /> Joined
      </Button>
    </div>
  );
}

function Hero({ artist }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const small = useMediaQuery('(max-width: 639px)');
  const name = artist.name.toUpperCase();
  // Longer names get smaller letters so the particles still fill each one.
  const size = name.length > 10 ? 'clamp(2.5rem, 11vw, 9rem)' : 'clamp(3.5rem, 17vw, 14rem)';
  const { user } = useAuth();

  return (
    <section ref={ref} className="relative isolate grid min-h-[100svh] place-items-center overflow-hidden text-white">
      {artist.banner
        ? <motion.img src={artist.banner} alt="" fetchPriority="high" style={{ y }} className="absolute inset-0 -z-20 size-full scale-110 object-cover" />
        : <div className="absolute inset-0 -z-20 bg-gradient-to-br from-brand-strong via-black to-black" />}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/30 to-bg" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(97,0,161,0.35))]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-bg to-transparent" />

      <motion.div style={{ opacity: fade }} className="w-full px-4 pt-20 text-center">
        <h1 className="sr-only">{artist.name}</h1>
        <div aria-hidden className="mx-auto h-[clamp(7rem,20vw,16rem)] w-full max-w-7xl text-white">
          <ParticleText
            key={name}
            text={name}
            fontFamily="'Anton SC', Impact, sans-serif"
            fontWeight={400}
            fontSize={size}
            color="#ffffff"
            highlightColor="#b06bff"
            particleSize={small ? 2.6 : 3.8}
            density={small ? 4 : 6}
            scatter={small ? 140 : 260}
            gatherDuration={1800}
            idleDrift={0.2}
            style={{ minHeight: 0 }}
          />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.6 }}>
          <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-white/85">
            {artist.verified && <span className="inline-flex items-center gap-1.5 font-semibold"><BadgeCheck className="size-5 text-sky-400" /> Verified artist</span>}
            {artist.genre && <span>{artist.genre}</span>}
            {artist.location && <span className="inline-flex items-center gap-1"><MapPin className="size-4" /> {artist.location}</span>}
          </p>
          <p className="mt-4 text-lg tracking-[0.2em] text-white/80 uppercase">
            <span className="font-bold text-white">{artist.followerCount.toLocaleString()}</span> {artist.followerCount === 1 ? artist.fanBase.member : artist.fanBase.name}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <JoinButtons artist={artist} />
            <Button asChild size="lg" variant="glass">
              <Link to={user ? `/app/songs?q=${encodeURIComponent(artist.name)}` : '/signup'}><Play className="size-5 fill-current" /> Listen</Link>
            </Button>
            {artist.canEdit && (
              <Button asChild size="lg" variant="glass"><Link to={`/app/profile/${artist.slug}`}><PencilLine className="size-5" /> Edit page</Link></Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function About({ artist }) {
  if (!artist.bio) return null;
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-24 md:grid-cols-[1fr_1.1fr] md:gap-16">
      <motion.div {...fadeUp} className="relative">
        <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand/40 to-transparent blur-2xl" />
        {artist.avatar
          ? <img src={artist.avatar} alt={artist.name} loading="lazy" className="aspect-[4/5] w-full rounded-3xl object-cover object-right shadow-2xl" />
          : <div className="grid aspect-[4/5] w-full place-items-center rounded-3xl bg-subtle font-display text-8xl text-muted">{artist.name[0]}</div>}
        <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-display text-5xl tracking-wider whitespace-nowrap text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.7)] sm:text-6xl">
          {artist.name.toUpperCase()}
        </p>
      </motion.div>
      <motion.div {...fadeUp}>
        <p className="text-sm font-semibold tracking-[0.3em] text-brand uppercase">The artist</p>
        <h2 className="mt-3 text-4xl leading-tight font-bold sm:text-5xl">{artist.name}</h2>
        <p className="mt-2 text-xl text-muted">Fans are called <span className="font-semibold text-fg">{artist.fanBase.name}</span></p>
        <div className="mt-6 space-y-4 text-lg leading-relaxed text-fg/85">
          {artist.bio.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <ArtistSocials socials={artist.socials} className="mt-8" itemClassName="border border-border" />
      </motion.div>
    </section>
  );
}

function Songs({ artist }) {
  if (!artist.songs.length) {
    return (
      <section className="mx-auto max-w-6xl px-6 pb-24 text-center text-muted">
        <Music2 className="mx-auto size-8" />
        <p className="mt-2">No songs yet. Join the {artist.fanBase.name} to hear them first.</p>
      </section>
    );
  }
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <motion.div {...fadeUp} className="mb-8">
        <p className="text-sm font-semibold tracking-[0.3em] text-brand uppercase">Music</p>
        <h2 className="mt-2 text-4xl font-bold">Songs</h2>
      </motion.div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {artist.songs.map((s, i) => (
          <motion.div key={s._id} {...fadeUp} transition={{ ...fadeUp.transition, delay: Math.min(i, 8) * 0.05 }}>
            <Link to={`/listen/${s.slug}`} className="group block">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-subtle shadow-lg">
                <img src={s.cover} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                  <span className="grid size-12 place-items-center rounded-full bg-white/15 ring-2 ring-white/60 backdrop-blur-md"><Play className="size-5 translate-x-px fill-white text-white" /></span>
                </span>
              </div>
              <p className="mt-3 truncate font-semibold">{s.title}</p>
              <p className={cn('truncate text-sm text-muted')}>{s.duration ? formatTime(s.duration) : ''}{s.likeCount ? ` · ${s.likeCount} likes` : ''}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Gallery({ artist }) {
  return (
    <section aria-label="Photo gallery" className="pb-24">
      <motion.div {...fadeUp} className="mx-auto mb-2 max-w-6xl px-6">
        <p className="text-sm font-semibold tracking-[0.3em] text-brand uppercase">Gallery</p>
        <h2 className="mt-2 text-4xl font-bold">On stage</h2>
        <p className="mt-2 text-muted">Drag, swipe or use the arrow keys. Click a photo to focus it.</p>
      </motion.div>
      <div className="h-[clamp(26rem,72vh,46rem)] text-fg">
        <Suspense fallback={null}>
          <FlexCarousel
            items={artist.gallery}
            preset="liquid"
            intro="rise"
            cardHeight={0.62}
            gap={14}
            radius={18}
            autoplay
            interval={4}
            captureWheel={false}
            style={{ overscrollBehavior: 'auto' }}
          />
        </Suspense>
      </div>
    </section>
  );
}
