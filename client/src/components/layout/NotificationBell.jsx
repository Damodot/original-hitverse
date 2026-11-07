import * as Popover from '@radix-ui/react-popover';
import { BadgeCheck, BellOff, BellRing, CircleX, Crown, Inbox, Mic, Music2, Radio, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import BellToggle from '@/components/ui/BellToggle';
import { useMarkRead, useNotifications } from '@/hooks/useNotifications';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

const ICONS = { application: UserPlus, approved: BadgeCheck, rejected: CircleX, 'song-removed': Music2, karaoke: Mic, live: Radio, premium: Crown };
const PREF = 'hv-alerts';

function readPref() {
  try {
    return localStorage.getItem(PREF) !== 'off';
  } catch {
    return true;
  }
}

function timeAgo(date) {
  const s = Math.round((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/**
 * The bell (React Bits' BellToggle). Lit = alerts on: it shows the unread count and rings when something new
 * arrives, with a toast. Clicking it opens the list; the switch at the bottom turns alerts off or on.
 */
export function NotificationBell() {
  const { data } = useNotifications();
  const markRead = useMarkRead();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState(readPref);
  const anchorRef = useRef(null);
  const seen = useRef(null);
  const unread = data?.unread ?? 0;

  // Toast anything that arrived since the last check (not the backlog on first load).
  useEffect(() => {
    if (!data) return;
    if (seen.current && alerts) {
      for (const n of data.items) {
        if (!n.read && !seen.current.has(n._id)) {
          toast(n.title, {
            id: `n-${n._id}`,
            description: n.body,
            action: n.link ? { label: 'View', onClick: () => navigate(n.link) } : undefined,
          });
        }
      }
    }
    seen.current = new Set(data.items.map((n) => n._id));
  }, [data, alerts, navigate]);

  const setAlertPref = (on) => {
    setAlerts(on);
    try {
      localStorage.setItem(PREF, on ? 'on' : 'off');
    } catch {
      // Private mode: the choice lasts for this visit only.
    }
  };

  const onOpenChange = (next) => {
    setOpen(next);
    // Unread items stay highlighted while the list is open, then count as read.
    if (!next && unread) markRead.mutate(undefined);
  };

  const go = (n) => {
    if (!n.read) markRead.mutate([n._id]);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Anchor asChild>
        <span ref={anchorRef} className="inline-flex">
          <BellToggle
            pressed={alerts}
            onChange={() => onOpenChange(!open)}
            count={unread}
            offLabel=""
            onLabel=""
            label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
            size="sm"
            radius={18}
            color="var(--muted)"
            background="transparent"
            onColor="var(--fg)"
            onBackground="color-mix(in srgb, var(--fg) 8%, transparent)"
            badgeColor="var(--brand)"
          />
        </span>
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={10}
          collisionPadding={12}
          onInteractOutside={(e) => anchorRef.current?.contains(e.target) && e.preventDefault()}
          className="z-50 flex max-h-[min(32rem,calc(100dvh-6rem))] w-[min(23rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-elevated text-fg shadow-2xl outline-none"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-lg font-bold">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={() => markRead.mutate(undefined)} className="cursor-pointer text-sm font-semibold text-brand hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {!data?.items.length ? (
              <div className="grid place-items-center px-6 py-12 text-center text-muted">
                <Inbox className="mb-2 size-7" />
                You’re all caught up.
              </div>
            ) : (
              <ul>
                {data.items.map((n) => {
                  const Icon = ICONS[n.type] ?? BellRing;
                  return (
                    <li key={n._id}>
                      <button
                        type="button"
                        onClick={() => go(n)}
                        className={cn('flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition hover:bg-subtle', !n.read && 'bg-brand/[0.07]')}
                      >
                        <span className={cn('mt-0.5 grid size-9 shrink-0 place-items-center rounded-full', n.type === 'rejected' || n.type === 'song-removed' ? 'bg-red-500/10 text-red-500' : 'bg-brand/15 text-brand')}>
                          <Icon className="size-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold leading-snug">{n.title}</span>
                          {n.body && <span className="mt-0.5 line-clamp-2 block text-sm text-muted">{n.body}</span>}
                          <span className="mt-1 block text-xs text-muted">{timeAgo(n.createdAt)}</span>
                        </span>
                        {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
            <span className="flex items-center gap-2">
              {alerts ? <BellRing className="size-4 text-brand" /> : <BellOff className="size-4 text-muted" />}
              {alerts ? 'Alerts on: the bell rings for new ones' : 'Alerts off: the bell stays quiet'}
            </span>
            <input type="checkbox" role="switch" checked={alerts} onChange={(e) => setAlertPref(e.target.checked)} className="peer sr-only" />
            <span aria-hidden className="relative h-6 w-10 shrink-0 rounded-full bg-border transition peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-4" />
          </label>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
