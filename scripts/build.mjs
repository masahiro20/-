// 静的サイトを site/ に生成する。使い方: node scripts/build.mjs
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMAINS, AGES, ISSUES, TRAITS } from '../data/issues.mjs';
import { CONFIG } from '../data/config.mjs';
import { salesPages } from './sales-pages.mjs';
import { programPage, programData } from './program-page.mjs';
import { SECTORS, portalPages, shareBlock, affiliateBlock } from './portal.mjs';
import { shogaiPage, shogaiData } from './shogai-page.mjs';
import { jikoPage, jikoData } from './jiko-page.mjs';
import { renrakuchoPage, renrakuchoData } from './renrakucho-page.mjs';
import { flyerPage } from './flyer-page.mjs';
import { formdocPages } from './formdoc-pages.mjs';
import { ikenPage } from './iken-page.mjs';
import { startPage } from './start-page.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'site');
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const SOURCE_NOTE = 'こども家庭庁 支援局障害児支援課 事務連絡（令和6年5月17日）「個別支援計画書の記載のポイント（参考様式版）」をもとに編集部で要約';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const domainById = Object.fromEntries(DOMAINS.map((d) => [d.id, d]));
const domainNames = (ids) => ids.map((id) => domainById[id].name).join('／');
const pages = [];

function write(path, html) {
  const file = join(OUT, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

const sq = (id) => `<span class="sq c-${id}" aria-hidden="true"></span>`;

// ツールページの下に置く共有ボタンとPR枠
function toolFooter(sector, path) {
  // 選ぶだけの下書き（formdoc）のページは本文に意見箱の案内があるので、それ以外のツールにだけ足す
  const ask = !['jido-keikaku.html', 'shogai-keikaku.html', 'jiko.html', 'renrakucho.html', 'program.html'].includes(path) ? ''
    : `<div class="ask-box" style="margin:0 0 24px"><p><b>「この項目もほしい」「この書類も作ってほしい」</b><br>現場の声でツールを増やしています。意見箱からお気軽にどうぞ。</p><a class="btn btn-line btn-sm" href="iken.html">意見箱に送る</a></div>`;
  return `<section class="section"><div class="wrap narrow">${ask}${shareBlock({ esc, url: `${CONFIG.siteUrl}/${path}`, title: `${CONFIG.siteName}｜無料で使える書類の下書きツール` })}${affiliateBlock({ esc, CONFIG, sector })}</div></section>`;
}
const yen = (n) => `${n.toLocaleString('ja-JP')}円`;
const TODO = (label) => `<span class="todo">【公開前に記入：${esc(label)}】</span>`;

// 購入ボタン。販売ページのURLが未設定のあいだは「準備中」にする
function buyButton(extraClass = '') {
  return CONFIG.productUrl
    ? `<a class="btn btn-shu btn-lg ${extraClass}" href="${esc(CONFIG.productUrl)}" target="_blank" rel="noopener">購入ページへ（${yen(CONFIG.productPrice)}）</a>`
    : `<span class="btn btn-shu btn-lg ${extraClass}" aria-disabled="true">販売開始の準備中です</span>`;
}

// root：相対パスの起点を上書きする（404ページはどの階層でも表示されるので '/' にする）
// noindex：検索結果に出さず、sitemap.xml にも入れない
function layout({ path, title, description, body, scripts = [], jsonLd, root, noindex }) {
  const depth = path.split('/').length - 1;
  const r = root || (depth ? '../'.repeat(depth) : './');
  const canonical = `${CONFIG.siteUrl}/${path === 'index.html' ? '' : path}`;
  if (!noindex) pages.push(canonical);
  const ga = CONFIG.gaId
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(CONFIG.gaId)}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(CONFIG.gaId)}');</script>`
    : '';
  // Vercel Web Analytics（/_vercel/insights/ は Vercel が配信する。Cookieなし）
  const va = CONFIG.vercelAnalytics
    ? `<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};</script>
<script defer src="/_vercel/insights/script.js"></script>`
    : '';
  const gsc = CONFIG.searchConsoleVerification ? `<meta name="google-site-verification" content="${esc(CONFIG.searchConsoleVerification)}">` : '';
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '' : `<link rel="canonical" href="${esc(canonical)}">`}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:site_name" content="${esc(CONFIG.siteName)}">
<meta property="og:image" content="${esc(CONFIG.siteUrl)}/assets/img/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary_large_image">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<meta name="theme-color" content="#1f5c4a">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%231f5c4a'/%3E%3Ctext x='16' y='23' font-size='20' text-anchor='middle' fill='white' font-family='serif'%3E%E5%B8%B3%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=BIZ+UDPMincho:wght@400;700&family=Zen+Kaku+Gothic+New:wght@700;900&display=swap">
<link rel="stylesheet" href="${r}assets/style.css">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
${gsc}
${ga}
${va}
</head>
<body>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="${r}index.html">
      <span class="brand-seal" aria-hidden="true">帳</span>
      <span class="brand-name">${esc(CONFIG.siteName)}<span class="brand-sub">${esc(CONFIG.tagline)}</span></span>
    </a>
    <nav class="nav" aria-label="メインメニュー">
      <a href="${r}jido.html">児童支援</a>
      <a href="${r}shogai.html">障害福祉</a>
      <a href="${r}kaigo.html">介護</a>
      <a class="nav-cta" href="${r}iken.html">意見箱</a>
    </nav>
  </div>
