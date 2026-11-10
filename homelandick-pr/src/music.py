"""Original score for the Homelandick PR movie. Pure numpy synthesis -> out/music.wav"""
import numpy as np, wave, os
SR = 44100; TOTAL = 74.0
N = int(SR * TOTAL); L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(3)
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)

def piano(m, dur=4.0, vel=1.0):
    t = np.arange(int(SR * dur)) / SR; f = hz(m); y = np.zeros_like(t)
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        if fk > 9000: break
        y += (1 / k ** 1.25) * np.exp(-t * (0.9 + 0.55 * k) * (1 + m / 140)) * np.sin(2 * np.pi * fk * t)
    att = np.minimum(1, t / 0.006)
    return y * att * vel * 0.2

def pad(m, dur, vel=1.0):
    t = np.arange(int(SR * dur)) / SR; f = hz(m); y = np.zeros_like(t)
    for d in (-0.35, 0, 0.35):
        ff = f * 2 ** (d / 100)
        y += np.sin(2 * np.pi * ff * t + rng.random() * 6) + 0.25 * np.sin(4 * np.pi * ff * t)
    env = np.minimum(1, t / 2.2) * np.minimum(1, (dur - t) / 2.5)
    return y * env * vel * 0.02

def put(y, at, pan=0.5):
    i = int(at * SR)
    if i >= N: return
    y = y[:N - i]
    L[i:i + len(y)] += y * np.cos(pan * np.pi / 2); R[i:i + len(y)] += y * np.sin(pan * np.pi / 2)

BEAT = 60 / 66; BAR = 4 * BEAT       # 66 bpm, bar = 3.636s
# D major: Dadd9 | Bm7 | Gmaj7 | Asus4 -> A
CH = [([38, 50], [57, 62, 64, 66]), ([35, 47], [57, 62, 66, 69]),
      ([31, 43], [59, 62, 66, 71]), ([33, 45], [57, 62, 64, 69])]
MEL = [[(0, 78), (1.5, 76), (2, 74), (3, 69)], [(0, 74), (1.5, 73), (2, 71), (3.5, 69)],
       [(0, 71), (1, 74), (2, 78), (3, 76)], [(0, 76), (2, 73), (3, 74)]]
MEL2 = [[(0, 81), (1.5, 78), (2, 76), (3, 74)], [(0, 78), (1, 74), (2, 73), (3, 71)],
        [(0, 74), (1, 78), (2, 83), (3, 81)], [(0, 81), (1.5, 76), (2.5, 78)]]
nbars = int(TOTAL / BAR) + 1
for b in range(nbars):
    t0 = b * BAR; bass, ch = CH[b % 4]
    if t0 > TOTAL - 6: break
    sec = t0
    # intensity by section of the film
    lvl = 0.45 if sec < 8 else 0.75 if sec < 31 else 0.9 if sec < 51 else 1.0 if sec < 62 else 0.8
    for m in bass: put(pad(m + 12, BAR + 2.5, lvl), t0, 0.5)
    for i, m in enumerate(ch): put(pad(m, BAR + 2.5, lvl * 0.8), t0, 0.25 + 0.17 * i)
    put(piano(bass[0], 5, 0.9 * lvl), t0, 0.45); put(piano(bass[1], 5, 0.6 * lvl), t0, 0.5)
    if sec >= 7:    # broken-chord accompaniment
        patt = [0, 2, 1, 3, 2, 1, 3, 2] if sec >= 19 else [0, 2, 1, 3]
        step = BAR / len(patt)
        for i, k in enumerate(patt):
            put(piano(ch[k], 3.5, (0.42 + 0.1 * (i % 2 == 0)) * lvl), t0 + i * step + rng.normal(0, 0.006), 0.35 + 0.1 * k)
    if 8 <= sec < 62:  # melody
        mel = MEL2[b % 4] if sec >= 41 else MEL[b % 4]
        for bt, m in mel:
            put(piano(m, 4.5, 0.75 * lvl), t0 + bt * BEAT + rng.normal(0, 0.008), 0.62)
            if sec >= 51: put(piano(m + 12, 4, 0.22), t0 + bt * BEAT, 0.7)
    if sec < 8 and b % 2 == 0:
        put(piano(ch[3] + 12, 6, 0.4), t0 + BEAT, 0.6)
# end card: resolving D chord
tE = (int((TOTAL - 6) / BAR) + 0) * BAR
for i, m in enumerate([38, 50, 57, 62, 66, 69, 74, 78]):
    put(piano(m, 8, 0.7), tE + i * 0.09, 0.3 + 0.05 * i)
for m in [38, 50, 57, 62, 66]: put(pad(m, 7.5, 1.0), tE, 0.5)

# reverb (convolution with decaying noise)
def reverb(x, seed):
    r = np.random.default_rng(seed); n = int(SR * 2.8); t = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-t * 2.4); ir[:int(.012 * SR)] = 0
    k = np.fft.rfftfreq(n, 1 / SR); IR = np.fft.rfft(ir) / (1 + (k / 3500) ** 2); ir = np.fft.irfft(IR, n)
    ir /= np.sqrt((ir ** 2).sum())
    m = len(x) + n; return np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[:len(x)]
L2 = L + 0.33 * reverb(L, 1); R2 = R + 0.33 * reverb(R, 2)
t = np.arange(N) / SR
env = np.minimum(1, t / 1.5) * np.clip((TOTAL - 0.3 - t) / 3.0, 0, 1)
S = np.stack([L2, R2], 1) * env[:, None]
S = np.tanh(S / np.abs(S).max() * 1.15) * 0.89
os.makedirs('out', exist_ok=True)
with wave.open('out/music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((S * 32767).astype('<i2').tobytes())
print('music ok', TOTAL)
