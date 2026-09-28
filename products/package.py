"""販売用の ZIP をまとめる。使い方: python3 products/package.py（先に build.sh の他の手順を実行しておく）"""
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'products' / 'dist'
CONFIG = json.loads((ROOT / 'products' / 'build' / 'data.json').read_text(encoding='utf-8'))['config']
NAME = CONFIG['productName']
VERSION = CONFIG['productVersion']
contact = CONFIG.get('supportEmail') or f'{CONFIG["siteUrl"]}/contact.html'

README = f"""{NAME}　ver.{VERSION}
はじめにお読みください
==================================================

このたびはご購入いただき、ありがとうございます。

■ 入っているもの
・{NAME}.xlsx
    課題を選ぶだけで、支援目標・支援内容（5領域つき）・留意事項・家族支援・
    移行支援の文例が入る個別支援計画書です。モニタリング記録、白紙の様式、
    記入例、文例一覧（事業所オリジナルの文例も追加できます）が入っています。
・個別支援計画 文例全集.pdf
    すべての文例を課題ごとに1ページにまとめた、印刷用の文例集です。

■ まずはここから（3分）
1. Excelファイルを開き、「はじめに」タブを読みます。
2. 「計画書（文例入り）」タブで、黄色いセルの「対象」と「課題」を選びます。
3. 入った文例を、お子さまに合わせて書き直します（セルに直接上書きしてOK）。

■ 動作環境
・Microsoft Excel 2016 以降（Windows／Mac）、Microsoft 365 で動作を確認する前提で作っています。
・Googleスプレッドシート、LibreOffice でも、プルダウンと文例の自動入力が使えます。
  （フォントやセルの高さが少し変わることがあります）
・「保護ビュー」で開いた場合は、「編集を有効にする」を押してください。

■ ご利用の範囲
・ご購入いただいた事業所（同じ法人の複数事業所を含みます）の中で、自由にお使いいただけます。
・計画書として印刷・保存・編集し、利用者のご家族へお渡しいただくのは問題ありません。
・ファイルそのものの再配布・転売・インターネット上での公開はご遠慮ください。

■ ご注意
・文例は、計画を書き始めるための下書きです。お子さまのアセスメントと、本人・家族の
  意向に合わせて必ず書き直してください。
・様式や記載方法の細かな求めは、自治体（指定権者）によって異なります。
  最新の資料をご確認ください。個別の計画内容についてのご相談にはお答えしておりません。

■ アップデート
・文例の追加や制度改定への対応は、購入された方へ無料でお届けします。

■ お問い合わせ
{contact}
{CONFIG['siteName']}
"""


def main():
    xlsx = DIST / f'{NAME}.xlsx'
    pdf = DIST / '個別支援計画 文例全集.pdf'
    for f in (xlsx, pdf):
        if not f.exists():
            raise SystemExit(f'missing: {f}')
    readme = DIST / 'はじめにお読みください.txt'
    readme.write_text(README.replace('\n', '\r\n'), encoding='utf-8-sig')  # Windows のメモ帳で文字化けしないように
    out = DIST / f'{NAME}_v{VERSION}.zip'
    folder = f'{NAME}_v{VERSION}'
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in (readme, xlsx, pdf):
            info = zipfile.ZipInfo(f'{folder}/{f.name}')
            info.flag_bits |= 0x800  # ファイル名をUTF-8として記録（Windows/Macで文字化けしにくい）
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, f.read_bytes())
    print(out)


if __name__ == '__main__':
    main()
