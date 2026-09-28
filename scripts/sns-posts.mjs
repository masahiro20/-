// 文例データから、X（旧Twitter）などに予約投稿する文章を作る。
// 使い方: node scripts/sns-posts.mjs → docs/sales/sns-posts.csv
// 1日1本 × 課題の数 ＋ 告知の投稿。X の文字数（全角2・半角1・URL 23、上限280）に収まるものだけを出力する。
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMAINS, ISSUES } from '../data/issues.mjs';
import { CONFIG } from '../data/config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const D = Object.fromEntries(DOMAINS.map((d) => [d.id, d]));
const TAGS = '#放デイ #児発管 #個別支援計画';

function weight(text) {
  let n = 0;
  for (const part of text.split(/(https?:\/\/\S+)/)) {
    if (/^https?:\/\//.test(part)) { n += 23; continue; }
    for (const ch of part) n += ch.charCodeAt(0) <= 0x7f ? 1 : 2;
  }
  return n;
}

const posts = [];
for (const i of ISSUES) {
  const url = `${CONFIG.siteUrl}/bunrei/${i.id}.html`;
  const variants = [
    `【個別支援計画の文例】${i.label}\n\n支援目標の例：\n${i.shortGoals[0]}\n\n支援内容（5領域つき）・モニタリングの文例はこちら\n${url}\n${TAGS}`,
    `【個別支援計画の文例】${i.label}\n\n${i.shortGoals[0]}\n\n支援内容・モニタリングの文例\n${url}\n${TAGS}`,
    `【文例】${i.label}（${D[i.domain].name}）\n${i.shortGoals[0]}\n${url}\n#放デイ #児発管`,
  ];
  const text = variants.find((v) => weight(v) <= 280);
  if (text) posts.push({ type: '文例', text });
  else console.warn(`長すぎるため省略: ${i.label}`);
  // モニタリングの文例も別の日に
  const mon = `【モニタリングの文例】${i.label}\n\n達成：${i.monitoring.done}\n\n${url}\n#放デイ #児発管`;
  if (weight(mon) <= 280) posts.push({ type: 'モニタリング', text: mon });
}
const promo = [
  `個別支援計画、白紙から書いていませんか？\n課題を選ぶと、こども家庭庁の参考様式と同じ項目で下書きができる無料ツールを作りました。5領域の関連性も入ります。登録不要・入力内容は送信されません。\n${CONFIG.siteUrl}/\n${TAGS}`,
  `個別支援計画書とモニタリング記録のExcel様式を無料で配布しています。令和6年度改定の参考様式と同じ項目です。\n${CONFIG.siteUrl}/download.html\n${TAGS}`,
  `Excelで課題を選ぶだけで、支援目標・支援内容（5領域つき）・家族支援の文例が入る計画書を作りました。モニタリング記録・記入例・文例全集PDFつき。\n${CONFIG.siteUrl}/template.html\n${TAGS}`,
  `運営指導の前に、個別支援計画まわりの書類を21項目で確認できるチェックリストです。\n${CONFIG.siteUrl}/checklist.html\n${TAGS}`,
];
// 文例とモニタリングを交互に並べ、7本ごとに告知を1本はさむ
const ordered = [];
const a = posts.filter((p) => p.type === '文例');
const b = posts.filter((p) => p.type === 'モニタリング');
for (let n = 0; n < Math.max(a.length, b.length); n++) {
  if (a[n]) ordered.push(a[n]);
  if (b[n]) ordered.push(b[n]);
}
const withPromo = [];
ordered.forEach((p, n) => {
  if (n % 7 === 0) {
    const t = promo[(n / 7) % promo.length];
    if (weight(t) <= 280) withPromo.push({ type: '告知', text: t });
  }
  withPromo.push(p);
});

const csv = ['日目,種類,本文,文字数（X換算）']
  .concat(withPromo.map((p, n) => [n + 1, p.type, `"${p.text.replace(/"/g, '""')}"`, weight(p.text)].join(',')))
  .join('\n');
const out = join(ROOT, 'docs', 'sales', 'sns-posts.csv');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, '﻿' + csv); // Excel で開いても文字化けしないよう BOM をつける
console.log(`wrote ${withPromo.length} posts to ${out}`);
