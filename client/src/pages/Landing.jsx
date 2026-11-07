import {
  BadgeCheck, BarChart3, Bomb, Clapperboard, Crown, Disc3, Ear, FireExtinguisher, Flame, Gem, Headphones, ListMusic, Megaphone,
  Mic2, Radar, Receipt, Rocket, ScanEye, ShieldCheck, Star, Swords, Users, Waves, Wind, Zap,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { SiteFooter, SiteNav } from '@/components/site/SiteNav';
import { Button } from '@/components/ui/button';
import ParticleText from '@/components/ui/ParticleText';
import { useAuth } from '@/context/AuthContext';
import { useArtists } from '@/hooks/useArtists';
import { naira, usePricing } from '@/hooks/usePremium';
import { cn } from '@/lib/utils';

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

/** HitVerse's own landing page: what it is, for artists and for fans. */
export default function Landing() {
  return (
    <div className="overflow-x-clip">
      <SiteNav />
      <Hero />
      <HowItWorks />
      <FanBases />
      <Smoke />
      <Protection />
      <Packages />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}

function SectionTitle({ eyebrow, title, children, center = false }) {
  return (
    <motion.div {...fadeUp} className={cn('mb-10', center && 'text-center')}>
      <p className="text-sm font-semibold tracking-[0.3em] text-brand uppercase">{eyebrow}</p>
      <h2 className="mt-2 text-4xl leading-tight font-bold sm:text-5xl">{title}</h2>
      {children && <p className={cn('mt-3 max-w-2xl text-lg text-muted', center && 'mx-auto')}>{children}</p>}
    </motion.div>
  );
}

const Soon = () => <span className="ml-2 rounded-full bg-brand/15 px-2 py-0.5 align-middle text-xs font-semibold text-brand">Coming soon</span>;

function Hero() {
  const ref = useRef(null);
  const { user } = useAuth();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const small = useMediaQuery('(max-width: 639px)');

  return (
    <section ref={ref} className="relative isolate grid min-h-[100svh] place-items-center overflow-hidden text-white">
      <motion.img src="/media/img/hero.webp" alt="" fetchPriority="high" style={{ y }} className="absolute inset-0 -z-20 size-full scale-110 object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/45 to-bg" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(97,0,161,0.4))]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-bg to-transparent" />

      <motion.div style={{ opacity: fade }} className="w-full px-4 text-center">
        <h1 className="sr-only">HitVerse: bringing smoke to music</h1>
        <div aria-hidden className="mx-auto h-[clamp(8rem,24vw,19rem)] w-full max-w-7xl text-white">
          <ParticleText
            text="HITVERSE"
            fontFamily="'Anton SC', Impact, sans-serif"
            fontWeight={400}
            fontSize="clamp(4rem, 19vw, 15rem)"
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.6 }}>
          <p className="mt-2 font-display text-3xl tracking-wide sm:text-5xl">BRINGING SMOKE TO MUSIC</p>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80 sm:text-xl">
            Artists test unreleased songs with their realest fans before the world hears them. Fans rate, debate and back
            their artists, and the music that wins gets pushed to every platform.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link to={user ? '/app/artist' : '/signup'}><Mic2 className="size-5" /> I’m an artist</Link></Button>
            <Button asChild size="lg" variant="glass"><Link to={user ? '/app' : '/signup'}><Headphones className="size-5" /> I’m a fan</Link></Button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

const ARTIST_STEPS = [
  [Disc3, 'Drop it before you drop it', 'Upload unreleased music for premium fans only, for as many days as you choose.'],
  [BarChart3, 'See the real numbers', 'Ratings, completion rate, replays and every comment show how a song will land, before release day.'],
  [Rocket, 'Release with a war chest', 'Release to every platform, and use the money your fans backed you with to promote it.'],
];
const FAN_STEPS = [
  [Ear, 'Hear it first', 'Go premium and hear songs months before anyone else.'],
  [Star, 'Rate it, debate it', 'Your ratings decide what gets released. Your takes start the debates.'],
  [Crown, 'Back your artist', 'Join fan bases, rep the one you ride for, and climb the supporter ranks.'],
];

