import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gql, upload } from '@/lib/api';
import { KARAOKE_INFO, SONG } from '@/lib/fields';
import { toast } from '@/lib/toast';

const BUSY = ['queued', 'processing'];
/** True while a karaoke beat is being made or a song is being analysed, so lists keep refreshing. */
export const isWorking = (songs) => songs?.some((s) => BUSY.includes(s.karaokeInfo?.status) || s.mixStatus === 'queued');

export const useAudioToolsReady = () =>
  useQuery({ queryKey: ['audio-tools'], queryFn: () => gql('query { audioToolsReady }').then((d) => d.audioToolsReady), staleTime: 10 * 60_000 });

/** Admin: every song with its karaoke and DJ-mix status. */
export const useKaraokeAdmin = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ['admin', 'karaoke'],
    queryFn: () => gql(`query { songs { ${SONG} ${KARAOKE_INFO} } }`).then((d) => d.songs),
    refetchInterval: (q) => (isWorking(q.state.data) ? 4000 : false),
    enabled,
  });

function useSongAction(build, success) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: build,
    onSuccess: (data, vars) => {
      for (const key of [['artist', 'me'], ['songs'], ['admin', 'karaoke']]) qc.invalidateQueries({ queryKey: key });
      const msg = typeof success === 'function' ? success(data, vars) : success;
      if (msg) toast.success(msg);
    },
    onError: (err) => toast.error(err.message),
  });
}

export const useMakeKaraoke = () => useSongAction(
  (song) => gql('mutation($id: ID!) { makeKaraoke(songId: $id) { _id } }', { id: song._id }),
  (_d, song) => `Removing the vocals from “${song.title}”. You’ll get a notification when the beat is ready.`,
);
export const usePublishKaraoke = () => useSongAction(
  ({ song, published }) => gql('mutation($id: ID!, $p: Boolean!) { publishKaraoke(songId: $id, published: $p) { _id } }', { id: song._id, p: published }),
  (_d, { song, published }) => (published ? `Karaoke is live for “${song.title}”` : `Karaoke hidden for “${song.title}”`),
);
export const useDeleteKaraoke = () => useSongAction(
  (song) => gql('mutation($id: ID!) { deleteKaraoke(songId: $id) { _id } }', { id: song._id }),
  (_d, song) => `Removed the karaoke beat for “${song.title}”`,
);
export const useUploadBeat = () => useSongAction(
  ({ song, file, onProgress }) => {
    const form = new FormData();
    form.append('audio', file);
    return upload(`/artist/songs/${song._id}/karaoke`, form, { onProgress });
  },
  (_d, { song }) => `Your beat for “${song.title}” is live: fans can sing along now`,
);
export const useAnalyzeMix = () => useSongAction(
  (song) => gql('mutation($id: ID!) { analyzeMix(songId: $id) { _id } }', { id: song._id }),
  null,
);
export const useAnalyzeAll = () => useSongAction(
  () => gql('mutation { adminAnalyzeAllMixes }').then((d) => d.adminAnalyzeAllMixes),
  (n) => `Analysing ${n} song${n === 1 ? '' : 's'} for DJ mode`,
);
