import { BadgeCheck, Check, Flame, Users } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { useFollow, useRep } from '@/hooks/useArtists';
import { cn } from '@/lib/utils';

/** Artist cards with Join / Rep buttons. `inApp` links stay inside the app shell. */
export function ArtistGrid({ artists, loading, empty, className }) {
  if (loading) return <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}</div>;
  if (!artists?.length) return empty ?? null;
  return (
    <ul className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {artists.map((a) => <ArtistCard key={a._id} artist={a} />)}
    </ul>
  );
}

function ArtistCard({ artist: a }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const follow = useFollow();
  const rep = useRep();
  const join = () => {
    if (!user) return navigate('/signup', { state: { from: `/a/${a.slug}?join=1` } });
    follow.mutate({ artist: a, follow: true });
  };
  return (
    <li className={cn('overflow-hidden rounded-3xl border bg-elevated/60 transition', a.isRepping ? 'border-orange-500/60 shadow-lg shadow-orange-500/10' : 'border-border')}>
      <Link to={`/a/${a.slug}`} state={{ from: location.pathname }} className="group block">
        <div className="relative h-28 overflow-hidden bg-gradient-to-br from-brand-strong to-black">
          {a.banner && <img src={a.banner} alt="" loading="lazy" className="size-full object-cover opacity-80 transition duration-700 group-hover:scale-105" />}
          {a.isRepping && <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-orange-300 backdrop-blur-md"><Flame className="size-3.5" /> Repping</span>}
        </div>
        <div className="px-5">
          <div className="-mt-10 size-20 overflow-hidden rounded-full border-4 border-bg bg-subtle">
            {a.avatar ? <img src={a.avatar} alt="" loading="lazy" className="size-full object-cover" /> : <span className="grid size-full place-items-center font-display text-3xl text-muted">{a.name[0]}</span>}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xl font-bold">{a.name}{a.verified && <BadgeCheck className="size-5 text-sky-500" aria-label="Verified" />}</p>
          <p className="text-muted"><span className="font-semibold text-fg">{a.followerCount.toLocaleString()}</span> {a.followerCount === 1 ? a.fanBase.member : a.fanBase.name}{a.genre ? ` · ${a.genre}` : ''}</p>
        </div>
      </Link>
      <div className="flex flex-wrap gap-2 p-5 pt-4">
        {!a.isFollowing ? (
          <Button size="sm" onClick={join} loading={follow.isPending}><Users className="size-4" /> Join the {a.fanBase.name}</Button>
        ) : (
          <>
            {!a.isRepping && <Button size="sm" onClick={() => rep.mutate({ artist: a })} loading={rep.isPending}><Flame className="size-4" /> Rep them</Button>}
            <Button size="sm" variant="secondary" onClick={() => follow.mutate({ artist: a, follow: false })} loading={follow.isPending} title={`Leave the ${a.fanBase.name}`}>
              <Check className="size-4" /> Joined
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
