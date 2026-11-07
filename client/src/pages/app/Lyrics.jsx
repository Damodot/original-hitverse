import { ArrowLeft, Pause, Play } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Page } from '@/components/layout/PageHeader';
import { LikeButton } from '@/components/player/LikeButton';
import { SongCredits } from '@/components/player/SongCredits';
import { SyncedLyrics } from '@/components/player/SyncedLyrics';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlayer } from '@/context/PlayerContext';
import { useLyrics, useSongs } from '@/hooks/useLibrary';

export default function Lyrics() {
  const { slug } = useParams();
  const { data, isPending, isError } = useLyrics(slug);
  const songs = useSongs();
  const { current, isPlaying, playSong } = usePlayer();
  const song = songs.data?.find((s) => s.slug === slug);
  const active = current?._id === song?._id;

  if (isError) return <Page><p className="py-20 text-center text-muted">Song not found.</p></Page>;

  return (
    <div className="relative isolate">
      {song && <img src={song.cover} alt="" className="fixed inset-0 -z-10 size-full scale-125 object-cover opacity-20 blur-3xl" />}
      <Page>
        <Link to="/app/lyrics" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg">
          <ArrowLeft className="size-4" /> All lyrics
        </Link>
        <header className="flex flex-col items-center gap-5 text-center">
          {song ? <img src={song.cover} alt="" className="size-40 rounded-2xl object-cover shadow-2xl" /> : <Skeleton className="size-40 rounded-2xl" />}
          <div>
            <h1 className="font-display text-5xl tracking-wide sm:text-6xl">{data?.title ?? song?.title ?? ' '}</h1>
            <p className="mt-1 text-muted">{song?.artist}</p>
          </div>
          {song && (
            <div className="flex items-center gap-2">
              <Button onClick={() => playSong(song, songs.data)}>
                {active && isPlaying ? <><Pause className="size-4 fill-current" /> Pause</> : <><Play className="size-4 fill-current" /> Play</>}
              </Button>
              <LikeButton song={song} className="size-11" />
            </div>
          )}
        </header>
        {data?.synced?.length > 0 && song && (
          <div className="mx-auto mt-12 max-w-2xl">
            <p className="mb-4 text-center text-sm font-semibold text-muted">
              <span className="rounded-full bg-brand/15 px-2.5 py-1 text-brand">Synced</span>{' '}
              {active ? 'Following along. Tap a line to jump to it.' : 'Press Play and the lyrics follow the song.'}
            </p>
            <SyncedLyrics song={song} synced={data.synced} credits={data.credits} size="md" />
          </div>
        )}
        <div className={data?.synced?.length ? 'hidden' : 'mx-auto mt-12 max-w-2xl space-y-3 text-center text-xl leading-snug font-semibold sm:text-2xl'}>
          {isPending
            ? Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="mx-auto h-7 w-3/4" />)
            : data.lyrics.length
              ? data.lyrics.map((line, i) => <p key={i}>{line}</p>)
              : <p className="text-muted">No lyrics for this track yet.</p>}
          {!isPending && <SongCredits credits={data.credits} className="text-base font-normal" />}
        </div>
      </Page>
    </div>
  );
}
