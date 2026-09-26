// 静的サイトを site/ に生成する。使い方: node scripts/build.mjs
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMAINS, AGES, ISSUES } from '../data/issues.mjs';
import { CONFIG } from '../data/config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'site');
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const domainById = Object.fromEntries(DOMAINS.map((d) => [d.id, d]));
const pages = [];

function write(path, html) {
  const file = join(OUT, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

function tag(domainId) {
  const d = domainById[domainId];
  return `<span class="tag tag-${d.id}">${esc(d.name)}</span>`;
}

function cta(url, label, pendingLabel) {
  return url
    ? `<a class="btn" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`
    : `<span class="btn btn-disabled" aria-disabled="true">${esc(pendingLabel)}</span>`;
}

function layout({ path, title, description, body, scripts = [], jsonLd }) {
  const depth = path.split('/').length - 1;
  const r = depth ? '../'.repeat(depth) : './';
  const canonical = `${CONFIG.siteUrl}/${path === 'index.html' ? '' : path}`;
  pages.push(canonical);
  const ga = CONFIG.gaId
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(CONFIG.gaId)}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(CONFIG.gaId)}');</script>`
    : '';
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:site_name" content="${esc(CONFIG.siteName)}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#2f6f5e">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='46' fill='%232f6f5e'/%3E%3Ctext x='50' y='68' font-size='52' text-anchor='middle' fill='white' font-family='sans-serif'%3E5%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="${r}assets/style.css">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
${ga}
</head>
<body>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="logo" href="${r}index.html"><span class="logo-mark">5</span><span>${esc(CONFIG.siteName)}</span></a>
    <nav class="nav">
      <a href="${r}index.html#tool">計画を作る</a>
      <a href="${r}bunrei/index.html">文例集</a>
      <a href="${r}kakikata.html">書き方</a>
      <a href="${r}checklist.html">チェックリスト</a>
    </nav>
  </div>
</header>
<main>
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <p class="footer-links">
      <a href="${r}index.html">トップ</a>
      <a href="${r}bunrei/index.html">5領域の文例集</a>
      <a href="${r}kakikata.html">個別支援計画の書き方</a>
      <a href="${r}checklist.html">運営指導前チェックリスト</a>
      <a href="${r}about.html">運営者情報・免責事項</a>
    </p>
    <p class="note">掲載している文例は作成の「たたき台」です。実際の計画は、お子さまのアセスメントと本人・保護者の意向をもとに作成し、指定権者（自治体）の指導内容をご確認ください。</p>
    <p class="note">&copy; ${new Date().getFullYear()} ${esc(CONFIG.operator)}</p>
  </div>
</footer>
${scripts.map((s) => `<script src="${r}${s}"></script>`).join('\n')}
</body>
</html>
`;
}

// ── データを JS として出力（ツール用）──
function buildData() {
  const data = { domains: DOMAINS, ages: AGES, issues: ISSUES };
  write('assets/data.js', `window.PLANNER_DATA=${JSON.stringify(data)};\n`);
}

// ── トップページ（作成ツール）──
function buildIndex() {
  const domainCards = DOMAINS.map(
    (d) => `<a class="card domain-card domain-${d.id}" href="bunrei/${d.id}.html">
      <h3>${esc(d.name)}</h3><p>${esc(d.desc)}</p><span class="more">文例を見る →</span></a>`,
  ).join('\n');

  const faq = [
    ['利用は無料ですか？', 'はい、文例の閲覧と計画のたたき台の作成は無料で、会員登録も不要です。'],
    ['入力した内容はどこかに送信されますか？', 'いいえ。計画の組み立てはすべてお使いのブラウザの中で行われ、入力内容がサーバーに送信・保存されることはありません。お子さまの氏名などの個人情報を入力する必要もありません。'],
    ['令和6年度の報酬改定に対応していますか？', '5領域（健康・生活／運動・感覚／認知・行動／言語・コミュニケーション／人間関係・社会性）との関連、本人支援・家族支援・移行支援・地域支援、インクルージョンの観点、支援の標準的な提供時間を記載できる構成にしています。様式や細かな求めは自治体によって異なるため、必ず指定権者の資料をご確認ください。'],
    ['できあがった文章はそのまま使えますか？', '文例は「たたき台」です。お子さまの具体的な様子や数値（回数・時間など）に合わせて必ず書き換えてください。アセスメントに基づかない計画は、運営指導で指摘を受けるおそれがあります。'],
    ['Excelの様式に貼り付けられますか？', '「表形式でコピー」を使うと、支援内容の表をExcelやGoogleスプレッドシートにそのまま貼り付けられます。'],
  ];

  const body = `
<section class="hero">
  <div class="wrap">
    <p class="eyebrow">放課後等デイサービス・児童発達支援の児発管・職員向け</p>
    <h1><span class="nb">個別支援計画のたたき台を、</span><span class="nb">5領域に沿って3分で。</span></h1>
    <p class="lead">お子さまの年齢と、気になる課題を選ぶだけ。令和6年度報酬改定で求められる<strong>5領域との関連</strong>を示した目標・支援内容の文例を組み立てます。無料・登録不要、入力内容は送信されません。</p>
    <div class="hero-actions">
      <a class="btn btn-lg" href="#tool">無料で計画を作る</a>
      <a class="btn btn-ghost btn-lg" href="bunrei/index.html">文例集を見る</a>
    </div>
    <ul class="hero-points">
      <li>文例 ${ISSUES.length}課題 × 5領域</li>
      <li>Excelに貼れる表形式コピー</li>
      <li>個人情報の入力は不要</li>
    </ul>
  </div>
</section>

<section id="tool" class="section tool-section">
  <div class="wrap">
    <h2>個別支援計画のたたき台を作る</h2>
    <p class="section-lead">氏名などの個人情報は入力しないでください。すべての処理はブラウザ内で行われます。</p>
    <div class="tool">
      <div class="tool-form">
        <div class="step">
          <h3><span class="step-no">1</span>対象の区分</h3>
          <div class="age-options" id="ageOptions" role="radiogroup" aria-label="対象の区分"></div>
        </div>
        <div class="step">
          <h3><span class="step-no">2</span>気になる課題を選ぶ<small>（1〜5つ程度）</small></h3>
          <input type="search" id="issueSearch" class="input" placeholder="キーワードで絞り込み（例：切り替え、偏食、友だち）" aria-label="課題を絞り込み">
          <div id="issueGroups"></div>
        </div>
        <div class="step">
          <h3><span class="step-no">3</span>任意の入力</h3>
          <label class="field">本人の意向<textarea id="wishChild" class="input" rows="2" placeholder="例：友だちと一緒にゲームがしたい"></textarea></label>
          <label class="field">保護者の意向<textarea id="wishParent" class="input" rows="2" placeholder="例：気持ちを切り替えて学校の準備ができるようになってほしい"></textarea></label>
          <div class="field-row">
            <label class="field">支援の標準的な提供時間（平日）<input id="timeWeekday" class="input" placeholder="例：14:30〜17:30"></label>
            <label class="field">（休日・長期休暇）<input id="timeHoliday" class="input" placeholder="例：10:00〜16:00"></label>
          </div>
        </div>
      </div>
      <div class="tool-output" aria-live="polite">
        <div class="output-head">
          <h3>計画のたたき台</h3>
          <div class="coverage" id="coverage"></div>
        </div>
        <div id="output" class="output-body"><p class="empty">左の「2」で課題を選ぶと、ここに計画のたたき台が表示されます。</p></div>
        <div class="output-actions">
          <button class="btn" id="copyText" type="button" disabled>文章でコピー</button>
          <button class="btn btn-ghost" id="copyTable" type="button" disabled>表形式でコピー（Excel用）</button>
          <button class="btn btn-ghost" id="fillDomains" type="button" disabled>不足領域を補う</button>
          <button class="btn btn-ghost" id="printPlan" type="button" disabled>印刷</button>
        </div>
        <p class="toast" id="toast" role="status"></p>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2>5領域ごとの文例集</h2>
    <p class="section-lead">課題ごとに、短期目標・支援内容・家族支援の文例をまとめています。</p>
    <div class="grid">${domainCards}</div>
  </div>
</section>

<section class="section section-alt">
  <div class="wrap">
    <h2>事業所の書類業務をもっと軽く</h2>
    <div class="grid grid-2">
      <div class="card">
        <h3>Excel様式＋文例全集</h3>
        <p>本人支援・家族支援・移行支援まで入った個別支援計画のExcel様式と、モニタリング・支援記録の文例をまとめたテンプレート集です。</p>
        ${cta(CONFIG.productUrl, 'テンプレート集を見る', '準備中')}
      </div>
      <div class="card">
        <h3>事業所向け AI版（先行登録）</h3>
        <p>アセスメントのメモから、お子さま一人ひとりに合わせた計画・モニタリング・支援記録の下書きをAIが作成する事業所向け版を準備しています。</p>
        ${cta(CONFIG.waitlistUrl, '先行登録する', '準備中')}
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap narrow">
    <h2>よくある質問</h2>
    ${faq.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('\n')}
  </div>
</section>
`;
  write(
    'index.html',
    layout({
      path: 'index.html',
      title: `個別支援計画 5領域の文例メーカー｜放デイ・児発【無料】｜${CONFIG.siteName}`,
      description:
        '放課後等デイサービス・児童発達支援の個別支援計画を、5領域に沿って無料で作成。年齢と課題を選ぶだけで、令和6年度報酬改定に対応した目標・支援内容の文例を組み立てます。登録不要・入力内容の送信なし。',
      body,
      scripts: ['assets/data.js', 'assets/app.js'],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      },
    }),
  );
}

// ── 課題別の文例ページ ──
function issueSection(issue, headingLevel = 'h2') {
  return `
<${headingLevel}>短期目標の文例</${headingLevel}>
<ul class="examples">${issue.shortGoals.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>
<${headingLevel}>支援内容の文例</${headingLevel}>
<ul class="examples">${issue.supports
    .map((s) => `<li>${esc(s.text)}<span class="tags">${s.domains.map(tag).join('')}</span></li>`)
    .join('')}</ul>
<${headingLevel}>家族支援の文例</${headingLevel}>
<ul class="examples"><li>${esc(issue.family)}</li></ul>`;
}

function buildIssuePages() {
  for (const issue of ISSUES) {
    const d = domainById[issue.domain];
    const related = ISSUES.filter((i) => i.domain === issue.domain && i.id !== issue.id);
    const longGoals = AGES.map(
      (a) => `<li><strong>${esc(a.name)}：</strong>${esc(`${issue.longGoal}、${a.context}を自信を持って過ごすことができる。`)}</li>`,
    ).join('');
    const body = `
<div class="wrap narrow article">
  <nav class="breadcrumb"><a href="../index.html">トップ</a> › <a href="index.html">文例集</a> › <a href="${d.id}.html">${esc(d.name)}</a> › ${esc(issue.label)}</nav>
  <p class="eyebrow">${tag(d.id)}</p>
  <h1>「${esc(issue.label)}」の個別支援計画 文例</h1>
  <p class="lead">放課後等デイサービス・児童発達支援の個別支援計画で使える、「${esc(issue.label)}」に関する目標と支援内容の文例です。支援内容には、関連する5領域を示しています。</p>
  <div class="callout">
    <p>この課題を選んだ状態で、計画のたたき台を作成できます。</p>
    <a class="btn" href="../index.html?issues=${issue.id}#tool">この文例で計画を作る（無料）</a>
  </div>
  <h2>長期目標の文例</h2>
  <ul class="examples">${longGoals}</ul>
  ${issueSection(issue)}
  <h2>書くときのポイント</h2>
  <ul class="points">
    <li>「〜できる」で終わる、達成したかどうかを判断できる書き方にします。</li>
    <li>回数・時間・声かけの量など、お子さまの現在の様子に合わせて<strong>具体的な数値</strong>に書き換えましょう。</li>
    <li>支援内容には、5領域のどれに関わる支援なのかを明記します（令和6年度報酬改定）。</li>
    <li>本人・保護者の意向と、アセスメントの結果とのつながりが分かるようにします。</li>
  </ul>
  <h2>「${esc(d.name)}」の他の文例</h2>
  <ul class="link-list">${related.map((i) => `<li><a href="${i.id}.html">${esc(i.label)}</a></li>`).join('')}</ul>
</div>`;
    write(
      `bunrei/${issue.id}.html`,
      layout({
        path: `bunrei/${issue.id}.html`,
        title: `「${issue.label}」の個別支援計画 文例（5領域対応）｜${CONFIG.siteName}`,
        description: `放デイ・児発の個別支援計画で使える「${issue.label}」の長期目標・短期目標・支援内容・家族支援の文例。支援内容ごとに5領域との関連を明記しています。`,
        body,
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
  <nav class="breadcrumb"><a href="../index.html">トップ</a> › <a href="index.html">文例集</a> › ${esc(d.name)}</nav>
  <h1>5領域「${esc(d.name)}」の個別支援計画 文例</h1>
  <p class="lead">${esc(d.desc)}</p>
  <h2>「${esc(d.name)}」に関わる支援の例</h2>
  <ul class="examples"><li>${esc(d.generic)}<span class="tags">${tag(d.id)}</span></li></ul>
  <h2>課題別の文例</h2>
  ${issues
    .map(
      (i) => `<section class="issue-block">
    <h3><a href="${i.id}.html">${esc(i.label)}</a></h3>
    <p class="muted">短期目標の例：${esc(i.shortGoals[0])}</p>
    <p><a href="${i.id}.html">支援内容・家族支援の文例を見る →</a></p>
  </section>`,
    )
    .join('')}
  <div class="callout">
    <p>課題を選ぶだけで、5領域に沿った計画のたたき台を作れます。</p>
    <a class="btn" href="../index.html#tool">無料で計画を作る</a>
  </div>
</div>`;
    write(
      `bunrei/${d.id}.html`,
      layout({
        path: `bunrei/${d.id}.html`,
        title: `5領域「${d.name}」の個別支援計画 文例・支援内容の例｜${CONFIG.siteName}`,
        description: `放デイ・児発の個別支援計画で使える、5領域「${d.name}」の目標と支援内容の文例集。${issues.map((i) => i.label).slice(0, 3).join('、')}など${issues.length}の課題別にまとめています。`,
        body,
      }),
    );
  }
}

