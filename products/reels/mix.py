"""無音のリール動画に、ナレーションとBGMを重ねる。

dist/<no>-<id>.mp4（無音）と dist/<no>-<id>.timeline.json（読み上げの時刻）、
dist/narr/<id>/*.wav（ナレーション）から、dist/final/<no>-<id>.mp4 を作る。
BGM は bgm.py で曲の長さぴったりに作り、声が出ている間は音量を下げる。
仕上げに、SNS向けの音量（約 -14 LUFS）にそろえる。

使い方：python mix.py [id ...]
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

import bgm

HERE = Path(__file__).resolve().parent
DIST = HERE / 'dist'
SR = 48000


def load_voice(path):
    a, sr = sf.read(path, dtype='float32')
    if a.ndim > 1:
        a = a.mean(axis=1)
    if sr != SR:  # 24kHz → 48kHz（単純な線形補間で十分）
        x = np.arange(len(a)) / sr
        xi = np.arange(int(len(a) * SR / sr)) / SR
        a = np.interp(xi, x, a).astype('float32')
    return a


def build(mp4: Path):
    stem = mp4.stem  # 例：1-kiroku
    rid = stem.split('-', 1)[1]
    tl = json.loads((DIST / f'{stem}.timeline.json').read_text(encoding='utf-8'))
    total = tl['total']
    n = int(total * SR)
    voice = np.zeros(n, dtype='float32')
    for line in tl['lines']:
        wav = DIST / 'narr' / rid / f"{line['key']}.wav"
        if not wav.exists():
            continue
        a = load_voice(wav)
        i = int(line['at'] * SR)
        j = min(n, i + len(a))
        voice[i:j] += a[: j - i]
    # 声をそろえる（ピークを -3dB 付近に）
    voice *= 0.7 / (np.max(np.abs(voice)) + 1e-9)
    music = bgm.make(total, 'warm')[:, 0][:n]
    if len(music) < n:
        music = np.pad(music, (0, n - len(music)))
    # 声がある間は BGM を下げる（なめらかに）
    talk = np.abs(voice) > 0.01
    win = int(0.25 * SR)
    talk = np.convolve(talk.astype('float32'), np.ones(win) / win, mode='same') > 0.02
    gain = np.where(talk, 0.16, 0.42).astype('float32')
    k = int(0.3 * SR)
    gain = np.convolve(gain, np.ones(k) / k, mode='same')
    mix = voice + music * gain
    mix /= max(1.0, np.max(np.abs(mix)) / 0.95)
    out_dir = DIST / 'final'
    out_dir.mkdir(exist_ok=True)
    wav = out_dir / f'{stem}.wav'
    sf.write(wav, np.stack([mix, mix], axis=1), SR)
    out = out_dir / f'{stem}.mp4'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(mp4), '-i', str(wav),
                    '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                    '-shortest', '-movflags', '+faststart', str(out)], check=True)
    wav.unlink()
    print('wrote', out)


if __name__ == '__main__':
    only = set(sys.argv[1:])
    for mp4 in sorted(DIST.glob('*-*.mp4')):
        if only and mp4.stem.split('-', 1)[1] not in only:
            continue
        if (DIST / f'{mp4.stem}.timeline.json').exists():
            build(mp4)
