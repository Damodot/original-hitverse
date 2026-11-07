import '@livekit/components-styles';
import {
  ConnectionStateToast, DisconnectButton, LiveKitRoom, RoomAudioRenderer, StartAudio, TrackToggle, VideoConference,
  useIsSpeaking, useLocalParticipant, useLocalParticipantPermissions, useParticipants,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { ArrowLeft, CalendarClock, Check, Hand, LogOut, Mic, MicOff, PanelRight, Radio, Search, UserPlus, UserX, Users, Video, Volume2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Page } from '@/components/layout/PageHeader';
import { UndoButton } from '@/components/UndoButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlayer } from '@/context/PlayerContext';
import { useEndLiveRoom, useInviteToLive, useJoinLive, useLiveRoom, useMyFans, useRemoveFromLive, useSetSpeaker, useStartLiveRoom } from '@/hooks/useLive';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { initials, kindLabel, MAX_FANS, when } from './Live';

const roleOf = (p) => {
  try { return JSON.parse(p.metadata || '{}').role ?? 'fan'; } catch { return 'fan'; }
};

/** One live room: a lobby first, then the call. */
export default function LiveRoomPage() {
  const { id } = useParams();
  const { data: room, isPending, error } = useLiveRoom(id);
  const join = useJoinLive();
  const [pass, setPass] = useState(null);
  const { isPlaying, toggle } = usePlayer();

  if (isPending) return <Page><Skeleton className="h-72" /></Page>;
  if (error || !room) {
    return (
      <Page>
        <div className="mx-auto max-w-md py-20 text-center">
          <Radio className="mx-auto size-10 text-muted" />
          <p className="mt-3 text-lg font-semibold">{error?.message ?? 'This room wasn’t found'}</p>
          <Button asChild variant="secondary" className="mt-6"><Link to="/app/live"><ArrowLeft className="size-4" /> All live rooms</Link></Button>
        </div>
      </Page>
    );
  }

  if (pass && room.status === 'live') {
    return <Call room={room} pass={pass} onLeave={() => setPass(null)} />;
  }

  const enter = () => {
    if (isPlaying) toggle(); // the music would play over the call
    join.mutate(room._id, { onSuccess: setPass });
  };
  return <Lobby room={room} onJoin={enter} joining={join.isPending} />;
}

function Lobby({ room, onJoin, joining }) {
  const start = useStartLiveRoom();
  const end = useEndLiveRoom();
  const [inviting, setInviting] = useState(false);
  const KindIcon = room.kind === 'video' ? Video : Mic;
  const canTalk = room.isHost || room.fansCanSpeak;
  return (
    <Page>
      <Link to="/app/live" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg"><ArrowLeft className="size-4" /> All live rooms</Link>
      <div className="relative overflow-hidden rounded-3xl border border-border bg-[#0b0a10] p-6 text-white sm:p-10">
        <div className="absolute inset-0 -z-0 bg-[radial-gradient(ellipse_at_top_left,rgba(153,51,255,0.45),transparent_60%)]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          {room.artist.avatar
            ? <img src={room.artist.avatar} alt="" className="size-24 rounded-3xl object-cover ring-4 ring-white/10" />
            : <span className="grid size-24 place-items-center rounded-3xl bg-white/10 text-3xl font-bold">{room.artist.name[0]}</span>}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-semibold tracking-[0.2em] text-white/60 uppercase">
              {room.status === 'live' && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] tracking-wider text-white">Live</span>}
              <KindIcon className="size-4" /> {kindLabel(room.kind)} · {room.artist.name}
            </p>
            <h1 className="mt-2 font-display text-4xl leading-none tracking-wide sm:text-6xl">{room.title.toUpperCase()}</h1>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-white/70">
              {room.status === 'live' && <span className="flex items-center gap-1.5"><Users className="size-4" /> {room.peopleInRoom} in the room</span>}
              {room.status === 'scheduled' && <span className="flex items-center gap-1.5"><CalendarClock className="size-4" /> Starts {when(room.startsAt)}</span>}
              {room.isHost && <span className="flex items-center gap-1.5"><UserPlus className="size-4" /> {room.inviteeCount} invited</span>}
            </p>
          </div>
        </div>

        <div className="relative mt-8 flex flex-wrap items-center gap-3">
          {room.status === 'live' && (
            <Button size="lg" onClick={onJoin} loading={joining}><Radio className="size-5" /> Join the room</Button>
          )}
          {room.status === 'scheduled' && room.isHost && (
            <Button size="lg" onClick={() => start.mutate(room._id)} loading={start.isPending}><Radio className="size-5" /> Go live now</Button>
          )}
          {room.isHost && room.status !== 'ended' && (
            <Button size="lg" variant="glass" onClick={() => setInviting(true)}><UserPlus className="size-5" /> Invite more fans</Button>
          )}
          {room.isHost && room.status !== 'ended' && (
            <UndoButton tone="danger" size="lg" label="End room" doneLabel="Ended" icon={<X />} onConfirm={() => end.mutate(room._id)} />
          )}
        </div>
        <p className="relative mt-4 text-sm text-white/60">
          {room.status === 'ended' ? 'This room has ended.'
            : room.status === 'scheduled' ? (room.isHost ? 'Your invited fans get a notification when you go live.' : 'You’ll get a notification when it starts.')
              : canTalk
                ? `Your browser will ask to use your microphone${room.kind === 'video' ? ' and camera' : ''}.`
                : 'You’ll join as a listener. Raise your hand if you want to talk.'}
        </p>
      </div>

      {room.isHost && room.invitees?.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold">Invited fans</h2>
          <ul className="flex flex-wrap gap-2">
            {room.invitees.map((f) => (
              <li key={f._id} className="flex items-center gap-2 rounded-full bg-subtle py-1 pr-3 pl-1 text-sm">
                <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-brand to-fuchsia-500 text-[11px] font-bold text-white">{initials(f.name)}</span>
                {f.name}
              </li>
            ))}
          </ul>
        </section>
      )}
      {room.isHost && <InviteMore room={room} open={inviting} onOpenChange={setInviting} />}
    </Page>
  );
}

