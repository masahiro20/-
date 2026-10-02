// リールの投稿キット（動画のプレビュー・キャプションのコピー・投稿の順番）を1ページのHTMLにする。
// 使い方：node products/reels/kit.mjs <出力先のフォルダ>   … フォルダに kit.html と reels/*.mp4 の参照先をそろえる
import { writeFileSync, mkdirSync, copyFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REELS, COMMON_TAGS } from '../../data/reels.mjs';
import { CONFIG } from '../../data/config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || join(HERE, 'dist', 'kit');
mkdirSync(join(out, 'reels'), { recursive: true });
const HOOK = 2.6, END = 3.4;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const plain = (h) => h.replace(/<br>/g, '').replace(/<small>.*?<\/small>/g, '').replace(/<[^>]+>/g, '');
const DAYS = ['月', '水', '金'];

const cards = REELS.map((r, i) => {
  const file = `${r.no}-${r.id}.mp4`;
  const src = existsSync(join(HERE, 'dist', 'final', file)) ? join(HERE, 'dist', 'final', file) : join(HERE, 'dist', file);
  if (existsSync(src)) copyFileSync(src, join(out, 'reels', file));
  if (existsSync(join(HERE, 'dist', `${r.no}-${r.id}-cover.jpg`))) copyFileSync(join(HERE, 'dist', `${r.no}-${r.id}-cover.jpg`), join(out, 'reels', `${r.no}-${r.id}-cover.jpg`));
  const tags = [...r.tags.slice(0, 4), COMMON_TAGS[0]].map((t) => '#' + t).join(' ');
  const text = `${r.caption}\n\n${tags}`;
  const tl = existsSync(join(HERE, 'dist', `${r.no}-${r.id}.timeline.json`)) ? JSON.parse(readFileSync(join(HERE, 'dist', `${r.no}-${r.id}.timeline.json`), 'utf8')) : null;
  const secs = Math.round(tl ? tl.total : HOOK + r.length + END);
  return `<article class="reel" id="r${r.no}">
  <div class="media"><video src="reels/${file}" poster="reels/${r.no}-${r.id}-cover.jpg" controls playsinline preload="metadata"></video></div>
  <div class="body">
    <p class="meta"><span class="day">${i + 1}本目・${DAYS[i % 3]}曜</span><span>#${r.no}</span><span>${secs}秒</span><span class="file">${file}</span></p>
    <h2>${esc(r.hook ? plain(r.hook) : r.title)}</h2>
    <p class="tool">紹介するツール：<a href="${esc(CONFIG.siteUrl + '/' + r.tool)}">${esc(r.toolName)}</a></p>
    <div class="cap">
      <div class="cap-head"><b>キャプション</b><button type="button" class="copy" id="copy-${r.id}" data-target="cap-${r.id}">コピー</button></div>
      <pre id="cap-${r.id}">${esc(text)}</pre>
    </div>
  </div>
</article>`;
}).join('\n');

