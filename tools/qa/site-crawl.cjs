// 全ページの確認：表示エラー・コンソールエラー・CSP違反・読み込み失敗・画像・内部リンク（#アンカー含む）・スマホ幅での横はみ出し。
// 使い方：(cd site && python3 -m http.server 8765) を起動しておき、node tools/qa/site-crawl.cjs
//   BASE=http://localhost:8766/ でポートを変更。合格なら最後に「NO PROBLEMS」。
// 外部へのリンクは開かず、一覧（件数）だけ出す。Google Fonts は読み込まない（ネットワークのない環境でも動くように）。
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

const SITE = path.join(__dirname, '..', '..', 'site');
const BASE = process.env.BASE || 'http://localhost:8765/';
const csp = (/Content-Security-Policy: (.*)/.exec(fs.readFileSync(path.join(SITE, '_headers'), 'utf8')) || [])[1];

function walk(d) {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') ? [path.relative(SITE, path.join(d, e.name)).split(path.sep).join('/')] : []);
}
const pages = walk(SITE).sort();
const ids = {};
for (const p of pages) ids[p] = new Set([...fs.readFileSync(path.join(SITE, p), 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

(async () => {
  const b = await chromium.launch();
  const problems = [];
  const external = new Set();
  for (const [label, vw] of [['d', 1280], ['m', 360]]) {
    const ctx = await b.newContext({ viewport: { width: vw, height: 800 } });
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    // cdnjs のライブラリは curl で取ってくる（SRI の確認があるので空の応答では代用できない）
    await ctx.route(/cdnjs\.cloudflare\.com/, async (r) => {
      try { await r.fulfill({ status: 200, contentType: 'application/javascript', headers: { 'access-control-allow-origin': '*' }, body: execFileSync('curl', ['-sS', r.request().url()], { maxBuffer: 5e6 }) }); } catch (e) { await r.abort(); }
    });
    // サーバーの応答に、本番と同じ CSP をつける（CSP違反をここで見つけるため）
    await ctx.route((u) => u.href.startsWith(BASE), async (r) => {
      const res = await r.fetch();
      const h = res.headers();
      if (csp && (h['content-type'] || '').includes('text/html')) h['content-security-policy'] = csp;
      await r.fulfill({ response: res, headers: h });
    });
    await ctx.route(/\/_vercel\//, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' })); // 本番だけにある計測
    const p = await ctx.newPage();
    for (const pg of pages) {
      const errs = [];
      const onErr = (e) => errs.push('PAGEERR ' + e.message);
      const onCon = (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_FAILED|net::ERR_ABORTED/.test(m.text())) errs.push('CONSOLE ' + m.text()); };
      const onRes = (res) => { if (res.status() >= 400 && res.url().startsWith(BASE)) errs.push('HTTP ' + res.status() + ' ' + res.url()); };
      p.on('pageerror', onErr); p.on('console', onCon); p.on('response', onRes);
      try {
        await p.goto(BASE + pg, { waitUntil: 'load' });
        await p.waitForTimeout(120);
        const info = await p.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          brokenImgs: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && !i.closest('[hidden]')).map((i) => i.getAttribute('src')),
          links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
        }));
        if (label === 'm' && info.overflow > 1) errs.push('はみ出し ' + info.overflow + 'px');
        info.brokenImgs.forEach((s) => errs.push('画像が読めない ' + s));
        if (label === 'd') {
          for (const href of info.links) {
            if (/^(mailto:|tel:|javascript:|data:)/.test(href)) continue;
            if (/^https?:/.test(href)) { external.add(href.split('#')[0]); continue; }
            const [file, hash] = href.split('#');
            const target = file ? path.posix.normalize(path.posix.join(path.posix.dirname(pg), file.split('?')[0])) : pg;
            const key = target.endsWith('/') || target === '.' ? (target === '.' ? 'index.html' : target + 'index.html') : target;
            if (!ids[key]) { if (!fs.existsSync(path.join(SITE, key))) errs.push('リンク切れ ' + href); continue; }
            if (hash && !ids[key].has(decodeURIComponent(hash))) errs.push('アンカーがない ' + href);
          }
        }
      } catch (e) { errs.push('開けない ' + e.message.split('\n')[0]); }
      p.off('pageerror', onErr); p.off('console', onCon); p.off('response', onRes);
      errs.forEach((e) => problems.push(`${label} ${pg} ${e}`));
    }
    await ctx.close();
  }
  await b.close();
  console.log(`pages: ${pages.length}, external links: ${external.size}`);
  if (problems.length) { problems.forEach((x) => console.log(x)); process.exitCode = 1; } else console.log('NO PROBLEMS');
})();
