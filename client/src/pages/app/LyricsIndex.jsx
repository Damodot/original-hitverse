import { MicVocal } from 'lucide-react';
import { Link } from 'react-router';
import { Page, PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { useSongs } from '@/hooks/useLibrary';

export default function LyricsIndex() {
  const { data, isPending } = useSongs();
  const songs = data?.filter((s) => s.hasLyrics);
  return (
    <Page>
      <PageHeader eyebrow="Sing along" title="Lyrics" subtitle="Every word, every track." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isPending
          ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-20" />)
          : songs.map((s) => (
            <Link key={s._id} to={`/app/lyrics/${s.slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-border p-3 transition hover:border-brand/50 hover:bg-subtle">
              <img src={s.cover} alt="" loading="lazy" className="size-14 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold">{s.title}</p>
                <p className="flex items-center gap-1.5 truncate text-sm text-muted">
                  {s.hasSynced && <span className="rounded bg-brand/15 px-1.5 text-[11px] font-semibold tracking-wide text-brand uppercase">Synced</span>}
                  {s.artist}
                </p>
              </div>
              <MicVocal className="size-5 text-muted transition group-hover:text-brand" />
            </Link>
          ))}
      </div>
    </Page>
  );
}
