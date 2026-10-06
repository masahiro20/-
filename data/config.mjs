// サイト全体の設定。公開前に TODO の値を埋めてから `node scripts/build.mjs` を実行する。
export const CONFIG = {
  siteName: 'ふくしのおたすけ帳',
  tagline: '介護・障害福祉・児童支援の書類づくりを、無料で',
  // 公開するURL（末尾スラッシュなし）。canonical・sitemap.xml・LINEの画像に使う。独自ドメインを取ったらここを差し替える
  siteUrl: 'https://fukushi-otasuke.vercel.app',
  // TODO: 運営者名（屋号でも可）
  operator: 'ふくしのおたすけ帳 編集部',
  // TODO: 問い合わせ用フォーム（Googleフォーム等）のURL。空なら問い合わせ導線を「準備中」表示にする
  contactUrl: '',
  // TODO: 有料テンプレート（Excel様式＋文例集）の販売ページURL（BOOTH・note・Stripe等）。空なら「準備中」
  productUrl: '',
  // 有料テンプレートの商品情報（価格は税込）
  productName: '個別支援計画 文例つき様式セット',
  productPrice: 3980,
  productVersion: '1.0',
  // TODO: 購入者サポート用のメールアドレス（商品の「はじめに」と特商法表記に載る）
  supportEmail: '',
  // TODO: 特定商取引法に基づく表記に載せる販売事業者名・所在地・電話番号。
  // 個人の場合、所在地と電話番号は「請求があった場合に遅滞なく開示します」と書くこともできる
  sellerName: '',
  sellerAddress: '請求があった場合には遅滞なく開示いたします。',
  sellerPhone: '請求があった場合には遅滞なく開示いたします。',
  // TODO: 事業所向けAI版の先行登録フォームURL。空なら「準備中」
  waitlistUrl: '',
  // アフィリエイト枠。url を入れた枠だけがサイトに表示される（ASPで提携した広告のリンクを貼る）。
  // sectors：表示する業種（jido=児童支援、shogai=障害福祉、kaigo=介護、all=全ページ）
  affiliates: [
    { id: 'job-kaigo', sectors: ['kaigo'], title: '介護職の求人を探す', text: '給与・休日・夜勤の有無などの条件から、介護の求人を探せます。', cta: '求人を見る', url: '' },
    { id: 'job-fukushi', sectors: ['jido', 'shogai'], title: '児発管・サビ管・支援員の求人を探す', text: '障害福祉・児童福祉に特化した求人サイトです。', cta: '求人を見る', url: '' },
    { id: 'shikaku', sectors: ['kaigo', 'shogai'], title: '介護・福祉の資格講座を比べる', text: '実務者研修・初任者研修などの講座資料を、まとめて無料で取り寄せられます。', cta: '資料を請求する', url: '' },
    { id: 'soft', sectors: ['all'], title: '請求・記録ソフトの資料をまとめて見る', text: '計画書・記録・請求を一つにまとめる、事業所向けソフトの比較です。', cta: '比較を見る', url: '' },
  ],
  // 意見箱の送り先。
  // feedbackEndpoint：Google Apps Script のウェブアプリのURL（tools/feedback-gas.js を貼って公開したもの）。
  //   入れると、意見がスプレッドシートに記録され、メールで届く。手順は docs/deploy.md の「意見箱」。
  // feedbackEmail：endpoint がまだ無いときの予備。入れると「メールで送る」ボタンになる（利用者のメールソフトが開く）。
  // どちらも空なら、意見箱は「送信の準備中」と表示し、文章のコピーだけできる。
  feedbackEndpoint: '',
  feedbackEmail: '',
  // Instagram のアカウントURL（例：https://www.instagram.com/fukushi_otasuke/）。入れると、LP（start.html）にフォローボタンが出る
  instagramUrl: '',
  // Vercel Web Analytics（Vercelで公開しているときのアクセス数の計測。Cookieを使わない）
  vercelAnalytics: true,
  // Google Search Console の所有権確認用（HTMLタグの content="…" の中身）。入れると全ページの head に入る
  searchConsoleVerification: 'fnAAUDesvY7BpXQV8NPD-PKuIAs4n8qq76oNTaiCXBg',
  // TODO: Google Analytics 4 の測定ID（例: G-XXXXXXXXXX）。空なら計測タグを出力しない
  gaId: '',
};