function InviteMore({ room, open, onOpenChange }) {
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState(() => new Set());
  const { data: fans } = useMyFans(open ? room.artist._id : null, search.trim());
  const invite = useInviteToLive();
  const already = new Set((room.invitees ?? []).map((f) => f._id));
  const room_left = MAX_FANS[room.kind] - already.size;
  const choices = (fans ?? []).filter((f) => !already.has(f._id));
  const toggle = (id) => setPicked((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else if (n.size < room_left) n.add(id);
    return n;
  });
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Invite more fans" description={`${room_left} more can join this ${room.kind === 'video' ? 'video' : 'voice'} room.`}
      footer={<Button disabled={!picked.size} loading={invite.isPending} onClick={() => invite.mutate({ id: room._id, userIds: [...picked] }, { onSuccess: () => { setPicked(new Set()); onOpenChange(false); } })}>Invite {picked.size || ''}</Button>}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your fan base" className="pl-9" aria-label="Search fans" />
      </div>
      <ul className="mt-3 space-y-1">
        {choices.map((f) => (
          <li key={f._id}>
            <button type="button" onClick={() => toggle(f._id)} aria-pressed={picked.has(f._id)} className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-subtle">
              <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-brand to-fuchsia-500 text-xs font-bold text-white">{initials(f.name)}</span>
              <span className="flex-1 truncate">{f.name}</span>
              <span className={cn('grid size-5 place-items-center rounded-md border', picked.has(f._id) ? 'border-brand bg-brand text-brand-fg' : 'border-border')}>{picked.has(f._id) && <Check className="size-3.5" />}</span>
            </button>
          </li>
        ))}
        {!choices.length && <li className="py-6 text-center text-sm text-muted">Everyone who matches is already invited.</li>}
      </ul>
    </Modal>
  );
}