function buildBunreiIndex() {
  const body = `
<div class="wrap narrow article">
  <nav class="breadcrumb"><a href="../index.html">トップ</a> › 文例集</nav>
  <h1>個別支援計画の文例集（5領域別）</h1>
  <p class="lead">放課後等デイサービス・児童発達支援の個別支援計画で使える文例を、5領域と課題ごとにまとめています。</p>
  ${DOMAINS.map(
    (d) => `<section class="issue-block">
    <h2><a href="${d.id}.html">${esc(d.name)}</a></h2>
    <p class="muted">${esc(d.desc)}</p>
    <ul class="link-list">${ISSUES.filter((i) => i.domain === d.id)
      .map((i) => `<li><a href="${i.id}.html">${esc(i.label)}</a></li>`)
      .join('')}</ul>
  </section>`,
  ).join('')}
</div>`;
  write(
    'bunrei/index.html',
    layout({
      path: 'bunrei/index.html',
      title: `個別支援計画の文例集｜5領域・課題別【放デイ・児発】｜${CONFIG.siteName}`,
      description: `放デイ・児発の個別支援計画の文例を、5領域（健康・生活／運動・感覚／認知・行動／言語・コミュニケーション／人間関係・社会性）と${ISSUES.length}の課題別に掲載。`,
      body,
    }),
  );
}

