// 検索で見つけてもらうための土台：構造化データ（JSON-LD）・タイトル／説明文の整え方・関連ツール・重複チェック。
// 方針：Google の検索ガイドラインに沿って、ページの内容と同じ事実だけを書く（キーワードの詰め込み・隠しテキストはしない）。

export const SECTOR_LABEL = { jido: '児童支援', shogai: '障害福祉', kaigo: '介護' };

// パンくず（トップ › 業種 › ツール）。crumbs: [[名前, 'path.html'], …]（先頭は呼び出し側でトップを入れる）
export function breadcrumbLd(siteUrl, crumbs) {
  // Google の仕様：パンくずは2項目以上が必要（トップページだけのときは出さない）
  if (crumbs.length < 2) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: `${siteUrl}/${path === 'index.html' ? '' : path}`,
    })),
  };
}

// ブラウザで動く無料のツール（WebApplication）。値はテンプレートの name・desc から
export function webAppLd(siteUrl, { name, desc, path }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description: desc,
    url: `${siteUrl}/${path}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    inLanguage: 'ja',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
  };
}

// ── タイトル ──
// 既定は「<ツール名>【無料】｜サイト名」。ツール名が長いものや、検索で使われる言い方（書き方・例文）を
// 添えたいものだけ、ここに「サイト名の前の部分」を書く。全体で全角32字以内に収める（長いと検索結果で切れる）。
export const TOOL_TITLES = {
  hiyari: 'ヒヤリハット報告書の書き方・例文【無料】',
  'hiyari-shukei': 'ヒヤリハットの月別集計表【無料】',
  otayori: 'おたより（お知らせ）の文例【無料】',
  'anzen-keikaku': '安全計画の作り方・下書き【無料】',
  'sougei-kiroku': '送迎記録の書き方・下書き【無料】',
  'kaigo-kiroku': '介護記録の書き方・例文【無料】',
  'houmon-hokoku': '保育所等訪問支援の報告書【無料】',
  assessment: 'アセスメントシートの書き方・下書き【無料】',
  kouchin: '工賃向上計画の書き方・下書き【無料】',
  'sagyo-nippo': '作業日報・工賃の記録の下書き【無料】',
  moushiokuri: '申し送りの書き方・例文【無料】',
  'tantousha-kaigi': 'サービス担当者会議の要点・下書き【無料】',
  mitori: '看取り記録の書き方・例文【無料】',
  kinkyo: 'ご家族への近況報告の例文【無料】',
  iinkai: '委員会の議事録の書き方・例文【無料】',
  'shien-kiroku': '支援記録の書き方・例文【無料】',
  monitoring: 'モニタリング記録の書き方・例文【無料】',
  kaigi: '個別支援会議の記録の書き方【無料】',
};

export const toolTitle = (t, siteName) => `${TOOL_TITLES[t.id] || `${t.name}【無料】`}｜${siteName}`;

// 説明文：テンプレートの desc（何が作れるか）に、事実だけの一文（無料・登録不要・送信しない）を添える。80〜120字に収める
export function toolDescription(t) {
  const base = /[。！]$/.test(t.desc) ? t.desc : `${t.desc}。`;
  const len = (s) => [...s].length;
  const tails = ['無料・登録不要で、入力した内容は送信されません。', '無料・登録不要。入力内容は送信されません。', '無料・登録不要。'];
  let out = base;
  for (const tail of tails) {
    if (len(base + tail) <= 120) { out = base + tail; break; }
    out = base; // 長すぎるときは desc のみ（build の警告に出る）
  }
  if (len(out) < 80) out += '選ぶだけで、書き始めの下書きができます。';
  return out;
}

// ── 関連するツール（同じ業種を優先して3件。本文にすでにあるリンクは除く） ──
export function relatedTools(TOOLS, path, body, n = 3) {
  const self = TOOLS.find((t) => t.path === path);
  if (!self) return [];
  const idx = TOOLS.indexOf(self);
  const skip = (t) => t.path === path || t.path.includes('/') || body.includes(`href="${t.path}"`);
  return TOOLS
    .map((t, i) => ({ t, shared: t.sectors.filter((s) => self.sectors.includes(s)).length, dist: (i - idx + TOOLS.length) % TOOLS.length }))
    .filter(({ t, shared }) => !skip(t) && shared > 0)
    // 共有する業種が多い順。同点は一覧で自分の次にあるものから（ツールごとに違うリンク先になり、特定のページに偏らない）
    .sort((a, b) => b.shared - a.shared || a.dist - b.dist)
    .slice(0, n)
    .map(({ t }) => t);
}

// ── title / description の重複・長さのチェック（build の警告に出す） ──
export function seoChecks(entries) {
  const warns = [];
  const seen = { title: new Map(), description: new Map() };
  for (const { path, title, description, tool } of entries) {
    for (const k of ['title', 'description']) {
      const v = k === 'title' ? title : description;
      if (seen[k].has(v)) warns.push(`[SEO] ${k} が重複: ${path} と ${seen[k].get(v)}`);
      else seen[k].set(v, path);
    }
    const tl = [...title].length;
    const dl = [...description].length;
    if (tool && tl > 32) warns.push(`[SEO] title が長い（${tl}字）: ${path} ${title}`);
    if (tool && (dl < 60 || dl > 130)) warns.push(`[SEO] description の長さ（${dl}字）: ${path}`);
  }
  return warns;
}
