import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { gql, upload } from '@/lib/api';
import { isWorking } from '@/hooks/useAudioTools';
import { APPLICATION, ARTIST, MY_SONG, USER } from '@/lib/fields';

/** The signed-in user's artist status and their uploads. Also refreshes the user in AuthContext. */
export function useArtistMe() {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['artist', 'me'],
    queryFn: async () => {
      const { studio } = await gql(`query { studio { user { ${USER} } songs { ${MY_SONG} } profile { ${ARTIST} } } }`);
      qc.setQueryData(['me'], studio.user); // an admin may have approved us since login
      return studio;
    },
    // Keep checking while a karaoke beat is being made.
    refetchInterval: (q) => (isWorking(q.state.data?.songs) ? 4000 : false),
  });
}

export function useApply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => gql(`mutation($name: String!, $bio: String!, $link: String) {
      applyAsArtist(name: $name, bio: $bio, link: $link) { ${USER} } }`, body).then((d) => ({ user: d.applyAsArtist })),
    onSuccess: (d) => {
      qc.setQueryData(['me'], d.user);
      qc.invalidateQueries({ queryKey: ['artist', 'me'] });
    },
  });
}

export function useUploadSong() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ formData, onProgress, signal }) => upload('/artist/songs', formData, { onProgress, signal }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['artist', 'me'] });
      qc.invalidateQueries({ queryKey: ['songs'] });
    },
  });
}

function useDeleteSong(mutation) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (song) => gql(`mutation($id: ID!) { ${mutation}(songId: $id) }`, { id: song._id }),
    onSuccess: (_d, song) => {
      toast(`Deleted “${song.title}”`);
      for (const key of [['artist', 'me'], ['songs'], ['likes'], ['admin']]) qc.invalidateQueries({ queryKey: key });
    },
    onError: (err) => toast.error(err.message),
  });
}
export const useDeleteMySong = () => useDeleteSong('deleteMySong');

// Admin
export const useAdminArtists = (status, { enabled = true } = {}) =>
  useQuery({
    queryKey: ['admin', 'artists', status],
    queryFn: () => gql(`query($status: String) { admin { artists(status: $status) {
      counts artists { _id firstName lastName email createdAt songCount artist { ${APPLICATION} } profile { _id slug name onboarded } } } } }`, { status })
      .then((d) => d.admin.artists),
    enabled,
  });

export const useAdminSongs = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ['admin', 'songs'],
    queryFn: () => gql(`query { admin { songs { _id slug title artist audio cover duration plays createdAt
      uploader { _id firstName lastName email artist { status name } } } } }`).then((d) => d.admin.songs),
    enabled,
  });

export function useDecide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }) => gql('mutation($id: ID!, $status: String!, $note: String) { adminDecideArtist(userId: $id, status: $status, note: $note) { id } }', { id, status, note }),
    onSuccess: (_d, { status, name }) => {
      toast.success(status === 'approved' ? `${name} can now upload music` : `${name} was not approved`);
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (err) => toast.error(err.message),
  });
}
export const useAdminDeleteSong = () => useDeleteSong('adminDeleteSong');

// Add a released song by its ISRC
export const useIsrcLookup = () =>
  useMutation({
    mutationFn: (query) => gql(`query($query: String!) { isrcLookup(query: $query) {
      track { isrc title artist artwork duration hasPreview links } existing { _id slug title } canAdd reason } }`, { query })
      .then((d) => d.isrcLookup),
  });

export function useAddByIsrc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ formData, onProgress, signal }) => upload('/artist/songs/isrc', formData, { onProgress, signal }),
    onSuccess: () => {
      for (const key of [['artist', 'me'], ['songs'], ['admin']]) qc.invalidateQueries({ queryKey: key });
    },
  });
}

/** Uploads the full song for a song (e.g. one added by ISRC with only the preview). */
export function useReplaceAudio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file, onProgress }) => {
      const formData = new FormData();
      formData.append('audio', file);
      return upload(`/artist/songs/${id}/audio`, formData, { method: 'PUT', onProgress });
    },
    onSuccess: ({ song }) => {
      toast.success(`Full song added to “${song.title}”`, { description: 'Likes, plays and links are kept.' });
      for (const key of [['artist', 'me'], ['songs'], ['admin']]) qc.invalidateQueries({ queryKey: key });
    },
    onError: (err) => toast.error(err.message),
  });
}

export const useAdminStorage = () =>
  useQuery({
    queryKey: ['admin', 'storage'],
    queryFn: () => gql('query { admin { storage { mediaBytes mediaFiles totalBytes limitBytes songs } } }').then((d) => d.admin.storage),
  });
