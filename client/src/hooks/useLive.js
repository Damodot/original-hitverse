import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gql } from '@/lib/api';
import { toast } from '@/lib/toast';

const ROOM = `_id title kind status fansCanSpeak startsAt startedAt endedAt isHost inviteeCount peopleInRoom
  artist { _id slug name avatar fanBase { name member } }`;

/** Rooms I host or I'm invited to. Refreshes often so "live now" shows up quickly. */
export const useLiveRooms = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ['live', 'rooms'],
    queryFn: () => gql(`query { liveRooms { ${ROOM} } }`).then((d) => d.liveRooms),
    refetchInterval: 15_000,
    enabled,
  });

export const useLiveRoom = (id) =>
  useQuery({
    queryKey: ['live', 'room', id],
    queryFn: () => gql(`query($id: ID!) { liveRoom(id: $id) { ${ROOM} invitees { _id name } } }`, { id }).then((d) => d.liveRoom),
    refetchInterval: 10_000,
    retry: false,
  });

/** Fans in the artist's fan base, for picking who to invite. */
export const useMyFans = (artistId, search) =>
  useQuery({
    queryKey: ['live', 'fans', artistId, search],
    queryFn: () => gql('query($a: ID!, $q: String) { myFans(artistId: $a, search: $q, limit: 100) { _id name } }', { a: artistId, q: search || null }).then((d) => d.myFans),
    enabled: Boolean(artistId),
    placeholderData: keepPreviousData,
  });

function useLiveAction(build, { success, invalidate = true } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: build,
    onSuccess: (data, vars) => {
      if (invalidate) qc.invalidateQueries({ queryKey: ['live'] });
      const msg = typeof success === 'function' ? success(data, vars) : success;
      if (msg) toast.success(msg);
    },
    onError: (err) => toast.error(err.message),
  });
}

export const useCreateLiveRoom = () => useLiveAction(
  (input) => gql(`mutation($input: LiveRoomInput!) { createLiveRoom(input: $input) { ${ROOM} } }`, { input }).then((d) => d.createLiveRoom),
  { success: (room) => (room.status === 'live' ? 'Your room is live. Invites sent.' : 'Room scheduled. Invites sent.') },
);
export const useStartLiveRoom = () => useLiveAction((id) => gql(`mutation($id: ID!) { startLiveRoom(id: $id) { ${ROOM} } }`, { id }), { success: 'You’re live. Your fans have been told.' });
export const useEndLiveRoom = () => useLiveAction((id) => gql(`mutation($id: ID!) { endLiveRoom(id: $id) { ${ROOM} } }`, { id }), { success: 'Room ended for everyone' });
export const useInviteToLive = () => useLiveAction(
  ({ id, userIds }) => gql(`mutation($id: ID!, $u: [ID!]!) { inviteToLiveRoom(id: $id, userIds: $u) { ${ROOM} } }`, { id, u: userIds }),
  { success: (_d, { userIds }) => `Invited ${userIds.length} more ${userIds.length === 1 ? 'fan' : 'fans'}` },
);
export const useJoinLive = () => useLiveAction(
  (id) => gql('mutation($id: ID!) { joinLiveRoom(id: $id) { token url } }', { id }).then((d) => d.joinLiveRoom),
  { invalidate: false },
);
export const useSetSpeaker = () => useLiveAction(
  ({ id, userId, canSpeak }) => gql('mutation($id: ID!, $u: ID!, $c: Boolean!) { liveSetSpeaker(id: $id, userId: $u, canSpeak: $c) }', { id, u: userId, c: canSpeak }),
  { invalidate: false },
);
export const useRemoveFromLive = () => useLiveAction(
  ({ id, userId }) => gql('mutation($id: ID!, $u: ID!) { liveRemove(id: $id, userId: $u) }', { id, u: userId }),
  { success: 'Removed from the room' },
);
