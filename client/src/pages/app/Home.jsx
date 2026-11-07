import { Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { CoverCard } from '@/components/CoverCard';
import { Page, PlayAllButtons } from '@/components/layout/PageHeader';
import { TrackList } from '@/components/player/TrackList';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { useAlbums, useSongs } from '@/hooks/useLibrary';

export default function Home() {
  const { user } = useAuth();
  const rep = user?.repping;
  const songs = useSongs();
  const albums = useAlbums();
  const { current, isPlaying, playList, playSong } = usePlayer();
  const singles = songs.data?.filter((s) => !s.album && !s.uploader) ?? [];
  const fresh = songs.data?.filter((s) => s.uploader).reverse().slice(0, 10) ?? [];

  const playAlbum = (album) => {
    const tracks = songs.data?.filter((s) => s.album === album._id).sort((a, b) => a.trackNumber - b.trackNumber) ?? [];
    if (tracks.some((t) => t._id === current?._id)) return playSong(current, tracks);
    playList(tracks, 0);
  };

  return (
    <Page>
      {/* Welcome banner */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative isolate overflow-hidden rounded-3xl bg-[#0a0a0b] text-white shadow-2xl"
      >
        {/* Greets fans as a member of the fan base they rep. */}
        {(rep?.avatar || rep?.banner) && (
          <img
            src={rep.avatar || rep.banner}
            alt=""
            className="absolute inset-y-0 right-0 -z-10 h-full w-3/5 object-cover [mask-image:linear-gradient(to_right,transparent,black_60%)]"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,rgba(153,51,255,0.45),transparent_60%)]" />
        <div className="p-7 sm:p-10">
          <p className="font-display text-2xl tracking-wide text-[#b06bff] sm:text-3xl">HELLO {user?.firstName?.toUpperCase()}</p>
          <h1 className="mt-1 max-w-md font-display text-4xl leading-tight sm:text-6xl">
            {rep ? `WELCOME BACK, ${rep.fanBase.member.toUpperCase()}` : 'WELCOME TO HITVERSE'}
          </h1>
          <p className="mt-2 max-w-md font-display text-lg tracking-wide text-white/70 sm:text-xl">
            {rep ? rep.welcome.toUpperCase() : 'JOIN A FAN BASE AND PICK YOUR SIDE'}
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            <PlayAllButtons songs={songs.data} />
            <Button asChild variant="glass">
              <Link to={rep ? `/a/${rep.slug}` : '/app/artists'}><Flame className="size-4" /> {rep ? `The ${rep.fanBase.name}` : 'Find your fan base'}</Link>
            </Button>
          </div>
        </div>
      </motion.section>

      <Section title="EPs" to="/app/albums">
        <Grid loading={albums.isPending}>
          {albums.data?.map((a) => (
            <CoverCard
              key={a._id}
              to={`/app/albums/${a.slug}`}
              cover={a.cover}
              title={a.title}
              subtitle={`${a.type} · ${a.trackCount} tracks`}
              onPlay={() => playAlbum(a)}
              playing={isPlaying && current?.album === a._id}
            />
          ))}
        </Grid>
      </Section>

      <Section title="Singles & mixes" to="/app/songs">
        <Grid loading={songs.isPending}>
          {singles.map((s) => (
            <CoverCard
              key={s._id}
              to={`/app/lyrics/${s.slug}`}
              cover={s.cover}
              title={s.title}
              subtitle={s.artist}
              onPlay={() => playSong(s, singles)}
              playing={isPlaying && current?._id === s._id}
            />
          ))}
        </Grid>
      </Section>

      {fresh.length > 0 && (
        <Section title="New from artists" to="/app/songs">
          <Grid>
            {fresh.map((s) => (
              <CoverCard
                key={s._id}
                to={s.hasLyrics ? `/app/lyrics/${s.slug}` : '/app/songs'}
                cover={s.cover}
                title={s.title}
                subtitle={s.artist}
                onPlay={() => playSong(s, fresh)}
                playing={isPlaying && current?._id === s._id}
              />
            ))}
          </Grid>
        </Section>
      )}

      <Section title="All tracks" to="/app/songs">
        <TrackList songs={songs.data?.slice(0, 6)} loading={songs.isPending} />
      </Section>
    </Page>
  );
}

function Section({ title, to, children }) {
  return (
    <section className="mt-12">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link to={to} className="text-sm font-semibold text-muted hover:text-fg">See all</Link>
      </div>
      {children}
    </section>
  );
}

function Grid({ loading, children }) {
  return (
    <div className="-mx-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {loading ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="m-3 aspect-square" />) : children}
    </div>
  );
}
