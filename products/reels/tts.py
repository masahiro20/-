"""リールのナレーション音声を作る（Kokoro：Apache-2.0。商用利用可・クレジット表記不要）。

make.mjs --lines が書き出した dist/narr/<id>/lines.json を読み、
1行ずつ dist/narr/<id>/<key>.wav を作って、長さ（秒）を durations.json に書く。

使い方：python tts.py [id ...]
必要なもの：pip install kokoro "misaki[ja]" unidic-lite soundfile torch
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro import KPipeline

VOICE = 'jf_alpha'  # 落ち着いた女性の声
SPEED = 1.08
SR = 24000
HERE = Path(__file__).resolve().parent
NARR = HERE / 'dist' / 'narr'


def trim(a, thr=0.008):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx):
        return a
    return a[max(0, idx[0] - int(0.03 * SR)): idx[-1] + int(0.08 * SR)]


def main(only):
    pipe = KPipeline(lang_code='j')
    for d in sorted(NARR.iterdir()):
        if only and d.name not in only:
            continue
        lines = json.loads((d / 'lines.json').read_text(encoding='utf-8'))
        durs = {}
        for line in lines:
            parts = [a.numpy() for _, _, a in pipe(line['text'], voice=VOICE, speed=SPEED)]
            audio = trim(np.concatenate(parts)) if parts else np.zeros(1)
            sf.write(d / f"{line['key']}.wav", audio, SR)
            durs[line['key']] = round(len(audio) / SR, 2)
        (d / 'durations.json').write_text(json.dumps(durs, ensure_ascii=False, indent=1), encoding='utf-8')
        print(d.name, durs)


if __name__ == '__main__':
    main(set(sys.argv[1:]))
