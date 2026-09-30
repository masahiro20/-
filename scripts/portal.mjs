// 総合サイトの入口（トップ・業種別ページ）と、共通パーツ（共有ボタン・PR枠）。
import { TEMPLATES } from '../data/templates.mjs';

export const SECTORS = [
  {
    id: 'jido', path: 'jido.html', name: '児童支援', sub: '放課後等デイサービス・児童発達支援',
    who: '児発管・児童指導員・保育士のみなさま',
    lead: '令和6年度の報酬改定で書き方が変わった個別支援計画と、公表が必要な支援プログラム。5領域との関連性まで入った下書きを、選ぶだけで作れます。',
    tools: [
      { path: 'jido-keikaku.html', name: '個別支援計画の下書き', desc: '課題を選ぶと、国の参考様式と同じ項目で下書き。5領域・家族支援・移行支援まで。', tag: '人気' },
      { path: 'renrakucho.html', name: '連絡帳の文例メーカー', desc: '今日の活動と様子を選ぶだけで、保護者に伝わる連絡帳の文章に。毎日使えます。', tag: '新着' },
      { path: 'program.html', name: '支援プログラムの下書き', desc: '作成・公表が必要な支援プログラムを、手引きの①〜⑫どおりに。ホームページ掲載用HTMLも。' },
      { path: 'bunrei/index.html', name: '個別支援計画の文例集', desc: '31課題の支援目標・支援内容・モニタリングの文例。' },
      { path: 'jiko.html', name: '事故・ヒヤリハット報告の下書き', desc: '国の標準様式の項目で、原因分析と再発防止策まで。' },
      { path: 'checklist.html', name: '運営指導前チェックリスト', desc: '個別支援計画まわりの書類を21項目で確認。' },
      { path: 'download.html', name: '白紙の計画書様式（Excel）', desc: '参考様式と同じ項目のExcel様式を無料でダウンロード。' },
    ],
    guides: [{ path: 'kakikata.html', name: '個別支援計画の書き方（令和6年度改定・5領域）' }],
    upcoming: ['おたより（月1回のお知らせ）の文例', '安全計画（送迎・置き去り防止）の下書き'],
  },
  {
    id: 'shogai', path: 'shogai.html', name: '障害福祉', sub: '就労継続支援・就労移行支援・生活介護・グループホーム',
    who: 'サービス管理責任者・生活支援員・職業指導員のみなさま',
    lead: '利用者さん一人ひとりの個別支援計画。希望と課題を選ぶだけで、目標・支援内容・留意事項まで入った下書きを作れます。',
    tools: [
      { path: 'shogai-keikaku.html', name: '個別支援計画の下書き', desc: '就労B・A・移行・生活介護・GHに対応。希望と課題を選ぶと、目標と支援内容の下書きに。', tag: '新着' },
      { path: 'jiko.html', name: '事故・ヒヤリハット報告の下書き', desc: '国の標準様式の項目で、原因分析と再発防止策まで。' },
    ],
    guides: [],
    upcoming: ['アセスメントシートの下書き', '工賃（賃金）向上計画の下書き'],
  },
  {
    id: 'kaigo', path: 'kaigo.html', name: '介護', sub: '特養・老健・グループホーム・デイサービス・訪問介護',
    who: '介護職員・生活相談員・管理者のみなさま',
    lead: '事故のたびに書く事故報告書。原因分析が「見守り不足」で終わらないよう、本人・職員・環境の要因と、それに合った再発防止策を選んで組み立てられます。',
    tools: [
      { path: 'jiko.html', name: '事故報告書の下書き', desc: '厚生労働省の標準様式の項目で。転倒・転落・誤嚥・誤薬など種別ごとの文例つき。', tag: '新着' },
    ],
    guides: [],
    upcoming: ['ヒヤリハットの月別集計表', '看取り（ターミナルケア）の記録の文例'],
  },
];

// 共通テンプレートを業種ごとのツール一覧に足す（その業種が主のものを先に）
for (const sec of SECTORS) {
  const own = TEMPLATES.filter((t) => t.sectors[0] === sec.id);
  const shared = TEMPLATES.filter((t) => t.sectors[0] !== sec.id && t.sectors.includes(sec.id));
  const tools = [...own, ...shared].map((t) => ({ path: t.path, name: t.name, desc: t.desc, tag: t.tag }));
  // 業種の中心になる計画書ツールのすぐ後ろに、毎日・毎月使う書類を入れる
  sec.tools.splice(sec.id === 'jido' ? 3 : 1, 0, ...tools);
}

