// Two audio decks for DJ mode and karaoke. One deck plays; the other loads the next song (or the karaoke beat)
// and the engine blends them like a DJ: tempo matched, beats locked together, bass swapped halfway.
//
// The decks are plain <audio> elements. They're only routed through the Web Audio mixer once DJ mode is turned
// on, because phones (iPhones especially) pause Web Audio when the screen locks, and normal playback should keep
// going in the background.

export const MIX_BARS = { short: 4, medium: 8, long: 16 };
const BEATS_PER_BAR = 4;
const MAX_TEMPO_CHANGE = 0.08; // stretch a song's tempo by up to 8 % to match the other
const BASS_CUT_DB = -26;

/** How to play song B so its beat matches song A: { rate, period (B's beat length in its own seconds) } or null. */
export function tempoMatch(mixA, mixB) {
  if (!mixA?.bpm || !mixB?.bpm) return null;
  let best = null;
  for (const factor of [1, 2, 0.5]) { // songs a tempo-octave apart (68 vs 136 BPM) still lock together
    const rate = mixA.bpm / (mixB.bpm * factor);
    if (!best || Math.abs(rate - 1) < Math.abs(best.rate - 1)) best = { rate, period: 60 / (mixB.bpm * factor) };
  }
  return Math.abs(best.rate - 1) <= MAX_TEMPO_CHANGE ? best : null;
}

const bar = (mix) => (BEATS_PER_BAR * 60) / mix.bpm;
/** The first downbeat at or after `t` in a song's own time. */
export function nextDownbeat(mix, t) {
  const b = bar(mix);
  return mix.firstBeat + Math.max(0, Math.ceil((t - mix.firstBeat - 1e-3) / b)) * b;
}
const prevDownbeat = (mix, t) => mix.firstBeat + Math.max(0, Math.floor((t - mix.firstBeat) / bar(mix))) * bar(mix);

/**
 * Where and how to mix from song A into song B.
 * Returns { start (A's time to begin), seconds (length in A's time), mode: 'blend' | 'fade', match }.
 */
export function planMix(a, b, { length = 'medium', beatMatch = true } = {}, durationA) {
  const duration = durationA || a.duration || 0;
  const match = beatMatch ? tempoMatch(a.mix, b.mix) : null;
  if (match) {
    const seconds = MIX_BARS[length] * bar(a.mix);
    let start = a.mix.mixOut ?? duration - seconds;
    if (start + seconds > duration - 0.5) start = duration - 0.5 - seconds;
    start = prevDownbeat(a.mix, start);
    if (start > duration * 0.4) return { start, seconds, mode: 'blend', match };
  }
  // Tempos too far apart (or unknown): a quicker fade, sweeping the outgoing song's bass and mids away.
  const seconds = Math.min(8, Math.max(3, duration * 0.08));
  let start = a.mix?.mixOut ?? duration - seconds - 1;
  if (start + seconds > duration - 0.3) start = duration - 0.3 - seconds;
  if (a.mix?.bpm) start = prevDownbeat(a.mix, start);
  return { start: Math.max(0, start), seconds, mode: 'fade', match: null };
}

export class Decks {
  constructor(a, b) {
    this.els = [a, b];
    this.active = 0;
    this.levels = [1, 0];
    this.volume = 1;
    this.muted = false;
    this.ctx = null;
    this.fallbackTimer = null;
  }

  get el() { return this.els[this.active]; }
  get idle() { return 1 - this.active; }
  get idleEl() { return this.els[this.idle]; }
  get mixer() { return Boolean(this.ctx); }

  /** Routes both decks through the Web Audio mixer (needed for smooth blends and the bass swap). */
  enableMixer() {
    if (this.ctx) {
      if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
      return true;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    try {
      const ctx = new Ctx({ latencyHint: 'playback' });
      const master = ctx.createGain();
      master.connect(ctx.destination);
      this.nodes = this.els.map((el) => {
        const source = ctx.createMediaElementSource(el);
        const bass = ctx.createBiquadFilter();
        bass.type = 'lowshelf';
        bass.frequency.value = 180;
        const sweep = ctx.createBiquadFilter();
        sweep.type = 'highpass';
        sweep.frequency.value = 10;
        const gain = ctx.createGain();
        source.connect(bass).connect(sweep).connect(gain).connect(master);
        el.volume = 1;
        el.muted = false;
        return { bass, sweep, gain };
      });
      this.ctx = ctx;
      this.master = master;
      this.levels.forEach((v, i) => { this.nodes[i].gain.gain.value = v; });
      this.applyVolume();
      return true;
    } catch {
      return false;
    }
  }

  setVolume(volume, muted) {
    this.volume = volume;
    this.muted = muted;
    this.applyVolume();
  }

  applyVolume() {
    if (this.ctx) {
      const g = this.master.gain;
      g.cancelScheduledValues(0);
      g.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.015);
    } else {
      this.els.forEach((el, i) => {
        el.volume = Math.min(1, Math.max(0, this.volume * this.levels[i]));
        el.muted = this.muted;
      });
    }
  }

