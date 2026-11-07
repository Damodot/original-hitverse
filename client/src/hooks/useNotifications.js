import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gql } from '@/lib/api';

/** In-app notifications, checked every 30 seconds and whenever the tab comes back into focus. */
export const useNotifications = () =>
  useQuery({
    queryKey: ['notifications'],
    queryFn: () => gql('query { notifications { unread items { _id type title body link read createdAt } } }').then((d) => d.notifications),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids) => gql('mutation($ids: [ID!]) { markNotificationsRead(ids: $ids) }', { ids: ids ?? null }),
    onMutate: (ids) => {
      qc.setQueryData(['notifications'], (old) => old && {
        unread: ids ? Math.max(0, old.unread - old.items.filter((n) => !n.read && ids.includes(n._id)).length) : 0,
        items: old.items.map((n) => (!ids || ids.includes(n._id) ? { ...n, read: true } : n)),
      });
    },
  });
}
