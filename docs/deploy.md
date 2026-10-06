# 公開の手順（ふくしのおたすけ帳）

無料のツールサイトとして公開するための手順です。**あなたの操作が必要なもの**には 👤 をつけています。
有料テンプレート（BOOTH）の販売は後回しでかまいません（`docs/sales/launch-checklist.md`）。

所要時間の目安：合計 1.5〜2時間（ドメインの反映待ちを除く）

---

## いまの公開状況（Vercel）

- 公開中：**https://fukushi-otasuke.vercel.app**（Vercel の無料プラン、プロジェクト名 `fukushi-otasuke`、GitHub の `masahiro20/-` とつながっている）
- サイトを直したら：作業ブランチにプッシュ → Vercel の本番（production）にデプロイし直す（Claude がコネクタで行う）。main ブランチは使っていない。
- 設定：`vercel.json`（ビルドの方法とセキュリティのヘッダー。`node scripts/build.mjs` が作る）
- アクセス数：Vercel Web Analytics（Cookieなし）。**最初に一度だけ** Vercel の画面で「fukushi-otasuke → Analytics → Enable」を押す。
- 毎週の報告：毎週月曜 8:52（日本時間）に、Claude が Vercel のアクセス数と、Gmail に届いた Search Console のお知らせをまとめて報告する。
- 注意：Vercel の無料プラン（Hobby）は「個人の非商用利用」が条件。**アフィリエイト広告を載せる前に**、Cloudflare Pages（下の手順、無料で商用可）に移すか、Vercel の有料プランにする。

### Google Search Console に登録する 👤（10分）

