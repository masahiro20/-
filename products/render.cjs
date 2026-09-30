// HTML を PDF・PNG に書き出す（Playwright + Chromium を使用）。
//   node products/render.cjs pdf <in.html> <out.pdf>
//   node products/render.cjs png <in.html> <out.png> [幅] [高さ]
// 環境変数 SCALE で画素密度を変えられる（既定：png は2倍）。
// 環境変数 FONT_VIA_CURL=1 のときは、Webフォントを curl 経由で取得する（プロキシ環境向け）。
const { execFileSync } = require('child_process');
const path = require('path');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); }
}

const cache = {};
async function fontRoute(route) {
  const url = route.request().url();
  if (!cache[url]) {
    cache[url] = execFileSync('curl', ['-sS', '-A', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36', url], { maxBuffer: 50e6 });
  }
  await route.fulfill({ body: cache[url], contentType: url.includes('googleapis') ? 'text/css' : 'font/woff2', headers: { 'access-control-allow-origin': '*' } });
}

(async () => {
  const [mode, input, output, w, h] = process.argv.slice(2);
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const width = Number(w) || 1200;
  const height = Number(h) || 1200;
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: Number(process.env.SCALE) || (mode === 'png' ? 2 : 1) });
  if (process.env.FONT_VIA_CURL) await ctx.route(/fonts\.(googleapis|gstatic)\.com/, fontRoute);
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(input), { waitUntil: 'load', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  if (mode === 'pdf') {
    await page.pdf({
      path: output, format: 'A4', printBackground: true, preferCSSPageSize: true,
      displayHeaderFooter: true, headerTemplate: '<span></span>',
      footerTemplate: '<div style="width:100%;text-align:center;font-size:8px;color:#999"><span class="pageNumber"></span></div>',
    });
  } else {
    await page.screenshot({ path: output, fullPage: !h });
  }
  await browser.close();
  console.log(`wrote ${output}`);
})();
