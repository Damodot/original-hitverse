import { CalendarClock, Check, Mic, Plus, Radio, Search, Users, Video } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Page, PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { useArtists } from '@/hooks/useArtists';
import { useCreateLiveRoom, useLiveRooms, useMyFans } from '@/hooks/useLive';
import { cn } from '@/lib/utils';

export const MAX_FANS = { audio: 50, video: 16 };
export const kindLabel = (kind) => (kind === 'video' ? 'Video room' : 'Voice room');
export const when = (d) => new Date(d).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** Live voice and video rooms: the ones you're invited to, and (for artists) the ones you host. */
export default function Live() {
  const { user } = useAuth();
  const { data: rooms, isPending } = useLiveRooms();
  const [creating, setCreating] = useState(false);
  const canHost = user?.role === 'admin' || Boolean(user?.canUpload && user?.artistProfile);

  const groups = useMemo(() => ({
    live: rooms?.filter((r) => r.status === 'live') ?? [],
    soon: rooms?.filter((r) => r.status === 'scheduled') ?? [],
    ended: rooms?.filter((r) => r.status === 'ended') ?? [],
  }), [rooms]);

  return (
    <Page>
      <PageHeader eyebrow="Live" title="Live rooms" subtitle="Voice and video calls between artists and the fans they pick.">
        {canHost && <Button onClick={() => setCreating(true)}><Plus className="size-4" /> Start a room</Button>}
      </PageHeader>

      {isPending ? (
        <div className="grid gap-3 sm:grid-cols-2">{[0, 1].map((i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : !rooms?.length ? (
        <div className="rounded-3xl border border-dashed border-border p-10 text-center">
          <Radio className="mx-auto size-10 text-brand" />
          <p className="mt-3 text-lg font-semibold">No live rooms right now</p>
          <p className="mx-auto mt-1 max-w-md text-muted">
            {canHost
              ? 'Start a voice or video room and invite fans from your fan base. They get a notification straight away.'
              : 'When an artist invites you to a live room, it shows up here and you get a notification.'}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <Section title="Live now" rooms={groups.live} />
          <Section title="Coming up" rooms={groups.soon} />
          <Section title="Earlier today" rooms={groups.ended} />
        </div>
      )}

      {canHost && <CreateRoom open={creating} onOpenChange={setCreating} />}
    </Page>
  );
}

function Section({ title, rooms }) {
  if (!rooms.length) return null;
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {rooms.map((r) => <RoomCard key={r._id} room={r} />)}
      </ul>
    </section>
  );
}

function RoomCard({ room }) {
  const live = room.status === 'live';
  const KindIcon = room.kind === 'video' ? Video : Mic;
  return (
    <li>
      <Link to={`/app/live/${room._id}`}
        className={cn('flex h-full gap-4 rounded-3xl border bg-elevated/60 p-4 transition hover:border-brand/50',
          live ? 'border-brand/40 shadow-[0_0_40px_-12px_var(--brand)]' : 'border-border', room.status === 'ended' && 'opacity-60')}>
        <span className="relative shrink-0">
          {room.artist.avatar
            ? <img src={room.artist.avatar} alt="" className="size-16 rounded-2xl object-cover" />
            : <span className="grid size-16 place-items-center rounded-2xl bg-subtle text-xl font-bold">{room.artist.name[0]}</span>}
          {live && <span className="absolute -top-1.5 -right-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">Live</span>}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-bold">{room.title}</span>
          <span className="block truncate text-sm text-muted">{room.artist.name}{room.isHost ? ' · You’re hosting' : ''}</span>
          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1"><KindIcon className="size-4" /> {kindLabel(room.kind)}</span>
            {live && <span className="flex items-center gap-1"><Users className="size-4" /> {room.peopleInRoom} in the room</span>}
            {room.status === 'scheduled' && <span className="flex items-center gap-1"><CalendarClock className="size-4" /> {when(room.startsAt)}</span>}
            {room.status === 'ended' && <span>Ended</span>}
          </span>
        </span>
      </Link>
    </li>
  );
}

/** Start or schedule a room and pick the fans who can join. */
function CreateRoom({ open, onOpenChange }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  const create = useCreateLiveRoom();
  // Admins can host for any artist (e.g. DAMODOT's page); artists host for their own page.
  const { data: artists } = useArtists({ enabled: isAdmin && open });
  const [artistId, setArtistId] = useState(user?.artistProfile?._id ?? '');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('audio');
  const [fansCanSpeak, setFansCanSpeak] = useState(true);
  const [later, setLater] = useState(false);
  const [startsAt, setStartsAt] = useState('');
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState(() => new Map()); // id -> name
  const [error, setError] = useState(null);
  const host = artistId || (isAdmin ? artists?.[0]?._id : '') || '';
  const { data: fans, isFetching } = useMyFans(host, search.trim());
  const max = MAX_FANS[kind];

  const toggle = (fan) => setPicked((m) => {
    const next = new Map(m);
    if (next.has(fan._id)) next.delete(fan._id);
    else if (next.size < max) next.set(fan._id, fan.name);
    return next;
  });
  const pickAll = () => setPicked((m) => {
    const next = new Map(m);
    for (const f of fans ?? []) if (next.size < max) next.set(f._id, f.name);
    return next;
  });

  const submit = (e) => {
    e.preventDefault();
    if (title.trim().length < 2) return setError({ field: 'title', message: 'Give the room a title' });
    if (!picked.size) return setError({ field: 'invitees', message: 'Pick at least one fan to invite' });
    if (later && !startsAt) return setError({ field: 'startsAt', message: 'Pick a date and time' });
    setError(null);
    create.mutate({
      artistId: host,
      title: title.trim(),
      kind,
      fansCanSpeak,
      invitees: [...picked.keys()],
      startsAt: later ? new Date(startsAt).toISOString() : null,
    }, {
      onSuccess: (room) => {
        onOpenChange(false);
        navigate(`/app/live/${room._id}`);
      },
      onError: (err) => setError({ field: err.field ?? 'form', message: err.message }),
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Start a live room" className="max-w-xl"
      description="Only the fans you pick can join. They get a notification with the link.">
      <form id="create-room" onSubmit={submit} noValidate className="space-y-5">
        {isAdmin && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">Host as</span>
            <select value={host} onChange={(e) => { setArtistId(e.target.value); setPicked(new Map()); }}
              className="h-11 w-full rounded-xl border border-border bg-bg px-3">
              {(artists ?? []).map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </label>
        )}
        <Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80}
          placeholder="e.g. First listen: new single" error={error?.field === 'title' ? error.message : undefined} />

        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Room type">
          {[['audio', 'Voice', Mic, 'Up to 50 fans'], ['video', 'Video', Video, 'Up to 16 fans']].map(([id, label, Icon, note]) => (
            <button key={id} type="button" role="radio" aria-checked={kind === id}
              onClick={() => { setKind(id); setPicked((m) => new Map([...m].slice(0, MAX_FANS[id]))); }}
              className={cn('flex cursor-pointer items-center gap-3 rounded-2xl border p-3 text-left transition',
                kind === id ? 'border-brand bg-brand/10' : 'border-border hover:border-brand/40')}>
              <span className={cn('grid size-10 place-items-center rounded-xl', kind === id ? 'bg-brand text-brand-fg' : 'bg-subtle text-muted')}><Icon className="size-5" /></span>
              <span><span className="block font-semibold">{label}</span><span className="block text-xs text-muted">{note}</span></span>
            </button>
          ))}
        </div>

        <label className="flex cursor-pointer items-start justify-between gap-3">
          <span>
            <span className="block text-sm font-semibold">Fans can talk</span>
            <span className="block text-xs text-muted">Off: fans join muted and raise a hand. You choose who speaks.</span>
          </span>
          <input type="checkbox" checked={fansCanSpeak} onChange={(e) => setFansCanSpeak(e.target.checked)} className="mt-1 size-5 accent-[var(--brand)]" />
        </label>

        <div>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-subtle p-1">
            {[[false, 'Go live now'], [true, 'Schedule']].map(([v, label]) => (
              <button key={label} type="button" onClick={() => setLater(v)}
                className={cn('cursor-pointer rounded-lg py-2 text-sm font-semibold transition', later === v ? 'bg-elevated shadow' : 'text-muted')}>{label}</button>
            ))}
          </div>
          {later && (
            <Field className="mt-3" label="Starts" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)}
              error={error?.field === 'startsAt' ? error.message : undefined} />
          )}
        </div>

        <div>
          <div className="mb-2 flex items-end justify-between gap-2">
            <span className="text-sm font-semibold">Invite fans</span>
            <span className={cn('text-sm tabular-nums', picked.size >= max ? 'text-amber-500' : 'text-muted')}>{picked.size} / {max} picked</span>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your fan base" className="pl-9" aria-label="Search fans" />
          </div>
          <div className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-border">
            {!fans?.length ? (
              <p className="p-4 text-center text-sm text-muted">{isFetching ? 'Loading fans…' : search ? 'No fans match that name.' : 'No fans in this fan base yet.'}</p>
            ) : (
              <ul>
                {fans.map((f) => {
                  const on = picked.has(f._id);
                  return (
                    <li key={f._id}>
                      <button type="button" onClick={() => toggle(f)} aria-pressed={on}
                        className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition hover:bg-subtle">
                        <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-brand to-fuchsia-500 text-xs font-bold text-white">{initials(f.name)}</span>
                        <span className="flex-1 truncate">{f.name}</span>
                        <span className={cn('grid size-5 place-items-center rounded-md border', on ? 'border-brand bg-brand text-brand-fg' : 'border-border')}>{on && <Check className="size-3.5" />}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button type="button" onClick={pickAll} disabled={!fans?.length || picked.size >= max} className="cursor-pointer text-sm font-semibold text-brand hover:underline disabled:opacity-40">Pick everyone shown</button>
            {picked.size > 0 && <button type="button" onClick={() => setPicked(new Map())} className="cursor-pointer text-sm text-muted hover:text-fg">Clear</button>}
          </div>
          {error?.field === 'invitees' && <p role="alert" className="mt-2 text-sm text-red-500">{error.message}</p>}
        </div>
        {error?.field === 'form' && <p role="alert" className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-500">{error.message}</p>}
        <Button type="submit" size="lg" className="w-full" loading={create.isPending}>
          {later ? <><CalendarClock className="size-5" /> Schedule and invite</> : <><Radio className="size-5" /> Go live and invite</>}
        </Button>
      </form>
    </Modal>
  );
}

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
