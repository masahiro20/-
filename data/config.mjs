// サイト全体の設定。公開前に TODO の値を埋めてから `node scripts/build.mjs` を実行する。
export const CONFIG = {
  siteName: '個別支援計画 文例帳',
  tagline: '放デイ・児発の5領域対応',
  // TODO: 公開するドメイン（末尾スラッシュなし）。canonical と sitemap.xml に使う
  siteUrl: 'https://example.com',
  // TODO: 運営者名（屋号でも可）
  operator: '個別支援計画 文例帳 編集部',
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
  // TODO: Google Analytics 4 の測定ID（例: G-XXXXXXXXXX）。空なら計測タグを出力しない
  gaId: '',
};
