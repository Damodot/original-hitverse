import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PremiumUpsell } from '@/components/PremiumUpsell';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/lib/toast';
import { gql } from '@/lib/api';
import { Decks, MIX_BARS, nextDownbeat, planMix } from '@/lib/mixEngine';
import { shuffled } from '@/lib/utils';

const PlayerCtx = createContext(null);
// Playback position changes several times a second, so it lives in its own context.
// Only the seek bar and time labels re-render on every tick.
const ProgressCtx = createContext({ current: 0, duration: 0 });

const readVolume = () => {
  try {
    const v = parseFloat(localStorage.getItem('hv-volume'));
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.9;
  } catch {
    return 0.9;
  }
};

const readPref = (key, allowed, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
};
const savePref = (key, value) => {
  try { localStorage.setItem(key, String(value)); } catch { /* storage blocked */ }
};

const PRELOAD_AHEAD = 25; // seconds before a mix starts, the next song starts loading
const recordPlay = (song) => gql('mutation($id: ID!) { recordPlay(songId: $id) }', { id: song._id }).catch(() => {});

export function PlayerProvider({ children }) {
  // Two decks: one plays, the other loads the next song (DJ mode) or the karaoke beat.
  const deckA = useRef(null);
  const deckB = useRef(null);
  const decksRef = useRef(null);
  const el = useCallback(() => decksRef.current?.el ?? deckA.current, []);
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const [volume, setVolumeState] = useState(readVolume);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // off | all | one
  const [expanded, setExpanded] = useState(false);
  const [loadId, setLoadId] = useState(0);
  // Karaoke: play the beat without the vocals when the song has one. Not remembered between visits.
  // Karaoke and DJ mode are Premium: the switches only take effect for Premium accounts.
  const { user } = useAuth();
  const premium = Boolean(user?.hasPremium);
  const [upsell, setUpsell] = useState(null); // 'karaoke' | 'dj' while the Premium prompt is open
  const [karaokePref, setKaraoke] = useState(false);
  const karaoke = karaokePref && premium;
  // DJ mode: songs blend into each other. Remembered, with its settings.
  const [djPref, setDjMode] = useState(() => readPref('hv-dj', ['on', 'off'], 'off') === 'on');
  const djMode = djPref && premium;
  const [mixLength, setMixLengthState] = useState(() => readPref('hv-mix-length', Object.keys(MIX_BARS), 'medium'));
  const [beatMatch, setBeatMatchState] = useState(() => readPref('hv-beat-match', ['on', 'off'], 'on') === 'on');
  const [mixing, setMixing] = useState(null); // { to: song, seconds, mode } while two songs are blending
  const [karaokeMaking, setKaraokeMaking] = useState(() => new Set()); // song ids whose beat is being made for us
  const qc = useQueryClient();

  const current = queue[index] ?? null;
  const state = useRef({});
  state.current = { queue, index, shuffle, repeat, karaoke, djMode, mixLength, beatMatch, current, premium };
  const planned = useRef({ from: -1, to: -1 }); // the song DJ mode will mix into (fixed per song, even on shuffle)
  const mixRef = useRef({ stage: 'idle' }); // idle | loading | ready | mixing
  const handoff = useRef(null); // id of a song a mix already started, so loading it again is skipped

  const srcFor = useCallback((song) => (state.current.karaoke && song?.karaoke ? song.karaoke : song?.audio), []);

  /** Which song plays after this one: -1 at the end of the queue. On shuffle it's picked once and kept. */
  const upcoming = useCallback(() => {
    const { queue: q, index: i, shuffle: sh, repeat: rep } = state.current;
    if (!q.length) return -1;
    if (planned.current.from === i && planned.current.queue === q) return planned.current.to;
    let n = -1;
    if (sh && q.length > 1) {
      do n = Math.floor(Math.random() * q.length); while (n === i);
    } else if (i + 1 < q.length) n = i + 1;
    else if (rep === 'all') n = 0;
    planned.current = { from: i, to: n, queue: q };
    return n;
  }, []);

  /** Stops a blend in progress and keeps whichever song is playing now. */
  const stopMix = useCallback(() => {
    const m = mixRef.current;
    const d = decksRef.current;
    m.timers?.forEach(clearTimeout);
    clearInterval(m.lock);
    clearInterval(m.restore);
    if (d) {
      const other = d.idleEl;
      if (m.stage !== 'idle') {
        other.pause();
        other.removeAttribute('src');
        other.load();
      }
      d.settle();
    }
    mixRef.current = { stage: 'idle' };
    setMixing(null);
  }, []);

  useEffect(() => {
    decksRef.current = new Decks(deckA.current, deckB.current);
  }, []);

  // Load and start a track whenever the selection changes.
  useEffect(() => {
    const d = decksRef.current;
    if (!d || !current) return;
    if (handoff.current === current._id) {
      handoff.current = null; // a DJ blend already brought this song in
      recordPlay(current);
      return;
    }
    stopMix();
    const audio = d.el;
    audio.src = srcFor(current);
    audio.playbackRate = 1;
    setProgress({ current: 0, duration: current.duration || 0 });
    audio.play().catch((err) => {
      if (err.name !== 'AbortError') setIsPlaying(false);
    });
    recordPlay(current);
  }, [current?._id, loadId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    decksRef.current?.setVolume(volume, muted);
    savePref('hv-volume', volume);
  }, [volume, muted]);

  // Karaoke on/off (or a beat just published): switch to the other version without stopping the music.
  useEffect(() => {
    const d = decksRef.current;
    if (!d || !current) return;
    const want = srcFor(current);
    const a = d.el;
    if (!a.getAttribute('src') || a.getAttribute('src') === want) return;
    stopMix();
    const at = a.currentTime;
    if (a.paused) {
      a.src = want;
      a.addEventListener('loadedmetadata', () => { a.currentTime = at; }, { once: true });
      return;
    }
    const b = d.idleEl;
    const from = d.active;
    let cancelled = false;
    b.src = want;
    b.playbackRate = a.playbackRate;
    b.addEventListener('loadedmetadata', () => {
      if (cancelled) return;
      b.currentTime = a.currentTime;
      b.play().catch(() => {});
      b.addEventListener('playing', () => {
        if (cancelled) return;
        b.currentTime = a.currentTime + 0.03; // line the two versions up, then cross over in a blink
        b.addEventListener('seeked', () => {
          if (cancelled) return;
          d.crossfade(from, 1 - from, 0.12, 'swap');
          d.swap();
          setTimeout(() => { a.pause(); a.removeAttribute('src'); a.load(); d.settle(); }, 160);
        }, { once: true });
      }, { once: true });
    }, { once: true });
    return () => { cancelled = true; };
  }, [karaoke, current?._id, current?.karaoke]); // eslint-disable-line react-hooks/exhaustive-deps

  const playAt = useCallback((i) => {
    setIndex(i);
    setLoadId((n) => n + 1);
  }, []);

  /** Play `songs` as the queue, starting from `startAt` (a song or an index). */
  const playList = useCallback((songs, startAt = 0, opts = {}) => {
    const playable = songs.filter((s) => s?.audio);
    if (!playable.length) return;
    let list = opts.shuffle ? shuffled(playable) : playable;
    let start = typeof startAt === 'number' ? startAt : list.findIndex((s) => s._id === startAt?._id);
    if (start < 0) start = 0;
    if (opts.shuffle) start = 0;
    setShuffle(!!opts.shuffle || state.current.shuffle);
    if (state.current.djMode) decksRef.current?.enableMixer();
    setQueue(list);
    playAt(start);
  }, [playAt]);

  const toggle = useCallback(() => {
    const audio = el();
    if (!audio || !state.current.queue.length) {
      toast('Pick a song to start listening');
      return;
    }
    if (state.current.djMode) decksRef.current?.enableMixer(); // needs a tap or key press to start
    if (audio.paused) audio.play().catch(() => {});
    else {
      if (mixRef.current.stage === 'mixing') stopMix();
      audio.pause();
    }
  }, [el, stopMix]);

  /** Play `song` from `list`, or pause/resume if it is already the current track. */
  const playSong = useCallback((song, list) => {
    const { queue: q, index: i } = state.current;
    if (q[i]?._id === song._id) return toggle();
    playList(list ?? [song], song);
  }, [playList, toggle]);

  const next = useCallback((auto = false) => {
    const { queue: q, index: i, shuffle: sh, repeat: rep } = state.current;
    if (!q.length) return;
    if (auto && rep === 'one') return playAt(i);
    if (sh && q.length > 1) return playAt(upcoming());
    if (i + 1 < q.length) return playAt(i + 1);
    if (!auto || rep === 'all') return playAt(0);
    setIsPlaying(false);
  }, [playAt, upcoming]);

  const prev = useCallback(() => {
    const audio = el();
    const { queue: q, index: i } = state.current;
    if (!q.length) return;
    if (audio && audio.currentTime > 3) {
      stopMix();
      audio.currentTime = 0;
      return;
    }
    playAt(i > 0 ? i - 1 : q.length - 1);
  }, [el, playAt, stopMix]);

  const seek = useCallback((t) => {
    const audio = el();
    if (audio && Number.isFinite(t)) {
      if (mixRef.current.stage !== 'idle') stopMix();
      audio.currentTime = t;
      setProgress((p) => ({ ...p, current: t }));
    }
  }, [el, stopMix]);

  const cycleRepeat = useCallback(() => setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')), []);

  // ---- DJ mode -------------------------------------------------------------------------------------------
  /** Loads the next song on the free deck, cued at its first downbeat. */
  const cueNext = useCallback(() => {
    const d = decksRef.current;
    const n = upcoming();
    const song = state.current.queue[n];
    if (!d || n < 0 || !song?.audio) return null;
    const b = d.idleEl;
    b.src = srcFor(song);
    b.preload = 'auto';
    b.playbackRate = 1;
    const cue = song.mix?.mixIn ?? 0;
    b.addEventListener('loadedmetadata', () => { b.currentTime = cue; }, { once: true });
    b.load();
    mixRef.current = { stage: 'loading', index: n, song, timers: [] };
    b.addEventListener('canplay', () => { if (mixRef.current.song === song && mixRef.current.stage === 'loading') mixRef.current.stage = 'ready'; }, { once: true });
    return song;
  }, [srcFor, upcoming]);

  /** Blends from the playing song into the cued one. `now`: start on the next downbeat instead of the planned spot. */
  const beginMix = useCallback((plan) => {
    const d = decksRef.current;
    const m = mixRef.current;
    if (!d || m.stage === 'mixing') return;
    const { song, index: n } = m;
    const a = d.el;
    const b = d.idleEl;
    const from = d.active;
    const to = d.idle;
    const outgoing = state.current.current;
    d.enableMixer();
    const aRate = a.playbackRate || 1;
    const rate = plan.match ? plan.match.rate : 1;
    const realSeconds = plan.seconds / aRate;
    // Start B exactly on A's downbeat: wait for it, then keep the two beats locked by nudging B's speed.
    const startIn = Math.max(0, (plan.start - a.currentTime) / aRate);
    m.stage = 'mixing';
    setMixing({ to: song, seconds: realSeconds, mode: plan.mode });
    const later = (ms, fn) => m.timers.push(setTimeout(fn, ms));
    later(startIn * 1000, () => {
      if (mixRef.current !== m) return;
      b.currentTime = song.mix?.mixIn ?? 0;
      b.playbackRate = rate;
      b.play().catch(() => {});
      d.crossfade(from, to, realSeconds, plan.mode);
      if (plan.match && outgoing?.mix?.bpm) {
        const periodA = 60 / outgoing.mix.bpm;
        const startedAt = performance.now();
        m.lock = setInterval(() => {
          if (b.paused || a.paused) return;
          const beatsA = (a.currentTime - outgoing.mix.firstBeat) / periodA;
          const beatsB = (b.currentTime - song.mix.firstBeat) / plan.match.period;
          let error = (beatsA - beatsB) % 4; // in beats, kept within one bar
          if (error > 2) error -= 4;
          if (error < -2) error += 4;
          if (Math.abs(error) > 0.35 && performance.now() - startedAt < 1500) {
            b.currentTime += error * plan.match.period; // still quiet: jump straight onto the beat
          } else {
            b.playbackRate = rate * (1 + Math.max(-0.04, Math.min(0.04, error * 0.25)));
          }
        }, 100);
      }
      // Halfway, the new song takes over the player (title, lyrics, controls).
      later((realSeconds / 2) * 1000, () => {
        if (mixRef.current !== m) return;
        d.swap();
        handoff.current = song._id;
        setIndex(n);
        setIsPlaying(true);
        setProgress({ current: b.currentTime, duration: b.duration || song.duration || 0 });
      });
      later(realSeconds * 1000 + 80, () => {
        if (mixRef.current !== m) return;
        clearInterval(m.lock);
        a.pause();
        a.removeAttribute('src');
        a.load();
        d.settle();
        mixRef.current = { stage: 'idle' };
        setMixing(null);
        // Ease the new song back to its own tempo over about ten seconds.
        const target = 1;
        const restore = setInterval(() => {
          const r = b.playbackRate;
          if (Math.abs(r - target) < 0.002 || mixRef.current.stage !== 'idle' || decksRef.current?.el !== b) {
            if (decksRef.current?.el === b && mixRef.current.stage === 'idle') b.playbackRate = target;
            clearInterval(restore);
            return;
          }
          b.playbackRate = r + Math.sign(target - r) * Math.min(Math.abs(target - r), 0.002);
        }, 250);
        mixRef.current.restore = restore;
      });
    });
  }, []);

  /** Called as the song plays: cue the next one in time, then start the blend at the planned spot. */
  const onDjTick = useCallback((t, duration) => {
    const { djMode: on, current: song, queue: q, repeat: rep } = state.current;
    if (!on || !song || rep === 'one' || !Number.isFinite(duration)) return;
    const m = mixRef.current;
    if (m.stage === 'mixing') return;
    const n = upcoming();
    if (n < 0 || !q[n]) return;
    const plan = planMix(song, q[n], { length: state.current.mixLength, beatMatch: state.current.beatMatch }, duration);
    if (m.stage === 'idle' && t >= plan.start - PRELOAD_AHEAD) cueNext();
    else if (m.stage === 'ready' && m.song === q[n] && t >= plan.start - 0.6) {
      // Past the planned spot (a seek into the outro, or the next song loaded late): use the next downbeat,
      // and skip the blend if the song is about to end anyway.
      let { start, seconds } = plan;
      if (t > start - 0.3) {
        start = song.mix?.bpm ? nextDownbeat(song.mix, t + 0.4) : t + 0.4;
        seconds = Math.min(seconds, duration - start - 0.3);
      }
      if (seconds >= 2) beginMix({ ...plan, start, seconds });
    }
  }, [beginMix, cueNext, upcoming]);

  /** "Mix now": blend into the next song from the next downbeat. */
  const mixNow = useCallback(() => {
    const d = decksRef.current;
    const { current: song, queue: q } = state.current;
    if (!d || !song) return;
    if (mixRef.current.stage === 'mixing') return;
    const n = upcoming();
    if (n < 0) { toast('Nothing to mix into: this is the last song'); return; }
    d.enableMixer();
    const go = () => {
      const a = d.el;
      const plan = planMix(song, q[n], { length: state.current.mixLength, beatMatch: state.current.beatMatch }, a.duration);
      const t = a.currentTime + 0.5;
      const start = song.mix?.bpm ? nextDownbeat(song.mix, t) : t;
      const remaining = (a.duration || song.duration) - start - 0.3;
      beginMix({ ...plan, start, seconds: Math.max(2, Math.min(plan.seconds, remaining)) });
    };
    const m = mixRef.current;
    if (m.stage === 'ready' && m.song === q[n]) return go();
    cueNext();
    d.idleEl.addEventListener('canplay', go, { once: true });
  }, [beginMix, cueNext, upcoming]);

  const toggleDj = useCallback(() => {
    if (!state.current.premium) { setUpsell('dj'); return; }
    const next = !state.current.djMode;
    setDjMode(next);
    savePref('hv-dj', next ? 'on' : 'off');
    if (next) decksRef.current?.enableMixer();
    else stopMix();
    toast(next ? 'DJ mode on: songs blend into each other' : 'DJ mode off', { id: 'dj', duration: 2000 });
  }, [stopMix]);
  const setMixLength = useCallback((v) => { setMixLengthState(v); savePref('hv-mix-length', v); }, []);
  const setBeatMatch = useCallback((v) => { setBeatMatchState(v); savePref('hv-beat-match', v ? 'on' : 'off'); }, []);
  // ---- Karaoke on demand ----------------------------------------------------------------------------------
  // A song without a beat gets one when a fan asks: the server removes the vocals (about a minute) and the player
  // switches over by itself when it's ready, without stopping the music.
  const asked = useRef(new Set());
  const polls = useRef(new Map());
  useEffect(() => () => polls.current.forEach(clearInterval), []);

  const applyBeat = useCallback((id, url) => {
    setQueue((q) => q.map((x) => (x._id === id ? { ...x, karaoke: url, karaokeState: 'ready' } : x)));
    setKaraokeMaking((m) => { const n = new Set(m); n.delete(id); return n; });
    qc.invalidateQueries({ queryKey: ['songs'] });
    qc.invalidateQueries({ queryKey: ['album'] });
  }, [qc]);

  const stopWaiting = useCallback((id) => {
    clearInterval(polls.current.get(id));
    polls.current.delete(id);
    asked.current.delete(id);
    setKaraokeMaking((m) => { const n = new Set(m); n.delete(id); return n; });
  }, []);

  const requestBeat = useCallback(async (song) => {
    if (!song || asked.current.has(song._id)) return;
    asked.current.add(song._id);
    try {
      const { requestKaraoke: r } = await gql('mutation($id: ID!) { requestKaraoke(songId: $id) { karaoke karaokeState } }', { id: song._id });
      if (r.karaoke) {
        asked.current.delete(song._id);
        return applyBeat(song._id, r.karaoke);
      }
      setKaraokeMaking((m) => new Set(m).add(song._id));
      toast(`Making the karaoke beat for “${song.title}”`, { id: `beat-${song._id}`, description: 'About a minute. Keep listening: it switches over by itself.', duration: 5000 });
      const started = Date.now();
      polls.current.set(song._id, setInterval(async () => {
        try {
          const { song: now } = await gql('query($id: ID!) { song(id: $id) { karaoke karaokeState } }', { id: song._id });
          if (now?.karaoke) {
            stopWaiting(song._id);
            applyBeat(song._id, now.karaoke);
            if (state.current.current?._id === song._id && state.current.karaoke) toast.success('Karaoke beat ready: sing it!', { id: `beat-${song._id}` });
          } else if (!now || now.karaokeState === 'failed' || now.karaokeState === 'off' || Date.now() - started > 6 * 60_000) {
            stopWaiting(song._id);
            toast.error(`Couldn’t make a karaoke beat for “${song.title}”`, { id: `beat-${song._id}` });
          }
        } catch { /* try again on the next tick */ }
      }, 4000));
    } catch (err) {
      asked.current.delete(song._id);
      toast.error(err.message, { id: `beat-${song._id}` });
      if (state.current.current?._id === song._id) setKaraoke(false);
    }
  }, [applyBeat, stopWaiting]);

  const toggleKaraoke = useCallback(() => {
    const { karaoke: on, current: song } = state.current;
    if (on) {
      setKaraoke(false);
      toast('Karaoke off: vocals are back', { id: 'karaoke', duration: 2000 });
      return;
    }
    if (!song) return;
    if (!state.current.premium) { setUpsell('karaoke'); return; }
    if (song.karaokeState === 'unavailable') return toast('This is a 30-second preview, so it can’t do karaoke yet');
    if (song.karaokeState === 'off') return toast('The artist turned karaoke off for this song');
    setKaraoke(true);
    if (song.karaoke) toast('Karaoke on: the beat is yours', { id: 'karaoke', duration: 2000 });
    else requestBeat(song);
  }, [requestBeat]);

  // Karaoke stays on from song to song: any song without a beat gets one made.
  useEffect(() => {
    if (karaoke && current && !current.karaoke && !['off', 'unavailable'].includes(current.karaokeState)) requestBeat(current);
  }, [karaoke, current?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Settings changed or the queue moved: plan the next blend again.
  useEffect(() => {
    if (mixRef.current.stage === 'loading' || mixRef.current.stage === 'ready') stopMix();
  }, [djMode, queue, shuffle, repeat, index, mixLength, beatMatch, karaoke]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock-screen and headphone controls.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: 'HitVerse',
      artwork: [{ src: current.cover, sizes: '800x800', type: 'image/webp' }],
    });
    const handlers = {
      play: () => el()?.play(),
      pause: () => el()?.pause(),
      previoustrack: prev,
      nexttrack: () => next(),
      seekto: (e) => seek(e.seekTime),
    };
    for (const [k, fn] of Object.entries(handlers)) {
      try { navigator.mediaSession.setActionHandler(k, fn); } catch { /* unsupported action */ }
    }
  }, [current, next, prev, seek, el]);

  // Keep the OS media controls (keyboard media keys, lock screen, headphones) showing the right state.
  useEffect(() => {
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = current ? (isPlaying ? 'playing' : 'paused') : 'none';
  }, [current, isPlaying]);

  // Keyboard shortcuts (like SoundCloud's):
  //   Space or K   play / pause          M            mute
  //   Shift + ↑/↓  volume up / down      Shift + →/←  next / previous track
  //   ← / →        back / forward 5 s
  // A control you clicked with the mouse keeps focus, so without this Space would press that control again
  // (re-click a Dock item, toggle a like) instead of pausing. Space only goes to a control you reached with Tab.
  const volumeRef = useRef(volume);
  volumeRef.current = muted ? 0 : volume;
  useEffect(() => {
    const TYPING = 'input:not([type=checkbox]):not([type=radio]):not([type=range]), textarea, select, [contenteditable="true"], [contenteditable=""]';
    const CONTROL = 'button, a[href], [role="slider"], [role="tab"], [role="menuitem"], [role="option"], [role="switch"], [role="checkbox"], [tabindex]:not([tabindex="-1"])';
    let swallowKeyUp = false;
    // Chrome counts any key press as "keyboard focus", so remember ourselves how each element got focus.
    let lastInput = 'keyboard';
    const focusedBy = new WeakMap();
    const onPointerDown = () => { lastInput = 'pointer'; };
    const onFocusIn = (e) => focusedBy.set(e.target, lastInput);
    const nudgeVolume = (delta) => {
      const next = Math.round(Math.min(1, Math.max(0, volumeRef.current + delta)) * 100) / 100;
      setVolumeState(next);
      setMuted(next === 0);
      toast(`Volume ${Math.round(next * 100)}%`, { id: 'volume', duration: 1200 });
    };
    const onKey = (e) => {
      if (e.key === 'Tab') lastInput = 'keyboard';
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target instanceof Element ? e.target : document.body;
      if (el.closest(TYPING)) return;
      const control = el.closest(CONTROL);
      const keyboardFocused = !!control && focusedBy.get(document.activeElement) === 'keyboard';
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      if (key === ' ' || key === 'k') {
        if (key === ' ' && keyboardFocused) return; // let the focused control do its job
        e.preventDefault();
        e.stopPropagation();
        swallowKeyUp = key === ' '; // a focused button would otherwise "click" on key up
        if (!e.repeat) toggle();
        return;
      }
      if (e.repeat && !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;
      if (key === 'm') {
        e.preventDefault();
        e.stopPropagation();
        setMuted((m) => {
          toast(m ? 'Sound on' : 'Muted', { id: 'volume', duration: 1200 });
          return !m;
        });
        return;
      }
      if (keyboardFocused && el.closest('[role="slider"], [role="tab"], [role="menuitem"]')) return; // they use arrows themselves
      if (e.shiftKey && (key === 'ArrowUp' || key === 'ArrowDown')) {
        e.preventDefault();
        e.stopPropagation();
        nudgeVolume(key === 'ArrowUp' ? 0.1 : -0.1);
      } else if (e.shiftKey && key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat) next();
      } else if (e.shiftKey && key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        if (!e.repeat) prev();
      } else if (!e.shiftKey && (key === 'ArrowRight' || key === 'ArrowLeft') && state.current.queue.length && !(keyboardFocused && el.closest('[role="toolbar"]'))) {
        const audio = el();
        if (!audio || !Number.isFinite(audio.duration)) return;
        e.preventDefault();
        e.stopPropagation();
        seek(Math.min(audio.duration, Math.max(0, audio.currentTime + (key === 'ArrowRight' ? 5 : -5))));
      }
    };
    const onKeyUp = (e) => {
      if (swallowKeyUp && e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        swallowKeyUp = false;
      }
    };
    // Capture phase: runs before any focused control sees the key; handled keys stop here.
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('focusin', onFocusIn, true);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('focusin', onFocusIn, true);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [toggle, next, prev, seek, el]);

  // Exact playback position, for things that need more precision than the progress updates (synced lyrics).
  const getTime = useCallback(() => el()?.currentTime ?? 0, [el]);

  const value = useMemo(() => ({
    queue, index, current, isPlaying, isLoading, volume, muted, shuffle, repeat, expanded,
    playList, playSong, toggle, next, prev, seek, playAt, getTime,
    setVolume: setVolumeState, setMuted, setShuffle, cycleRepeat, setExpanded,
    karaoke, toggleKaraoke, karaokeMaking, djMode, toggleDj, mixLength, setMixLength, beatMatch, setBeatMatch, mixing, mixNow, premium,
  }), [queue, index, current, isPlaying, isLoading, volume, muted, shuffle, repeat, expanded,
    playList, playSong, toggle, next, prev, seek, playAt, getTime, cycleRepeat,
    karaoke, toggleKaraoke, karaokeMaking, djMode, toggleDj, mixLength, setMixLength, beatMatch, setBeatMatch, mixing, mixNow, premium]);

  return (
    <PlayerCtx.Provider value={value}>
      <ProgressCtx.Provider value={progress}>
        {children}
        <PremiumUpsell feature={upsell} onClose={() => setUpsell(null)} />
        {[deckA, deckB].map((ref, i) => {
          // Only the playing deck reports to the player; the other one is loading or fading out.
          const live = (fn) => (e) => { if (decksRef.current ? decksRef.current.active === i : i === 0) fn(e); };
          return (
            <audio
              key={i}
              ref={ref}
              preload="metadata"
              onPlay={live(() => setIsPlaying(true))}
              onPause={live(() => setIsPlaying(false))}
              onWaiting={live(() => setIsLoading(true))}
              onPlaying={live(() => setIsLoading(false))}
              onCanPlay={live(() => setIsLoading(false))}
              onEnded={live(() => next(true))}
              onError={live((e) => {
                if (e.currentTarget.getAttribute('src')) toast.error('This track could not be loaded');
                setIsLoading(false);
              })}
              onTimeUpdate={live((e) => {
                const t = e.currentTarget.currentTime;
                setProgress((p) => ({ ...p, current: t }));
                onDjTick(t, e.currentTarget.duration);
              })}
              onDurationChange={live((e) => {
                const d = e.currentTarget.duration;
                if (Number.isFinite(d)) setProgress((p) => ({ ...p, duration: d }));
              })}
            />
          );
        })}
      </ProgressCtx.Provider>
    </PlayerCtx.Provider>
  );
}

export const usePlayer = () => useContext(PlayerCtx);
export const useProgress = () => useContext(ProgressCtx);