/** The call itself, full screen. LiveKit carries the audio and video. */
function Call({ room, pass, onLeave }) {
  const canTalk = room.isHost || room.fansCanSpeak;
  const [panel, setPanel] = useState(room.isHost);
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b0a10] text-white" data-lk-theme="default"
      style={{ '--lk-accent-bg': '#9933ff', '--lk-accent2': '#a855ff', '--lk-font-family': 'inherit', '--lk-bg': '#0b0a10', '--lk-bg2': '#16141d' }}>
      <LiveKitRoom
        serverUrl={pass.url}
        token={pass.token}
        connect
        audio={canTalk}
        video={room.kind === 'video' && canTalk}
        onDisconnected={onLeave}
        onError={(e) => toast.error(e.message || 'Couldn’t connect to the room')}
        className="flex min-h-0 flex-1 flex-col"
      >
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase">Live</span>
          <p className="min-w-0 flex-1 truncate font-semibold">{room.title} <span className="font-normal text-white/50">· {room.artist.name}</span></p>
          <PeopleCount />
          {room.isHost && (
            <button type="button" onClick={() => setPanel((v) => !v)} aria-pressed={panel} aria-label="People and controls"
              className={cn('grid size-9 cursor-pointer place-items-center rounded-full', panel ? 'bg-white/15' : 'hover:bg-white/10')}>
              <PanelRight className="size-5" />
            </button>
          )}
        </header>
        <div className="flex min-h-0 flex-1">
          <main className="relative min-w-0 flex-1">
            {room.kind === 'video' ? <VideoConference /> : <VoiceStage />}
          </main>
          {room.isHost && panel && <HostPanel room={room} />}
        </div>
        {room.kind === 'audio' && <VoiceControls />}
        {room.kind === 'audio' && <RoomAudioRenderer />}
        <SpeakNotice />
        <StartAudio label="Tap to hear the room" className="lk-start-audio-button !fixed !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2" />
        <ConnectionStateToast />
      </LiveKitRoom>
    </div>
  );
}

function PeopleCount() {
  const people = useParticipants();
  return <span className="flex items-center gap-1.5 text-sm text-white/70"><Users className="size-4" /> {people.length}</span>;
}

/** Tells a fan when the host lets them speak (or stops them). */
function SpeakNotice() {
  const perms = useLocalParticipantPermissions();
  const before = useRef(null);
  useEffect(() => {
    const now = perms?.canPublish ?? null;
    if (before.current !== null && now !== before.current) {
      toast(now ? 'The host let you speak. Turn your mic on.' : 'The host muted you.', { id: 'speak' });
    }
    before.current = now;
  }, [perms?.canPublish]);
  return null;
}

/** Voice rooms: everyone as a bubble that glows when they talk. Speakers on stage, listeners below. */
function VoiceStage() {
  const people = useParticipants();
  const sorted = [...people].sort((a, b) => (roleOf(b) === 'host') - (roleOf(a) === 'host'));
  const stage = sorted.filter((p) => roleOf(p) === 'host' || p.permissions?.canPublish);
  const listening = sorted.filter((p) => !stage.includes(p));
  return (
    <div className="h-full overflow-y-auto px-4 py-8 sm:px-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(153,51,255,0.25),transparent_65%)]" />
      <p className="mb-5 text-xs font-semibold tracking-[0.3em] text-white/50 uppercase">On stage</p>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-6">
        {stage.map((p) => <Bubble key={p.identity} participant={p} big />)}
      </ul>
      {listening.length > 0 && (
        <>
          <p className="mt-10 mb-5 text-xs font-semibold tracking-[0.3em] text-white/50 uppercase">Listening</p>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-5">
            {listening.map((p) => <Bubble key={p.identity} participant={p} />)}
          </ul>
        </>
      )}
    </div>
  );
}