function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <SectionTitle eyebrow="How it works" title="Test the hit before the world hears it" center />
      <div className="grid gap-6 md:grid-cols-2">
        {[['For artists', ARTIST_STEPS, Mic2], ['For fans', FAN_STEPS, Users]].map(([label, steps, Icon]) => (
          <motion.div key={label} {...fadeUp} className="rounded-3xl border border-border bg-elevated/60 p-6 sm:p-8">
            <p className="flex items-center gap-2 text-xl font-bold"><Icon className="size-6 text-brand" /> {label}</p>
            <ol className="mt-6 space-y-6">
              {steps.map(([StepIcon, title, text], i) => (
                <li key={title} className="flex gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand"><StepIcon className="size-5" /></span>
                  <div>
                    <p className="font-semibold"><span className="text-muted">{i + 1}.</span> {title}</p>
                    <p className="mt-1 text-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FanBases() {
  const { data } = useArtists({ limit: 8 });
  if (!data?.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <SectionTitle eyebrow="Fan bases" title="Pick a side">
        Every artist has a fan base with its own name. Follow as many as you like, and choose which one you rep in each battle.
      </SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.map((a, i) => (
          <motion.div key={a._id} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.06 }}>
            <Link to={`/a/${a.slug}`} className="group relative block overflow-hidden rounded-3xl border border-border bg-elevated/60 transition hover:-translate-y-1 hover:border-brand/50">
              <div className="relative h-28 overflow-hidden bg-gradient-to-br from-brand-strong to-black">
                {a.banner && <img src={a.banner} alt="" loading="lazy" className="size-full object-cover opacity-80 transition duration-700 group-hover:scale-105" />}
              </div>
              <div className="px-5 pb-5">
                <div className="-mt-10 size-20 overflow-hidden rounded-full border-4 border-bg bg-subtle">
                  {a.avatar ? <img src={a.avatar} alt="" loading="lazy" className="size-full object-cover" /> : <span className="grid size-full place-items-center font-display text-3xl text-muted">{a.name[0]}</span>}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xl font-bold">{a.name}{a.verified && <BadgeCheck className="size-5 text-sky-500" />}</p>
                <p className="text-muted"><span className="font-semibold text-fg">{a.followerCount.toLocaleString()}</span> {a.fanBase.name}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      <div className="mt-8 text-center"><Button asChild variant="outline"><Link to="/artists">See every artist</Link></Button></div>
    </section>
  );
}

// How each bant looks. Names and prices come from the server (lib/pricing.js); this list shows until they load.
const BANT_LOOK = {
  puff: [Wind, 'text-sky-300', 'Puff'],
  fire: [Flame, 'text-orange-400', 'Fire'],
  extinguisher: [FireExtinguisher, 'text-red-400', 'Extinguisher'],
  receipts: [Receipt, 'text-emerald-300', 'Receipts'],
  'smoke-bomb': [Bomb, 'text-violet-300', 'Smoke Bomb'],
  thunder: [Zap, 'text-yellow-300', 'Thunder'],
  diamond: [Gem, 'text-cyan-300', 'Diamond'],
  crown: [Crown, 'text-amber-300', 'Crown'],
};
const DEFAULT_BANTS = Object.entries(BANT_LOOK).map(([id, [, , name]]) => ({ id, name }));

function Smoke() {
  const { data: pricing } = usePricing();
  const bants = pricing?.bants ?? DEFAULT_BANTS;
  const cheapest = pricing?.bants[0]?.priceNgn;
  const dearest = pricing?.bants.at(-1)?.priceNgn;
  return (
    <section className="relative isolate overflow-hidden bg-[#0a0a0b] py-24 text-white sm:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(153,51,255,0.35),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(249,115,22,0.25),transparent_55%)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
        <motion.div {...fadeUp}>
          <p className="text-sm font-semibold tracking-[0.3em] text-orange-400 uppercase">Battles &amp; bants <Soon /></p>
          <h2 className="mt-3 font-display text-5xl leading-none tracking-wide sm:text-7xl">WE BRING THE SMOKE.<br />YOU PAY TO SEE IT.</h2>
          <p className="mt-5 max-w-lg text-lg text-white/75">
            Song vs song. Fan base vs fan base. One vote per fan decides the battle, and paid bants bring the heat.
            {pricing
              ? <> Bants go from {naira(cheapest)} to {naira(dearest)}, and the artist you’re fighting for keeps {pricing.artistKeepsPercent}% of every one.</>
              : <> Most of every bant goes straight to the artist you’re fighting for.</>}
          </p>
          <p className="mt-4 flex items-center gap-2 text-white/60"><Swords className="size-5" /> Healthy smoke only: roast the song, never the person.</p>
        </motion.div>
        <motion.ul {...fadeUp} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {bants.map((b, i) => {
            const [Icon, tint] = BANT_LOOK[b.id] ?? [Flame, 'text-orange-400'];
            return (
              <motion.li
                key={b.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 18 }}
                className="grid place-items-center rounded-3xl border border-white/10 bg-white/5 py-5 text-center backdrop-blur-sm sm:aspect-square sm:py-0"
              >
                <span className="flex flex-col items-center px-1">
                  <Icon className={cn('size-9 drop-shadow-[0_0_12px_currentColor]', tint)} strokeWidth={1.75} aria-hidden />
                  <span className="mt-2 block text-sm font-semibold text-white/80">{b.name}</span>
                  {b.priceNgn && <span className="block text-xs text-white/55 tabular-nums">{naira(b.priceNgn)}</span>}
                </span>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}

const SHIELDS = [
  [ShieldCheck, 'Locked streaming', 'Unreleased songs only play for signed-in premium fans. There’s no file to download.', false],
  [Waves, 'HitVerse preview tag', 'A short spoken tag in test songs makes any leak worth far less.', true],
  [ScanEye, 'Invisible watermark', 'Every stream is marked to the listener’s account, so a leak points straight to the leaker.', true],
  [Radar, 'Leak scanning', 'Test songs are searched for across the internet, with takedowns sent fast.', true],
];

function Protection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <SectionTitle eyebrow="Leak Shield" title="Your unreleased music stays yours" center>
        Testing a song should never cost you the song. HitVerse protects every test release in layers.
      </SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        {SHIELDS.map(([Icon, title, text, soon]) => (
          <motion.div key={title} {...fadeUp} className="flex gap-4 rounded-3xl border border-border bg-elevated/60 p-6">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-500"><Icon className="size-6" /></span>
            <div>
              <p className="text-lg font-bold">{title}{soon && <Soon />}</p>
              <p className="mt-1 text-muted">{text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const PACKAGES = [
  [Disc3, 'Beats', 'Production from HitVerse producers.'],
  [Mic2, 'Recording, mixing & mastering', 'Studio sessions and a radio-ready finish.'],
  [Clapperboard, 'Music videos', 'Concept, shoot and edit.'],
  [ListMusic, 'Playlist placement', 'HitVerse playlists on every platform, updated weekly.'],
  [Megaphone, 'Promotion plans', 'Song of the Week campaigns and social media pushes.'],
  [Flame, 'Road to stardom', 'A step-by-step plan from first release to headline shows.'],
];

function Packages() {
  return (
    <section className="bg-subtle/40 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionTitle eyebrow="Promotion packages" title="Everything between the studio and stardom">
          Packages for every stage, priced for your country and payable with the money your fans back you with. <Soon />
        </SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PACKAGES.map(([Icon, title, text], i) => (
            <motion.div key={title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.05 }} className="rounded-3xl border border-border bg-elevated p-6">
              <Icon className="size-7 text-brand" />
              <p className="mt-4 text-lg font-bold">{title}</p>
              <p className="mt-1 text-muted">{text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  const { user } = useAuth();
  return (
    <section className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
      <motion.div {...fadeUp}>
        <h2 className="font-display text-5xl tracking-wide sm:text-7xl">READY TO BRING THE SMOKE?</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">Artists: apply in a minute and set up your fan base. Fans: join free, then go premium to hear it first.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg"><Link to={user ? '/app/artist' : '/signup'}><Mic2 className="size-5" /> Apply as an artist</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/artists"><Users className="size-5" /> Find your fan base</Link></Button>
        </div>
      </motion.div>
    </section>
  );
}
