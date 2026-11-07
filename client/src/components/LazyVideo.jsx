import { useEffect, useRef, useState } from 'react';

/** Background video that only downloads once it nears the screen, and pauses when off screen. */
export function LazyVideo({ src, poster, className, eager = false }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        el.play?.().catch(() => {});
      } else {
        el.pause?.();
      }
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      poster={poster}
      src={visible ? src : undefined}
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
    />
  );
}
