"""無音のリール動画に、ナレーション・効果音・BGMを重ねる。

入力：dist/<no>-<id>.mp4（無音）・dist/<no>-<id>.timeline.json（読み上げと効果音の時刻）・dist/narr/<id>/*.wav
出力：
  dist/final/<no>-<id>.mp4        … 声＋効果音＋BGM（そのまま投稿できる）
  dist/final-voice/<no>-<id>.mp4  … 声＋効果音だけ（インスタの音源を足して使う用）
BGM と効果音は music.py で作る（自作の曲を、MITライセンスの楽器音源で鳴らす）。声が出ている間は BGM を下げる。
仕上げに、SNS向けの音量（約 -14 LUFS）にそろえる。

使い方：python mix.py [id ...]
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf

import music

HERE = Path(__file__).resolve().parent
DIST = HERE / 'dist'
SR = 48000
SFX_DIR = DIST / 'sfx'
SFX_GAIN = {'tap': 0.45, 'done': 0.6, 'open': 0.45}


def load(path, mono=True):
    a, sr = sf.read(path, dtype='float32')
    if mono and a.ndim > 1:
        a = a.mean(axis=1)
    if sr != SR:
        x = np.arange(len(a)) / sr
        xi = np.arange(int(len(a) * SR / sr)) / SR
        a = np.interp(xi, x, a).astype('float32') if a.ndim == 1 else np.stack([np.interp(xi, x, a[:, c]) for c in range(a.shape[1])], 1).astype('float32')
    return a


def place(buf, a, at):
    i = int(at * SR)
    j = min(len(buf), i + len(a))
    if i < len(buf) and j > i:
        buf[i:j] += a[: j - i]


def encode(mp4, wav, out):
    out.parent.mkdir(exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(mp4), '-i', str(wav),
                    '-af', 'loudnorm=I=-14:TP=-1.5:LRA=9', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                    '-shortest', '-movflags', '+faststart', str(out)], check=True)


def build(mp4: Path):
    stem = mp4.stem
    rid = stem.split('-', 1)[1]
    tl = json.loads((DIST / f'{stem}.timeline.json').read_text(encoding='utf-8'))
    total = tl['total']
    n = int(total * SR)
    voice = np.zeros(n, dtype='float32')
    for line in tl['lines']:
        wav = DIST / 'narr' / rid / f"{line['key']}.wav"
        if wav.exists():
            place(voice, load(wav), line['at'])
    voice *= 0.72 / (np.max(np.abs(voice)) + 1e-9)
    fx = np.zeros(n, dtype='float32')
    for e in tl.get('sfx', []):
        place(fx, load(SFX_DIR / f"{e['key']}.wav") * SFX_GAIN[e['key']], e['at'])

    with tempfile.TemporaryDirectory() as d:
        bgm_path = Path(d) / 'bgm.wav'
        sf.write(bgm_path, np.zeros((10, 2)), SR)  # 置き場所の確保
        music.render(music.bgm(total + 2), bgm_path)
        bgm = load(bgm_path)[:n]
        if len(bgm) < n:
            bgm = np.pad(bgm, (0, n - len(bgm)))
        fo = int(1.2 * SR)
        bgm[-fo:] *= np.linspace(1, 0, fo)
        bgm /= np.max(np.abs(bgm)) + 1e-9
        # 声がある間は BGM を下げる
        talk = np.abs(voice) > 0.01
        win = int(0.25 * SR)
        talk = np.convolve(talk.astype('float32'), np.ones(win) / win, mode='same') > 0.02
        gain = np.where(talk, 0.2, 0.45).astype('float32')
        k = int(0.25 * SR)
        gain = np.convolve(gain, np.ones(k) / k, mode='same')

        for name, mix in (('final', voice + fx + bgm * gain), ('final-voice', voice + fx)):
            mix = mix / max(1.0, np.max(np.abs(mix)) / 0.95)
            wav = Path(d) / f'{name}.wav'
            sf.write(wav, np.stack([mix, mix], axis=1), SR)
            encode(mp4, wav, DIST / name / f'{stem}.mp4')
    print('wrote', stem)


if __name__ == '__main__':
    if not (SFX_DIR / 'tap.wav').exists():
        music.sfx(SFX_DIR)
    only = set(sys.argv[1:])
    for mp4 in sorted(DIST.glob('*-*.mp4')):
        if only and mp4.stem.split('-', 1)[1] not in only:
            continue
        if (DIST / f'{mp4.stem}.timeline.json').exists():
            build(mp4)
