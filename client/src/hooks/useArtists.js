import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gql, upload } from '@/lib/api';
import { ARTIST, ARTIST_CARD, SONG, USER } from '@/lib/fields';
import { toast } from '@/lib/toast';

const LONG = 1000 * 60 * 5;

export const useArtists = ({ featured = false, limit = 50, enabled = true } = {}) =>
  useQuery({
    enabled,
    queryKey: ['artists', { featured, limit }],
    queryFn: () => gql(`query($featured: Boolean, $limit: Int) { artists(featured: $featured, limit: $limit) { ${ARTIST_CARD} songCount isFollowing isRepping } }`, { featured, limit })
      .then((d) => d.artists),
    staleTime: LONG,
  });

/** An artist's public page, with their songs. */
export const useArtistPage = (slug) =>
  useQuery({
    queryKey: ['artist', slug],
    queryFn: async () => {
      const { artist } = await gql(`query($slug: String!) { artist(slug: $slug) { ${ARTIST} songs { ${SONG} } } }`, { slug });
      if (!artist) throw Object.assign(new Error('Artist not found'), { status: 404 });
      return artist;
    },
    enabled: !!slug,
    retry: false,
  });

export const useMyFanBases = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ['fanbases'],
    queryFn: () => gql(`query { myFanBases { ${ARTIST_CARD} isRepping } }`).then((d) => d.myFanBases),
    enabled,
  });

const refreshFans = (qc) => {
  for (const key of [['artists'], ['artist'], ['fanbases']]) qc.invalidateQueries({ queryKey: key });
};

/** Join (follow) or leave a fan base. */
export function useFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ artist, follow }) => gql(`mutation($id: ID!) { ${follow ? 'follow' : 'unfollow'}(artistId: $id) { _id followerCount } }`, { id: artist._id }),
    onSuccess: (_d, { artist, follow }) => {
      toast.success(follow ? `You joined the ${artist.fanBase.name}` : `You left the ${artist.fanBase.name}`);
      refreshFans(qc);
      qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (err) => toast.error(err.message),
  });
}

/** Represent a fan base (joins it first if needed). */
export function useRep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ artist }) => gql(`mutation($id: ID!) { rep(artistId: $id) { ${USER} } }`, { id: artist._id }).then((d) => d.rep),
    onSuccess: (user, { artist }) => {
      qc.setQueryData(['me'], user);
      toast.success(`You’re repping the ${artist.fanBase.name}`, { description: artist.welcome });
      refreshFans(qc);
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => gql(`mutation($id: ID!, $input: ArtistProfileInput!) { updateArtistProfile(artistId: $id, input: $input) { ${ARTIST} } }`, { id, input })
      .then((d) => d.updateArtistProfile),
    onSuccess: (artist) => {
      qc.setQueryData(['artist', artist.slug], (old) => (old ? { ...old, ...artist } : old));
      for (const key of [['artists'], ['artist'], ['artist', 'me'], ['me'], ['admin']]) qc.invalidateQueries({ queryKey: key });
    },
  });
}

/** Avatar or banner, sent as a file (plain HTTP upload). */
export function useProfileImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, kind, file }) => {
      const formData = new FormData();
      formData.append('image', file);
      return upload(`/artist/profile/${id}/image/${kind}`, formData);
    },
    onSuccess: () => {
      for (const key of [['artists'], ['artist'], ['artist', 'me'], ['me']]) qc.invalidateQueries({ queryKey: key });
    },
    onError: (err) => toast.error(err.message),
  });
}

// Admin
export const useAdminProfiles = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ['admin', 'profiles'],
    queryFn: () => gql(`query { admin { profiles { ${ARTIST_CARD} onboarded songCount } } }`).then((d) => d.admin.profiles),
    enabled,
  });

export function useSetArtistFlags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, featured, verified }) => gql('mutation($id: ID!, $featured: Boolean, $verified: Boolean) { adminSetArtistFlags(artistId: $id, featured: $featured, verified: $verified) { _id featured verified } }', { id, featured, verified }),
    onSuccess: () => {
      for (const key of [['admin'], ['artists'], ['artist']]) qc.invalidateQueries({ queryKey: key });
    },
    onError: (err) => toast.error(err.message),
  });
}
