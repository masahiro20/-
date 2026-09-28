// BOOTH などの販売ページに載せる商品画像（正方形）の HTML を作る。
// 使い方: node products/build_thumbs.mjs → products/build/thumbs/*.html
//         PNG化: node products/render.cjs png products/build/thumbs/1-cover.html products/marketing/1-cover.png 600 600
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ISSUES } from '../data/issues.mjs';
import { CONFIG } from '../data/config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'products', 'build', 'thumbs');
const IMG = '../../../site/assets/img/';
mkdirSync(OUT, { recursive: true });

const base = (body) => `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=BIZ+UDPMincho:wght@700&display=swap">
<style>
* { box-sizing: border-box; margin: 0; }
html, body { width: 600px; height: 600px; overflow: hidden; }
body { font-family: "BIZ UDPGothic", sans-serif; color: #1c2126; background: #fffaf0; position: relative; }
.bar { position: absolute; left: 0; right: 0; top: 0; height: 10px; background: #1f3b60; }
.pad { position: absolute; inset: 34px 36px 30px; display: flex; flex-direction: column; }
.pill { align-self: flex-start; background: #fbefec; color: #b63b27; font-weight: 700; font-size: 15px; padding: 4px 14px; border-radius: 999px; }
h1 { font-family: "BIZ UDPMincho", serif; font-size: 42px; line-height: 1.4; margin-top: 16px; letter-spacing: .02em; }
h2 { font-family: "BIZ UDPMincho", serif; font-size: 32px; line-height: 1.4; letter-spacing: .02em; }
.hl { background: linear-gradient(transparent 60%, #ffe78a 60%); }
.sub { font-size: 19px; color: #1f3b60; font-weight: 700; margin-top: 8px; }
.frame { background: #fff; border: 1px solid #d9d4ca; border-radius: 10px; padding: 8px; box-shadow: 0 14px 30px -18px rgba(0,0,0,.35); overflow: hidden; }
.frame img { display: block; width: 100%; border-radius: 4px; }
.tag { position: absolute; background: #b63b27; color: #fff; font-weight: 700; font-size: 16px; padding: 5px 14px; border-radius: 999px; box-shadow: 0 4px 10px rgba(0,0,0,.2); }
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.chips span { border: 1.5px solid #1f3b60; color: #1f3b60; font-weight: 700; font-size: 14px; padding: 3px 10px; border-radius: 6px; background: #fff; }
.foot { margin-top: auto; font-size: 13px; color: #767d84; }
ul.list { list-style: none; padding: 0; margin-top: 16px; }
ul.list li { background: #fff; border: 1px solid #e9e5dd; border-radius: 10px; padding: 11px 14px; margin-bottom: 9px; font-size: 16px; }
ul.list li b { color: #1f3b60; margin-right: 8px; }
.seal { width: 44px; height: 44px; background: #b63b27; color: #fff; display: grid; place-items: center; font: 700 24px "BIZ UDPMincho", serif; border-radius: 6px; }
</style></head><body><div class="bar"></div><div class="pad">${body}</div></body></html>`;

const pages = {
  '1-cover': `
    <span class="pill">放デイ・児発の児発管さんへ</span>
    <h1>課題を選ぶだけで、<br><span class="hl">文例が入る</span>計画書。</h1>
    <p class="sub">個別支援計画の文例つきExcelセット</p>
    <div class="chips"><span>5領域対応</span><span>${ISSUES.length}課題</span><span>モニタリング</span><span>記入例</span><span>文例全集PDF</span></div>
    <div class="frame" style="margin-top:18px"><img src="${IMG}excel-plan-zoom.png"></div>
    <p class="foot">令和6年度報酬改定・こども家庭庁の参考様式と同じ項目</p>`,
  '2-howto': `
    <h2>使い方は3つだけ</h2>
    <div class="frame" style="margin-top:16px;position:relative"><img src="${IMG}excel-plan-zoom.png"></div>
    <span class="tag" style="left:40px;top:150px">① 課題を選ぶ</span>
    <span class="tag" style="left:300px;top:150px">② 文例が入る</span>
    <ul class="list">
      <li><b>1</b>黄色いセルで、対象と課題をプルダウンから選ぶ</li>
      <li><b>2</b>入った文例を、その子に合わせて書き直す</li>
      <li><b>3</b>A4横で印刷。半年後はモニタリング記録へ</li>
    </ul>`,
  '3-contents': `
    <h2>セットの中身</h2>
    <ul class="list">
      <li><b>Excel</b>計画書（文例入り）… 課題を選ぶと文例が入る</li>
      <li><b>Excel</b>モニタリング記録 … 評価を選ぶと文例が入る</li>
      <li><b>Excel</b>記入例・白紙の様式・文例一覧（${ISSUES.length}課題）</li>
      <li><b>PDF</b>文例全集 37ページ（課題ごとに1ページ）</li>
      <li><b>付録</b>はじめにお読みください（使い方・動作環境）</li>
    </ul>
    <div style="display:flex;gap:12px;margin-top:6px;height:150px">
      <div class="frame" style="flex:1"><img src="${IMG}book-cover.png"></div>
      <div class="frame" style="flex:1"><img src="${IMG}book-issue.png"></div>
      <div class="frame" style="flex:1.4"><img src="${IMG}excel-example.png"></div>
    </div>`,
  '4-book': `
    <h2>印刷して使える<br><span class="hl">文例全集</span>（PDF・37ページ）</h2>
    <div style="display:flex;gap:14px;margin-top:18px;height:400px">
      <div class="frame" style="flex:1"><img src="${IMG}book-toc.png"></div>
      <div class="frame" style="flex:1"><img src="${IMG}book-issue.png"></div>
    </div>`,
  '5-monitoring': `
    <h2>モニタリングも、<br><span class="hl">評価を選ぶと文例が入る</span></h2>
    <div class="frame" style="margin-top:18px;height:380px"><img src="${IMG}excel-monitoring.png"></div>
    <p class="foot">支援目標は計画書から自動で写ります</p>`,
};

for (const [name, body] of Object.entries(pages)) {
  writeFileSync(join(OUT, `${name}.html`), base(body));
}
console.log(`wrote ${Object.keys(pages).length} thumbnails into ${OUT}`);
