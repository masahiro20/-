// 有料セットに入れる「文例全集」（PDF）の元になる HTML を作る。
// 使い方: node products/build_book.mjs → products/build/book.html（PDF化は products/render.cjs）
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMAINS, AGES, ISSUES } from '../data/issues.mjs';
import { CONFIG } from '../data/config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const D = Object.fromEntries(DOMAINS.map((d) => [d.id, d]));
const COLORS = { health: '#3f7a52', motor: '#b0652d', cognition: '#2f5f8f', language: '#7a4f98', social: '#a64837' };

const POINTS = [
  ['つながりを持たせる', '意向 → 総合的な支援の方針 → 長期目標・短期目標 → 支援目標及び具体的な支援内容等が、ひと続きになるように書きます。'],
  ['本人・家族・移行は必ず', '「本人支援」「家族支援」「移行支援」は必ず記載します。「地域支援・地域連携」は必要に応じて記載します。'],
  ['5領域は本人支援に', '本人支援の支援内容に、関連する5領域をすべて記載します。家族支援・移行支援・地域支援には不要です。'],
  ['目標の主語はこども・家族', 'モニタリングの時点で到達しているであろう「こども本人や家族の状況」を、具体的に書きます。'],
  ['達成時期は最長6か月', '計画は6か月に1回以上見直すため、達成時期も最長6か月後まで。1〜3か月の目標も積極的に検討します。'],
  ['当てはめにしない', '5領域に課題や支援を当てはめるだけの計画にならないよう留意します。どのこどもでも同じ目標・支援内容になることは想定されていません。'],
];

const byDomain = DOMAINS.map((d) => ({ d, items: ISSUES.filter((i) => i.domain === d.id) }));
let pageNo = 4; // 表紙・はじめに・5領域・ポイント の次から
const tocRows = byDomain
  .map(
    ({ d, items }) => `<div class="toc-d"><h3 style="color:${COLORS[d.id]}"><i style="background:${COLORS[d.id]}"></i>${esc(d.name)}</h3>
    ${items.map((i) => `<div class="toc-row"><span>${esc(i.label)}</span><span class="dots"></span><span>${++pageNo}</span></div>`).join('')}</div>`,
  )
  .join('');

const issuePages = ISSUES.map((i) => {
  const d = D[i.domain];
  const c = COLORS[d.id];
  return `<section class="page issue">
  <header class="issue-head" style="border-color:${c}">
    <p class="dom" style="color:${c}"><i style="background:${c}"></i>${esc(d.name)}</p>
    <h2>${esc(i.label)}</h2>
  </header>
  <div class="grid">
    <div class="blk"><h4>アセスメントで確かめたいこと</h4><ul class="chk">${i.assess.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>
    <div class="blk"><h4>支援目標（具体的な到達目標）</h4><ol>${i.shortGoals.map((g) => `<li>${esc(g)}</li>`).join('')}</ol></div>
  </div>
  <div class="blk"><h4>支援内容</h4><ol>${i.supports
    .map((s) => `<li>${esc(s.text)}<span class="tags">${s.domains.map((x) => `<b style="color:${COLORS[x]};border-color:${COLORS[x]}">${esc(D[x].name)}</b>`).join('')}</span></li>`)
    .join('')}</ol></div>
  <div class="grid">
    <div class="blk"><h4>留意事項</h4><p>${esc(i.note)}</p></div>
    <div class="blk"><h4>家族支援</h4><p><span class="lab">目標</span>${esc(i.familyGoal)}</p><p><span class="lab">内容</span>${esc(i.family)}</p></div>
  </div>
  <div class="blk"><h4>モニタリング（評価）</h4>
    <p><span class="lab ok">達成</span>${esc(i.monitoring.done)}</p>
    <p><span class="lab cont">継続</span>${esc(i.monitoring.cont)}</p>
  </div>
  <div class="blk"><h4>長期目標の例</h4><p>${esc(i.longGoal)}、学校や家庭での生活を自信を持って過ごすことができる。<span class="muted">（未就学なら「園や家庭での生活」、中高生なら「学校生活や卒業後の生活」に）</span></p></div>
  <p class="memo">メモ：この子の場合は？（回数・時間・場面・好きなものに書き換えて）</p>
</section>`;
}).join('\n');

