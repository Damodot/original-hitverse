import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Page, PlayAllButtons } from '@/components/layout/PageHeader';
import { TrackList } from '@/components/player/TrackList';
import { Skeleton } from '@/components/ui/skeleton';
import { useAlbum } from '@/hooks/useLibrary';
import { formatTotal } from '@/lib/utils';

export default function AlbumDetail() {
  const { slug } = useParams();
  const { data, isPending, isError } = useAlbum(slug);
  if (isError) return <Page><p className="py-20 text-center text-muted">Album not found.</p></Page>;
  const total = data?.songs.reduce((n, s) => n + (s.duration || 0), 0) ?? 0;

  return (
    <div>
      <div className="relative isolate overflow-hidden">
        {data && <img src={data.album.cover} alt="" className="absolute inset-0 -z-10 size-full scale-125 object-cover opacity-50 blur-3xl" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-bg" />
        <Page>
          <Link to="/app/albums" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg">
            <ArrowLeft className="size-4" /> Albums
          </Link>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            {isPending ? <Skeleton className="size-52 shrink-0 rounded-2xl" /> : (
              <img src={data.album.cover} alt={`${data.album.title} cover`} className="size-52 shrink-0 rounded-2xl object-cover shadow-2xl shadow-black/40 sm:size-60" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-[0.25em] text-brand uppercase">{data?.album.type ?? 'EP'}</p>
              <h1 className="mt-1 font-display text-5xl tracking-wide sm:text-7xl">{data?.album.title ?? ' '}</h1>
              {data && <p className="mt-2 text-muted">{data.album.artist} · {data.songs.length} tracks · {formatTotal(total)}</p>}
              <div className="mt-5"><PlayAllButtons songs={data?.songs} /></div>
            </div>
          </div>
        </Page>
      </div>
      <Page>
        <TrackList songs={data?.songs} loading={isPending} showCover={false} />
      </Page>
    </div>
  );
}