</header>
<main>
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-cols">
      <div><p class="brand-name" style="margin:0 0 6px">${esc(CONFIG.siteName)}</p><p class="small muted" style="margin:0">${esc(CONFIG.tagline)}</p></div>
      ${SECTORS.map((sec) => `<div><p class="footer-h"><a href="${r}${sec.path}">${esc(sec.name)}</a></p><ul class="footer-list">${sec.tools.slice(0, 6).map((t) => `<li><a href="${r}${t.path}">${esc(t.name)}</a></li>`).join('')}<li><a class="footer-more" href="${r}${sec.path}">${esc(sec.name)}のツールをすべて見る（${sec.tools.length}）</a></li></ul></div>`).join('')}
      <div><p class="footer-h">このサイトについて</p><ul class="footer-list">
        <li><a href="${r}iken.html">意見箱（ほしい書類・ご要望）</a></li>
        <li><a href="${r}flyer.html">職場で紹介するチラシ（印刷用）</a></li>
        <li><a href="${r}about.html">運営者情報・プライバシー</a></li>
        <li><a href="${r}contact.html">お問い合わせ</a></li>
        <li><a href="${r}terms.html">利用規約</a></li>
        <li><a href="${r}template.html">文例つきExcelセット（放デイ・児発）</a></li>
        <li><a href="${r}tokushoho.html">特定商取引法に基づく表記</a></li>
      </ul></div>
    </div>
    <p class="fine">掲載している文例・下書きは、書類を書き始めるためのものです。実際の書類は、ご本人のアセスメントと意向・事実に基づいて作成し、様式や記載方法は指定権者（自治体）の資料をご確認ください。サイト内の「PR」は広告です。<br>&copy; ${new Date().getFullYear()} ${esc(CONFIG.operator)}</p>
  </div>
</footer>
<script src="${r}assets/common.js"></script>
${scripts.map((s) => (typeof s === 'object'
    ? `<script src="${s.src}" integrity="${s.integrity}" crossorigin="anonymous" referrerpolicy="no-referrer"></script>`
    : `<script src="${/^https?:/.test(s) ? s : r + s}"></script>`)).join('\n')}
</body>
</html>
`;
}

// ── ツール用データ ──
function buildData() {
  write('assets/data.js', `window.PLANNER_DATA=${JSON.stringify({ domains: DOMAINS, ages: AGES, issues: ISSUES, traits: TRAITS })};\n`);
}

const POINTS = [
  ['つながりを持たせる', '「利用児及び家族の生活に対する意向」→「総合的な支援の方針」→「長期目標・短期目標」→「支援目標及び具体的な支援内容等」が、ひと続きになるように書きます。'],
  ['本人・家族・移行は必ず', '支援内容の項目は「本人支援」「家族支援」「移行支援」を必ず記載します。「地域支援・地域連携」は必要に応じて記載します（積極的な取り組みが望ましいとされています）。'],
  ['5領域は本人支援に', '本人支援の支援内容には、関連する5領域を記載します。複数にまたがる場合は、すべて記載します。家族支援・移行支援・地域支援には5領域の記載は不要です。'],
  ['目標の主語はこども・家族', '支援目標は、モニタリングの時点で到達しているであろう「こども本人や家族の状況」を具体的に書きます。移行支援・地域支援は、主語が事業所や関係機関になってもかまいません。'],
  ['達成時期は最長6か月', '計画は6か月に1回以上見直すため、達成時期も最長6か月後までにします。1〜3か月で達成する目標も積極的に検討します。'],
  ['当てはめにしない', '5領域に対応する課題や支援を当てはめるだけの計画にならないよう留意します。支援目標や支援内容が、どのこどもでも同じになることは想定されていません。'],
];

// ── トップページ ──
function buildIndex() {
  const sample = ISSUES.find((i) => i.id === 'kirikae');
  const sampleDomains = [...new Set(sample.supports.flatMap((s) => s.domains))];
  const toc = tocHtml('bunrei/');
  const faq = [
    ['無料で使えますか？', 'はい。文例の閲覧と計画書の下書きづくりは無料で、会員登録もいりません。'],
    ['入力した内容は、どこかに送られますか？', '送られません。下書きの組み立ては、すべてお使いのブラウザの中で行います。お子さまの氏名など、個人が特定できる情報を入力する必要もありません。'],
    ['事業所の様式が参考様式と違っても使えますか？', 'はい。「Excelに貼る形でコピー」は、項目・支援目標・支援内容・達成時期・担当者・留意事項・優先順位の順で表をコピーします。事業所の様式に合わせて、必要な列だけ貼り付けてください。'],
    ['できあがった文章をそのまま使ってもいいですか？', 'おすすめしません。文例はあくまで書き始めのための下書きです。お子さまの様子に合わせて、回数・時間・場面などを具体的に書き換えてください。下書きの文章は、画面上でクリックすればその場で直せます。'],
    ['モニタリングの文例もありますか？', 'はい。課題ごとの文例ページに、「達成」「継続」の2パターンでモニタリング（評価）の文例を載せています。'],
  ];

  const body = `
