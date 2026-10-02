"""リールのナレーション音声を作る。

Style-Bert-VITS2 と「小春音アミ」モデル（あみたろの声素材工房の声を元にしたモデル）を使う。
商用利用できるが、投稿には次のクレジットを必ず入れる（キャプションと動画の最後に入れている）：
  音声：Style-Bert-VITS2モデル 小春音アミ／あみたろの声素材工房（https://amitaro.net/）
規約（禁止事項）：年齢制限のある作品、宗教・政治・マルチ商法、誹謗中傷への使用、本人の声として扱うこと。

make.mjs --lines が書き出した dist/narr/<id>/lines.json を読み、1行ずつ <key>.wav を作り、長さを durations.json に書く。
行ごとに style（るんるん／Neutral／ノーマル）を選べる。共感の一言は落ち着いた Neutral、紹介は明るい るんるん。

使い方：python tts.py [id ...]
準備：pip install style-bert-vits2 soundfile（pyopenjtalk は numpy に合わせてソースからビルド）
      モデル：huggingface.co/litagin/sbv2_koharune_ami と ku-nlp/deberta-v2-large-japanese-char-wwm を SBV2_DIR に置く
"""
import json
import os
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

HERE = Path(__file__).resolve().parent
NARR = HERE / 'dist' / 'narr'
SBV2_DIR = Path(os.environ.get('SBV2_DIR', HERE / 'sbv2'))
DEFAULT_STYLE = 'るんるん'
SPEED = 0.94  # 1より小さいほど速い


def trim(a, sr, thr=0.006):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx):
        return a
    return a[max(0, idx[0] - int(0.02 * sr)): idx[-1] + int(0.06 * sr)]


def load():
    from style_bert_vits2.constants import Languages
    from style_bert_vits2.nlp import bert_models
    from style_bert_vits2.tts_model import TTSModel
    bert = SBV2_DIR / 'bert' / 'deberta-v2-large-japanese-char-wwm'
    bert_models.load_model(Languages.JP, str(bert)).float()
    bert_models.load_tokenizer(Languages.JP, str(bert))
    d = SBV2_DIR / 'model_assets' / 'koharune-ami'
    return TTSModel(model_path=d / 'koharune-ami.safetensors', config_path=d / 'config.json',
                    style_vec_path=d / 'style_vectors.npy', device='cpu')


def main(only):
    model = load()
    for d in sorted(NARR.iterdir()):
        if only and d.name not in only:
            continue
        lines = json.loads((d / 'lines.json').read_text(encoding='utf-8'))
        durs = {}
        for line in lines:
            sr, audio = model.infer(text=line['text'], style=line.get('style') or DEFAULT_STYLE,
                                    style_weight=1.0, length=line.get('speed') or SPEED)
            audio = audio.astype('float32') / 32768.0 if audio.dtype != np.float32 else audio
            audio = trim(audio, sr)
            sf.write(d / f"{line['key']}.wav", audio, sr)
            durs[line['key']] = round(len(audio) / sr, 2)
        (d / 'durations.json').write_text(json.dumps(durs, ensure_ascii=False, indent=1), encoding='utf-8')
        print(d.name, durs)


if __name__ == '__main__':
    main(set(sys.argv[1:]))