const html = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=BIZ+UDPMincho:wght@400;700&display=swap">
<style>
@page { size: A4; margin: 14mm 14mm 16mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: "BIZ UDPGothic", sans-serif; color: #1c2126; font-size: 10pt; line-height: 1.75; }
h1, h2, h3, h4 { margin: 0; }
.page { page-break-after: always; }
.page:last-child { page-break-after: auto; }
.muted { color: #767d84; }
.serif { font-family: "BIZ UDPMincho", serif; }
/* 表紙 */
.cover { height: 265mm; display: flex; flex-direction: column; justify-content: space-between; border-top: 8px solid #1f3b60; padding-top: 28mm; }
.cover .seal { width: 22mm; height: 22mm; background: #b63b27; color: #fff; display: grid; place-items: center; font: 700 30pt "BIZ UDPMincho", serif; border-radius: 2mm; }
.cover h1 { font: 700 30pt/1.4 "BIZ UDPMincho", serif; margin: 12mm 0 6mm; letter-spacing: .04em; }
.cover .sub { font-size: 13pt; color: #464d54; }
.cover .chips { display: flex; gap: 3mm; margin-top: 10mm; flex-wrap: wrap; }
.cover .chips span { border: 1px solid #1f3b60; color: #1f3b60; padding: 1.5mm 4mm; border-radius: 1mm; font-weight: 700; }
.cover .doms { display: flex; gap: 2mm; margin-top: 16mm; }
.cover .doms span { flex: 1; color: #fff; text-align: center; padding: 3mm 0; font-weight: 700; font-size: 8.5pt; white-space: nowrap; }
.cover .foot { font-size: 9pt; color: #767d84; border-top: 1px solid #d9d4ca; padding-top: 4mm; }
/* 見出しページ */
.title { font: 700 18pt "BIZ UDPMincho", serif; padding-bottom: 3mm; border-bottom: 2px solid #1c2126; margin-bottom: 6mm; }
.lead { font-size: 10.5pt; color: #464d54; margin: 0 0 6mm; }
.steps { counter-reset: s; margin: 0 0 8mm; padding: 0; list-style: none; }
.steps li { counter-increment: s; position: relative; padding: 2.5mm 0 2.5mm 11mm; border-bottom: 1px solid #e9e5dd; }
.steps li::before { content: counter(s); position: absolute; left: 0; top: 2mm; width: 7mm; height: 7mm; border: 1.5px solid #1f3b60; color: #1f3b60; display: grid; place-items: center; font: 700 10pt "BIZ UDPMincho", serif; }
.toc { columns: 2; column-gap: 10mm; }
.toc-d { break-inside: avoid; margin-bottom: 4mm; }
.toc-d h3 { font-size: 10.5pt; margin-bottom: 1mm; }
.toc-d h3 i, .dom i { display: inline-block; width: 3mm; height: 3mm; margin-right: 2mm; vertical-align: 0; }
.toc-row { display: flex; gap: 2mm; font-size: 9.5pt; line-height: 1.9; }
.toc-row .dots { flex: 1; border-bottom: 1px dotted #b8b2a7; margin-bottom: 2mm; }
.dtable { width: 100%; border-collapse: collapse; }
.dtable th, .dtable td { border: 1px solid #2b2f33; padding: 3mm; vertical-align: top; text-align: left; }
.dtable th { width: 42mm; background: #f3f1ec; }
.redpen { border: 1.5px dashed #b63b27; color: #b63b27; padding: 3mm 4mm; margin-bottom: 3mm; break-inside: avoid; }
.redpen b { display: block; font-size: 9.5pt; }
.pgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm 4mm; }
.tips li { margin-bottom: 2mm; }
/* 課題ページ */
.issue-head { border-left: 3mm solid; padding: 1mm 0 1mm 4mm; margin-bottom: 5mm; }
.issue-head .dom { margin: 0; font-weight: 700; font-size: 9.5pt; }
.issue-head h2 { font: 700 17pt/1.45 "BIZ UDPMincho", serif; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 6mm; }
.blk { margin-bottom: 4mm; break-inside: avoid; }
.blk h4 { font-size: 9.5pt; color: #1f3b60; border-bottom: 1px solid #1f3b60; padding-bottom: 1mm; margin-bottom: 2mm; }
.blk p { margin: 0 0 1.5mm; }
.blk ol, .blk ul { margin: 0; padding-left: 5mm; }
.blk li { margin-bottom: 1.5mm; }
.chk { list-style: none; padding-left: 0 !important; }
.chk li { padding-left: 5mm; position: relative; }
.chk li::before { content: ""; position: absolute; left: 0; top: 1.6mm; width: 2.6mm; height: 2.6mm; border: 1px solid #767d84; }
.tags { display: block; margin-top: .5mm; }
.tags b { display: inline-block; font-size: 8pt; border: 1px solid; padding: 0 1.5mm; margin-right: 1.5mm; border-radius: .8mm; font-weight: 700; line-height: 1.6; }
.lab { display: inline-block; font-size: 8pt; font-weight: 700; border: 1px solid #767d84; color: #464d54; padding: 0 1.5mm; margin-right: 2mm; border-radius: .8mm; line-height: 1.6; }
.lab.ok { color: #3f7a52; border-color: #3f7a52; }
.lab.cont { color: #b0652d; border-color: #b0652d; }
.memo { margin-top: 5mm; border: 1px dashed #b8b2a7; padding: 3mm 4mm 16mm; color: #9aa1a8; font-size: 9pt; }
.agebox { border-top: 1px solid #d9d4ca; padding: 3mm 0; break-inside: avoid; }
.agebox h3 { font-size: 11pt; margin-bottom: 1mm; }
</style></head><body>

<section class="page cover">
  <div>
    <div class="seal">文</div>
    <h1>個別支援計画<br>文例全集</h1>
    <p class="sub">放課後等デイサービス・児童発達支援<br>5領域対応（令和6年度報酬改定）</p>
    <div class="chips"><span>${ISSUES.length}課題</span><span>支援目標・支援内容</span><span>家族支援</span><span>モニタリング</span></div>
    <div class="doms">${DOMAINS.map((d) => `<span style="background:${COLORS[d.id]}">${esc(d.name)}</span>`).join('')}</div>
  </div>
  <p class="foot">${esc(CONFIG.productName)} 付属　ver.${esc(CONFIG.productVersion)}　／　${esc(CONFIG.siteName)}</p>
</section>

<section class="page">
  <h2 class="title">この本の使い方</h2>
  <p class="lead">個別支援計画を書くときに「最初の一文」が出てこない。そんなときに開く文例集です。課題ごとに、計画書の項目の順番で文例を並べました。</p>
  <ol class="steps">
    <li><b>課題を探す</b>　下の目次から、お子さまの気になる課題のページを開きます。</li>
    <li><b>アセスメントを確かめる</b>　ページ上の「確かめたいこと」で、つまずきの理由を確認します。理由によって、合う支援が変わります。</li>
    <li><b>文例を選んで、書き換える</b>　回数・時間・場面・好きなものを、その子に合わせて書き換えます。ページ下のメモ欄も使ってください。</li>
    <li><b>Excelで仕上げる</b>　付属のExcelなら、課題を選ぶだけで同じ文例が計画書に入ります。</li>
  </ol>
  <h2 class="title" style="font-size:14pt">目次</h2>
  <div class="toc">${tocRows}<div class="toc-d"><h3>付録</h3><div class="toc-row"><span>年齢別　移行支援・地域支援の文例</span><span class="dots"></span><span>${pageNo + 1}</span></div></div></div>
</section>

<section class="page">
  <h2 class="title">5領域とは</h2>
  <p class="lead">児童発達支援ガイドラインで示されている、発達支援の5つの領域です。本人支援の支援内容ごとに、どの領域に関わるかを記載します。</p>
  <table class="dtable">${DOMAINS.map((d) => `<tr><th style="color:${COLORS[d.id]}">${esc(d.name)}</th><td>${esc(d.desc)}<br><span class="muted">日々の支援の例：${esc(d.generic)}</span></td></tr>`).join('')}</table>
</section>

<section class="page">
  <h2 class="title">書く前に押さえる6つのポイント</h2>
  <p class="lead">こども家庭庁の「個別支援計画書の記載のポイント（参考様式版）」から、迷いやすいところを抜き出しました。</p>
  <div class="pgrid">${POINTS.map(([t, d]) => `<div class="redpen"><b>${esc(t)}</b>${esc(d)}</div>`).join('')}</div>
  <h2 class="title" style="font-size:14pt;margin-top:6mm">目標を書くコツ</h2>
  <ul class="tips">
    <li><b>場面と行動を書く</b>：「落ち着いて過ごす」ではなく「タイマーが鳴ったら、声かけ2回以内で片付けを始めることができる」。</li>
    <li><b>評価できる数字を入れる</b>：回数・時間・声かけの量があると、モニタリングで「達成／継続」を判断しやすくなります。</li>
    <li><b>肯定的な言葉で</b>：「〜しない」ではなく、身につけたい姿を「〜できる」で。</li>
    <li><b>書き分ける</b>：目標は「こども」が主語、支援内容は「職員・事業所」の行動として書きます。</li>
  </ul>
  <p class="muted" style="font-size:8.5pt">出典：こども家庭庁 支援局障害児支援課 事務連絡（令和6年5月17日）をもとに編集部で要約。様式や記載方法の細かな求めは自治体によって異なります。</p>
</section>

${issuePages}

<section class="page">
  <h2 class="title">付録　年齢別　移行支援・地域支援の文例</h2>
  ${AGES.map((a) => `<div class="agebox"><h3>${esc(a.name)}（${esc(a.service)}）</h3>
    <p><span class="lab">移行支援の目標</span>${esc(a.transitionGoal)}</p>
    <p><span class="lab">移行支援の内容</span>${esc(a.transition)}</p>
    <p><span class="lab">地域支援の目標</span>${esc(a.communityGoal)}</p>
    <p><span class="lab">地域支援の内容</span>${esc(a.community)}</p></div>`).join('')}
  <p class="muted" style="margin-top:8mm;font-size:8.5pt">この文例集は、計画を書き始めるための下書きです。お子さまのアセスメントと、本人・家族の意向に合わせて必ず書き直してください。購入された事業所の中でご自由にお使いいただけます。再配布・転売はご遠慮ください。</p>
</section>
</body></html>`;

const out = join(ROOT, 'products', 'build', 'book.html');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`wrote ${out}`);
