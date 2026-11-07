import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { useLocation } from 'react-router';
import SwipeToast from '@/components/ui/SwipeToast';
import { removeToast, subscribe } from '@/lib/toast';

let snapshot = [];
const store = {
  subscribe: (cb) => subscribe((items) => { snapshot = items; cb(); }),
  get: () => snapshot,
};

const ICONS = {
  success: <CircleCheck className="text-emerald-500" />,
  error: <CircleAlert className="text-red-500" />,
  default: <Info className="text-brand" />,
};

/** Stacks toasts in the bottom-right corner, above the player and dock inside the app. Swipe down to dismiss. */
export function Toaster() {
  const items = useSyncExternalStore(store.subscribe, store.get);
  const inApp = useLocation().pathname.startsWith('/app');
  if (!items.length) return null;
  return (
    <div
      aria-label="Notifications"
      className={`pointer-events-none fixed right-4 z-[100] flex w-[min(356px,calc(100vw-2rem))] flex-col sm:right-6 ${inApp ? 'bottom-[calc(10.5rem+env(safe-area-inset-bottom,0px))] md:bottom-[7.5rem]' : 'bottom-4'}`}
    >
      {items.map((t) => (
        <SwipeToast
          key={t.id}
          inline
          open={t.open}
          title={t.title}
          description={t.description}
          icon={ICONS[t.type]}
          actionLabel={t.action?.label}
          onAction={t.action?.onClick}
          onClose={() => removeToast(t.id)}
          duration={t.duration}
          background="var(--toast-bg)"
          color="var(--fg)"
          fuseColor={t.type === 'error' ? '#ef4444' : 'var(--brand)'}
          width={356}
          radius={14}
          closeButton
          className="pointer-events-auto text-[15px] [&_[role=status]]:shadow-xl [&_[role=status]]:ring-1 [&_[role=status]]:ring-border"
        />
      ))}
    </div>
  );
}
