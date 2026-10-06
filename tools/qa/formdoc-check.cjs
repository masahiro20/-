const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright');
// 全テンプレートの入力欄を一通り操作して、下書き・コピー・エラーを確認する。
// 使い方：(cd site && python3 -m http.server 8765) を起動しておき、
//   OUT=<スクショの保存先> node tools/qa/formdoc-check.cjs kesseki hiyari …   （BASE=http://localhost:8766/ でポートを変更）
// 合格の目安：placeholdersLeft=0、errs=[]
const ids = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  for (const id of ids) {
    const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/fonts|ERR_CERT|net::/.test(m.text())) errs.push(m.text()); });
    await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await p.route(/\/_vercel\//, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' })); // 本番だけにある計測スクリプト
    await p.goto((process.env.BASE || 'http://localhost:8765/') + id + '.html');
    await p.waitForTimeout(200);
    // cycle every seg option
    const segCount = await p.$$eval('#fdPanel .seg button', (a) => a.length);
    for (let i = 0; i < segCount; i++) { const bt = (await p.$$('#fdPanel .seg button'))[i]; if (bt) await bt.click(); }
    // select 2nd option of each select
    for (const s of await p.$$('#fdPanel select')) { await s.evaluate((el) => { if (el.options.length > 1) { el.selectedIndex = 1; el.dispatchEvent(new Event('change', { bubbles: true })); } }); }
    // check first 2 chips of each chip group
    const groups = await p.$$eval('#fdPanel .chips2', (a) => a.length);
    for (let g = 0; g < groups; g++) {
      for (let k = 0; k < 2; k++) { await p.evaluate(([g, k]) => { const grp = document.querySelectorAll('#fdPanel .chips2')[g]; const c = grp && grp.querySelectorAll('input')[k]; if (c && !c.checked) c.click(); }, [g, k]); }
    }
    for (const t of await p.$$('#fdPanel textarea, #fdPanel input[type=text]')) await t.fill('テスト入力');
    // edit a cell, copy
    const ed = await p.$('#fdDoc .ed');
    if (ed) { await ed.click(); await p.keyboard.type('編集'); }
    await p.click('#fdCopy');
    await p.waitForTimeout(150);
    const txt = await p.$eval('#fdDoc', (d) => d.innerText);
    const ph = (txt.match(/（[^）]*選ぶと入ります）/g) || []).length;
    const warn = await p.$eval('#fdWarn', (d) => d.innerText.trim());
    await p.screenshot({ path: (process.env.OUT || '.') + '/fd-' + id + '.png', fullPage: true });
    console.log(`== ${id}: len=${txt.length} placeholdersLeft=${ph} errs=${JSON.stringify(errs)}\n   warn: ${warn.slice(0, 90)}`);
    await p.close();
  }
  await b.close();
})();
