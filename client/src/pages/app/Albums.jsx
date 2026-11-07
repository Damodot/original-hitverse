import { CoverCard } from '@/components/CoverCard';
import { Page, PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useAlbums } from '@/hooks/useLibrary';

export default function Albums() {
  const { data, isPending } = useAlbums();
  return (
    <Page>
      <PageHeader eyebrow="Library" title="Albums" subtitle="EPs and projects" />
      <div className="-mx-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {isPending
          ? Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="m-3 aspect-square" />)
          : data?.map((a) => (
            <CoverCard key={a._id} to={`/app/albums/${a.slug}`} cover={a.cover} title={a.title} subtitle={`${a.type} · ${a.trackCount} tracks`} />
          ))}
      </div>
    </Page>
  );
}
