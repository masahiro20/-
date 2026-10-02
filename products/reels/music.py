"""リール用のBGMと効果音を作る（自作の曲を、本物の楽器の音源で鳴らす）。

曲：明るく弾むポップス（ハ長調・118BPM）。ピチカート・ナイロンギター・グロッケン・マリンバ・ベース・手拍子。
進行は C → G → Am → F（いちばん親しみやすい王道の進行）。メロディはペンタトニックで、くり返し覚えやすく。
音源：FluidR3_GM（MITライセンス）。apt install fluidsynth fluid-soundfont-gm

使い方：
  python music.py bgm <出力.wav> <秒数>
  python music.py sfx <出力フォルダ>     … tap.wav（タップの「ポン」）・done.wav（完成の「キラーン」）・open.wav（はじまりの合図）
"""
import subprocess
import sys
import tempfile
from pathlib import Path

import mido
import numpy as np
import soundfile as sf

SF2 = '/usr/share/sounds/sf2/FluidR3_GM.sf2'
SR = 48000
BPM = 118
TPB = 480  # 1拍のティック数


def render(mid, out, gain='0.6'):
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / 'x.mid'
        mid.save(p)
        subprocess.run(['fluidsynth', '-ni', '-g', gain, '-r', str(SR), '-F', str(out), SF2, str(p)],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


class Song:
    def __init__(self):
        self.mid = mido.MidiFile(ticks_per_beat=TPB)
        self.events = {}  # ch -> [(tick, msg)]

    def program(self, ch, prog, vol=100, pan=64, reverb=40):
        ev = self.events.setdefault(ch, [])
        ev += [(0, mido.Message('program_change', channel=ch, program=prog)),
               (0, mido.Message('control_change', channel=ch, control=7, value=vol)),
               (0, mido.Message('control_change', channel=ch, control=10, value=pan)),
               (0, mido.Message('control_change', channel=ch, control=91, value=reverb))]

    def note(self, ch, beat, length, n, vel=90):
        ev = self.events.setdefault(ch, [])
        t0 = int(beat * TPB)
        t1 = int((beat + length) * TPB)
        ev.append((t0, mido.Message('note_on', channel=ch, note=n, velocity=vel)))
        ev.append((t1, mido.Message('note_off', channel=ch, note=n, velocity=0)))

    def build(self):
        tempo = mido.MidiTrack()
        tempo.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(BPM), time=0))
        self.mid.tracks.append(tempo)
        for ch, ev in self.events.items():
            tr = mido.MidiTrack()
            ev.sort(key=lambda x: (x[0], 0 if x[1].type in ('program_change', 'control_change') else (1 if x[1].type == 'note_off' else 2)))
            last = 0
            for t, m in ev:
                tr.append(m.copy(time=t - last))
                last = t
            self.mid.tracks.append(tr)
        return self.mid


# コード：ルート（ベース）と、和音の構成音
CHORDS = {
    'C': (48, [60, 64, 67]), 'G': (43, [59, 62, 67]), 'Am': (45, [57, 60, 64]), 'F': (41, [57, 60, 65]),
    'Dm': (50, [57, 62, 65]), 'Em': (52, [59, 64, 67]),
}
PROG = ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C']
# メロディ（8分音符ずつ。None は休み）。2小節で1フレーズ
MELODY = [
    [76, None, 79, 81, 79, None, 76, 74], [74, None, 76, 74, 71, None, 67, None],
    [72, 76, 81, None, 79, 76, None, 79], [77, 76, 74, 72, 74, None, None, None],
    [76, None, 79, 81, 79, None, 76, 74], [74, None, 76, 79, 81, None, 79, None],
    [77, None, 76, 74, 72, None, 74, 76], [72, None, None, None, 79, None, 84, None],
]