function Bubble({ participant: p, big }) {
  const speaking = useIsSpeaking(p);
  const host = roleOf(p) === 'host';
  const hand = p.attributes?.hand === '1';
  const micOn = p.isMicrophoneEnabled;
  return (
    <li className="flex flex-col items-center gap-2 text-center">
      <span className="relative">
        <span className={cn('grid place-items-center rounded-full font-bold transition-shadow duration-200',
          big ? 'size-24 text-2xl' : 'size-16 text-lg',
          host ? 'bg-gradient-to-br from-brand to-fuchsia-500' : 'bg-white/10',
          speaking && 'shadow-[0_0_0_4px_#9933ff,0_0_32px_6px_rgba(153,51,255,0.7)]')}>
          {initials(p.name || p.identity)}
        </span>
        {(big || hand) && (
          <span className={cn('absolute -right-1 -bottom-1 grid size-8 place-items-center rounded-full border-2 border-[#0b0a10]',
            hand ? 'bg-amber-400 text-black' : micOn ? 'bg-white text-black' : 'bg-white/20 text-white')}>
            {hand ? <Hand className="size-4" /> : micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
          </span>
        )}
      </span>
      <span className="max-w-full truncate text-sm font-semibold">{p.name || 'Fan'}{p.isLocal ? ' (you)' : ''}</span>
      {host && <span className="-mt-1.5 text-xs font-semibold text-brand">Host</span>}
    </li>
  );
}

function VoiceControls() {
  const { localParticipant } = useLocalParticipant();
  const perms = useLocalParticipantPermissions();
  const [hand, setHand] = useState(false);
  const canSpeak = Boolean(perms?.canPublish);
  useEffect(() => { if (canSpeak) setHand(false); }, [canSpeak]);
  const raise = async () => {
    const next = !hand;
    setHand(next);
    try { await localParticipant.setAttributes({ hand: next ? '1' : '' }); } catch { setHand(!next); }
  };
  return (
    <div className="flex items-center justify-center gap-3 border-t border-white/10 px-4 py-4">
      {canSpeak ? (
        <TrackToggle source={Track.Source.Microphone} className="!h-12 !rounded-full !px-6 !font-semibold">Mic</TrackToggle>
      ) : (
        <button type="button" onClick={raise} aria-pressed={hand}
          className={cn('flex h-12 cursor-pointer items-center gap-2 rounded-full px-6 font-semibold transition', hand ? 'bg-amber-400 text-black' : 'bg-white/10 hover:bg-white/15')}>
          <Hand className="size-5" /> {hand ? 'Hand raised' : 'Raise hand'}
        </button>
      )}
      <DisconnectButton className="!h-12 !rounded-full !px-6"><LogOut className="size-5" /> Leave</DisconnectButton>
    </div>
  );
}

/** The host's people list: let fans speak, mute them, remove them, or end the room. */
function HostPanel({ room }) {
  const people = useParticipants().filter((p) => !p.isLocal);
  const speaker = useSetSpeaker();
  const remove = useRemoveFromLive();
  const end = useEndLiveRoom();
  const hands = people.filter((p) => p.attributes?.hand === '1');
  return (
    <aside className="absolute inset-y-0 right-0 z-10 flex w-80 max-w-[90vw] flex-col border-l border-white/10 bg-[#121019] sm:static">
      <div className="border-b border-white/10 p-4">
        <p className="font-bold">People ({people.length})</p>
        {hands.length > 0 && <p className="mt-1 flex items-center gap-1.5 text-sm text-amber-400"><Hand className="size-4" /> {hands.length} {hands.length === 1 ? 'hand' : 'hands'} up</p>}
      </div>
      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {!people.length && <li className="p-4 text-center text-sm text-white/50">Waiting for fans to join…</li>}
        {[...hands, ...people.filter((p) => !hands.includes(p))].map((p) => {
          const talking = Boolean(p.permissions?.canPublish);
          return (
            <li key={p.identity} className="flex items-center gap-2 rounded-xl p-2 hover:bg-white/5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold">{initials(p.name)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{p.name || 'Fan'}</span>
                <span className="flex items-center gap-1 text-xs text-white/50">
                  {p.attributes?.hand === '1' ? <><Hand className="size-3 text-amber-400" /> Wants to talk</> : talking ? <><Volume2 className="size-3" /> Can talk</> : 'Listening'}
                </span>
              </span>
              <button type="button" title={talking ? 'Stop them talking' : 'Let them talk'} aria-label={talking ? `Mute ${p.name}` : `Let ${p.name} talk`}
                onClick={() => speaker.mutate({ id: room._id, userId: p.identity, canSpeak: !talking })}
                className={cn('grid size-8 cursor-pointer place-items-center rounded-full', talking ? 'bg-white/10 hover:bg-white/20' : 'bg-brand text-white hover:opacity-90')}>
                {talking ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </button>
              <button type="button" title="Remove from the room" aria-label={`Remove ${p.name}`}
                onClick={() => remove.mutate({ id: room._id, userId: p.identity })}
                className="grid size-8 cursor-pointer place-items-center rounded-full text-red-400 hover:bg-red-500/15">
                <UserX className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-white/10 p-3">
        <UndoButton tone="danger" label="End room for everyone" doneLabel="Ended" icon={<X />} className="w-full" onConfirm={() => end.mutate(room._id)} />
      </div>
    </aside>
  );
}
