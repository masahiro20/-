// Instagram リール（1080×1920・30fps・音なし）を作る。
// 本物のサイトを iframe で開き、data/reels.mjs の台本どおりにタップ・入力・スクロールして、1コマずつ撮って動画にする。
//
// 使い方：
//   1. サイトを作って配信する：node scripts/build.mjs && (cd site && python3 -m http.server 8765)
//   2. node products/reels/make.mjs            … すべて作る
//      node products/reels/make.mjs kiroku     … 1本だけ作る
//   出力：products/reels/dist/<番号>-<id>.mp4 と、表紙用の <番号>-<id>-cover.jpg
// 必要なもの：Playwright（Chromium）と ffmpeg。プロキシ環境では FONT_VIA_CURL=1 をつける。
import { createRequire } from 'node:module';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REELS } from '../../data/reels.mjs';
import { CONFIG } from '../../data/config.mjs';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); }
}
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'dist');
const BASE = process.env.SITE_BASE || 'http://localhost:8765/';
const FPS = 30;
const HOOK = 2.6; // 最初の大きな文字の秒数
const END = 3.4; // 最後の案内の秒数

const fontCache = {};
async function fontRoute(route) {
  const url = route.request().url();
  try {
    if (!fontCache[url]) fontCache[url] = execFileSync('curl', ['-sS', '-A', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36', url], { maxBuffer: 50e6 });
    await route.fulfill({ body: fontCache[url], contentType: url.includes('googleapis') ? 'text/css' : 'font/woff2', headers: { 'access-control-allow-origin': '*' } });
  } catch (e) { await route.abort(); }
}

const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

async function makeReel(browser, reel) {
  const ctx = await browser.newContext({ viewport: { width: 432, height: 768 }, deviceScaleFactor: 2.5 });
  if (process.env.FONT_VIA_CURL) await ctx.route(/fonts\.(googleapis|gstatic)\.com/, fontRoute);
  // 舞台のページをサイトと同じオリジンで出す（iframe の中を操作するため）
  const stage = readFileSync(join(HERE, 'stage.html'), 'utf8');
  await ctx.route(BASE + '__stage.html', (r) => r.fulfill({ body: stage, contentType: 'text/html; charset=utf-8' }));
  const page = await ctx.newPage();
  await page.goto(BASE + '__stage.html');
  await page.evaluate(({ reel, url }) => {
    document.getElementById('no').textContent = reel.no ? '#' + reel.no : 'はじめまして';
    document.getElementById('hookText').innerHTML = reel.hook;
    document.getElementById('kicker').textContent = reel.no ? '#' + reel.no + '　' + reel.toolName : '介護・障害福祉・児童支援で働く方へ';
    document.getElementById('who').textContent = { kaigo: '介護の現場で働く方へ', shogai: '障害福祉・児童支援で働く方へ', jido: '放デイ・児発で働く方へ', all: '介護・障害福祉・児童支援で働く方へ' }[reel.sector];
    document.getElementById('url').textContent = url;
    window.__loads = 0;
    const app = document.getElementById('app');
    app.addEventListener('load', () => { window.__loads++; });
  }, { reel, url: CONFIG.siteUrl.replace(/^https?:\/\//, '') });
  await page.evaluate((src) => { document.getElementById('app').src = src; }, BASE + reel.page);
  await page.waitForFunction(() => window.__loads > 0);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);

  const dir = join(OUT, 'frames-' + reel.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const total = HOOK + reel.length + END;
  const frames = Math.round(total * FPS);
  const steps = reel.steps.map((s) => ({ ...s, done: false }));
  let scroll = null; // { from, to, start, dur }
  let typing = null; // { sel, text, start, dur }
  let tap = null; // { x, y, start }
  let cap = '';

  for (let f = 0; f < frames; f++) {
    const t = f / FPS;
    const d = t - HOOK; // 画面操作の時間
    for (const s of steps) {
      if (s.done || d < s.at) continue;
      s.done = true;
      if (s.cap != null) cap = s.cap;
      if (s.scroll) {
        const to = await page.evaluate(({ sel, offset }) => {
          const w = document.getElementById('app').contentWindow;
          const el = w.document.querySelector(sel);
          if (!el) return null;
          const max = w.document.scrollingElement.scrollHeight - w.innerHeight;
          return Math.max(0, Math.min(max, el.getBoundingClientRect().top + w.scrollY - (offset || 0)));
        }, { sel: s.scroll, offset: s.offset });
        if (to == null) console.warn(`  [${reel.id}] scroll: 見つからない ${s.scroll}`);
        else scroll = { from: await page.evaluate(() => document.getElementById('app').contentWindow.scrollY), to, start: s.at, dur: s.dur || 0.8 };
      }
      if (s.type) typing = { sel: s.type, text: s.text, start: s.at, dur: s.dur || 1 };
      if (s.tap) {
        const loadsBefore = await page.evaluate(() => window.__loads);
        const hit = await page.evaluate((sel) => {
          const app = document.getElementById('app');
          const w = app.contentWindow;
          let el = w.document.querySelector(sel);
          if (!el) return null;
          if (el.matches('input[type=checkbox],input[type=radio]')) el = el.closest('label') || el;
          const r = el.getBoundingClientRect();
          const box = app.getBoundingClientRect();
          const k = box.width / app.offsetWidth;
          const nav = el.closest('a[href]');
          el.click();
          return { x: box.left + (r.left + Math.min(r.width / 2, 60)) * k, y: box.top + (r.top + r.height / 2) * k, nav: !!nav };
        }, s.tap);
        if (!hit) console.warn(`  [${reel.id}] tap: 見つからない ${s.tap}`);
        else {
          tap = { x: hit.x, y: hit.y, start: s.at };
          if (hit.nav) {
            await page.waitForFunction((n) => window.__loads > n, loadsBefore);
            await page.evaluate(() => document.getElementById('app').contentDocument.fonts.ready);
            await page.waitForTimeout(400);
          }
        }
      }
    }
    // 毎コマの状態
    const sc = scroll ? scroll.from + (scroll.to - scroll.from) * ease(clamp01((d - scroll.start) / scroll.dur)) : null;
    const typed = typing ? typing.text.slice(0, Math.ceil(typing.text.length * clamp01((d - typing.start) / typing.dur))) : null;
    await page.evaluate(({ t, d, total, sc, typing, typed, tap, cap, HOOK, END }) => {
      const w = document.getElementById('app').contentWindow;
      if (sc != null) w.scrollTo(0, sc);
      if (typing && typed != null) {
        const el = w.document.querySelector(typing.sel);
        if (el && el.value !== typed) { el.value = typed; el.dispatchEvent(new w.Event('input', { bubbles: true })); }
      }
      const hook = document.getElementById('hook');
      hook.style.opacity = t < HOOK - 0.3 ? 1 : Math.max(0, (HOOK - t) / 0.3);
      const end = document.getElementById('end');
      const e = (t - (total - END)) / 0.35;
      end.style.opacity = Math.max(0, Math.min(1, e));
      end.style.transform = `translateY(${(1 - Math.max(0, Math.min(1, e))) * 24}px)`;
      const capEl = document.getElementById('capText');
      if (capEl.dataset.v !== cap) { capEl.innerHTML = cap; capEl.dataset.v = cap; capEl.dataset.t = String(t); }
      const ct = Math.min(1, (t - Number(capEl.dataset.t || 0)) / 0.25);
      capEl.style.opacity = ct; capEl.style.transform = `translateY(${(1 - ct) * 10}px)`;
      const tp = document.getElementById('tap');
      if (tap && d >= tap.start && d < tap.start + 0.6) {
        const k = (d - tap.start) / 0.6;
        tp.style.left = tap.x + 'px'; tp.style.top = tap.y + 'px';
        tp.style.opacity = String(1 - k); tp.style.transform = `scale(${0.6 + k * 0.9})`;
      } else tp.style.opacity = 0;
    }, { t, d, total, sc, typing, typed, tap, cap, HOOK, END });
    await page.screenshot({ path: join(dir, String(f).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92 });
    if (f === Math.round(1.2 * FPS)) await page.screenshot({ path: join(OUT, `${reel.no}-${reel.id}-cover.jpg`), type: 'jpeg', quality: 92 });
  }
  await ctx.close();

  const mp4 = join(OUT, `${reel.no}-${reel.id}.mp4`);
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, '%04d.jpg'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', mp4]);
  if (r.status !== 0) throw new Error(String(r.stderr));
  rmSync(dir, { recursive: true, force: true });
  return { mp4, seconds: total };
}

const only = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const { chromium } = loadPlaywright();
const browser = await chromium.launch();
for (const reel of REELS) {
  if (only.length && !only.includes(reel.id)) continue;
  const started = Date.now();
  const { mp4, seconds } = await makeReel(browser, reel);
  console.log(`wrote ${mp4}（${seconds.toFixed(1)}秒、${((Date.now() - started) / 1000).toFixed(0)}秒で作成）`);
}
await browser.close();
if (!existsSync(OUT)) process.exit(1);
