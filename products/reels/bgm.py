"""リール用のオリジナルBGM（著作権の心配がない自作の曲）を作る。

やわらかいエレピ風の和音・ベース・小さなシェイカーと、ときどき鳴る鉄琴。
90BPM・ヘ長調。4小節の進行をくり返し、指定の秒数でフェードアウトする。

使い方：python bgm.py <出力.wav> <秒数> [曲のタイプ: warm|bright]
"""
import sys
import numpy as np
import soundfile as sf

SR = 48000
BPM = 90
BEAT = 60 / BPM


def note_hz(n):  # MIDIノート番号 → 周波数
    return 440.0 * 2 ** ((n - 69) / 12)


def env(length, attack=0.01, decay=1.2):
    t = np.arange(int(length * SR)) / SR
    a = np.clip(t / attack, 0, 1)
    return a * np.exp(-t / decay)


def epiano(n, length, vel=0.5):
    """エレピ風：基音＋倍音（すぐ減衰）＋わずかなトレモロ"""
    t = np.arange(int(length * SR)) / SR
    f = note_hz(n)
    tone = (np.sin(2 * np.pi * f * t)
            + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.35)
            + 0.12 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / 0.18)
            + 0.05 * np.sin(2 * np.pi * 7 * f * t) * np.exp(-t / 0.05))
    trem = 1 + 0.08 * np.sin(2 * np.pi * 4.2 * t)
    return vel * tone * trem * env(length, 0.006, 1.6)


def bell(n, length, vel=0.25):
    """鉄琴風：非整数倍音で、きらっと短く"""
    t = np.arange(int(length * SR)) / SR
    f = note_hz(n)
    tone = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t / 0.25) + 0.2 * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t / 0.12)
    return vel * tone * env(length, 0.002, 0.9)


def bass(n, length, vel=0.55):
    t = np.arange(int(length * SR)) / SR
    f = note_hz(n)
    tone = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)
    return vel * tone * env(length, 0.01, 0.9)


def kick(vel=0.5):
    length = 0.35
    t = np.arange(int(length * SR)) / SR
    f = 95 * np.exp(-t / 0.05) + 45
    phase = 2 * np.pi * np.cumsum(f) / SR
    return vel * np.sin(phase) * np.exp(-t / 0.12)


def shaker(rng, vel=0.06):
    length = 0.09
    n = rng.standard_normal(int(length * SR))
    n = np.diff(n, prepend=0)  # 高い音だけ残す
    return vel * n * env(length, 0.004, 0.03)


def add(buf, sig, at):
    i = int(at * SR)
    j = min(len(buf), i + len(sig))
    if i < len(buf):
        buf[i:j] += sig[: j - i]


def reverb(x, seconds=1.6, mix=0.22, seed=3):
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / (seconds / 5))
    ir[0] = 0
    ir /= np.sqrt(np.sum(ir ** 2))
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    wet = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return (1 - mix) * x + mix * wet


def make(seconds, kind='warm'):
    rng = np.random.default_rng(7)
    total = int((seconds + 2) * SR)
    keys = np.zeros(total)
    low = np.zeros(total)
    perc = np.zeros(total)
    top = np.zeros(total)
    # 進行：Fmaj7 → C/E → Dm7 → B♭maj7（ヘ長調）
    chords = [[53, 57, 60, 64], [52, 55, 60, 64], [50, 57, 60, 65], [46, 57, 62, 65]]
    roots = [41, 40, 38, 34]
    if kind == 'bright':
        chords = [[c + 2 for c in ch] for ch in chords]
        roots = [r + 2 for r in roots]
    melody = [72, None, 69, 67, None, 69, 72, None, 74, 72, None, 69, 67, None, 65, None]
    bar = BEAT * 4
    t = 0.0
    bar_i = 0
    while t < seconds + 1:
        ch = chords[bar_i % 4]
        # 和音：1拍目と2拍目の裏（少しずらしてやわらかく）
        for k, n in enumerate(ch):
            add(keys, epiano(n, bar * 1.1, 0.16), t + k * 0.012)
            add(keys, epiano(n + 12 if k == 3 else n, BEAT * 1.6, 0.07), t + BEAT * 1.5 + k * 0.01)
        add(low, bass(roots[bar_i % 4], BEAT * 1.8), t)
        add(low, bass(roots[bar_i % 4] + 7, BEAT * 1.4, 0.4), t + BEAT * 2.5)
        if bar_i >= 1:  # 2小節目から打楽器
            for b in range(4):
                if b in (0, 2):
                    add(perc, kick(0.32), t + b * BEAT)
                for h in range(2):
                    add(perc, shaker(rng, 0.05 if h else 0.035), t + b * BEAT + h * BEAT / 2)
        if bar_i >= 2:  # 3小節目から鉄琴のメロディ
            for s in range(4):
                n = melody[(bar_i * 4 + s) % len(melody)]
                if n:
                    add(top, bell(n, BEAT * 2, 0.09), t + s * BEAT)
        t += bar
        bar_i += 1
    mix = reverb(keys, 1.8, 0.28) + low * 0.9 + perc + reverb(top, 2.2, 0.35)
    mix = mix[: int(seconds * SR)]
    # フェードイン・アウト
    fi, fo = int(0.4 * SR), int(1.6 * SR)
    mix[:fi] *= np.linspace(0, 1, fi)
    mix[-fo:] *= np.linspace(1, 0, fo)
    mix /= np.max(np.abs(mix)) + 1e-9
    mix *= 0.6
    return np.stack([mix, mix], axis=1)


if __name__ == '__main__':
    out, secs = sys.argv[1], float(sys.argv[2])
    kind = sys.argv[3] if len(sys.argv) > 3 else 'warm'
    sf.write(out, make(secs, kind), SR)
    print('wrote', out)