<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <p class="kicker">放課後等デイサービス・児童発達支援の児発管のみなさまへ</p>
      <h1><span class="nb">個別支援計画を、</span><span class="nb"><span class="hl">白紙から</span>書かなくていい。</span></h1>
      <p class="hero-lead">半年ごとにやってくる、利用児全員分の計画書。「最初の一文が出てこない」時間を、ここで短くしませんか。気になる課題を選ぶと、こども家庭庁の参考様式と同じ項目で下書きができます。5領域との関連性も、家族支援・移行支援も入った状態から、お子さまに合わせて書き直すだけです。</p>
      <div class="hero-actions">
        <a class="btn" href="#tool">下書きをつくる（無料）</a>
        <a class="text-link" href="bunrei/index.html">文例集を目次から探す</a>
      </div>
      <ul class="facts">
        <li><b>登録不要</b>・無料</li>
        <li>入力内容は<b>送信されません</b></li>
        <li>文例 <b>${ISSUES.length}課題</b>・モニタリング文例つき</li>
      </ul>
    </div>
    <div class="sample" aria-hidden="true">
      <div class="sample-paper">
        <p class="sample-title">個別支援計画書</p>
        <table class="sample-table"><colgroup><col class="c-item"><col><col><col class="c-period"></colgroup>
          <tr><th>項目</th><th>支援目標</th><th>支援内容（5領域との関連性等）</th><th>達成時期</th></tr>
          <tr>
            <th>本人支援</th>
            <td>${esc(sample.shortGoals[1])}</td>
            <td>${esc(sample.supports[1].text)}<br><span class="dom">【5領域】${esc(domainNames(sampleDomains))}</span></td>
            <td>6か月後</td>
          </tr>
          <tr><th>家族支援</th><td>${esc(sample.familyGoal.slice(0, 34))}…</td><td>${esc(sample.family.slice(0, 30))}…</td><td>6か月後</td></tr>
        </table>
      </div>
      <div class="redpen sample-note">
        <span class="redpen-label">赤ペン</span>
        <p>支援内容ごとに、関連する5領域まで書いた状態で下書きができます。</p>
      </div>
    </div>
  </div>
</section>

<section id="tool" class="tool-section">
  <div class="wrap">
    <div class="section-head tool-head">
      <div>
        <h2 class="serif" style="margin:0;font-size:clamp(22px,3vw,28px)">計画書の下書きをつくる</h2>
        <p class="section-sub">左で条件を選ぶと、右の計画書に文例が入ります。</p>
      </div>
    </div>
    <div class="tool">
      <div class="panel">
        <div class="panel-block">
          <h3 class="panel-title"><span class="no">一</span>対象</h3>
          <div class="seg" id="ageOptions" role="group" aria-label="対象"></div>
        </div>
        <div class="panel-block">
          <h3 class="panel-title"><span class="no">二</span>気になる課題<small>3つ前後がおすすめ</small></h3>
          <p class="picked-caption" id="pickedCaption" hidden>選んだ課題（上から優先順位）</p>
          <ol class="picked" id="picked"></ol>
          <div class="traits" id="traits"></div>
          <label class="visually-hidden" for="issueSearch">課題を絞り込む</label>
          <input type="search" id="issueSearch" class="input" placeholder="絞り込み（例：切り替え、偏食、友だち）">
          <div class="issue-list" id="issueList"></div>
        </div>
        <div class="panel-block">
          <h3 class="panel-title"><span class="no">三</span>お子さまのこと<small>任意</small></h3>
          <label class="field">好きなこと・得意なこと<span class="hint">支援の方針に書き込まれます</span><input id="likes" class="input" placeholder="例：電車、ブロック、絵を描くこと"></label>
          <label class="field">本人・家族の意向<textarea id="wish" class="input" rows="3" placeholder="例：（本人）友だちとゲームがしたい。（保護者）学校の準備を自分でできるようになってほしい。"></textarea></label>
          <label class="field">支援の標準的な提供時間等<input id="time" class="input" placeholder="例：月・水・金 14:30〜17:30"></label>
          <p class="small muted" style="margin:14px 0 0">氏名など、個人が特定できる情報は入力しないでください。入力内容はこの画面の中だけで使われます。</p>
        </div>
      </div>

      <div class="doc-area">
        <div class="doc-bar">
          <div class="coverage" id="coverage" aria-live="polite"></div>
          <div class="doc-actions">
            <button class="btn btn-sm" id="copyTable" type="button" disabled>Excelに貼る形でコピー</button>
            <button class="btn btn-line btn-sm" id="copyText" type="button" disabled>文章でコピー</button>
            <button class="btn btn-line btn-sm" id="printPlan" type="button" disabled>印刷</button>
            <button class="btn btn-line btn-sm ai-btn" id="aiPlan" type="button" disabled>AIで文章を整える</button>
            <button class="btn btn-line btn-sm" id="shareLink" type="button" disabled>リンクで共有</button>
          </div>
        </div>
        <p class="edit-hint">文章は<mark>クリックすると、その場で書き換え</mark>られます。書き換えた箇所は、課題を選び直しても残ります。<span class="sp-only">計画書は横にスクロールできます。</span></p>
        <div class="doc-scroll"><div class="doc" id="doc"></div></div>
        <div id="warn"></div>
        <div class="tool-cta">
          <p>いつものExcelで作りたい方へ。<b>課題を選ぶと文例が入る計画書のExcel</b>もあります。</p>
          <div class="links"><a class="btn btn-sm btn-shu" href="template.html">Excelセットを見る</a><a class="text-link" href="download.html">白紙の様式（無料）</a></div>
        </div>
      </div>
    </div>
  </div>
  <div class="mobile-bar" id="mobileBar"><span id="mobileCount"></span><a class="btn btn-sm" href="#doc">計画書を見る</a></div>
  <p class="toast" id="toast" role="status"></p>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head">
      <div>
        <h2>令和6年度改定後の計画書で、押さえること</h2>
        <p class="section-sub">国の「記載のポイント」から、書くときに迷いやすいところを抜き出しました。</p>
      </div>
      <a class="text-link" href="kakikata.html">書き方をくわしく読む</a>
    </div>
    <div class="points-grid">
      ${POINTS.map(([t, d]) => `<div class="redpen"><span class="redpen-label">${esc(t)}</span><p>${esc(d)}</p></div>`).join('\n')}
    </div>
    <p class="source">出典：${esc(SOURCE_NOTE)}</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head">
      <div>
        <h2>文例集 目次</h2>
        <p class="section-sub">課題ごとに、アセスメントの視点・支援目標・支援内容・留意事項・家族支援・モニタリングの文例をまとめています。</p>
      </div>
    </div>
    ${toc}
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><h2>もっと手早く書きたい方へ</h2></div>
    <div class="offer">
      <div>
        <h3>課題を選ぶと文例が入る、計画書のExcel</h3>
        <p>計画書・モニタリング記録・記入例・${ISSUES.length}課題の文例一覧が入ったExcelと、印刷用の文例全集（PDF）のセットです。${CONFIG.productPrice.toLocaleString('ja-JP')}円（税込）・買い切り。</p>
        <a class="btn btn-sm btn-shu" href="template.html">くわしく見る</a>
      </div>
      <div>
        <h3>白紙の様式（無料）</h3>
        <p>参考様式と同じ項目の、個別支援計画書とモニタリング記録のExcel様式です。登録なしでダウンロードできます。</p>
        <a class="btn btn-line btn-sm" href="download.html">ダウンロードページへ</a>
      </div>
      <div>
        <h3>支援プログラムの下書き（無料）</h3>
        <p>作成・公表が必要な「支援プログラム」を、国の手引きの①〜⑫の項目どおりに作れます。ホームページ掲載用のHTMLもコピーできます。</p>
        <a class="btn btn-line btn-sm" href="program.html">下書きをつくる</a>
      </div>
      <div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><h2>よくある質問</h2></div>
    <dl class="qa" style="max-width:780px">
      ${faq.map(([q, a]) => `<div><dt>${esc(q)}</dt><dd>${esc(a)}</dd></div>`).join('\n')}
    </dl>
  </div>