// ── 書き方ガイド ──
function buildGuide() {
  const body = `
<div class="wrap narrow article">
  <nav class="breadcrumb"><a href="index.html">トップ</a> › 個別支援計画の書き方</nav>
  <h1>個別支援計画の書き方｜令和6年度報酬改定の5領域対応</h1>
  <p class="lead">放課後等デイサービス・児童発達支援の個別支援計画は、令和6年度の報酬改定で記載すべき内容が増えました。押さえるべきポイントと、作成の流れを整理します。</p>

  <h2>改定で求められるようになったこと</h2>
  <ul class="points">
    <li><strong>5領域との関連性</strong>：「健康・生活」「運動・感覚」「認知・行動」「言語・コミュニケーション」「人間関係・社会性」の5領域を踏まえ、支援内容がどの領域に関わるかを示します。</li>
    <li><strong>本人支援・家族支援・移行支援</strong>：本人への支援だけでなく、家族への支援、地域への移行（インクルージョン）に向けた支援を記載します。必要に応じて地域支援・地域連携も記載します。</li>
    <li><strong>インクルージョンの観点</strong>：地域社会への参加・包摂を踏まえた取り組みを盛り込みます。</li>
    <li><strong>支援の標準的な提供時間等</strong>：日々の支援に係る計画時間（延長支援を行う場合はその時間）を記載します。</li>
  </ul>
  <p class="muted">あわせて、事業所ごとに5領域との関連を明確にした「支援プログラム」を作成・公表し、届け出ることが求められています（令和7年4月以降、未公表の場合は減算の対象）。</p>

  <h2>作成の流れ</h2>
  <ol class="steps">
    <li><strong>アセスメント</strong>：本人・保護者との面談、関係機関からの情報をもとに、得意なこと・困っていることを5領域の視点で整理します。</li>
    <li><strong>原案の作成</strong>：本人・保護者の意向をふまえ、長期目標（おおむね1年）・短期目標（おおむね6か月）・具体的な支援内容を書きます。</li>
    <li><strong>担当者会議</strong>：支援に関わる職員で原案を検討します。</li>
    <li><strong>説明・同意・交付</strong>：本人・保護者に説明して同意を得て、計画を交付します。</li>
    <li><strong>モニタリング・見直し</strong>：定期的に（少なくとも6か月に1回以上）支援の効果を確認し、計画を見直します。</li>
  </ol>

  <h2>目標の書き方のコツ</h2>
  <ul class="points">
    <li><strong>具体的に</strong>：「落ち着いて過ごす」ではなく「タイマーが鳴ったら、声かけ2回以内で片付けを始めることができる」のように、場面と行動を書きます。</li>
    <li><strong>達成を判断できる形に</strong>：回数・時間・支援の量（声かけ◯回、職員と一緒に等）を入れると、モニタリングで評価しやすくなります。</li>
    <li><strong>肯定的な表現で</strong>：「〜しない」ではなく「〜できる」と、身につけたい行動を書きます。</li>
    <li><strong>本人が主語</strong>：目標は本人の姿、支援内容は職員の行動として書き分けます。</li>
  </ul>

  <h2>支援内容の書き方のコツ</h2>
  <ul class="points">
    <li>「誰が・いつ・どのように」関わるのかが分かるように書きます。</li>
    <li>支援ごとに関連する5領域を明記します。1つの支援が複数の領域に関わることもあります。</li>
    <li>5領域のうち、計画に出てこない領域がないかを確認します。重点でない領域も、日々の支援での関わりを記載しておくと全体像が伝わります。</li>
  </ul>

  <div class="callout">
    <p>年齢と課題を選ぶだけで、この構成に沿ったたたき台を作れます。</p>
    <a class="btn" href="index.html#tool">無料で計画を作る</a>
  </div>
  <p class="note">※ 様式や記載方法の細かな求めは自治体（指定権者）によって異なります。必ず指定権者の最新の資料をご確認ください。</p>
</div>`;
  write(
    'kakikata.html',
    layout({
      path: 'kakikata.html',
      title: `個別支援計画の書き方｜令和6年度報酬改定・5領域対応のポイント【放デイ・児発】｜${CONFIG.siteName}`,
      description:
        '放課後等デイサービス・児童発達支援の個別支援計画の書き方を解説。令和6年度報酬改定で求められる5領域との関連、本人支援・家族支援・移行支援、目標の具体的な書き方のコツを紹介します。',
      body,
    }),
  );
}