def bgm(seconds):
    s = Song()
    s.program(0, 45, 92, 40)   # ピチカート（伴奏の刻み）
    s.program(1, 24, 78, 88)   # ナイロンギター（裏拍のストローク）
    s.program(2, 9, 92, 70, 60)  # グロッケン（メロディ）
    s.program(3, 12, 70, 58, 50)  # マリンバ（メロディを1オクターブ下で重ねる）
    s.program(4, 32, 100, 64, 20)  # アコースティックベース
    s.program(9, 0, 95, 64, 30)  # ドラム（ch10）
    beats = seconds * BPM / 60
    bars = int(np.ceil(beats / 4)) + 1
    for b in range(bars):
        name = PROG[b % len(PROG)]
        root, tones = CHORDS[name]
        base = b * 4
        intro = b == 0
        # ベース：1拍目と3拍目、3拍目の裏で5度
        s.note(4, base, 1.4, root, 100)
        s.note(4, base + 2, 0.9, root, 88)
        s.note(4, base + 3.5, 0.45, root + 7, 80)
        # ピチカート：8分で分散和音
        for k in range(8):
            s.note(0, base + k * 0.5, 0.4, tones[[0, 1, 2, 1][k % 4]] + 12, 70 if k % 2 else 86)
        # ギター：2拍目・4拍目の裏で軽く
        if not intro:
            for off in (1.5, 3.5):
                for i, n in enumerate(tones):
                    s.note(1, base + off + i * 0.02, 0.4, n, 64)
        # メロディ：2小節目から
        if b >= 1:
            phrase = MELODY[(b - 1) % len(MELODY)]
            for k, n in enumerate(phrase):
                if n:
                    s.note(2, base + k * 0.5, 0.5, n, 96)
                    s.note(3, base + k * 0.5, 0.45, n - 12, 70)
        # ドラム：キック・手拍子・シェイカー
        s.note(9, base, 0.2, 36, 92 if not intro else 70)
        s.note(9, base + 2, 0.2, 36, 84)
        if not intro:
            s.note(9, base + 1, 0.2, 39, 82)
            s.note(9, base + 3, 0.2, 39, 88)
        for k in range(8):
            s.note(9, base + k * 0.5, 0.1, 70, 60 if k % 2 else 44)  # マラカス
    return s.build()


def sfx(out_dir):
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    # タップ：木琴の高い音を一つ（ポン）
    s = Song()
    s.program(0, 13, 120, 64, 20)  # シロフォン
    s.note(0, 0, 0.25, 84, 105)
    render(s.build(), out / 'tap.wav', '0.9')
    # 完成：グロッケンの駆け上がり（キラーン）
    s = Song()
    s.program(0, 9, 120, 64, 70)
    s.program(1, 14, 90, 64, 80)  # チューブラーベル
    for i, n in enumerate([72, 76, 79, 84, 88]):
        s.note(0, i * 0.12, 0.6, n, 110)
    s.note(1, 0.6, 1.2, 84, 80)
    render(s.build(), out / 'done.wav', '0.9')
    # はじまり：マリンバの2音（ポロン）
    s = Song()
    s.program(0, 12, 120, 64, 50)
    s.note(0, 0, 0.3, 79, 100)
    s.note(0, 0.25, 0.5, 84, 110)
    render(s.build(), out / 'open.wav', '0.9')
    for f in ('tap', 'done', 'open'):  # 頭の無音を削る
        a, sr = sf.read(out / f'{f}.wav')
        mono = a.mean(axis=1) if a.ndim > 1 else a
        idx = np.where(np.abs(mono) > 0.003)[0]
        if len(idx):
            a = a[idx[0]: idx[-1] + int(0.05 * sr)]
        sf.write(out / f'{f}.wav', a, sr)


if __name__ == '__main__':
    if sys.argv[1] == 'bgm':
        out, secs = sys.argv[2], float(sys.argv[3])
        render(bgm(secs + 2), out)
        a, sr = sf.read(out)
        n = int(secs * sr)
        a = a[:n]
        fo = int(1.2 * sr)
        a[-fo:] *= np.linspace(1, 0, fo)[:, None]
        sf.write(out, a, sr)
        print('wrote', out)
    else:
        sfx(sys.argv[2])
        print('wrote sfx to', sys.argv[2])
