import { Flame } from 'lucide-react';
import { ArtistGrid } from '@/components/ArtistGrid';
import { Page, PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useArtists } from '@/hooks/useArtists';

/** Your fan bases (switch which one you rep) and every other artist to discover. */
export default function FanBases() {
  const { user } = useAuth();
  const { data, isPending } = useArtists({ limit: 100 });
  const mine = data?.filter((a) => a.isFollowing) ?? [];
  const others = data?.filter((a) => !a.isFollowing) ?? [];
  return (
    <Page>
      <PageHeader
        eyebrow="Fan bases"
        title="Pick your side"
        subtitle={user?.repping ? `You’re repping the ${user.repping.fanBase.name}. Switch any time.` : 'Join fan bases, then choose which one you rep.'}
      />
      {(isPending || mine.length > 0) && (
        <section className="mb-12">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold"><Flame className="size-6 text-orange-500" /> Your fan bases</h2>
          <ArtistGrid artists={mine} loading={isPending} />
        </section>
      )}
      <section>
        <h2 className="mb-4 text-2xl font-bold">{mine.length ? 'Discover more' : 'Artists on HitVerse'}</h2>
        <ArtistGrid artists={others} loading={isPending} empty={<p className="text-muted">You’ve joined every fan base on HitVerse.</p>} />
      </section>
    </Page>
  );
}