const html = `<title>おたすけ帳 リール投稿キット</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Zen+Kaku+Gothic+New:wght@700;900&display=swap">
<style>
/* 投稿の順番に、縦長の動画とキャプションを横に並べる。スマホでは縦に積む */
:root {
  --bg: #fcfaf5; --panel: #ffffff; --ink: #1f2a26; --ink-2: #4d5753; --rule: #e3dccd;
  --forest: #1f5c4a; --apricot: #f5a25a; --apricot-soft: #ffe2c2; --code: #f6f1e6;
  --display: "Zen Kaku Gothic New", "Hiragino Sans", "Yu Gothic", sans-serif;
  --body: "BIZ UDPGothic", "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #121a17; --panel: #1a2420; --ink: #e8efe9; --ink-2: #aab8b1; --rule: #2c3934;
  --forest: #7cc4a8; --apricot: #f5a25a; --apricot-soft: #4a3320; --code: #202b27; color-scheme: dark; } }
:root[data-theme="dark"] {
  --bg: #121a17; --panel: #1a2420; --ink: #e8efe9; --ink-2: #aab8b1; --rule: #2c3934;
  --forest: #7cc4a8; --apricot: #f5a25a; --apricot-soft: #4a3320; --code: #202b27; color-scheme: dark; }
body { background: var(--bg); color: var(--ink); font-family: var(--body); font-size: 15px; line-height: 1.75; }
.wrap { max-width: 980px; margin: 0 auto; padding-inline: 16px; padding-block: 28px 56px; }
header h1 { margin: 0; font-family: var(--display); font-weight: 900; font-size: clamp(26px, 5vw, 36px); text-wrap: balance; }
header p { margin: 6px 0 0; color: var(--ink-2); max-width: 62ch; }
.steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 20px 0 30px; padding: 0; list-style: none; counter-reset: s; }
.steps li { counter-increment: s; padding: 12px 14px; border: 1px solid var(--rule); border-radius: 10px; background: var(--panel); font-size: 14px; }
.steps li::before { content: counter(s); display: inline-grid; place-items: center; width: 22px; height: 22px; margin-right: 6px; border-radius: 50%; background: var(--forest); color: var(--bg); font-family: var(--display); font-weight: 900; font-size: 12px; }
.reels { display: grid; gap: 22px; }
.reel { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 20px; padding: 18px; border: 1px solid var(--rule); border-radius: 14px; background: var(--panel); }
.media video { display: block; width: 100%; max-width: 100%; aspect-ratio: 9 / 16; border-radius: 12px; background: #000; }
.body { min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.meta { margin: 0; display: flex; flex-wrap: wrap; gap: 6px; font-size: 12.5px; color: var(--ink-2); }
.meta span { padding: 1px 9px; border: 1px solid var(--rule); border-radius: 999px; }
.meta .day { background: var(--apricot); border-color: var(--apricot); color: #1f2a26; font-weight: 700; }
.meta .file { font-variant-numeric: tabular-nums; }
.reel h2 { margin: 0; font-family: var(--display); font-weight: 900; font-size: 21px; line-height: 1.45; text-wrap: balance; }
.tool { margin: 0; font-size: 14px; color: var(--ink-2); }
.tool a { color: var(--forest); }
.cap { border: 1px solid var(--rule); border-radius: 10px; overflow: hidden; }
.cap-head { display: flex; justify-content: space-between; align-items: center; padding: 6px 8px 6px 12px; background: var(--code); font-size: 13px; }
.copy { font: inherit; font-weight: 700; padding: 6px 16px; border: 0; border-radius: 999px; background: var(--forest); color: var(--bg); cursor: pointer; }
.copy:focus-visible { outline: 3px solid var(--apricot); outline-offset: 2px; }
.copy.done { background: var(--apricot); color: #1f2a26; }
pre { margin: 0; padding: 12px; max-height: 260px; overflow: auto; white-space: pre-wrap; word-break: break-word; font-family: var(--body); font-size: 13.5px; line-height: 1.7; }
.note { margin-top: 28px; font-size: 13.5px; color: var(--ink-2); }
@media (max-width: 640px) { .reel { grid-template-columns: minmax(0, 1fr); } .media { max-width: 240px; } }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>
<div class="wrap">
  <header>
    <h1>ふくしのおたすけ帳 リール投稿キット</h1>
    <p>${REELS.length}本の縦長動画（1080×1920・ナレーションとBGMつき）と、そのまま貼れるキャプションです。動画ファイルは、チャットに送ったファイルから保存してください。</p>
  </header>
  <ol class="steps">
    <li>動画をスマホに保存する</li>
    <li>インスタで「リール」を選び、動画を選ぶ</li>
    <li>音はナレーションとBGMが入っています（インスタの音源は足さなくてOK）</li>
    <li>表紙は最初の大きな文字の画面</li>
    <li>下のキャプションをコピーして貼る</li>
    <li>#0 はプロフィールに固定する</li>
  </ol>
  <div class="reels">
${cards}
  </div>
  <p class="note">プロフィールのリンク：${esc(CONFIG.siteUrl)}/start.html（リールで紹介したツールの一覧ページ）。投稿は週3本（月・水・金）、昼休みか仕事終わりの時間がおすすめです。</p>
</div>
<script>
document.querySelectorAll('.copy').forEach(function (b) {
  b.addEventListener('click', function () {
    var pre = document.getElementById(b.getAttribute('data-target'));
    var done = function () { b.textContent = 'コピーしました'; b.classList.add('done'); setTimeout(function () { b.textContent = 'コピー'; b.classList.remove('done'); }, 2200); };
    var fallback = function () { var r = document.createRange(); r.selectNodeContents(pre); var s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = '選択しました。長押しでコピー'; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(pre.textContent).then(done, fallback); else fallback();
  });
});
</script>
`;
writeFileSync(join(out, 'kit.html'), html);
console.log('wrote ' + join(out, 'kit.html'));