// ── 運営指導前チェックリスト ──
function buildChecklist() {
  const groups = [
    ['計画の内容', [
      'アセスメントの結果（得意なこと・困りごと）が記録として残っている',
      '本人・保護者の意向が記載されている',
      '長期目標・短期目標が、具体的で評価できる書き方になっている',
      '支援内容ごとに、関連する5領域が示されている',
      '本人支援・家族支援・移行支援（必要に応じて地域支援）が記載されている',
      'インクルージョン（地域社会への参加・包摂）の観点が盛り込まれている',
      '支援の標準的な提供時間（延長支援がある場合はその時間）が記載されている',
    ]],
    ['作成の手続き', [
      '児童発達支援管理責任者が計画を作成している',
      '原案について、担当者会議で検討した記録がある',
      '本人・保護者に説明し、同意を得た記録（署名等）がある',
      '同意を得た計画を保護者に交付している',
      '計画の作成日・同意日・計画期間が明記されている',
    ]],
    ['モニタリング・見直し', [
      '定められた期間ごと（少なくとも6か月に1回以上）にモニタリングを行っている',
      'モニタリングで、目標ごとの達成状況と今後の方針が記録されている',
      'モニタリングの結果をふまえて、計画を見直している',
      '日々の支援記録が、計画の支援内容と対応している',
    ]],
    ['事業所として', [
      '5領域との関連を明確にした支援プログラムを作成・公表し、届け出ている',
      '計画の様式が、自治体（指定権者）の最新の求めに合っている',
    ]],
  ];
  let n = 0;
  const body = `
<div class="wrap narrow article">
  <nav class="breadcrumb"><a href="index.html">トップ</a> › 運営指導前チェックリスト</nav>
  <h1>個別支援計画の運営指導前チェックリスト</h1>
  <p class="lead">運営指導（実地指導）の前に、個別支援計画まわりの書類を確認するためのチェックリストです。チェックの状態はこの端末のブラウザにだけ保存されます。</p>
  <div class="progress"><div class="progress-bar" id="progressBar"></div></div>
  <p class="muted" id="progressText"></p>
  ${groups
    .map(
      ([title, items]) => `<section class="check-group"><h2>${esc(title)}</h2>${items
        .map((t) => `<label class="check"><input type="checkbox" data-key="c${n++}"><span>${esc(t)}</span></label>`)
        .join('')}</section>`,
    )
    .join('')}
  <p><button class="btn btn-ghost" id="resetChecks" type="button">チェックをすべて外す</button></p>
  <p class="note">※ 一般的な確認項目をまとめたものです。減算の要件や必要書類は自治体によって異なるため、必ず指定権者の資料をご確認ください。</p>
</div>`;
  write(
    'checklist.html',
    layout({
      path: 'checklist.html',
      title: `個別支援計画の運営指導前チェックリスト【放デイ・児発】｜${CONFIG.siteName}`,
      description:
        '放課後等デイサービス・児童発達支援の運営指導（実地指導）前に、個別支援計画・モニタリング・支援プログラムの書類を確認できる無料チェックリスト。',
      body,
      scripts: ['assets/checklist.js'],
    }),
  );
}