</section>
`;
  write(
    'jido-keikaku.html',
    layout({
      path: 'jido-keikaku.html',
      title: `個別支援計画の文例と下書き作成【5領域対応・無料】放デイ・児発｜${CONFIG.siteName}`,
      description:
        '放課後等デイサービス・児童発達支援の個別支援計画を、こども家庭庁の参考様式と同じ項目で下書き。5領域との関連性、家族支援・移行支援、モニタリングの文例まで。無料・登録不要、入力内容は送信されません。',
      body: body + toolFooter('jido', 'jido-keikaku.html'),
      scripts: ['assets/data.js', 'assets/app.js'],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
    }),
  );
}

function tocHtml(prefix) {
  return `<div class="toc">${DOMAINS.map(
    (d) => `<div class="toc-group">
    <h3><a href="${prefix}${d.id}.html">${sq(d.id)}${esc(d.name)}</a></h3>
    <ul>${ISSUES.filter((i) => i.domain === d.id)
      .map((i) => `<li><a href="${prefix}${i.id}.html">${esc(i.label)}</a></li>`)
      .join('')}</ul>
  </div>`,
  ).join('')}</div>`;
}

// ── 課題別の文例ページ ──
function exItem(text, extra = '') {
  return `<li><span class="txt">${extra}${esc(text)}</span><button class="copy" type="button" data-copy="${esc(text)}">コピー</button></li>`;
}

function buildIssuePages() {
  for (const issue of ISSUES) {
    const d = domainById[issue.domain];
    const related = ISSUES.filter((i) => i.domain === issue.domain && i.id !== issue.id);
    const body = `
