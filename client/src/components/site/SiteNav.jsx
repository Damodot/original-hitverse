import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

/** Top bar for the public pages (HitVerse landing, artist pages). Turns solid once you scroll. */
export function SiteNav({ left }) {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className={cn('fixed inset-x-0 top-0 z-40 transition-colors duration-300', scrolled && 'border-b border-white/10 bg-black/60 backdrop-blur-xl')}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {left ?? (
            <Button asChild variant="glass" size="sm" className="hidden sm:inline-flex"><Link to="/artists">Artists</Link></Button>
          )}
        </div>
        <Link to="/" className="absolute left-1/2 -translate-x-1/2" aria-label="HitVerse home">
          <Logo tone="light" className="h-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:h-8" />
        </Link>
        <div className="flex items-center gap-2">
          {user ? (
            <Button asChild variant="glass" size="sm"><Link to="/app">Open app</Link></Button>
          ) : (
            <>
              <Button asChild variant="glass" size="sm" className="hidden sm:inline-flex"><Link to="/login">Login</Link></Button>
              <Button asChild size="sm"><Link to="/signup">Sign up</Link></Button>
            </>
          )}
          <ThemeToggle className="hidden sm:inline-flex" />
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter({ children }) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
        <Logo className="h-7" />
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-muted">
          <Link to="/" className="hover:text-fg">HitVerse</Link>
          <Link to="/artists" className="hover:text-fg">Artists</Link>
          <Link to="/signup" className="hover:text-fg">Join</Link>
          <Link to="/login" className="hover:text-fg">Login</Link>
        </nav>
        {children}
      </div>
      <p className="pb-8 text-center text-sm text-muted">© {new Date().getFullYear()} HitVerse · Bringing smoke to music</p>
    </footer>
  );
}