// ── 運営者情報・免責 ──
function buildAbout() {
  const body = `
<div class="wrap narrow article">
  <nav class="breadcrumb"><a href="index.html">トップ</a> › 運営者情報・免責事項</nav>
  <h1>運営者情報・免責事項・プライバシーポリシー</h1>
  <h2>運営者</h2>
  <p>${esc(CONFIG.operator)}</p>
  ${CONFIG.contactUrl ? `<p><a href="${esc(CONFIG.contactUrl)}" target="_blank" rel="noopener">お問い合わせフォーム</a></p>` : ''}
  <h2>このサイトについて</h2>
  <p>${esc(CONFIG.siteName)}は、放課後等デイサービス・児童発達支援で働く方の書類作成の負担を減らすことを目的とした、個別支援計画の文例サイトです。</p>
  <h2>免責事項</h2>
  <ul class="points">
    <li>掲載している文例は、計画作成の参考となる「たたき台」です。実際の計画は、お子さまのアセスメントと本人・保護者の意向に基づいて作成してください。</li>
    <li>制度や様式の細かな求めは自治体（指定権者）によって異なり、改定されることがあります。最新の情報は必ず指定権者の資料をご確認ください。</li>
    <li>当サイトの情報を利用したことによって生じた損害について、運営者は責任を負いかねます。</li>
  </ul>
  <h2>プライバシーポリシー</h2>
  <ul class="points">
    <li>計画作成ツールに入力した内容は、お使いのブラウザ内でのみ処理され、当サイトのサーバーに送信・保存されることはありません。</li>
    <li>チェックリストのチェック状態は、お使いのブラウザ（localStorage）にのみ保存されます。</li>
    ${CONFIG.gaId ? '<li>サイトの改善のため、Google アナリティクスを利用してアクセス情報を収集しています。収集される情報は匿名で、個人を特定するものではありません。</li>' : ''}
  </ul>
  <p class="muted">最終更新日：${BUILD_DATE}</p>
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
buildSeoFiles();
console.log(`built ${pages.length} pages into site/`);
