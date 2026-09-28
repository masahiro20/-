# 個別支援計画 文例帳

放課後等デイサービス・児童発達支援の個別支援計画を、5領域に沿って作るための無料ツールと文例サイト。あわせて、有料の「文例つき様式セット（Excel＋PDF）」を販売する。

## フォルダ構成

| 場所 | 中身 |
|---|---|
| `data/issues.mjs` | 文例データ（5領域 × 31課題）。サイトと商品の両方がここを使う |
| `data/config.mjs` | サイト名・ドメイン・価格・販売ページURL・連絡先などの設定 |
| `scripts/build.mjs` | `site/` に静的サイトを生成する（`scripts/sales-pages.mjs` は販売まわりのページ） |
| `scripts/sns-posts.mjs` | SNSの投稿文を `docs/sales/sns-posts.csv` に生成する |
| `site/` | 公開するファイル一式。`assets/app.js`・`style.css`・`checklist.js`・`copy.js`・`img/` 以外は生成物 |
| `products/` | 有料商品を作るスクリプト。出力先の `products/dist/` はリポジトリに入れない |
| `products/marketing/` | BOOTH用の商品画像 |
| `docs/sales/` | 販売開始チェックリスト・BOOTH出品文・返信テンプレート・SNS投稿文 |
| `docs/` | 戦略・業種選定の資料 |

## よく使うコマンド

```sh
node scripts/build.mjs        # サイトを作り直す
./products/build.sh           # 有料商品（Excel・PDF・ZIP）を作り直す
python3 products/previews.py  # 販売ページ用のプレビュー画像を作り直す（LibreOffice が必要）
node scripts/sns-posts.mjs    # SNS投稿文を作り直す
```

商品の作成には Node.js、Python 3（openpyxl・PyMuPDF）、Playwright（Chromium）、プレビュー画像には LibreOffice Calc を使う。

販売開始までの手順は `docs/sales/launch-checklist.md` を参照。
