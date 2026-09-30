# ふくしのおたすけ帳

介護・障害福祉・児童支援の現場で働く人のための、無料の書類ツール集（個別支援計画・モニタリング・支援記録・介護記録・事故報告・ヒヤリハット・委員会議事録・研修計画など19種類）。収益はPR枠（アフィリエイト）。放デイ・児発向けには有料の「文例つき様式セット（Excel＋PDF）」も用意している。

運営の方針は `docs/portal-plan.md` を参照。

## フォルダ構成

| 場所 | 中身 |
|---|---|
| `data/issues.mjs` | 児童支援の文例データ（5領域 × 31課題）。サイトと商品の両方がここを使う |
| `data/program.mjs`・`data/shogai.mjs`・`data/jiko.mjs` | 支援プログラム・障害福祉の個別支援計画・事故報告書のデータ |
| `data/templates.mjs` | 「選ぶだけの下書き」テンプレートの一覧と、各ページの説明文 |
| `site/assets/formdoc.js`・`site/assets/tpl/*.js` | テンプレートの共通エンジンと、書類ごとの組み立て（手で書くファイル） |
| `tools/feedback-gas.js` | 意見箱の受け口（Google Apps Script。スプレッドシート記録＋メール通知） |
| `data/config.mjs` | サイト名・ドメイン・価格・販売ページURL・連絡先などの設定 |
| `scripts/build.mjs` | `site/` に静的サイトを生成する。`portal.mjs`（トップ・業種ページ・共有ボタン・PR枠）、`*-page.mjs`（各ツール）、`sales-pages.mjs`（販売まわり）を呼び出す |
| `scripts/sns-posts.mjs` | SNSの投稿文を `docs/sales/sns-posts.csv` に生成する |
| `site/` | 公開するファイル一式。HTML・`*-data.js`・`sitemap.xml`・`robots.txt`・`_headers` は生成物。`assets/` の JS・CSS・画像は手で書くファイル |
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

サイトの公開手順は `docs/deploy.md`、有料商品の販売開始までの手順は `docs/sales/launch-checklist.md` を参照。
