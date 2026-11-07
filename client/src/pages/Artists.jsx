import { Users } from 'lucide-react';
import { SiteFooter, SiteNav } from '@/components/site/SiteNav';
import { ArtistGrid } from '@/components/ArtistGrid';
import { useArtists } from '@/hooks/useArtists';

/** Public directory of every artist and their fan base. */
export default function Artists() {
  const { data, isPending } = useArtists({ limit: 100 });
  return (
    <div className="min-h-dvh overflow-x-clip">
      <SiteNav />
      <div className="relative isolate bg-[#0a0a0b] pt-32 pb-16 text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(153,51,255,0.4),transparent_65%)]" />
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-sm font-semibold tracking-[0.3em] text-brand uppercase">Artists</p>
          <h1 className="mt-2 font-display text-5xl tracking-wide sm:text-7xl">FIND YOUR FAN BASE</h1>
          <p className="mt-3 max-w-xl text-lg text-white/75">Join as many fan bases as you like. Rep the one you ride for.</p>
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <ArtistGrid artists={data} loading={isPending} empty={<p className="py-16 text-center text-muted"><Users className="mx-auto mb-2 size-8" />No artists yet.</p>} />
      </main>
      <SiteFooter />
    </div>
  );
}
