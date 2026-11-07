import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { LazyVideo } from '@/components/LazyVideo';
import { Logo } from '@/components/Logo';

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <LazyVideo
        eager
        src="/media/video/auth-bg.mp4"
        poster="/media/img/auth-bg-poster.webp"
        className="fixed inset-0 -z-20 size-full object-cover"
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-black/70 via-black/50 to-brand/30" />

      <Link to="/" className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white">
        <ArrowLeft className="size-4" /> Home
      </Link>

      <motion.main
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md rounded-3xl border border-white/15 bg-bg/80 p-7 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-9"
      >
        <Link to="/" className="mx-auto block w-fit"><Logo className="h-8" /></Link>
        <h1 className="mt-6 text-center font-display text-4xl tracking-wide">{title}</h1>
        {subtitle && <p className="mt-2 text-center text-muted">{subtitle}</p>}
        <div className="mt-7">{children}</div>
        {footer && <div className="mt-7 border-t border-border pt-5 text-center text-muted">{footer}</div>}
      </motion.main>
    </div>
  );
}

export const AuthLink = (props) => <Link className="font-semibold text-brand hover:underline" {...props} />;