export function shareBlock({ esc, url, title, r }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return `<div class="share">
  <p class="share-title">同じ職場の方にも、教えてあげてください</p>
  <div class="share-btns">
    <a class="share-btn share-line" href="https://social-plugins.line.me/lineit/share?url=${u}" target="_blank" rel="noopener">LINEで送る</a>
    <a class="share-btn share-x" href="https://twitter.com/intent/tweet?url=${u}&text=${t}" target="_blank" rel="noopener">Xでシェア</a>
    <button type="button" class="share-btn" data-copy-url="${esc(url)}">URLをコピー</button>
  </div>
  <p class="share-sub">事務所に貼れる<a href="${r || ''}flyer.html">紹介チラシ（QRコードつき）</a>もあります。</p>
</div>`;
}

// url が設定された枠だけを出す。ステマ規制に合わせて「PR」を明記する
export function affiliateBlock({ esc, CONFIG, sector }) {
  const items = (CONFIG.affiliates || []).filter((a) => a.url && (a.sectors.includes('all') || a.sectors.includes(sector)));
  if (!items.length) return '';
  return `<aside class="pr-box" aria-label="広告">
  <p class="pr-label">PR</p>
  <div class="pr-items">${items
    .map((a) => `<a class="pr-item" href="${esc(a.url)}" target="_blank" rel="noopener sponsored">
      <b>${esc(a.title)}</b><span>${esc(a.text)}</span><em>${esc(a.cta)} →</em></a>`)
    .join('')}</div>
</aside>`;
}

function toolCard(t, esc) {
  return `<a class="tool-card" href="${esc(t.path)}">
    ${t.tag ? `<span class="pill pill-shu">${esc(t.tag)}</span>` : ''}
    <b>${esc(t.name)}</b><span>${esc(t.desc)}</span><em>使ってみる →</em></a>`;
}

