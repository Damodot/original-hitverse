import { cn } from '@/lib/utils';

/**
 * The HitVerse wordmark. `tone="light"` is for dark backgrounds (white "HIT"),
 * `tone="dark"` for light ones; `auto` follows the theme.
 */
export function Logo({ className, tone = 'auto' }) {
  const common = { alt: 'HitVerse', width: 800, height: 165, draggable: false };
  const cls = cn('h-7 w-auto select-none', className);
  if (tone === 'light') return <img src="/media/img/logo-wordmark.webp" className={cls} {...common} />;
  if (tone === 'dark') return <img src="/media/img/logo-wordmark-dark.webp" className={cls} {...common} />;
  return (
    <>
      <img src="/media/img/logo-wordmark-dark.webp" className={cn(cls, 'dark:hidden')} {...common} />
      <img src="/media/img/logo-wordmark.webp" className={cn(cls, 'hidden dark:block')} {...common} />
    </>
  );
}

export function LogoMark({ className }) {
  return <img src="/media/img/logo-mark.webp" alt="" width={64} height={64} className={cn('size-8 rounded-full', className)} />;
}
