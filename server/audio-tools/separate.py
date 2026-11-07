"""Split a song into its instrumental (the beat) and its vocals with Demucs (open source, runs on our own server).

Usage: python separate.py <input.wav> <instrumental.wav> [vocals.wav]
The input is 44.1 kHz stereo WAV (the API converts the song with ffmpeg first).
Prints one JSON line when done: {"ok": true, "device": "...", "seconds": 42.1}
"""
import json
import os
import sys
import time

os.environ.setdefault("PYTORCH_ENABLE_MPS_FALLBACK", "1")

import soundfile as sf  # noqa: E402
import torch  # noqa: E402
from demucs.apply import apply_model  # noqa: E402
from demucs.pretrained import get_model  # noqa: E402


def pick_device():
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def separate(src, inst_out, vocals_out=None, device=None):
    started = time.time()
    device = device or pick_device()
    model = get_model("htdemucs")
    model.eval()
    audio, rate = sf.read(src, always_2d=True, dtype="float32")
    if rate != model.samplerate:
        raise SystemExit(f"expected {model.samplerate} Hz audio, got {rate}")
    mix = torch.from_numpy(audio.T.copy())  # (channels, samples)
    if mix.shape[0] == 1:
        mix = mix.repeat(2, 1)
    # Demucs works on normalised audio; undo it afterwards.
    ref = mix.mean(0)
    mean, std = ref.mean(), ref.std() + 1e-8
    with torch.no_grad():
        stems = apply_model(model, ((mix - mean) / std)[None], device=device, shifts=1, split=True, overlap=0.25, progress=False)[0]
    stems = stems * std + mean
    vocals_index = model.sources.index("vocals")
    beat = sum(stems[i] for i in range(len(model.sources)) if i != vocals_index)
    peak = beat.abs().max().item()
    if peak > 0.999:  # avoid clipping when the stems add up louder than the original
        beat = beat * (0.999 / peak)
    sf.write(inst_out, beat.cpu().numpy().T, rate, subtype="PCM_16")
    if vocals_out:
        sf.write(vocals_out, stems[vocals_index].cpu().numpy().T, rate, subtype="PCM_16")
    return {"ok": True, "device": device, "seconds": round(time.time() - started, 1)}


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    try:
        result = separate(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
    except RuntimeError as err:
        # Some Apple GPU builds miss an operation; the CPU always works, just slower.
        if "mps" not in str(err).lower():
            raise
        result = separate(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None, device="cpu")
    print(json.dumps(result), flush=True)