1. [Search Console](https://search.google.com/search-console) を開き、「プロパティを追加」→ **URLプレフィックス** に `https://fukushi-otasuke.vercel.app/` を入れる。
2. 確認方法で「HTMLタグ」を選び、表示された `<meta name="google-site-verification" content="〇〇〇〇">` の **〇〇〇〇 の部分** をコピーして Claude に送る（`data/config.mjs` の `searchConsoleVerification` に入れて公開し直す）。
3. 公開し直したら、Search Console の画面で「確認」を押す。
4. 左のメニュー「サイトマップ」に `sitemap.xml` と入れて送信する。
5. 数日〜1週間で、検索での表示回数・クリック数が見られるようになる。

## （別の方法）Cloudflare Pages で公開する（10分）👤

独自ドメインなしで、**`https://fukushi-otasuke.pages.dev`** として公開します。設定ファイル（`siteUrl`）はこのURLに合わせてあります。

1. [Cloudflare](https://dash.cloudflare.com/sign-up) に無料登録する（メールアドレスとパスワードだけ。クレジットカード不要）。
2. 左のメニュー「Workers & Pages」→「作成」→「Pages」タブ →「Git に接続」。
3. 「GitHub に接続」→ GitHub の画面で、このリポジトリ（`masahiro20/-`）へのアクセスを許可する。
4. リポジトリを選んで「セットアップを開始」。次のとおり入力する。

   | 項目 | 入れる値 |
   |---|---|
   | プロジェクト名 | `fukushi-otasuke`（これがURLになります） |
   | 本番ブランチ | `claude/ai-monetization-strategy-42fcns`（あとで main に変えてもOK） |
   | フレームワーク プリセット | なし |
   | ビルドコマンド | `node scripts/build.mjs` |
   | ビルド出力ディレクトリ | `site` |

5. 「保存してデプロイ」。1〜2分で `https://fukushi-otasuke.pages.dev` が開けるようになります。
6. 以後は、このブランチにプッシュするたびに自動で公開し直されます（こちらで直したものは、そのまま反映されます）。

> プロジェクト名 `fukushi-otasuke` が使えないと言われたら、別の名前にして、決まったURLを教えてください。`siteUrl` をそのURLに合わせて作り直します。

---

## 0. 公開前に1つだけ：リポジトリを非公開にする 👤

このGitHubリポジトリは「公開（public）」です。サイトのファイル以外（運営メモ・売上の計画など）も誰でも見られます。
GitHub の **Settings → General → 一番下の「Change repository visibility」→ Private** にしてください。
Cloudflare Pages は、非公開のリポジトリからでも公開できます。

## 1. ドメインを決める 👤（15分）

- 例：`fukushi-otasuke.jp`、`otasukecho.com` など。短く、口頭で伝えやすいもの（「ふくしのおたすけ帳で検索」でも見つかるように、サイト名と近いもの）。
- Cloudflare Registrar・お名前.com などで取得（年1,500〜3,000円前後）。
- 急ぐ場合は、先に Cloudflare Pages の無料URL（`○○.pages.dev`）で公開して、あとからドメインをつけてもかまいません。

## 2. 設定ファイルを埋める 👤→🤖（5分）

`data/config.mjs` を開いて、次を入れます（値を教えてもらえれば、こちらで入れてビルドします）。

| 項目 | 入れる値 | 必須 |
|---|---|---|
| `siteUrl` | 公開するURL（例：`https://fukushi-otasuke.jp`。末尾の `/` なし） | ◎ |
| `operator` | 運営者名（屋号でOK） | ◎ |
| `feedbackEndpoint` | 意見箱の送り先（下の「5. 意見箱」で作るURL） | ○ |
| `feedbackEmail` | 意見箱の予備の送り先（endpoint を作るまでの間だけ使う場合） | 任意 |
| `gaId` | Google アナリティクスの測定ID（`G-` で始まる） | 任意 |
| `contactUrl` | 問い合わせフォーム（Googleフォーム）のURL | 任意 |
| `affiliates[].url` | ASPで提携した広告のリンク（「7. 広告」） | あとで |

埋めたら `node scripts/build.mjs` を実行します（Cloudflare Pages では自動で実行されます）。

## 3. サイトを公開する：Cloudflare Pages 👤（20分）

1. [Cloudflare](https://dash.cloudflare.com/) に無料登録してログイン。
2. 「Workers & Pages」→「作成」→「Pages」→「Git に接続」→ GitHub を連携し、このリポジトリを選ぶ。
3. ビルドの設定：
   - 本番ブランチ：公開に使うブランチ（例：`main`）
   - フレームワーク プリセット：なし
   - ビルドコマンド：`node scripts/build.mjs`
   - ビルド出力ディレクトリ：`site`
   - 環境変数（任意）：`NODE_VERSION` = `20`
4. 「保存してデプロイ」。数分で `○○.pages.dev` で公開されます。
5. 独自ドメイン：プロジェクトの「カスタムドメイン」→ドメインを入力 → 画面の案内どおりにDNSを設定。
6. 以後は、GitHub にプッシュするたびに自動で公開し直されます。

サイトに入っているもの：
- `site/_headers`：セキュリティのヘッダー（外部から読み込むのはフォント・QRコード・計測・意見箱の送り先だけに制限）とキャッシュの設定。Cloudflare Pages・Netlify がそのまま読みます。
- `site/404.html`：存在しないURLにアクセスされたときのページ（自動で使われます）。
- `site/assets/img/og.png`：LINE・X でURLを送ったときに表示される画像（1200×630）。作り直すときは `SCALE=1 FONT_VIA_CURL=1 node products/render.cjs png products/og.html site/assets/img/og.png 1200 630`。

## 4. 公開したら確認すること 👤（10分）

- [ ] スマホで、トップ → 業種 → ツールを開き、下書きが出る
- [ ] LINE で自分あてにトップのURLを送り、画像つきで表示される（表示されない場合は、`siteUrl` が正しいか確認）
- [ ] 紹介チラシ（`/flyer.html`）のQRコードを読み取ると、サイトが開く
- [ ] 意見箱から1件送ってみて、スプレッドシートとメールに届く

## 5. 意見箱（メールで届くようにする）👤（15分）

いまは送り先が空なので、意見箱は「送信の準備中」と表示し、入力した文章のコピーだけできる状態です。
次の手順で、**送られた意見がスプレッドシートに記録され、メールでも届く**ようになります（無料・サーバー不要）。

1. Googleドライブの「おたすけ帳 意見箱」スプレッドシートを開く（作成済み。なければ新しく作る。見出し行はスクリプトが自動で入れます）。
2. メニューの「拡張機能 → Apps Script」を開く。
3. 最初から入っているコードを消して、`tools/feedback-gas.js` の中身をすべて貼り付け、保存する。
4. 左の歯車「プロジェクトの設定」→ 一番下の「スクリプト プロパティを追加」
   - プロパティ：`NOTIFY_EMAIL`
   - 値：意見を受け取りたいメールアドレス
5. 右上「デプロイ」→「新しいデプロイ」→ 種類の選択（歯車）で「ウェブアプリ」
   - 次のユーザーとして実行：**自分**
   - アクセスできるユーザー：**全員**
   - 「デプロイ」→ Googleの権限の確認で「許可」（「このアプリは確認されていません」と出たら「詳細」→「〇〇（安全ではないページ）に移動」）
6. 表示された **ウェブアプリのURL**（`https://script.google.com/macros/s/…/exec`）をコピーし、`data/config.mjs` の `feedbackEndpoint` に貼る。
7. `node scripts/build.mjs` → プッシュ（または、URLを教えてもらえればこちらで反映します）。

しくみ：
- スプレッドシートに「意見箱」シートが自動でできて、1件ごとに1行たまります。「対応」列で、未対応／対応済みを管理できます。
- いたずら対策として、人には見えない入力欄（ロボットよけ）と、10分あたり30件までの上限を入れています。
- Apps Script を書き換えたときは、「デプロイを管理」→ 鉛筆 →「バージョン：新バージョン」で更新します（URLは変わりません）。

endpoint を作るまでの間だけ、`feedbackEmail` にアドレスを入れておく方法もあります（送信ボタンで利用者のメールソフトが開きます）。

## 6. 検索エンジンと計測 👤（15分）

1. [Google Search Console](https://search.google.com/search-console) にドメインを登録（Cloudflare でドメインを管理していれば、DNSの確認は数クリック）。
2. 「サイトマップ」に `sitemap.xml` を送信。
3. （任意）[Google アナリティクス](https://analytics.google.com/) でプロパティを作り、測定ID（`G-…`）を `gaId` に入れる。
   `gaId` を入れると、プライバシーポリシーに計測の説明が自動で入ります。

## 7. 広告（アフィリエイト）👤（公開から1〜2週間後）

ASP（広告の仲介会社）の審査は、**サイトが公開されていて、中身がそろっていること**が条件です。公開して数ページ見られる状態になってから申し込みます。

1. A8.net・もしもアフィリエイト・アクセストレード などに、サイトのURLで登録する。
2. 審査に通ったら、「介護 求人」「保育 求人」「障害福祉 求人」「資格 資料請求」「介護ソフト」などで案件を探し、提携を申し込む。
3. 提携できた広告のリンクを `data/config.mjs` の `affiliates` の `url` に貼り、ビルドする。
   - リンクを入れた枠だけが、その業種のページの下に「PR」表示つきで出ます（ステマ規制に対応済み）。
   - ツールの結果（下書き）の中には広告を入れません。信頼を失うと口コミが止まるためです。

## 8. 公開後の運用（週1〜2時間）

| 頻度 | やること |
|---|---|
| 届いたら | 意見箱の内容を確認し、スプレッドシートの「対応」列を更新。ほしい書類の声が多いものから、テンプレートを追加 |
| 週1回 | Search Console で、どの検索語で来ているか・どのツールが見られているかを確認 |
| 月1回 | 意見箱の声をまとめて、ツール・テンプレートを追加（`data/templates.mjs` と `site/assets/tpl/`）。SNSで「新しく〇〇の下書きができました」と告知 |
| 制度改定時 | 報酬改定（3年ごと）・通知の変更を確認し、頻度や記載事項の文言を直す |

## 9. 新しいテンプレートの足し方（開発メモ）

1. `data/templates.mjs` に1件追加（ページのタイトル・説明・書き方のコツ・出典）。
2. `site/assets/tpl/<id>.js` に、左の入力欄（`blocks`）と、右の書類の組み立て（`build`）を書く。既存のテンプレートをまねるのが早いです。
3. `node scripts/build.mjs` で、ページ・業種ページの一覧・フッター・サイトマップに自動で入ります。
