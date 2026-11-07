import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import { LogoMark } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import Landing from '@/pages/Landing';

// Each screen is its own chunk, so the landing page doesn't download the player.
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Listen = lazy(() => import('@/pages/Listen'));
const ArtistPage = lazy(() => import('@/pages/ArtistPage'));
const Artists = lazy(() => import('@/pages/Artists'));
const FanBases = lazy(() => import('@/pages/app/FanBases'));
const ProfileEditor = lazy(() => import('@/pages/app/ProfileEditor'));
const AppShell = lazy(() => import('@/pages/app/AppShell'));
const Home = lazy(() => import('@/pages/app/Home'));
const Songs = lazy(() => import('@/pages/app/Songs'));
const Albums = lazy(() => import('@/pages/app/Albums'));
const AlbumDetail = lazy(() => import('@/pages/app/AlbumDetail'));
const Liked = lazy(() => import('@/pages/app/Liked'));
const LyricsIndex = lazy(() => import('@/pages/app/LyricsIndex'));
const Lyrics = lazy(() => import('@/pages/app/Lyrics'));
const Artist = lazy(() => import('@/pages/app/Artist'));
const Admin = lazy(() => import('@/pages/app/Admin'));
const Live = lazy(() => import('@/pages/app/Live'));
const Premium = lazy(() => import('@/pages/app/Premium'));
const LiveRoom = lazy(() => import('@/pages/app/LiveRoom'));

function Splash() {
  return (
    <div className="grid h-dvh place-items-center">
      <LogoMark className="size-16 animate-pulse" />
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

// The server checks roles on every request too; this only keeps non-admins off a page that would 403.
function AdminOnly({ children }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/app" replace />;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  // Signing in flips `user` before the login page's own redirect runs, so send people back to where they were here.
  return user ? <Navigate to={location.state?.from ?? '/app'} replace /> : children;
}

export default function App() {
  return (
    <Suspense fallback={<Splash />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/listen/:slug" element={<Listen />} />
        <Route path="/a/:slug" element={<ArtistPage />} />
        <Route path="/artists" element={<Artists />} />
        <Route path="/app" element={<RequireAuth><AppShell /></RequireAuth>}>
          <Route index element={<Home />} />
          <Route path="songs" element={<Songs />} />
          <Route path="albums" element={<Albums />} />
          <Route path="albums/:slug" element={<AlbumDetail />} />
          <Route path="liked" element={<Liked />} />
          <Route path="lyrics" element={<LyricsIndex />} />
          <Route path="lyrics/:slug" element={<Lyrics />} />
          <Route path="artist" element={<Artist />} />
          <Route path="live" element={<Live />} />
          <Route path="premium" element={<Premium />} />
          <Route path="live/:id" element={<LiveRoom />} />
          <Route path="artists" element={<FanBases />} />
          <Route path="profile/:slug" element={<ProfileEditor />} />
          <Route path="admin" element={<AdminOnly><Admin /></AdminOnly>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
