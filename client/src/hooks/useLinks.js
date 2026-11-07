import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gql } from '@/lib/api';

export const useListen = (slug) =>
  useQuery({
    queryKey: ['listen', slug],
    queryFn: async () => {
      const { listen } = await gql(`query($slug: String!) { listen(slug: $slug) {
        slug title artist artistSlug cover preview duration album { title type } links linkCredits } }`, { slug });
      if (!listen) throw new Error('Song not found');
      return listen;
    },
    enabled: !!slug,
    retry: false,
  });

/** Counts a "Listen on …" click. keepalive lets it finish even as the page opens the platform. */
export function trackClick(slug, platform) {
  gql('mutation($slug: String!, $platform: String!) { listenClick(slug: $slug, platform: $platform) }', { slug, platform }, { keepalive: true }).catch(() => {});
}

export const useAdminLinks = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ['admin', 'links'],
    queryFn: () => gql('query { admin { links { sources songs { _id slug title artist cover links linkClicks uploader isrc } } } }').then((d) => d.admin.links),
    enabled,
  });

const refreshAfterLinks = (qc) => {
  for (const key of [['admin', 'links'], ['songs'], ['artist', 'me'], ['listen']]) qc.invalidateQueries({ queryKey: key });
};

export function useSaveLinks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, links, isrc, credits }) => gql(`mutation($id: ID!, $links: JSON!, $isrc: String, $credits: [String!]) {
      saveLinks(songId: $id, links: $links, isrc: $isrc, credits: $credits) { links isrc } }`, { id, links, isrc, credits }).then((d) => d.saveLinks),
    onSuccess: () => refreshAfterLinks(qc),
  });
}

export const useFindLinks = () =>
  useMutation({ mutationFn: ({ id, isrc }) => gql('mutation($id: ID!, $isrc: String) { findLinks(songId: $id, isrc: $isrc) }', { id, isrc: isrc || null }).then((d) => d.findLinks) });

export function useFindAllLinks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => gql('mutation { adminFindAllLinks }').then((d) => d.adminFindAllLinks),
    onSuccess: () => refreshAfterLinks(qc),
  });
}