export function portalPages({ esc, CONFIG }) {
  const home = `
<section class="portal-hero">
  <div class="wrap">
    <span class="pill">介護・障害福祉・児童支援で働く方へ</span>
    <h1>福祉の現場の書類を、<br><span class="hl">もっとかんたんに。</span></h1>
    <p class="lead">計画書や報告書の「最初の一文が出てこない」を、選ぶだけの下書きで助けます。すべて無料・登録不要。入力した内容はどこにも送られません。</p>
    <div class="hero-jump">
      ${SECTORS.map((s) => `<a class="jump jump-${s.id}" href="${s.path}"><b>${esc(s.name)}</b><span>${esc(s.sub)}</span></a>`).join('')}
    </div>
    <ul class="portal-points">
      <li><b>国の様式どおり</b>の項目で下書き</li>
      <li>文章は<b>その場で書き換え</b>、コピーして使える</li>
      <li><b>AIに頼む文章</b>もワンクリックで</li>
    </ul>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><h2>業種ごとのツール</h2></div>
    <div class="sector-grid">
      ${SECTORS.map((s) => `<div class="sector-card sector-${s.id}">
        <a class="sector-head" href="${s.path}"><b>${esc(s.name)}</b><span>${esc(s.sub)}</span></a>
        <ul>${s.tools.slice(0, 4).map((t) => `<li><a href="${esc(t.path)}">${esc(t.name)}</a>${t.tag ? ` <span class="pill pill-shu">${esc(t.tag)}</span>` : ''}</li>`).join('')}</ul>
        <a class="text-link" href="${s.path}">${esc(s.name)}のツールをすべて見る</a>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="section section-band">
  <div class="wrap band">
    <div>
      <h2>事業所みんなで、<br>書き方をそろえる。</h2>
      <p>職員によって計画書の書き方がばらばら。新しく入った人が、何から書けばいいか分からない。そんな事業所で、共通の「書き始め」として使ってください。選んだ課題はリンクにして同僚に送れます（入力した文章は含まれません）。</p>
    </div>
    <a class="btn btn-yellow" href="flyer.html">職場に貼れるチラシを印刷する</a>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><h2>使い方は、どのツールも同じです</h2></div>
    <div class="steps3 steps-mini">
      <div><span class="num">1</span><h3>選ぶ</h3><p>対象・課題・状況を選びます。個人名などは入力しません。</p></div>
      <div><span class="num">2</span><h3>直す</h3><p>国の様式どおりに並んだ下書きを、その子・その方に合わせて書き換えます。</p></div>
      <div><span class="num">3</span><h3>使う</h3><p>コピーして事業所の様式やソフトに貼り付け。AIに整えてもらうこともできます。</p></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap narrow">
    ${shareBlock({ esc, url: `${CONFIG.siteUrl}/`, title: `${CONFIG.siteName}｜福祉の書類を無料でかんたんに` })}
    ${affiliateBlock({ esc, CONFIG, sector: 'all' })}
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><h2>よくある質問</h2></div>
    <dl class="qa" style="max-width:820px">
      <div><dt>本当に無料ですか？</dt><dd>はい。すべてのツールを無料・登録不要でお使いいただけます。運営費は、サイト内の広告（PR）でまかなっています。</dd></div>
      <div><dt>入力した内容は送信されますか？</dt><dd>いいえ。下書きの組み立ては、すべてお使いのブラウザの中で行います。氏名など個人が特定できる情報は入力しないでください。</dd></div>
      <div><dt>「AIに頼む文章」とは？</dt><dd>下書きと注意点をまとめた依頼文をコピーできる機能です。ChatGPT・Claude・Geminiなどに貼り付けると、文章を整えてもらえます。AIに貼る前に、個人が特定できる情報が入っていないか確認してください。</dd></div>
      <div><dt>そのまま提出してもいいですか？</dt><dd>下書きは書き始めのためのものです。ご本人のアセスメントや事実に合わせて必ず書き直し、様式や記載方法は自治体（指定権者）の資料をご確認ください。</dd></div>
    </dl>
  </div>
</section>`;

  const hubs = SECTORS.map((s) => ({
    path: s.path,
    title: `${s.name}（${s.sub}）の書類ツール【無料】｜${CONFIG.siteName}`,
    description: `${s.sub}で働く方のための無料ツール。${s.tools.map((t) => t.name).join('・')}。登録不要・入力内容は送信されません。`,
    sector: s.id,
    body: `
<section class="portal-hero portal-hero-sm hub-${s.id}">
  <div class="wrap">
    <nav class="breadcrumb"><a href="index.html">トップ</a></nav>
    <span class="pill">${esc(s.who)}へ</span>
    <h1>${esc(s.name)}の書類ツール</h1>
    <p class="lead">${esc(s.sub)}</p>
    <p class="lead" style="max-width:44em">${esc(s.lead)}</p>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <div class="tool-grid">${s.tools.map((t) => toolCard(t, esc)).join('')}</div>
    ${s.upcoming && s.upcoming.length ? `<div class="upcoming"><p>準備中のツール</p><ul>${s.upcoming.map((u) => `<li>${esc(u)}</li>`).join('')}</ul></div>` : ''}
    ${s.guides.length ? `<h2 style="margin-top:40px;font-size:20px">読みもの</h2><ul class="plain">${s.guides.map((g) => `<li><a href="${esc(g.path)}">${esc(g.name)}</a></li>`).join('')}</ul>` : ''}
  </div>
</section>
<section class="section">
  <div class="wrap narrow">
    ${shareBlock({ esc, url: `${CONFIG.siteUrl}/${s.path}`, title: `${s.name}の書類がかんたんに作れる無料ツール｜${CONFIG.siteName}` })}
    ${affiliateBlock({ esc, CONFIG, sector: s.id })}
  </div>
</section>`,
  }));

  return [
    {
      path: 'index.html', body: home,
      title: `${CONFIG.siteName}｜介護・障害福祉・児童支援の計画書・報告書を無料でかんたんに`,
      description: '介護・障害福祉・児童支援（放デイ・児発）で働く方のための無料ツール集。個別支援計画、支援プログラム、事故報告書の下書きを、国の様式どおりの項目で作れます。登録不要・入力内容は送信されません。',
    },
    ...hubs,
  ];
}