<div class="wrap narrow article">
  <nav class="breadcrumb"><a href="../index.html">トップ</a> ／ <a href="../jido.html">児童支援</a> ／ <a href="index.html">文例集</a> ／ <a href="${d.id}.html">${esc(d.name)}</a></nav>
  <p class="domain-label c-${d.id}">${sq(d.id)}${esc(d.name)}</p>
  <h1>「${esc(issue.label)}」の個別支援計画 文例</h1>
  <p class="lead">放課後等デイサービス・児童発達支援の個別支援計画で使える文例です。アセスメントの視点から、支援目標・支援内容（5領域との関連性つき）・留意事項・家族支援・モニタリングまで、計画書の項目の順に並べています。</p>

  <div class="cta-line">
    <p>この課題を選んだ状態で、参考様式どおりの計画書の下書きを作れます。</p>
    <a class="btn btn-sm" href="../jido-keikaku.html?issues=${issue.id}#tool">この課題で下書きをつくる</a>
  </div>

  <h2>アセスメントで確かめたいこと</h2>
  <ul class="checks">${issue.assess.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>

  <h2>支援目標（具体的な到達目標）の文例</h2>
  <ol class="ex">${issue.shortGoals.map((g) => exItem(g)).join('')}</ol>

  <h2>支援内容の文例</h2>
  <ol class="ex">${issue.supports
    .map(
      (s) =>
        `<li><span class="txt">${esc(s.text)}</span><span class="doms">5領域：${esc(domainNames(s.domains))}</span><button class="copy" type="button" data-copy="${esc(`${s.text}（${domainNames(s.domains)}）`)}">コピー</button></li>`,
    )
    .join('')}</ol>

  <h2>留意事項の文例</h2>
  <ol class="ex">${exItem(issue.note)}</ol>

  <h2>家族支援の文例</h2>
  <ol class="ex">${exItem(issue.familyGoal, '<span class="ex-label" style="color:var(--ink-2)">目標</span>')}${exItem(issue.family, '<span class="ex-label" style="color:var(--ink-2)">内容</span>')}</ol>

  <h2>モニタリング（評価）の文例</h2>
  <ol class="ex">${exItem(issue.monitoring.done, '<span class="ex-label done">達成</span>')}${exItem(issue.monitoring.cont, '<span class="ex-label cont">継続</span>')}</ol>

  <h2>長期目標の文例</h2>
  <ol class="ex">${AGES.map((a) => exItem(`${issue.longGoal}、${a.context}を自信を持って過ごすことができる。`, `<span class="ex-label" style="color:var(--ink-2)">${esc(a.name)}</span>`)).join('')}</ol>

  <div class="redpen" style="margin-top:40px">
    <span class="redpen-label">赤ペン：そのまま写さないで</span>
    <p>国の記載のポイントでは、5領域に課題や支援を「当てはめるだけ」の計画にならないよう求めています。回数・時間・場面・声かけの量など、お子さまの今の様子に合わせて数字と言葉を書き換えてください。</p>
  </div>

  <div class="tool-cta">
    <p>この文例、<b>Excelの計画書でプルダウンから選ぶだけ</b>で入れられます。</p>
    <div class="links"><a class="btn btn-sm btn-shu" href="../template.html">Excelセットを見る</a><a class="text-link" href="../download.html">白紙の様式（無料）</a></div>
  </div>

  <h2>「${esc(d.name)}」のほかの文例</h2>
  <ul class="related">${related.map((i) => `<li><a href="${i.id}.html">${esc(i.label)}</a></li>`).join('')}</ul>
</div>`;
    write(
      `bunrei/${issue.id}.html`,
      layout({
        path: `bunrei/${issue.id}.html`,
        title: `「${issue.label}」の個別支援計画 文例｜支援目標・支援内容・モニタリング【5領域】｜${CONFIG.siteName}`,
        description: `放デイ・児発の個別支援計画で使える「${issue.label}」の文例。支援目標・支援内容（5領域との関連性つき）・留意事項・家族支援・モニタリング（達成／継続）の文例を、計画書の項目順にまとめています。`,
        body,
        scripts: ['assets/copy.js'],
      }),
    );
  }
}

// ── 領域別ページ ──
function buildDomainPages() {
  for (const d of DOMAINS) {
    const issues = ISSUES.filter((i) => i.domain === d.id);
    const body = `
<div class="wrap narrow article">
  <nav class="breadcrumb"><a href="../index.html">トップ</a> ／ <a href="../jido.html">児童支援</a> ／ <a href="index.html">文例集</a></nav>
  <p class="domain-label c-${d.id}">${sq(d.id)}5領域</p>
  <h1>「${esc(d.name)}」の個別支援計画 文例</h1>
  <p class="lead">${esc(d.desc)}</p>
  <h2>日々の支援として書くときの文例</h2>
  <ol class="ex">${exItem(d.generic)}</ol>
  <h2>課題別の文例</h2>
  ${issues
    .map(
      (i) => `<div class="issue-block">
    <h3><a href="${i.id}.html">${esc(i.label)}</a></h3>
    <p class="muted small">支援目標の例：${esc(i.shortGoals[0])}</p>
  </div>`,
    )
    .join('')}
  <div class="cta-line">
    <p>課題を選ぶと、5領域の関連性まで入った計画書の下書きができます。</p>
    <a class="btn btn-sm" href="../jido-keikaku.html#tool">下書きをつくる</a>
  </div>
</div>`;
    write(
      `bunrei/${d.id}.html`,
      layout({
        path: `bunrei/${d.id}.html`,
        title: `5領域「${d.name}」の個別支援計画 文例・支援内容の例｜${CONFIG.siteName}`,
        description: `放デイ・児発の個別支援計画で使える、5領域「${d.name}」の支援目標と支援内容の文例。${issues.map((i) => i.label).slice(0, 3).join('、')}など${issues.length}の課題別にまとめています。`,
        body,
        scripts: ['assets/copy.js'],
      }),
    );
  }
}

function buildBunreiIndex() {
  const body = `
<div class="wrap article">
  <nav class="breadcrumb"><a href="../index.html">トップ</a> ／ <a href="../jido.html">児童支援</a></nav>
  <h1>個別支援計画 文例集</h1>
  <p class="lead">5領域と課題ごとに、アセスメントの視点・支援目標・支援内容・留意事項・家族支援・モニタリングの文例をまとめています。</p>
  ${tocHtml('')}
</div>`;
  write(
    'bunrei/index.html',
    layout({
      path: 'bunrei/index.html',
      title: `個別支援計画の文例集｜5領域・課題別【放デイ・児発】｜${CONFIG.siteName}`,
      description: `放デイ・児発の個別支援計画の文例を、5領域（健康・生活／運動・感覚／認知・行動／言語・コミュニケーション／人間関係・社会性）と${ISSUES.length}の課題別に掲載。モニタリングの文例つき。`,
      body,
    }),
  );
}

// ── 書き方ガイド ──
function buildGuide() {
  const body = `
<div class="wrap narrow article">
  <nav class="breadcrumb"><a href="index.html">トップ</a> ／ <a href="jido.html">児童支援</a></nav>
  <h1>個別支援計画の書き方<br><small class="muted" style="font-size:.6em">令和6年度報酬改定・5領域対応</small></h1>
  <p class="lead">放課後等デイサービス・児童発達支援の個別支援計画は、令和6年度の報酬改定で書くべき内容が増えました。国が示した「記載のポイント」に沿って、項目ごとの書き方を整理します。</p>

  <h2>計画書の項目と書き方</h2>
  <h3>利用児及び家族の生活に対する意向</h3>
  <p>こども本人や家族の意向を聞いたうえで、家族から得た情報や発達段階・特性をふまえて整理して書きます。本人の言葉は、できるだけそのまま残すと伝わりやすくなります。</p>
  <h3>総合的な支援の方針</h3>
  <p>おおむね1年を目安に、事業所としての見立てと、どのように支援していくかの方針を書きます。次の視点をふまえます。</p>
  <ul class="plain">
    <li>障害児支援利用計画や担当者会議で求められている、事業所の役割</li>
    <li>支援の場面だけでなく、家庭や園・学校での生活や育ちの視点</li>
    <li>保育所等への移行や、同年代のこどもとの仲間づくりなど、インクルージョンの視点</li>
    <li>継続して利用している場合は、前回のモニタリング結果をふまえた視点</li>
  </ul>
  <h3>長期目標・短期目標</h3>
  <p>長期目標は方針をふまえておおむね1年、短期目標は長期目標をふまえておおむね6か月で目指す目標を書きます。</p>
  <h3>支援の標準的な提供時間等</h3>
  <p>利用する曜日・頻度・提供時間を書きます。計画時間や延長時間は別表で定めることもできます。</p>

  <h2>支援目標及び具体的な支援内容等（表の部分）</h2>
  <ul class="plain">
    <li><strong>項目</strong>：「本人支援」「家族支援」「移行支援」は必ず書きます。「地域支援・地域連携」は必要に応じて書きます。</li>
    <li><strong>支援目標</strong>：モニタリングのときに到達しているであろう「こども本人や家族の状況」を、具体的な到達目標として書きます。主語はこども本人や家族が基本です。</li>
    <li><strong>支援内容</strong>：事業所がどのような支援・工夫・配慮をするかを具体的に書きます。本人支援では、関連する5領域をすべて書きます。</li>
    <li><strong>達成時期</strong>：最長6か月後まで。1〜3か月で達成する目標も積極的に検討します。</li>
    <li><strong>担当者・提供機関</strong>：主に支援する担当者の氏名や職種を書きます。関係機関と連携する場合は、連携先の機関名も書きます。</li>
    <li><strong>留意事項</strong>：加算の算定を想定している取り組みは、加算名や頻度を書きます。家族の役割など補足があれば書きます。</li>
    <li><strong>優先順位</strong>：本人支援の各支援内容に、取り組みの優先順位をつけます。家族支援・移行支援・地域支援には不要です。</li>
  </ul>

  <h2>目標をうまく書くコツ</h2>
  <ol class="steps">
    <li><strong>場面と行動を書く</strong><br>「落ち着いて過ごす」ではなく、「タイマーが鳴ったら、声かけ2回以内で片付けを始めることができる」のように、場面と行動を書きます。</li>
    <li><strong>評価できる数字を入れる</strong><br>回数・時間・声かけの量を入れると、モニタリングで「達成」「継続」を判断しやすくなります。</li>
    <li><strong>肯定的な言葉で書く</strong><br>「〜しない」ではなく、身につけたい姿を「〜できる」で書きます。</li>
    <li><strong>目標と支援内容を書き分ける</strong><br>目標は「こども」が主語、支援内容は「職員・事業所」の行動として書きます。</li>
  </ol>

  <div class="redpen" style="margin-top:32px">
    <span class="redpen-label">赤ペン：当てはめにしない</span>
    <p>5領域の視点でアセスメントを行い、5領域を網羅した支援を行うことが求められています。一方で、5領域に対応する課題や支援を当てはめるだけの計画にならないよう、また支援目標や支援内容がどのこどもでも同じにならないよう留意することとされています。</p>
  </div>
  <p class="source">出典：${esc(SOURCE_NOTE)}</p>

  <div class="cta-line">
    <p>この構成どおりの下書きを、課題を選ぶだけで作れます。</p>
    <a class="btn btn-sm" href="jido-keikaku.html#tool">下書きをつくる</a>
  </div>
  <p class="small muted">※ 様式や記載方法の細かな求めは、自治体（指定権者）によって異なります。必ず最新の資料をご確認ください。</p>
</div>`;
  write(
    'kakikata.html',
    layout({
      path: 'kakikata.html',
      title: `個別支援計画の書き方｜令和6年度改定の記載のポイント・5領域【放デイ・児発】｜${CONFIG.siteName}`,
      description:
        '放課後等デイサービス・児童発達支援の個別支援計画の書き方を、国の「記載のポイント」に沿って項目ごとに解説。5領域との関連性、達成時期、優先順位、担当者の書き方まで。',
      body,
    }),
  );
}

// ── 運営指導前チェックリスト ──
function buildChecklist() {
  const groups = [
    ['計画書の中身', [
      ['本人・家族の意向が書かれている'],
      ['意向 → 方針 → 目標 → 支援内容が、ひと続きになっている'],
      ['支援目標が、場面・行動・数字を含む評価できる書き方になっている'],
      ['本人支援の支援内容ごとに、関連する5領域が書かれている', '複数にまたがる場合はすべて'],
      ['「本人支援」「家族支援」「移行支援」が書かれている', '地域支援・地域連携は必要に応じて'],
      ['インクルージョン（地域社会への参加・包摂）の視点が入っている'],
      ['達成時期が6か月以内になっている'],
      ['担当者（職種・氏名）と、連携先の機関名が書かれている'],
      ['本人支援に優先順位がついている'],
      ['支援の標準的な提供時間等（曜日・頻度・時間）が書かれている'],
      ['加算を算定する取り組みは、加算名・頻度が書かれている'],
    ]],
    ['作成の手続き', [
      ['アセスメントの記録が残っている'],
      ['原案を担当者会議で検討した記録がある'],
      ['本人・保護者に説明し、同意を得た記録（保護者の署名等）がある'],
      ['同意を得た計画書を保護者に交付している'],
    ]],
    ['モニタリング・見直し', [
      ['6か月に1回以上、モニタリングと計画の見直しをしている'],
      ['モニタリングで、目標ごとの達成状況が記録されている'],
      ['日々の支援記録が、計画の支援内容と対応している'],
      ['支援目標や支援内容が、長いあいだ同じままになっていない'],
    ]],
    ['事業所として', [
      ['5領域との関連を明確にした支援プログラムを作成・公表し、届け出ている'],
      ['計画書の様式が、指定権者の最新の求めに合っている'],
    ]],
  ];
  let n = 0;
  const total = groups.reduce((a, [, items]) => a + items.length, 0);
  const body = `
<div class="wrap narrow article">
  <nav class="breadcrumb"><a href="index.html">トップ</a> ／ <a href="jido.html">児童支援</a></nav>
  <h1>個別支援計画 運営指導前チェックリスト</h1>
  <p class="lead">運営指導（実地指導）の前に、個別支援計画まわりの書類を${total}項目で確認できます。チェックはこの端末のブラウザにだけ保存されます。</p>
  <div class="progress"><div class="progress-track"><div class="progress-bar" id="progressBar"></div></div><span id="progressText"></span></div>
  ${groups
    .map(
      ([title, items]) => `<section class="check-group"><h2>${esc(title)}</h2>${items
        .map(([t, s]) => `<label class="check"><input type="checkbox" data-key="c${n++}"><span>${esc(t)}${s ? `<small>${esc(s)}</small>` : ''}</span></label>`)
        .join('')}</section>`,
    )
    .join('')}
  <p style="margin-top:24px"><button class="btn btn-line btn-sm" id="resetChecks" type="button">チェックをすべて外す</button></p>
  <p class="source">参考：${esc(SOURCE_NOTE)}。減算の要件や必要な書類は自治体によって異なるため、必ず指定権者の資料をご確認ください。</p>
</div>`;
  write(
    'checklist.html',
    layout({
      path: 'checklist.html',
      title: `個別支援計画の運営指導前チェックリスト【放デイ・児発】｜${CONFIG.siteName}`,
      description: `放課後等デイサービス・児童発達支援の運営指導（実地指導）前に、個別支援計画・モニタリング・支援プログラムの書類を${total}項目で確認できる無料チェックリスト。`,
      body,
      scripts: ['assets/checklist.js'],
    }),
  );
}

// ── 運営者情報・免責 ──
function buildAbout() {
  const body = `
<div class="wrap narrow article">
  <nav class="breadcrumb"><a href="index.html">トップ</a></nav>
  <h1>運営者情報・免責事項</h1>
  <h2>運営者</h2>
  <p>${esc(CONFIG.operator)}</p>
  ${CONFIG.contactUrl ? `<p><a href="${esc(CONFIG.contactUrl)}" target="_blank" rel="noopener">お問い合わせフォーム</a></p>` : ''}
  <h2>このサイトについて</h2>
  <p>${esc(CONFIG.siteName)}は、介護・障害福祉・児童支援の現場で働く方の書類づくりの負担を減らすための、無料ツール集です。サイトの運営費は、サイト内の広告（「PR」と表示しています）でまかなっています。</p>
  <h2>免責事項</h2>
  <ul class="plain">
    <li>掲載している文例・下書きは、書類を書き始めるためのものです。実際の書類は、ご本人のアセスメントと意向、事実に基づいて作成してください。</li>
    <li>制度や様式の細かな求めは自治体（指定権者）によって異なり、改定されることがあります。最新の情報は必ず指定権者の資料をご確認ください。</li>
    <li>当サイトの情報を利用したことで生じた損害について、運営者は責任を負いかねます。</li>
  </ul>
  <h2>プライバシーポリシー</h2>
  <ul class="plain">
    <li>下書きづくりの画面に入力した内容は、お使いのブラウザの中でのみ処理され、当サイトのサーバーに送信・保存されることはありません。</li>
    <li>チェックリストのチェック状態は、お使いのブラウザ（localStorage）にのみ保存されます。</li>
    <li>意見箱に送っていただいた内容（ご意見・任意のメールアドレス）は、ツールの改善と、ご希望の場合の返信のためだけに使い、第三者に提供しません。</li>
    <li>当サイトは、アフィリエイトプログラム（A8.net などの広告配信サービス）を利用することがあります。広告の成果を計測するため、広告配信事業者がCookieを使用する場合があります。Cookieはブラウザの設定で無効にできます。</li>
    ${CONFIG.gaId ? '<li>サイトの改善のため、Google アナリティクスでアクセス情報を収集しています。個人を特定する情報は含みません。</li>' : ''}
    ${CONFIG.vercelAnalytics ? '<li>サイトの改善のため、Vercel Web Analytics で閲覧されたページの数を計測しています。Cookieは使わず、個人を特定する情報は集めません。</li>' : ''}
  </ul>
  <p class="small muted">最終更新日：${BUILD_DATE}</p>
</div>`;
  write('about.html', layout({ path: 'about.html', title: `運営者情報・免責事項｜${CONFIG.siteName}`, description: `${CONFIG.siteName}の運営者情報・免責事項・プライバシーポリシー。`, body }));
}

function buildSeoFiles() {
  write(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((u) => `  <url><loc>${esc(u)}</loc><lastmod>${BUILD_DATE}</lastmod></url>`).join('\n')}
</urlset>
`,
  );
  write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${CONFIG.siteUrl}/sitemap.xml\n`);
  // Cloudflare Pages / Netlify が読むヘッダー設定。外部から読み込むのはフォント・QRコード・計測・意見箱の送信先だけ
  const feedbackHost = CONFIG.feedbackEndpoint ? new URL(CONFIG.feedbackEndpoint).origin : '';
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    `connect-src 'self' https://script.google.com https://script.googleusercontent.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com${feedbackHost && !feedbackHost.includes('script.google') ? ' ' + feedbackHost : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join('; ');
  // Vercel が読む設定（リポジトリの直下）。ビルドの方法と、上と同じヘッダー
  const security = [
    ['X-Content-Type-Options', 'nosniff'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
    ['X-Frame-Options', 'SAMEORIGIN'],
    ['Content-Security-Policy', csp],
  ].map(([key, value]) => ({ key, value }));
  writeFileSync(join(ROOT, 'vercel.json'), JSON.stringify({
    buildCommand: 'node scripts/build.mjs',
    outputDirectory: 'site',
    framework: null,
    headers: [
      { source: '/(.*)', headers: security },
      { source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }] },
      { source: '/assets/img/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800' }] },
      { source: '/files/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400' }] },
    ],
  }, null, 2) + '\n');
  write('_headers', `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  X-Frame-Options: SAMEORIGIN
  Content-Security-Policy: ${csp}

/assets/*
  Cache-Control: public, max-age=3600

/assets/img/*
  Cache-Control: public, max-age=604800

/files/*
  Cache-Control: public, max-age=86400
`);
}

