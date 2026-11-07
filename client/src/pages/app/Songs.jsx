import { Search } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Page, PageHeader, PlayAllButtons } from '@/components/layout/PageHeader';
import { TrackList } from '@/components/player/TrackList';
import { Input } from '@/components/ui/input';
import { useSongs } from '@/hooks/useLibrary';
import { formatTotal } from '@/lib/utils';

export default function Songs() {
  const { data, isPending } = useSongs();
  const [params] = useSearchParams();
  // Song pages link here with ?q=<title> so the song is ready to play.
  const [q, setQ] = useState(() => params.get('q') ?? '');
  const query = useDeferredValue(q.trim().toLowerCase());
  const songs = useMemo(
    () => (query ? data?.filter((s) => `${s.title} ${s.artist}`.toLowerCase().includes(query)) : data),
    [data, query],
  );
  const total = data?.reduce((n, s) => n + (s.duration || 0), 0) ?? 0;

  return (
    <Page>
      <PageHeader eyebrow="Library" title="Songs" subtitle={data ? `${data.length} tracks · ${formatTotal(total)}` : ' '}>
        <PlayAllButtons songs={songs} />
      </PageHeader>
      <div className="relative mb-6 max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search songs" className="pl-12" aria-label="Search songs" type="search" />
      </div>
      <TrackList
        songs={songs}
        loading={isPending}
        numbered={false}
        empty={<p className="py-10 text-center text-muted">No songs match “{q}”.</p>}
      />
    </Page>
  );
}
