import { Crown, Disc3, Heart, House, ListMusic, LogOut, MicVocal, Moon, Radio, ShieldCheck, Sun, Upload, Users } from 'lucide-react';
import { Suspense } from 'react';
import { Link, matchPath, Outlet, useLocation, useNavigate } from 'react-router';
import { LogoMark, Logo } from '@/components/Logo';
import { NowPlaying } from '@/components/player/NowPlaying';
import { PlayerBar } from '@/components/player/PlayerBar';
import Dock from '@/components/ui/Dock';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useAdminArtists } from '@/hooks/useArtist';
import { useLiveRooms } from '@/hooks/useLive';
import { NotificationBell } from './NotificationBell';

const NAV = [
  { to: '/app', label: 'Home', icon: House, end: true },
  { to: '/app/songs', label: 'Songs', icon: ListMusic },
  { to: '/app/albums', label: 'Albums', icon: Disc3 },
  { to: '/app/liked', label: 'Liked', icon: Heart },
  { to: '/app/lyrics', label: 'Lyrics', icon: MicVocal },
  { to: '/app/artists', label: 'Fan bases', icon: Users },
];

/** Links for the artist upload page and, for admins, the review page (with the number of waiting requests). */
function useCreatorLinks() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const pending = useAdminArtists('pending', { enabled: isAdmin }).data?.counts?.pending ?? 0;
  const links = [{ to: '/app/artist', label: user?.canUpload ? 'Upload music' : 'Become an artist', icon: Upload }];
  if (isAdmin) links.push({ to: '/app/admin', label: 'Admin', icon: ShieldCheck, badge: pending });
  return links;
}

export default function AppLayout() {
  return (
    <div className="grid h-dvh grid-cols-1 grid-rows-[auto_1fr_auto]">
      <TopBar />
      {/* The dock floats over the bottom of the page, so the page scrolls underneath its glass. */}
      <div className="relative min-h-0 min-w-0">
        <main id="main" className="h-full overflow-y-auto pb-28">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
        <AppDock />
      </div>
      <div className="z-30">
        <PlayerBar />
      </div>
      <NowPlaying />
    </div>
  );
}

function TopBar() {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-border bg-bg/80 px-4 py-2.5 backdrop-blur-xl sm:px-6">
      <Link to="/app" aria-label="HitVerse home"><Logo className="h-6 sm:h-7" /></Link>
      <div className="flex items-center gap-1 sm:gap-2">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}

function AppDock() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme } = useTheme();
  const creator = useCreatorLinks();
  const toItem = ({ to, label, icon: Icon, end, badge }) => {
    const active = !!matchPath({ path: to, end: !!end }, pathname);
    return {
      label,
      icon: <Icon className="size-[1em]" strokeWidth={2} />,
      onClick: () => navigate(to),
      active,
      badge: badge || undefined,
      className: active ? '[&_svg]:text-brand' : undefined,
    };
  };
  // Live rooms, with a badge while a room you're in is live.
  const liveNow = useLiveRooms().data?.filter((r) => r.status === 'live').length ?? 0;
  const live = { to: '/app/live', label: 'Live', icon: Radio, badge: liveNow };
  const items = [...NAV.map(toItem), toItem(live), { separator: true }, ...creator.map(toItem)];

  return (
    <nav aria-label="Main" className="pointer-events-none absolute inset-x-0 bottom-0 h-24">
      <Dock
        items={items}
        theme={theme === 'dark' ? 'dark' : 'light'}
        baseItemSize={48}
        magnification={68}
        panelHeight={64}
        gap={8}
        accentColor="#9933ff"
        badgeColor="#9933ff"
        className="pointer-events-auto"
      />
    </nav>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  if (!user) return null;
  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Account" className="cursor-pointer rounded-full p-0.5 transition hover:ring-2 hover:ring-brand/40">
          <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-brand to-fuchsia-500 text-sm font-bold text-white">{initials}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <span className="block truncate">{user.firstName} {user.lastName}</span>
          <span className="block truncate text-xs font-normal text-muted">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); toggle(); }}>
          {theme === 'dark' ? <Sun /> : <Moon />} {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/app/premium"><Crown className="!text-amber-500" /> {user.premium?.active ? 'Premium' : 'Get Premium'}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/"><LogoMark className="size-4" /> HitVerse home</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => logout.mutate(undefined, { onSuccess: () => navigate('/') })}>
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-56" />
      <Skeleton className="h-16" />
      <Skeleton className="h-16" />
    </div>
  );
}
