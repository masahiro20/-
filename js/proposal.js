/*
 * 提案書の組版
 *   お客様向け（6ページ）：表紙／ご提案の結論／なぜこの容量か／お金の流れ／暮らしと発電／前提と用語
 *   詳細資料（任意・1ページ）：屋根の割り付け・容量別の比較・1日の流れ
 */
(function (root) {
  'use strict';
  const E = root.SolarEngine, C = root.SOLAR_CATALOG, Ch = root.Charts;
  const COL = { gen: '#E0782A', load: '#2A78D6', net: '#1BAF7A', buy: '#4A3AA7', ink: '#14161B', mute: '#B9B2A6' };
  // 環境省「令和5年度 家庭部門のCO2排出実態統計調査」世帯人数別 電気のCO2[t] ÷ 0.427（全国 1.67t ↔ 3,911kWh）
  const STAT_BY_PERSONS = [2412, 3934, 5105, 5831, 6604, 8852];
  const STAT_DETACHED = 4917;

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ok = (v) => v != null && isFinite(v);
  const f0 = (v) => (ok(v) ? Math.round(v).toLocaleString('ja-JP') : '—');
  const f1 = (v) => (ok(v) ? (Math.round(v * 10) / 10).toLocaleString('ja-JP', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—');
  const f2 = (v) => (ok(v) ? v.toFixed(2) : '—');
  const pct = (v) => (ok(v) ? Math.round(v * 100) + '%' : '—');
  const man = (yen) => (ok(yen) ? (Math.round(yen / 1000) / 10).toLocaleString('ja-JP', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—');
  const GOAL = { econ: '経済性重視', netzero: '自給重視', max: '屋根いっぱい' };

  function panelName(p) {
    const m = C.panels.find((x) => x.id === p.panelId);
    return m ? `${m.maker.startsWith('汎用') ? '' : m.maker.replace(/（.*）/, '') + ' '}${m.model}` : '指定パネル';
  }
  function dateJa(iso) {
    const d = iso ? new Date(iso + 'T00:00:00') : new Date();
    return isNaN(d) ? '' : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }

  // ------------------------------------------------------------ 集計 ---
  function facts(p, a) {
    const R = a.recDetail.sim, eco = a.recDetail.eco, crit = a.crit;
    const loads = a.prep.lb.loads;
    const evLoad = R.evPv + R.evGrid;
    const groups = {};
    loads.forEach((l) => (groups[l.group] = (groups[l.group] || 0) + l.annual));
    if (evLoad) groups.EV = evLoad;
    const stat = STAT_BY_PERSONS[(p.house.persons || 4) - 1];
    const allDay = loads.filter((l) => l.pet || l.pattern === '24h' || l.key === 'central');
    const refYield = E.monthlyYieldPerKw(a.prep.st, { dir: 'S', slopeSun: 5.8, shading: 0 }, p.generation).annual;
    const hSum = a.prep.st.H.reduce((s, v, m) => s + v * E.DAYS[m], 0);
    const disasterOk = crit.disasterWinterGen(crit.disaster) >= crit.essential.total;
    const age = +p.house.age > 0 ? +p.house.age : null;
    // 期間別の年間メリット（売電単価の切り替わりごと）
    const fl = eco.flows;
    const avg = (from, to) => {
      const xs = fl.filter((x) => x.y >= from && x.y <= to);
      if (!xs.length) return null;
      const g = (y) => Math.pow(1 - (p.cost.degradation || 0) / 100, y - 1), e = (y) => Math.pow(1 + (p.tariff.escalation || 0) / 100, y - 1);
      const save = xs.reduce((s, x) => s + R.saving * g(x.y) * e(x.y), 0) / xs.length;
      const sell = xs.reduce((s, x) => s + R.exp * g(x.y) * x.sellPrice, 0) / xs.length;
      return { from, to: Math.min(to, eco.years), save, sell, price: xs[0].sellPrice };
    };
    const y1 = eco.big ? p.fit.big1Years : p.fit.res1Years, y2 = y1 + (eco.big ? p.fit.big2Years : p.fit.res2Years);
    const periods = [avg(1, y1), avg(y1 + 1, y2), avg(y2 + 1, eco.years)].filter(Boolean);
    return { R, eco, crit, groups, evLoad, stat, allDay, refYield, hSum, total: R.load, disasterOk, age, periods, site: a.prep.st };
  }

  function reasons(p, a, F) {
    const { R, crit, groups, stat, refYield, total, site } = F;
    const out = [];
    const top = Object.entries(groups).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([g, v]) => `${g}${pct(v / total)}`).join('・');
    const usage = a.prep.second ? `（滞在する${a.prep.occDays}日分）` : '';
    out.push(`<b>使う電気</b>　設備と暮らし方から年間 <b>${f0(total)}kWh</b>${usage}と推計（${top}）。同じ人数の全国平均 約${f0(stat)}kWh の <b>${(total / stat).toFixed(1)}倍</b>です。`);
    out.push(`<b>地域の日射</b>　${esc(site.name)}は南向き30°なら 1kWあたり年間 <b>約${f0(refYield)}kWh</b> を発電する地域です（気象データにもとづく推計）。`);
    out.push(`<b>屋根</b>　発電に向いた面に最大 ${a.maxPanels}枚、<b>${f2(crit.roofMax.kw)}kW</b> まで載せられます。`);
    const e = crit.econ, next = a.cases.find((c) => c.kw >= e.kw + 1);
    out.push(`<b>お金</b>　${a.recDetail.eco.years}年間の手残りは <b>${f2(e.kw)}kW がもっとも多く（${man(e.eco.net)}万円）</b>、` +
      (next ? `それより増やすと、増えた電気の多くが安い単価の売電になり、費用の増加に見合わなくなります。` : `屋根いっぱいまで載せるほど手残りが増えます。`));
    void R;
    return out;
  }

  function points(p, a, F) {
    const { eco, total, stat, allDay, evLoad, age, R } = F;
    const pts = [];
    const usage = p.house.usage || 'main';
    if (usage === 'final') {
      pts.push({ t: 'これからの電気代を軽く', d: `年間の電気代を約${man(R.saving)}万円減らし、${age && eco.payback != null ? `${Math.round(age + eco.payback)}歳ごろに導入費を取り戻せる見込みです。` : '値上がりの影響も受けにくくなります。'}収入が年金中心になっても固定費を抑えられます。` });
    } else if (usage === 'second') {
      pts.push({ t: '留守の日の発電もムダにしない', d: `滞在しない日の発電は売電に回り、家計の助けになります。滞在日（年${a.prep.occDays}日）の電気は太陽光で直接まかないます。` });
    } else {
      const life = [];
      if (allDay.length) life.push('24時間の空調');
      if (evLoad) life.push('EVの充電');
      if (p.waterHeater && p.waterHeater.startsWith('ecocute')) life.push('エコキュート');
      pts.push({ t: '暮らしに合わせた容量', d: `${life.length ? life.join('・') + 'を含め、' : ''}年間 ${f0(total)}kWh（全国平均の${(total / stat).toFixed(1)}倍）の使い方から逆算しました。` });
    }
    pts.push({ t: `${eco.years}年で ${man(eco.net)}万円の手残り`, d: `初年度の経済効果は${man(eco.year1)}万円。${eco.payback != null ? `約${f1(eco.payback)}年で導入費を取り戻し、その後は毎年のメリットがそのまま家計に残ります。` : ''}` });
    const o = E.outageEstimate(p, a);
    pts.push(o.selfStandOnly
      ? { t: '停電の日も、昼は電気が使える', d: `パワコンの非常用コンセント（最大1.5kVA）で、晴れた日中にスマホ充電や冷蔵庫などに使えます。夜も使うには蓄電池・V2Hが必要です。` }
      : { t: `停電しても約${f1(o.daysNoSun)}日分の安心`, d: `${o.battery ? '蓄電池' : ''}${o.battery && o.ev ? '＋' : ''}${o.ev ? 'EV（V2H）' : ''}に約${f1(o.storage)}kWhを貯めておけます。${o.full ? 'エアコンなど200Vの機器も使えます。' : ''}晴れれば太陽光で再充電できます。` });
    return pts;
  }

  // ------------------------------------------------------------ 部品 ---
  function head(ctx) {
    return `<div class="pg-head"><span class="brand"><span class="mark"></span>${esc(ctx.settings.company || 'HIKARI')}</span><span>SOLAR CAPACITY PROPOSAL</span></div>`;
  }
  function foot(ctx, n) {
    return `<div class="pg-foot"><span>${esc(ctx.customerLabel)}</span><span><b>${String(n).padStart(2, '0')}</b> / ${String(ctx.total).padStart(2, '0')}</span></div>`;
  }
  function sec(k, t, d) {
    return `<div class="sec"><div class="sec-k">${k}</div><h2 class="sec-t">${t}</h2>${d ? `<p class="sec-d">${d}</p>` : ''}</div>`;
  }
  function kpi(k, v, unit, d, meter) {
    return `<div class="kpi"><div class="k">${k}</div><div class="v">${v}<small>${unit || ''}</small></div>${meter ? `<div class="meter"><i style="width:${Math.min(100, meter.v * 100)}%;--c:${meter.c}"></i></div>` : ''}<div class="d">${d || ''}</div></div>`;
  }
  const howto = (t) => `<p class="howto"><b>見方</b>${t}</p>`;

  /** 手残りの推移（年ごとの累計）。0年目＝導入費のマイナスから始まり、0を超えた年が回収 */
  function paybackChart(F) {
    const { eco } = F;
    const W = 680, H = 210, pad = { l: 52, r: 16, t: 30, b: 28 };
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const vals = [-eco.capex].concat(eco.flows.map((f) => f.cum)).map((v) => v / 10000);
    const T = Ch.niceTicks(Math.min(...vals), Math.max(0, ...vals), 4);
    const Y = (v) => pad.t + ih - (v - T.lo) / (T.hi - T.lo) * ih;
    const n = vals.length, band = iw / n, bw = Math.min(16, band * 0.62);
    let g = '';
    T.ticks.forEach((t) => {
      g += `<line x1="${pad.l}" x2="${pad.l + iw}" y1="${Y(t)}" y2="${Y(t)}" class="${t === 0 ? 'cv-base' : 'cv-grid'}"/>`;
      g += `<text x="${pad.l - 8}" y="${Y(t) + 3.5}" class="cv-tick" text-anchor="end">${f0(t)}</text>`;
    });
    g += `<text x="${pad.l - 8}" y="${pad.t - 16}" class="cv-unit" text-anchor="end">万円</text>`;
    vals.forEach((v, i) => {
      const x = pad.l + i * band + (band - bw) / 2;
      const y0 = Y(0), y1 = Y(v);
      const top = Math.min(y0, y1), h = Math.abs(y1 - y0);
      const r = Math.min(3, h);
      const d = v >= 0
        ? `M${x},${y0}V${top + r}Q${x},${top} ${x + r},${top}H${x + bw - r}Q${x + bw},${top} ${x + bw},${top + r}V${y0}Z`
        : `M${x},${y0}V${top + h - r}Q${x},${top + h} ${x + r},${top + h}H${x + bw - r}Q${x + bw},${top + h} ${x + bw},${top + h - r}V${y0}Z`;
      g += `<path d="${d}" fill="${v >= 0 ? COL.net : COL.mute}"/>`;
      if (i % 5 === 0 || i === n - 1) g += `<text x="${x + bw / 2}" y="${H - 8}" class="cv-tick" text-anchor="middle">${i}年</text>`;
      g += `<rect class="cv-hit" x="${pad.l + i * band}" y="${pad.t}" width="${band}" height="${ih}" data-tip="${esc(`<b>${i ? i + '年目まで' : '導入時'}</b><span>累計<em>${man(v * 10000)}万円</em></span>`)}"/>`;
    });
    // 注記
    const x0 = pad.l + (band - bw) / 2 + bw + 6;
    g += `<text x="${x0}" y="${Y(vals[0]) + 4}" class="cv-mlabel">導入費 −${man(eco.capex)}万円</text>`;
    if (eco.payback != null) {
      const xp = pad.l + eco.payback * band + band / 2;
      g += `<line x1="${xp}" x2="${xp}" y1="${pad.t - 6}" y2="${pad.t + ih}" class="cv-mark-strong"/>`;
      g += `<text x="${xp}" y="${pad.t - 12}" class="cv-mlabel-strong" text-anchor="middle">約${f1(eco.payback)}年で回収</text>`;
    }
    const xe = pad.l + (n - 1) * band + band / 2;
    g += `<text x="${xe - bw}" y="${Y(vals[n - 1]) - 8}" class="cv-mlabel-strong" text-anchor="end">${eco.years}年で ${vals[n - 1] >= 0 ? '+' : ''}${man(vals[n - 1] * 10000)}万円</text>`;
    return `<figure class="cv"><div class="cv-legend"><span class="cv-key"><i class="sw" style="--c:${COL.mute}"></i>まだ回収できていない額</span><span class="cv-key"><i class="sw" style="--c:${COL.net}"></i>回収後に手元に残る額</span></div><svg viewBox="0 0 ${W} ${H}" class="cv-svg" role="img" aria-label="手残りの推移">${g}</svg></figure>`;
  }

  function coverArt(mode) {
    // 夜明けの水平線から昇る太陽（表紙・ホーム共通）
    const hero = mode === 'hero';
    const W = hero ? 1440 : 794, H = hero ? 640 : 1123;
    const cx = hero ? 1120 : 560, hy = hero ? 548 : 800, r = hero ? 205 : 214;
    const hf = hy / H;
    const id = (k) => k + (mode || 'c');
    const lines = [];
    for (let i = 0; i < 16; i++) {
      const y = hy + 8 + i * (10 + i * 1.6);
      if (y > H) break;
      const w = (hero ? 340 : 300) - i * 15;
      lines.push(`<rect x="${cx - w / 2}" y="${y}" width="${w}" height="${Math.max(1, 3 - i * 0.12)}" rx="1.5" fill="url(#${id('refl')})" opacity="${(0.85 - i * 0.05).toFixed(2)}"/>`);
    }
    const dots = [];
    const dx = hero ? 760 : 52, dy = hero ? 70 : 430;
    for (let rr = 0; rr < 9; rr++) for (let c = 0; c < 9; c++) dots.push(`<circle cx="${dx + c * 18}" cy="${dy + rr * 18}" r="1" fill="#F1ECE3" opacity="${(0.05 + (rr + c) * 0.006).toFixed(3)}"/>`);
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="${id('sky')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B111B"/><stop offset="${(hf * 0.75).toFixed(3)}" stop-color="#141B2A"/><stop offset="${(hf - 0.002).toFixed(3)}" stop-color="#3A2621"/><stop offset="${hf.toFixed(3)}" stop-color="#0D141F"/><stop offset="1" stop-color="#0B1019"/></linearGradient>
        <radialGradient id="${id('sun')}" cx=".5" cy=".42" r=".55"><stop offset="0" stop-color="#FFF1D6"/><stop offset=".32" stop-color="#FFC97A"/><stop offset=".62" stop-color="#F08A33"/><stop offset="1" stop-color="#C2531B"/></radialGradient>
        <radialGradient id="${id('glow')}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#F4A84A" stop-opacity=".42"/><stop offset=".5" stop-color="#E0782A" stop-opacity=".1"/><stop offset="1" stop-color="#E0782A" stop-opacity="0"/></radialGradient>
        <linearGradient id="${id('refl')}" x1="0" x2="1"><stop offset="0" stop-color="#F4A84A" stop-opacity="0"/><stop offset=".5" stop-color="#FFC97A"/><stop offset="1" stop-color="#F4A84A" stop-opacity="0"/></linearGradient>
        <linearGradient id="${id('hz')}" x1="0" x2="1"><stop offset="0" stop-color="#F4A84A" stop-opacity="0"/><stop offset=".6" stop-color="#F4A84A" stop-opacity=".6"/><stop offset="1" stop-color="#F4A84A" stop-opacity=".2"/></linearGradient>
        <clipPath id="${id('above')}"><rect x="0" y="0" width="${W}" height="${hy - 1}"/></clipPath>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#${id('sky')})"/>
      <circle cx="${cx}" cy="${hy}" r="${r * 2.2}" fill="url(#${id('glow')})"/>
      <g fill="none" stroke="#F4A84A" stroke-opacity=".16"><circle cx="${cx}" cy="${hy}" r="${r * 1.4}"/><circle cx="${cx}" cy="${hy}" r="${r * 1.74}"/><circle cx="${cx}" cy="${hy}" r="${r * 2.11}" stroke-opacity=".09"/></g>
      <g clip-path="url(#${id('above')})"><circle cx="${cx}" cy="${hy}" r="${r}" fill="url(#${id('sun')})"/></g>
      <rect x="0" y="${hy - 1}" width="${W}" height="1" fill="url(#${id('hz')})"/>
      ${lines.join('')}
      ${dots.join('')}
    </svg>`;
  }

  // ------------------------------------------------------------ ページ ---
  function render(p, a, ctx) {
    if (!a.rec) return `<section class="page"><div class="sec"><h2 class="sec-t">屋根に載せられるパネルがありません</h2><p class="sec-d">屋根面の面積・向き・最大枚数を確認してください。</p></div></section>`;
    const F = facts(p, a);
    const { R, eco, crit } = F;
    const rec = a.rec;
    const cust = p.customer || {};
    const name = cust.name ? `${cust.name}${cust.honorific || '様'}` : 'お客様';
    const detail = !!ctx.detail;
    ctx.total = detail ? 7 : 6;
    ctx.customerLabel = `${name}　太陽光発電 最適容量のご提案`;
    const pages = [];
    const o = E.outageEstimate(p, a);
    const site = F.site;

    // ---- P1 表紙
    pages.push(`<section class="page cover"><div class="cover-art">${coverArt()}</div><div class="cover-in">
      <div class="cover-top"><span class="brand"><span class="mark"></span><span class="brand-name">${esc(ctx.settings.company || 'Hikari')}</span></span><span class="co">${dateJa(cust.date)}</span></div>
      <div class="cover-copy"><p class="eyebrow">SOLAR CAPACITY PROPOSAL</p><h1>太陽光発電<br>最適容量のご提案</h1></div>
      <div class="cover-name">${esc(cust.address || `${site.pref || ''}${site.name}`)}<b>${esc(cust.name || 'お客様')}<small>${esc(cust.honorific || '様')}</small></b></div>
      <div class="cover-kw"><div><div class="lbl">RECOMMENDED CAPACITY</div><div class="big"><b>${f2(rec.kw)}</b><span>kW</span></div>
        <div class="spec">${esc(panelName(p))}　${p.panel.watt}W × ${rec.n}枚</div></div>
        <div class="facts">年間の経済効果<b>${man(eco.year1)} 万円</b><br>導入費の回収<b>${eco.payback != null ? '約' + f1(eco.payback) + ' 年' : '—'}</b><br>${eco.years}年間の手残り<b>${man(eco.net)} 万円</b></div></div>
      <div class="cover-bottom"><span>ご提案　<b>${esc(ctx.settings.company || '')}</b>${cust.staff || ctx.settings.staff ? `　担当　<b>${esc(cust.staff || ctx.settings.staff)}</b>` : ''}</span><span>${GOAL[a.goal]}${p.disaster.priority ? '＋停電対策' : ''}</span></div>
    </div></section>`);

    // ---- P2 結論
    const why = { econ: `${eco.years}年間の手残りがもっとも多く`, netzero: '年間に使う電気をご自宅の屋根でまかなえ', max: '屋根の発電力を余さず活かせ' }[a.goal];
    const pts = points(p, a, F);
    pages.push(`<section class="page">${head(ctx)}
      ${sec('01 — CONCLUSION', 'ご提案の結論')}
      <p class="lead">${esc(name)}のご家庭には、<br><em>${f2(rec.kw)} kW</em>（${p.panel.watt}W × ${rec.n}枚）の太陽光発電をおすすめします。</p>
      <p class="lead-sub">${why}、年間 約${f0(R.gen)}kWh を発電します。ご家庭で使う電気の <b>${pct(R.sufficiency)}</b> を太陽光${p.battery.enabled || (p.ev.enabled && p.ev.v2h) ? '・蓄電' : ''}でまかない、${eco.payback != null ? `約${f1(eco.payback)}年で導入費を取り戻し、` : ''}${eco.years}年間で <b>${man(eco.net)}万円</b> が手元に残る見込みです。</p>
      <div class="kpis k4">
        ${kpi('年間の経済効果', man(eco.year1), '万円', `電気代の削減 ${man(R.saving)}万円 ＋ 売電 ${man(R.exp * eco.flows[0].sellPrice)}万円（初年度）`)}
        ${kpi('導入費と回収', eco.payback != null ? f1(eco.payback) : `${eco.years}年超`, eco.payback != null ? '年' : '', `導入費 ${man(eco.capex)}万円${p.cost.subsidy ? `（補助金${f0(p.cost.subsidy)}万円差引後）` : ''}を経済効果で取り戻すまで${F.age && eco.payback != null ? `。${Math.round(F.age + eco.payback)}歳ごろ` : ''}`)}
        ${kpi(`${eco.years}年間の手残り`, man(eco.net), '万円', `経済効果の合計から導入費を引いた額`)}
        ${kpi('自給率', pct(R.sufficiency), '', `使う電気 ${f0(R.load)}kWh のうち、買わずに済む割合`, { v: R.sufficiency, c: COL.gen })}
      </div>
      <div class="cols blk">
        <div><div class="blk-t">つくった電気のゆくえ<small>年間 ${f0(R.gen)}kWh</small></div>
          ${Ch.split([{ name: '家で使う', value: R.self, color: COL.net }, { name: '売る', value: R.exp, color: COL.gen }], (v) => f0(v) + 'kWh')}</div>
        <div><div class="blk-t">使う電気のまかない方<small>年間 ${f0(R.load)}kWh</small></div>
          ${Ch.split([{ name: '太陽光・蓄電', value: Math.max(0, R.load - R.imp), color: COL.gen }, { name: '電力会社から買う', value: R.imp, color: COL.buy }], (v) => f0(v) + 'kWh')}</div>
      </div>
      <div class="blk"><div class="blk-t">ご提案のポイント</div>
        <div class="points">${pts.map((x, i) => `<div class="pt"><div class="n">POINT ${String(i + 1).padStart(2, '0')}</div><b>${esc(x.t)}</b><p>${esc(x.d)}</p></div>`).join('')}</div></div>
      ${foot(ctx, 2)}</section>`);

    // ---- P3 なぜこの容量か
    const cs = a.cases;
    const goalCrit = { econ: crit.econ, netzero: crit.netZero || crit.roofMax, max: crit.roofMax }[a.goal];
    const card = (title, c, color, desc, on) => `<div class="crit ${on ? 'on' : ''}" style="--c:${color}">${on ? '<span class="tag">ご提案</span>' : ''}<div class="t"><i></i>${title}</div><div class="v">${c ? f2(c.kw) : '—'}<small>kW</small></div><div class="d">${desc}</div></div>`;
    const markers = [];
    const addM = (c, label, strong) => { if (c && !markers.some((m) => m.x === c.kw)) markers.push({ x: c.kw, label, strong }); };
    addM(rec, `ご提案 ${f2(rec.kw)}kW`, true);
    addM(crit.netZero, '使う電気と同じ量');
    addM(crit.econ, '手残り最大');
    const recIdx = cs.indexOf(rec);
    pages.push(`<section class="page">${head(ctx)}
      ${sec('02 — RATIONALE', `なぜ ${f2(rec.kw)}kW なのか`, `パネルを1枚ずつ増やしながら ${cs.length}通りの容量を計算し、3つの目安で比べました。`)}
      <div class="crits c3 blk">
        ${card(`${eco.years}年間の手残りが最大`, crit.econ, COL.net, `手残り ${man(crit.econ.eco.net)}万円`, rec === crit.econ && (a.goal === 'econ' || goalCrit === crit.econ))}
        ${card('使う電気と同じ量を発電', crit.netZero, COL.load, crit.netZero ? `年間 ${f0(a.consumption)}kWh を発電` : `屋根いっぱいでも使う電気の${pct(crit.roofMax.sim.gen / a.consumption)}`, a.goal === 'netzero' && rec === goalCrit)}
        ${card('屋根に載る上限', crit.roofMax, '#8A8D94', `最大 ${a.maxPanels}枚`, a.goal === 'max')}
      </div>
      <div class="blk"><div class="blk-t">容量ごとの${eco.years}年間の手残り<small>万円</small></div>
        ${Ch.line({ x: cs.map((c) => c.kw), xMin: 0, width: 680, height: 220, yUnit: '万円', fmtX: (v) => v + 'kW', fmtY: (v) => f0(v), markers,
          series: [{ name: '手残り', values: cs.map((c) => c.eco.net / 10000), color: COL.net, area: true, dot: recIdx }],
          fmtTip: (i) => `<b>${f2(cs[i].kw)}kW（${cs[i].n}枚）</b><span><i style="--c:${COL.net}"></i>手残り<em>${man(cs[i].eco.net)}万円</em></span><span>回収<em>${cs[i].eco.payback != null ? f1(cs[i].eco.payback) + '年' : '—'}</em></span>` })}
        ${howto(`横軸が載せる容量、縦軸が${eco.years}年間で手元に残る金額です。線が右上がりの間は「増やすほど得」、平らになったところが増やしても得が増えない容量です。`)}</div>
      <div class="blk"><div class="blk-t">判断の材料</div><ol class="reasons">${reasons(p, a, F).map((r) => `<li><span>${r}</span></li>`).join('')}</ol></div>
      ${p.disaster.priority && crit.disaster.n === rec.n && rec !== goalCrit ? `<p class="note">※ 停電対策を優先し、冬の曇りの日でも必要な電気（${f1(crit.essential.total)}kWh/日）を発電できる容量にしています。</p>` : ''}
      ${foot(ctx, 3)}</section>`);

    // ---- P4 お金の流れ
    pages.push(`<section class="page">${head(ctx)}
      ${sec('03 — MONEY', 'お金の流れ', '導入費を、毎年の「電気代の削減」と「売電収入」で取り戻していきます。')}
      <div class="formula">
        <div><span>毎年の経済効果</span><b>電気代の削減</b><i>＋</i><b>売電収入</b></div>
        <div><span>手残り</span><b>経済効果の合計</b><i>−</i><b>導入費 ${man(eco.capex)}万円</b></div>
      </div>
      <div class="blk"><div class="blk-t">手残りの推移<small>導入時からの累計</small></div>
        ${paybackChart(F)}
        ${howto(`0年目の棒は導入費（マイナス）。毎年の経済効果を足していき、棒が0を超えた年が「回収」です。そこから先の緑の棒が、手元に残るお金です。`)}</div>
      <div class="blk"><div class="blk-t">年間の経済効果の内訳<small>期間ごとの1年あたり平均・万円</small></div>
        <table class="tbl money"><thead><tr><th>期間</th><th>電気代の削減</th><th>売電収入</th><th>合計</th><th>売電の単価</th></tr></thead><tbody>
          ${F.periods.map((x) => `<tr><td>${x.from}〜${x.to}年目</td><td>${man(x.save)}</td><td>${man(x.sell)}</td><td><b>${man(x.save + x.sell)}</b></td><td>${x.price}円/kWh</td></tr>`).join('')}
        </tbody></table>
        <p class="note">売電の単価は国の制度（FIT）で、最初の${eco.big ? p.fit.big1Years : p.fit.res1Years}年間が高く、その後下がります。${eco.big ? '' : '11年目以降は電力会社の買取単価（想定）です。'}電気代は毎年${p.tariff.escalation}%値上がりし、パネルの発電量は毎年${p.cost.degradation}%ずつ減る前提です。</p></div>
      ${foot(ctx, 4)}</section>`);

    // ---- P5 暮らしと発電
    const loads = a.prep.lb.loads.map((l) => ({ label: l.label.replace(/（(.*)）/, ''), note: (/（(.*)）/.exec(l.label) || [])[1], value: l.annual }));
    if (F.evLoad > 0) loads.push({ label: 'EV 自宅充電', value: F.evLoad, note: `太陽光から ${pct(R.evPv / F.evLoad)}` });
    loads.sort((x, y) => y.value - x.value);
    const shown = loads.slice(0, 6);
    if (loads.length > 6) shown.push({ label: 'その他', value: loads.slice(6).reduce((s, l) => s + l.value, 0) });
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const maxCmp = Math.max(R.load, F.stat, STAT_DETACHED);
    const over = months.filter((_, i) => R.monthly.gen[i] > R.monthly.load[i]);
    const monthNote = over.length >= 6 ? `冬は発電が減り暖房・給湯が増えるため買う電気が多く、${over[0]}〜${over[over.length - 1]}は発電が使う量を上回ります。`
      : over.length ? `${over.join('・')}は発電が使う量を上回り、ほかの月は使う量のほうが多くなります。`
      : '1年を通して使う量が発電を上回るため、つくった電気の多くを家で使い切れます。';
    const ess = crit.essential;
    pages.push(`<section class="page">${head(ctx)}
      ${sec('04 — LIFE & ENERGY', '暮らしと発電', '機器ごとの使い方を積み上げ、365日×24時間で発電とのバランスを計算しました。')}
      <div class="cols w64 blk">
        <div><div class="blk-t">電気の使い道<small>年間</small></div>${Ch.hbars(shown, (v) => f0(v) + 'kWh', COL.load)}</div>
        <div><div class="blk-t">年間の使う電気</div><div class="total-big">${f0(R.load)}<small>kWh</small></div>
          <div class="compare" style="margin-top:14px">
            ${[['ご家庭', R.load, 'me'], [`全国平均（${p.house.persons >= 6 ? '6人以上' : p.house.persons + '人'}）`, F.stat, ''], ['戸建の平均', STAT_DETACHED, '']].map(([l, v, c]) =>
              `<div class="cmp-row ${c}"><span class="lab">${l}</span><div><div class="bar" style="width:${(v / maxCmp * 100).toFixed(1)}%"></div></div><span class="val">${f0(v)}</span></div>`).join('')}
          </div>
          <p class="note">全国平均は環境省「家庭部門のCO2排出実態統計調査（令和5年度）」から換算（ガス併用の世帯を含む）。${a.prep.lb.calib !== 1 ? `実績 ${f0(p.calibration.annualKwh)}kWh に合わせて補正済み。` : ''}</p></div>
      </div>
      <div class="blk"><div class="blk-t">月ごとの発電と使う電気<small>kWh・${f2(rec.kw)}kW の場合</small></div>
        ${Ch.columns({ categories: months, width: 680, height: 170, fmtY: (v) => f0(v), barMax: 13,
          series: [{ name: '発電量', values: R.monthly.gen, color: COL.gen }, { name: '使う電気', values: R.monthly.load, color: COL.load }],
          extraTip: (i) => `<span><i style="--c:${COL.buy}"></i>買う電気<em>${f0(R.monthly.imp[i])}</em></span>`, fmtTip: (v) => f0(v) + 'kWh' })}
        <p class="note">${monthNote}</p></div>
      <div class="blk"><div class="blk-t">もしもの停電への備え<small>必要な電気 ${f1(ess.total)}kWh/日</small></div>
        <div class="outage"><div><p>${o.selfStandOnly
          ? `太陽光だけの場合、停電時はパワコンの<b>非常用コンセント（最大1.5kVA）</b>から晴れた日中のみ使えます。夜間や冷蔵庫${F.allDay.length ? '・ペット用エアコン' : ''}の連続運転には、<b>蓄電池またはV2H</b>が必要です。`
          : `${o.battery ? `蓄電池 ${f1(o.battery)}kWh` : ''}${o.battery && o.ev ? '・' : ''}${o.ev ? `EV ${f1(o.ev)}kWh（V2H）` : ''} に貯めた電気で、太陽が出なくても必要な電気を約 <b>${f1(o.daysNoSun)}日分</b> まかなえます。${o.full ? '全負荷型なので、エアコン・IHなど200Vの機器も使えます。' : '特定負荷型のため、使えるのはあらかじめ決めたコンセントです。'}`}
          冬の曇りの日でも、${f2(rec.kw)}kW なら日中に約 <b>${f1(crit.disasterWinterGen(rec))}kWh</b> を発電します。</p>
          <div class="ess-list">${ess.items.map((i) => `<span>${esc(i.label)}<em>${f1(i.kwh)}</em></span>`).join('')}</div></div>
          <div class="days">${o.selfStandOnly ? `<b>昼のみ</b><span>非常用コンセント</span>` : `<b>${f1(o.daysNoSun)}<small style="font-size:14px">日</small></b><span>日が出なくても使える日数</span>`}</div></div></div>
      ${foot(ctx, 5)}</section>`);

    // ---- P6 前提と用語
    const kh = E.khMonthly(a.prep.st, p.generation).map((v) => v.toFixed(2)).join(' / ');
    const st = ctx.settings;
    const lastNo = ctx.total;
    const lastPage = `<section class="page last">${head(ctx)}
      ${sec('05 — NOTES', '計算の前提と用語', '数値はすべて公的データと業界標準の計算式にもとづく推計です。')}
      <div class="blk"><div class="blk-t">用語</div><dl class="gloss">
        <dt>自給率</dt><dd>使う電気のうち、太陽光（と蓄電池・EV）でまかない、電力会社から買わずに済む割合。</dd>
        <dt>自家消費</dt><dd>つくった電気を売らずに家で使うこと。買う電気（約${p.tariff.type === 'tou' ? p.tariff.day : p.tariff.flat}円/kWh）を減らせるので、売る（${p.fit.res2}〜${p.fit.res1}円/kWh）より得になります。</dd>
        <dt>売電・FIT</dt><dd>使い切れない電気を電力会社に売ること。国の制度（FIT）で10年間の単価が決まっています。11年目以降を「卒FIT」と呼びます。</dd>
        <dt>回収</dt><dd>毎年の経済効果（電気代の削減＋売電収入）の合計が、導入費に追いつくこと。</dd>
        <dt>手残り</dt><dd>評価期間（${eco.years}年）の経済効果の合計から導入費を引いた、手元に残る金額。</dd>
      </dl></div>
      <div class="blk"><div class="blk-t">計算の前提</div><ul class="srcs">
        <li><b>発電量</b><span>月間発電量 ＝ 容量 × 傾斜面日射量 × Kh × Kpcs × Kj（太陽光発電協会 表示ガイドライン2026）。Kh＝${kh}${p.generation.method === 'jpea' ? '（JPEA参考値）' : '（JIS C 8907・温度係数' + p.panel.tc + '%/℃）'}、Kpcs＝${p.generation.pcsEff}、Kj＝${p.generation.otherLoss}。</span></li>
        <li><b>日射量・気温</b><span>${esc(site.name)}：${esc(site.src)}。気象庁 平年値（1991〜2020年）と PVGIS（欧州委員会 共同研究センター、2005〜2020年）から、屋根の向き・勾配に換算。</span></li>
        <li><b>使う電気</b><span>エアコンは JIS C 9612 の期間消費電力量を、運転時間・断熱等級・地域の気温・冷暖房の使い方で補正。給湯・家電は人数別の代表値。365日×24時間で晴れ・曇り・雨の日を混ぜて計算。</span></li>
        <li><b>料金・売電</b><span>買う電気 ${p.tariff.type === 'tou' ? `昼 ${p.tariff.day}円・夜 ${p.tariff.night}円` : `${p.tariff.flat}円`}/kWh（値上がり ${p.tariff.escalation}%/年）。売電 1〜4年目 ${p.fit.res1}円・5〜10年目 ${p.fit.res2}円（2025年10月〜の初期投資支援スキーム）、11年目以降 ${p.fit.after}円。</span></li>
        <li><b>導入費</b><span>太陽光 ${p.cost.pvFixed}万円 ＋ ${p.cost.pvPerKw}万円/kW${p.cost.subsidy ? ` − 補助金 ${p.cost.subsidy}万円` : ''}。蓄電池・V2H・保守費・パワコン交換費は含みません。</span></li>
        <li><b>ご注意</b><span>周辺の建物・樹木の影、積雪、出力制御は入力値の範囲でのみ考慮しています。実際の発電量・電気代は天候やご使用状況で変わります。本書は推計であり、発電量や経済効果を保証するものではありません。</span></li>
      </ul></div>
      <div class="blk"><div class="blk-t">参考資料</div><div class="refs">
        <div>太陽光発電協会「表示ガイドライン（2026年度）」</div><div>気象庁「過去の気象データ検索（平年値）」</div>
        <div>European Commission JRC「PVGIS」</div><div>環境省「令和5年度 家庭部門のCO2排出実態統計調査」</div>
        <div>経済産業省「FIT・FIP制度 2026年度以降の買取価格等」</div><div>調達価格等算定委員会「令和8年度以降の調達価格等に関する意見」</div>
      </div></div>
      <div class="contact"><div><div class="co">${esc(st.company || 'ご提案者')}</div><div class="who">${[cust.staff || st.staff ? '担当　' + esc(cust.staff || st.staff) : '', st.phone ? 'TEL　' + esc(st.phone) : '', st.email ? 'MAIL　' + esc(st.email) : ''].filter(Boolean).join('<br>')}</div></div>
        <div style="text-align:right"><span class="brand"><span class="mark"></span></span><div class="who">${dateJa(cust.date)}</div></div></div>
      ${foot(ctx, 6)}</section>`;
    pages.push(lastPage);

    // ---- 詳細資料（任意）
    if (detail) {
      const panelKw = p.panel.watt / 1000;
      const best = Math.max(...a.prep.faces.map((f) => f.yield.annual));
      const faceRows = a.prep.faces.map((f, i) => {
        const n = rec.counts[i] || 0;
        return `<tr><td>${E.DIR_LABEL[f.face.dir]}向き・${f.face.slopeSun}寸</td><td>${f0(f.face.areaM2)}㎡</td><td>${pct(f.yield.annual / best)}</td><td>${n} / ${f.maxPanels}枚</td><td>${f2(n * panelKw)}kW</td><td>${f0(n * panelKw * f.yield.annual)}kWh</td></tr>`;
      }).join('');
      const step = Math.max(1, Math.ceil(cs.length / 9));
      const keep = new Set([rec.n, crit.econ.n, crit.roofMax.n].concat(crit.netZero ? [crit.netZero.n] : []));
      const tags = {};
      const tag = (c, t) => { if (c) tags[c.n] = (tags[c.n] || []).concat(t); };
      tag(rec, 'ご提案'); if (crit.econ !== rec) tag(crit.econ, '手残り最大'); tag(crit.netZero, '使う量と同じ'); tag(crit.roofMax, '屋根上限');
      const rows = cs.filter((c) => c.n % step === 0 || keep.has(c.n)).map((c) => `<tr class="${c.n === rec.n ? 'rec' : ''}">
        <td>${f2(c.kw)}kW<span style="color:#8A8D94">（${c.n}枚）</span>${(tags[c.n] || []).map((t) => `<span class="tag">${t}</span>`).join('')}</td><td>${f0(c.sim.gen)}</td><td>${pct(c.sim.selfRate)}</td><td>${pct(c.sim.sufficiency)}</td>
        <td>${man(c.eco.year1)}</td><td>${man(c.eco.capex)}</td><td>${c.eco.payback != null ? f1(c.eco.payback) : '—'}</td><td class="${c.eco.net < 0 ? 'neg' : ''}">${man(c.eco.net)}</td></tr>`).join('');
      const tr = a.recDetail.sim.trace[a.recDetail.traceDays[0]];
      const cons = tr ? tr.map((r) => r.L + r.evPv + r.evGrid) : [];
      pages.splice(pages.length - 1, 0, `<section class="page">${head(ctx)}
        ${sec('APPENDIX', '詳細資料', '屋根の割り付けと、容量ごとの比較です。')}
        <div class="blk"><div class="blk-t">屋根への割り付け<small>発電効率の高い面から順に配置</small></div>
          <table class="tbl"><thead><tr><th>屋根面</th><th>面積</th><th>発電効率</th><th>枚数（採用 / 上限）</th><th>容量</th><th>年間発電</th></tr></thead><tbody>${faceRows}</tbody></table>
          <p class="note">${esc(panelName(p))}（${p.panel.watt}W・${p.panel.l}×${p.panel.w}mm）。発電効率はもっとも条件の良い面を100%とした比。</p></div>
        <div class="blk"><div class="blk-t">容量ごとの比較<small>金額は万円・年間値は初年度</small></div>
          <table class="tbl"><thead><tr><th>容量</th><th>発電 kWh</th><th>自家消費率</th><th>自給率</th><th>経済効果</th><th>導入費</th><th>回収（年）</th><th>${eco.years}年手残り</th></tr></thead><tbody>${rows}</tbody></table>
          <p class="note">自家消費率＝つくった電気のうち家で使う割合。容量を増やすほど自給率は上がり、自家消費率は下がります。</p></div>
        ${tr ? `<div class="blk"><div class="blk-t">晴れた夏の日の1日<small>kW</small></div>${Ch.line({ x: tr.map((r) => r.h), width: 680, height: 150, yTicks: 3, fmtX: (v) => v + '時', fmtY: (v) => f1(v), xTicks: [0, 6, 12, 18, 23],
          series: [{ name: '発電', values: tr.map((r) => r.g), color: COL.gen, area: true, areaOpacity: 0.28 }, { name: '使う電気', values: cons, color: COL.load }, { name: '買う電気', values: tr.map((r) => r.imp), color: COL.buy, dash: true }] })}
          ${howto('昼は発電が使う量を上回り、余りが売電（または蓄電池・EVへの充電）になります。夕方以降は買う電気になります。')}</div>` : ''}
        ${foot(ctx, 6)}</section>`);
      // 最終ページ番号の付け直し
      pages[pages.length - 1] = pages[pages.length - 1].replace(`<b>06</b> / 07`, `<b>07</b> / 07`);
    }
    void lastNo;
    return pages.join('');
  }

  root.Proposal = { render, coverArt, STAT_BY_PERSONS, panelName, dateJa };
})(typeof window !== 'undefined' ? window : globalThis);
