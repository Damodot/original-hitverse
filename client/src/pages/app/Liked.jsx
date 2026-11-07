import { Heart } from 'lucide-react';
import { Link } from 'react-router';
import { Page, PageHeader, PlayAllButtons } from '@/components/layout/PageHeader';
import { TrackList } from '@/components/player/TrackList';
import { Button } from '@/components/ui/button';
import { useLikedSongs } from '@/hooks/useLibrary';

export default function Liked() {
  const { data, isPending } = useLikedSongs();
  return (
    <Page>
      <PageHeader eyebrow="Favourites" title="Liked songs" subtitle={data ? `${data.length} ${data.length === 1 ? 'song' : 'songs'}` : ' '}>
        <PlayAllButtons songs={data} />
      </PageHeader>
      <TrackList
        songs={data}
        loading={isPending}
        numbered={false}
        empty={
          <div className="grid place-items-center rounded-3xl border border-dashed border-border py-16 text-center">
            <Heart className="size-10 text-brand" />
            <p className="mt-4 text-xl font-semibold">You haven’t liked any songs yet</p>
            <p className="mt-1 text-muted">Tap the heart on any track to save it here.</p>
            <Button asChild className="mt-6"><Link to="/app/songs">Browse songs</Link></Button>
          </div>
        }
      />
    </Page>
  );
}