rmSync(join(OUT, 'bunrei'), { recursive: true, force: true });
buildData();
buildIndex();
buildBunreiIndex();
buildDomainPages();
buildIssuePages();
buildGuide();
buildChecklist();
buildAbout();
for (const pg of portalPages({ esc, CONFIG })) {
  write(pg.path, layout({ path: pg.path, title: pg.title, description: pg.description, body: pg.body }));
}
write('assets/program-data.js', programData());
write('assets/shogai-data.js', shogaiData());
write('assets/jiko-data.js', jikoData());
write('assets/renrakucho-data.js', renrakuchoData());
for (const pg of [flyerPage({ esc, CONFIG }), ikenPage({ esc, CONFIG }), startPage({ esc, CONFIG, OUT })]) {
  write(pg.path, layout({ path: pg.path, title: pg.title, description: pg.description, body: pg.body, scripts: pg.scripts }));
}
for (const pg of [shogaiPage({ esc }), jikoPage({ esc }), renrakuchoPage({ esc }), ...formdocPages({ esc, CONFIG })]) {
  write(pg.path, layout({ path: pg.path, title: pg.title, description: pg.description, body: pg.body + toolFooter(pg.sector || 'shogai', pg.path), scripts: pg.scripts }));
}
{
  const pg = programPage({ esc });
  write(pg.path, layout({ path: pg.path, title: pg.title, description: pg.description, body: pg.body + toolFooter('jido', pg.path), scripts: pg.scripts }));
}
for (const pg of salesPages({ CONFIG, ISSUES, esc, yen, TODO, buyButton })) {
  write(pg.path, layout({
    path: pg.path, title: pg.title, description: pg.description, body: pg.body,
    jsonLd: pg.faq ? {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: pg.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    } : undefined,
  }));
}
write('404.html', layout({
  path: '404.html', root: '/', noindex: true,
  title: `ページが見つかりません｜${CONFIG.siteName}`,
  description: 'お探しのページは見つかりませんでした。',
  body: `
<section class="portal-hero portal-hero-sm">
  <div class="wrap">
    <span class="pill">404</span>
    <h1>ページが見つかりませんでした</h1>
    <p class="lead">移動したか、URLが変わった可能性があります。下の入口から、お使いのツールを探してください。</p>
    <div class="hero-jump">${SECTORS.map((sec) => `<a class="jump jump-${sec.id}" href="/${sec.path}"><b>${esc(sec.name)}</b><span>${esc(sec.sub)}</span></a>`).join('')}</div>
    <p style="margin-top:24px"><a class="btn" href="/">トップページへ</a></p>
  </div>
</section>`,
}));
if (!CONFIG.siteUrl || CONFIG.siteUrl === 'https://example.com') console.warn('[公開前に必須] data/config.mjs: siteUrl（共有・検索・LINEの画像に使うURL）');
if (!CONFIG.feedbackEndpoint && !CONFIG.feedbackEmail) console.warn('[公開前に推奨] data/config.mjs: feedbackEndpoint（意見箱の送り先。docs/deploy.md の「5. 意見箱」）');
const salesMissing = ['sellerName', 'supportEmail', 'productUrl'].filter((k) => !CONFIG[k]);
if (salesMissing.length) console.warn(`[有料販売を始めるときに] data/config.mjs: ${salesMissing.join(', ')}`);
buildSeoFiles();
console.log(`built ${pages.length} pages into site/`);
