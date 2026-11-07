import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { toast } from '@/lib/toast';
import { gql } from '@/lib/api';
import { SONG } from '@/lib/fields';

const LONG = 1000 * 60 * 10;

export const useSongs = () =>
  useQuery({ queryKey: ['songs'], queryFn: () => gql(`query { songs { ${SONG} } }`).then((d) => d.songs), staleTime: LONG });

export const useAlbums = () =>
  useQuery({
    queryKey: ['albums'],
    queryFn: () => gql('query { albums { _id slug title artist artistId cover type order trackCount } }').then((d) => d.albums),
    staleTime: LONG,
  });

export const useAlbum = (slug) =>
  useQuery({
    queryKey: ['album', slug],
    queryFn: () => gql(`query($slug: String!) { album(slug: $slug) { album { _id slug title artist cover type trackCount } songs { ${SONG} } } }`, { slug })
      .then((d) => d.album),
    staleTime: LONG,
    enabled: !!slug,
  });

export const useLyrics = (slug) =>
  useQuery({
    queryKey: ['lyrics', slug],
    queryFn: () => gql(`query($slug: String!) { lyrics(slug: $slug) {
      slug title lyrics synced { t text } credits { writers producers } } }`, { slug }).then((d) => d.lyrics),
    staleTime: Infinity,
    enabled: !!slug,
  });

export function useLikes() {
  const q = useQuery({ queryKey: ['likes'], queryFn: () => gql('query { myLikes }').then((d) => d.myLikes), staleTime: LONG });
  const ids = useMemo(() => new Set(q.data ?? []), [q.data]);
  return { ...q, ids };
}

/** Liked songs in the order they were liked, newest first. */
export function useLikedSongs() {
  const songs = useSongs();
  const likes = useLikes();
  const data = useMemo(() => {
    if (!songs.data || !likes.data) return undefined;
    const byId = new Map(songs.data.map((s) => [s._id, s]));
    return [...likes.data].reverse().map((id) => byId.get(id)).filter(Boolean);
  }, [songs.data, likes.data]);
  return { data, isPending: songs.isPending || likes.isPending };
}

/** The latest copy of a song from the library cache (live like count and rating), falling back to the one passed in. */
export function useLiveSong(song) {
  const { data } = useSongs();
  return useMemo(() => (song ? data?.find((s) => s._id === song._id) ?? song : null), [data, song]);
}

const patchSong = (qc, id, patch) =>
  qc.setQueryData(['songs'], (old) => old?.map((s) => (s._id === id ? { ...s, ...patch(s) } : s)));

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, liked }) => (liked
      ? gql('mutation($id: ID!) { unlike(songId: $id) }', { id }).then((d) => ({ likeCount: d.unlike }))
      : gql('mutation($id: ID!) { like(songId: $id) }', { id }).then((d) => ({ likeCount: d.like }))),
    // Flip the heart and the count right away; roll back if the server says no.
    onMutate: async ({ id, liked }) => {
      await qc.cancelQueries({ queryKey: ['likes'] });
      const prev = { likes: qc.getQueryData(['likes']), songs: qc.getQueryData(['songs']) };
      qc.setQueryData(['likes'], (old = []) => (liked ? old.filter((x) => x !== id) : [...old, id]));
      patchSong(qc, id, (s) => ({ likeCount: Math.max(0, (s.likeCount ?? 0) + (liked ? -1 : 1)) }));
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      qc.setQueryData(['likes'], ctx?.prev.likes);
      qc.setQueryData(['songs'], ctx?.prev.songs);
      toast.error(err.message);
    },
    onSuccess: (d, { id }) => patchSong(qc, id, () => ({ likeCount: d.likeCount })),
  });
}

// Ratings
export const useMyRatings = () =>
  useQuery({ queryKey: ['ratings'], queryFn: () => gql('query { myRatings }').then((d) => d.myRatings), staleTime: LONG });

export function useRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value }) => gql('mutation($id: ID!, $value: Int!) { rate(songId: $id, value: $value) { value ratingSum ratingCount } }', { id, value })
      .then((d) => d.rate),
    onMutate: ({ id, value }) => {
      const prev = qc.getQueryData(['ratings']);
      qc.setQueryData(['ratings'], (old = {}) => {
        const next = { ...old };
        if (value) next[id] = value;
        else delete next[id];
        return next;
      });
      return { prev };
    },
    onError: (err, _v, ctx) => {
      qc.setQueryData(['ratings'], ctx?.prev);
      toast.error(err.message);
    },
    onSuccess: (d, { id }) => patchSong(qc, id, () => ({ ratingSum: d.ratingSum, ratingCount: d.ratingCount })),
  });
}

export const averageRating = (s) => (s?.ratingCount ? s.ratingSum / s.ratingCount : 0);
