import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from '@/lib/api';

export function useSaveLyrics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, lines, synced }) => gql(`mutation($id: ID!, $lines: [String!]!, $synced: [SyncedLineInput!]) {
      saveLyrics(songId: $id, lines: $lines, synced: $synced) { lyrics synced { t text } } }`, { id, lines, synced }).then((d) => d.saveLyrics),
    onSuccess: (_d, { slug }) => {
      qc.invalidateQueries({ queryKey: ['lyrics', slug] });
      for (const key of [['songs'], ['artist', 'me']]) qc.invalidateQueries({ queryKey: key });
    },
  });
}

export const useFindLyricsOnline = () =>
  useMutation({ mutationFn: (id) => gql('mutation($id: ID!) { findLyricsOnline(songId: $id) }', { id }).then((d) => d.findLyricsOnline) });

export function useSaveCredits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, writers, producers }) => gql(`mutation($id: ID!, $writers: [String!], $producers: [String!]) {
      saveCredits(songId: $id, writers: $writers, producers: $producers) { writers producers } }`, {
      id,
      writers: String(writers ?? '').split(/\s*(?:,|&|\n)\s*/).map((n) => n.trim()).filter(Boolean),
      producers: String(producers ?? '').split(/\s*(?:,|&|\n)\s*/).map((n) => n.trim()).filter(Boolean),
    }).then((d) => d.saveCredits),
    onSuccess: (_d, { slug }) => qc.invalidateQueries({ queryKey: ['lyrics', slug] }),
  });
}
