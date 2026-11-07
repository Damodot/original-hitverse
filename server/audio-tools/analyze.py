"""Find a song's tempo, beat grid and the best places to mix in and out of it (for DJ mode).

Usage: python analyze.py <audio file>
Prints JSON: {"bpm": 104.2, "firstBeat": 0.42, "mixIn": 0.42, "mixOut": 171.3, "duration": 196.0}

- bpm / firstBeat: the beat grid. Beat n is at firstBeat + n * 60 / bpm. firstBeat is a downbeat (beat 1 of a bar).
- mixIn:  where the next song should start playing in a mix (its first downbeat).
- mixOut: where this song should start handing over to the next one. It sits on a phrase boundary (every 8 bars)
          near the start of the outro, where the energy drops, or about 30 s before the end if there's no clear outro.
"""
import json
import sys

import librosa
import numpy as np

BEATS_PER_BAR = 4
PHRASE_BEATS = 8 * BEATS_PER_BAR


FINE_HOP = 128  # about 6 ms per onset frame


def fit_grid(onset, times, period_guess, duration):
    """The beat period and offset (seconds) whose grid best matches the onset envelope."""
    best = (-1.0, period_guess, 0.0)
    for spread, steps in ((0.03, 241), (0.002, 81)):  # coarse search, then a fine one around the winner
        centre = best[1]
        for period in np.linspace(centre * (1 - spread), centre * (1 + spread), steps):
            phases = np.arange(0, period, 0.004)
            k = np.arange(int(duration / period))
            points = phases[:, None] + k[None, :] * period
            scores = np.interp(points, times, onset).mean(axis=1)
            i = int(np.argmax(scores))
            if scores[i] > best[0]:
                best = (float(scores[i]), float(period), float(phases[i]))
    return best[1], best[2]


def analyze(path):
    y, sr = librosa.load(path, sr=22050, mono=True)
    duration = len(y) / sr
    onset = librosa.onset.onset_strength(y=y, sr=sr)
    onset_fine = librosa.onset.onset_strength(y=y, sr=sr, hop_length=FINE_HOP)
    fine_times = librosa.frames_to_time(np.arange(len(onset_fine)), sr=sr, hop_length=FINE_HOP)
    tempo, beats = librosa.beat.beat_track(onset_envelope=onset, sr=sr, units="frames", tightness=120)
    tempo = float(np.atleast_1d(tempo)[0])
    beat_times = librosa.frames_to_time(beats, sr=sr)
    if len(beat_times) < 16 or tempo <= 0:
        return {"bpm": None, "firstBeat": 0.0, "mixIn": 0.0, "mixOut": max(0.0, duration - 12), "duration": duration}

    # A steady grid (produced music keeps one tempo). Rather than trust each detected beat, try tempos within 3 %
    # of the tracker's guess, at every offset, and keep the grid that lands on the most drum hits across the
    # whole song. Precise to about 0.01 BPM, so two songs stay locked together through a long blend.
    period, offset = fit_grid(onset_fine, fine_times, float(np.median(np.diff(beat_times))), duration)
    bpm = 60.0 / period

    # The downbeat is the beat position (1-4) with the strongest accents on average.
    grid = np.arange(offset, duration, period)
    strength = np.interp(grid, fine_times, onset_fine)
    phase = int(np.argmax([strength[i::BEATS_PER_BAR].mean() for i in range(BEATS_PER_BAR)]))
    first_beat = offset + phase * period
    while first_beat - BEATS_PER_BAR * period >= 0:
        first_beat -= BEATS_PER_BAR * period
    while first_beat < 0:
        first_beat += BEATS_PER_BAR * period

    # Loudness per bar, to find where the intro ends and the outro starts.
    rms = librosa.feature.rms(y=y)[0]
    rms_times = librosa.frames_to_time(np.arange(len(rms)), sr=sr)
    bar = BEATS_PER_BAR * period
    bars = np.arange(first_beat, duration - bar, bar)
    loud = np.array([rms[(rms_times >= t) & (rms_times < t + bar)].mean() for t in bars]) if len(bars) else np.array([])
    typical = float(np.median(loud)) if len(loud) else 0.0

    mix_in = first_beat

    # Phrase boundaries in the last 45 % of the song; take the first one after which the music stays quieter.
    phrase = PHRASE_BEATS * period
    candidates = [t for t in np.arange(first_beat, duration, phrase) if duration * 0.55 <= t <= duration - 8]
    mix_out = None
    for t in candidates:
        after = loud[(bars >= t) & (bars < t + phrase)]
        if len(after) and after.mean() < 0.7 * typical:
            mix_out = float(t)
            break
    if mix_out is None:
        target = duration - 30
        grid = np.arange(first_beat, duration, bar)
        mix_out = float(grid[np.argmin(np.abs(grid - target))]) if len(grid) else max(0.0, target)

    return {
        "bpm": round(bpm, 2),
        "firstBeat": round(first_beat, 3),
        "mixIn": round(mix_in, 3),
        "mixOut": round(mix_out, 3),
        "duration": round(duration, 2),
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    print(json.dumps(analyze(sys.argv[1])), flush=True)