  /** Puts both decks back to normal: the playing deck at full level, the other silent, no filters. */
  settle() {
    clearInterval(this.fallbackTimer);
    this.levels = this.els.map((_, i) => (i === this.active ? 1 : 0));
    if (this.ctx) {
      const now = this.ctx.currentTime;
      this.nodes.forEach((n, i) => {
        for (const p of [n.gain.gain, n.bass.gain, n.sweep.frequency]) p.cancelScheduledValues(0);
        n.gain.gain.setValueAtTime(this.levels[i], now);
        n.bass.gain.setValueAtTime(0, now);
        n.sweep.frequency.setValueAtTime(10, now);
      });
    } else {
      this.applyVolume();
    }
  }

  /**
   * Fades deck `from` out and deck `to` in over `seconds` (real time).
   * 'blend': equal-power crossfade; the incoming song's bass stays out until halfway, then the basslines swap.
   * 'fade':  the outgoing song is swept away with a high-pass filter while the new one fades in.
   * 'swap':  a very short crossfade (karaoke on/off).
   */
  crossfade(from, to, seconds, mode = 'blend') {
    const steps = 64;
    const out = new Float32Array(steps);
    const inn = new Float32Array(steps);
    for (let i = 0; i < steps; i++) {
      const x = i / (steps - 1);
      out[i] = Math.cos((x * Math.PI) / 2);
      inn[i] = Math.sin((x * Math.PI) / 2);
    }
    this.levels[from] = 0;
    this.levels[to] = 1;
    if (!this.ctx) {
      // No Web Audio: step the element volumes instead.
      clearInterval(this.fallbackTimer);
      const started = performance.now();
      const tick = () => {
        const x = Math.min(1, (performance.now() - started) / (seconds * 1000));
        this.els[from].volume = this.volume * Math.cos((x * Math.PI) / 2);
        this.els[to].volume = this.volume * Math.sin((x * Math.PI) / 2);
        if (x >= 1) clearInterval(this.fallbackTimer);
      };
      tick();
      this.fallbackTimer = setInterval(tick, 40);
      return;
    }
    const t0 = this.ctx.currentTime + 0.01;
    const a = this.nodes[from];
    const b = this.nodes[to];
    for (const p of [a.gain.gain, b.gain.gain, a.bass.gain, b.bass.gain, a.sweep.frequency, b.sweep.frequency]) p.cancelScheduledValues(0);
    a.gain.gain.setValueCurveAtTime(out, t0, seconds);
    b.gain.gain.setValueCurveAtTime(inn, t0, seconds);
    b.sweep.frequency.setValueAtTime(10, t0);
    if (mode === 'blend') {
      const mid = t0 + seconds / 2;
      a.bass.gain.setValueAtTime(0, t0);
      b.bass.gain.setValueAtTime(BASS_CUT_DB, t0);
      a.bass.gain.setTargetAtTime(BASS_CUT_DB, mid, 0.04);
      b.bass.gain.setTargetAtTime(0, mid, 0.04);
      a.sweep.frequency.setValueAtTime(10, t0);
    } else if (mode === 'fade') {
      a.bass.gain.setValueAtTime(0, t0);
      b.bass.gain.setValueAtTime(0, t0);
      a.sweep.frequency.setValueAtTime(10, t0);
      a.sweep.frequency.exponentialRampToValueAtTime(1800, t0 + seconds);
    } else {
      a.bass.gain.setValueAtTime(0, t0);
      b.bass.gain.setValueAtTime(0, t0);
      a.sweep.frequency.setValueAtTime(10, t0);
    }
  }

  swap() {
    this.active = this.idle;
  }
}
