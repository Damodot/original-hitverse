import { CalendarCheck, Check, Crown, Disc3, Ear, Mic, Swords } from 'lucide-react';
import { Page, PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { naira, usePremiumPlans } from '@/hooks/usePremium';
import { cn } from '@/lib/utils';

const PERKS = [
  [Mic, 'Karaoke on any song', 'Take the vocals off and sing it yourself, with the lyrics on screen.', false],
  [Disc3, 'DJ mode', 'Every song blends into the next, tempo matched and beat on beat.', false],
  [Ear, 'Hear unreleased songs first', 'Rate artists’ test releases before the world hears them.', true],
  [Swords, 'Battles and bants', 'Back your fan base when songs go head to head.', true],
];

const LENGTHS = {
  weekly: { per: 'week', lasts: 'a week' },
  monthly: { per: 'month', lasts: 'a month' },
  yearly: { per: 'year', lasts: 'a full year' },
};

const fmt = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

/** What Premium gets you, the plans, and your own status. */
export default function Premium() {
  const { user } = useAuth();
  const { data: plans, isPending } = usePremiumPlans();
  const mine = user?.premium;
  const admin = user?.role === 'admin';

  return (
    <Page>
      <PageHeader eyebrow="Premium" title="HitVerse Premium" subtitle="Karaoke and DJ mode on every song, by the week, month or year." />

      {(mine?.active || admin) && (
        <div className="mb-8 flex items-center gap-4 rounded-3xl border border-amber-400/40 bg-amber-400/10 p-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-400 text-black"><Crown className="size-6" /></span>
          <div>
            <p className="text-lg font-bold">{admin && !mine?.active ? 'Admins have every Premium feature' : 'You’re on Premium'}</p>
            {mine?.active && <p className="text-muted">Until {fmt(mine.until)}{mine.plan === 'gift' ? ' · a gift from HitVerse' : ''}</p>}
          </div>
        </div>
      )}
      {!mine?.active && mine?.until && !admin && (
        <p className="mb-8 rounded-2xl bg-subtle px-4 py-3 text-muted">Your Premium ended on {fmt(mine.until)}.</p>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        {PERKS.map(([Icon, title, text, soon]) => (
          <div key={title} className={cn('flex gap-4 rounded-3xl border border-border bg-elevated/60 p-5', soon && 'opacity-70')}>
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand"><Icon className="size-5" /></span>
            <span>
              <span className="flex items-center gap-2 font-bold">{title}
                {soon && <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-semibold text-brand">Coming soon</span>}
              </span>
              <span className="mt-1 block text-sm text-muted">{text}</span>
            </span>
          </div>
        ))}
      </section>

      <h2 className="mt-12 mb-4 text-2xl font-bold">Plans</h2>
      {isPending ? (
        <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-52" />)}</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {plans?.map((p) => {
            const length = LENGTHS[p.id] ?? { per: `${p.days} days`, lasts: `${p.days} days` };
            const monthly = plans.find((x) => x.id === 'monthly')?.priceNgn;
            const saving = p.id === 'yearly' && monthly ? Math.round((1 - p.priceNgn / (monthly * 12)) * 100) : 0;
            return (
              <div key={p.id} className={cn('flex flex-col rounded-3xl border p-6', p.id === 'yearly' ? 'border-brand/50 bg-brand/5' : 'border-border bg-elevated/60')}>
                <p className="flex items-center gap-2 text-lg font-bold">
                  <CalendarCheck className="size-5 text-brand" /> {p.name}
                  {saving > 0 && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Save {saving}%</span>}
                </p>
                <p className="mt-3 font-display text-4xl tracking-wide">
                  {naira(p.priceNgn)}<span className="ml-1 font-sans text-base font-normal text-muted">/ {length.per}</span>
                </p>
                <ul className="mt-4 space-y-1.5 text-sm text-muted">
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-500" /> Karaoke and DJ mode</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-500" /> Lasts {length.lasts}, then you choose to renew</li>
                </ul>
                <Button className="mt-6" disabled>Pay with card or bank transfer</Button>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-4 text-sm text-muted">Payments open soon. Until then, HitVerse can switch Premium on for you.</p>
    </Page>
  );
}
