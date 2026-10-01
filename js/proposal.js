/* 提案書（A4×6ページ）の組版 */
(function (root) {
  'use strict';
  const E = root.SolarEngine, C = root.SOLAR_CATALOG, Ch = root.Charts;
  const COL = { gen: '#E0782A', load: '#2A78D6', net: '#1BAF7A', buy: '#4A3AA7', ink: '#14161B', mute: '#C9C2B6' };
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
    return m ? `${m.maker === '汎用（海外大手）' || m.maker === '汎用（国内メーカー系）' ? '' : m.maker + ' '}${m.model}` : '指定パネル';
  }
  function dateJa(iso) {
    const d = iso ? new Date(iso + 'T00:00:00') : new Date();
    return isNaN(d) ? '' : `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }

  // ------------------------------------------------------------ 文章 ---
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
    return { R, eco, crit, groups, evLoad, stat, allDay, refYield, hSum, total: R.load, disasterOk };
  }

  function reasons(p, a, F) {
    const { R, crit, groups, evLoad, stat, allDay, refYield, hSum, total } = F;
    const out = [];
    const top = Object.entries(groups).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([g, v]) => `${g}${pct(v / total)}`).join('・');
    out.push(`<b>ご使用量</b>　設備と暮らし方から年間 <b>${f0(total)}kWh</b> と推計（${top}）。同じ人数の全国平均 約${f0(stat)}kWh の <b>${(total / stat).toFixed(1)}倍</b> です。`);
    if (allDay.length) out.push(`<b>止められない空調</b>　${esc(allDay.map((l) => l.label.replace(/（.*/, '')).join('・'))}の24時間運転で年間 約${f0(allDay.reduce((s, l) => s + l.annual, 0))}kWh。昼は太陽光で直接まかない、${p.battery.enabled || (p.ev.enabled && p.ev.v2h) ? '夜は蓄電池・V2Hで' : '夜の分は蓄電池・V2H の導入で'}カバーできます。`);
    if (evLoad) out.push(`<b>EV の充電</b>　自宅充電は年間 約${f0(evLoad)}kWh。そのうち <b>${f0(R.evPv)}kWh（${pct(R.evPv / evLoad)}）</b> を太陽光の余剰で充電できます${p.ev.v2h ? `。V2H で夜に家へ ${f0(R.v2hOut)}kWh を給電` : ''}。`);
    out.push(`<b>日射量</b>　${esc(p.location.station)}は水平面で年間 ${f0(hSum)}kWh/㎡（${esc(a.prep.st.src.replace(/（.*/, ''))}）。南向き30°なら 1kWあたり年間 <b>約${f0(refYield)}kWh</b> を発電します。`);
    out.push(`<b>屋根</b>　発電に適した面に最大 ${a.maxPanels}枚、<b>${f2(crit.roofMax.kw)}kW</b> まで載せられます。`);
    const e = crit.econ, next = a.cases.find((c) => c.kw >= e.kw + 1);
    let t = `<b>経済性</b>　${a.recDetail.eco.years}年間の収支は <b>${f2(e.kw)}kW で最大（${man(e.eco.net)}万円）</b>。`;
    t += next ? `それ以上は増えた発電の多くが売電（5年目以降 ${p.fit.res2}円）となり、追加費用 ${p.cost.pvPerKw}万円/kW を回収しにくくなります。`
      : `屋根いっぱいまで、載せるほど手残りが増えます。`;
    out.push(t);
    out.push(crit.netZero ? `<b>自給</b>　年間の発電が使用量を上回る「ネットゼロ」は <b>${f2(crit.netZero.kw)}kW</b> から。`
      : `<b>自給</b>　屋根いっぱいでも年間使用量の ${pct(crit.roofMax.sim.gen / a.consumption)} の発電。断熱・高効率機器との組み合わせが有効です。`);
    out.push(F.disasterOk ? `<b>停電時</b>　最低限必要な ${f1(crit.essential.total)}kWh/日 を、冬の曇りの日でも発電できるのは <b>${f2(crit.disaster.kw)}kW</b> 以上です。`
      : `<b>停電時</b>　必要な ${f1(crit.essential.total)}kWh/日 は冬の曇天では屋根いっぱいでも届かないため、晴れの日の電気を<b>蓄電池・V2H</b>に貯めて補います。`);
    return out;
  }

  function points(p, a, F) {
    const { R, eco, total, stat, allDay, evLoad } = F;
    const pts = [];
    const life = [];
    if (allDay.length) life.push('24時間の空調');
    if (evLoad) life.push('EVの充電');
    if (p.waterHeater && p.waterHeater.startsWith('ecocute')) life.push('エコキュート');
    pts.push({ t: '暮らしに合わせた容量', d: `${life.length ? life.join('・') + 'を含め、' : ''}年間 ${f0(total)}kWh（全国平均の${(total / stat).toFixed(1)}倍）のご使用量から逆算しました。` });
    pts.push({ t: `${eco.years}年で ${man(eco.net)}万円の手残り`, d: `年間メリットは初年度 ${man(eco.year1)}万円。${eco.payback != null ? `約${f1(eco.payback)}年で導入費を回収し、` : ''}以降は電気代の上昇にも強い家計になります。` });
    const o = E.outageEstimate(p, a);
    pts.push(o.selfStandOnly
      ? { t: '停電の日も、昼は電気が使える', d: `自立運転コンセントで日中に最大1.5kVA。冬の曇天でも約${f1(a.crit.disasterWinterGen(a.rec))}kWh/日を発電します。` }
      : { t: `停電しても約${f1(o.daysNoSun)}日分の安心`, d: `${o.battery ? '蓄電池' : ''}${o.battery && o.ev ? '＋' : ''}${o.ev ? 'EV（V2H）' : ''}で約${f1(o.storage)}kWh。晴れれば太陽光で再充電でき、長い停電にも備えられます。` });
    void R;
    return pts;
  }

  // ------------------------------------------------------------ 部品 ---
  function head(ctx) {
    return `<div class="pg-head"><span class="brand"><span class="mark"></span>${esc(ctx.settings.company || 'HIKARI')}</span><span>SOLAR CAPACITY PROPOSAL</span></div>`;
  }
  function foot(ctx, n, total) {
    return `<div class="pg-foot"><span>${esc(ctx.customerLabel)}</span><span><b>${String(n).padStart(2, '0')}</b> / ${String(total).padStart(2, '0')}</span></div>`;
  }
  function sec(k, t, d) {
    return `<div class="sec"><div class="sec-k">${k}</div><h2 class="sec-t">${t}</h2>${d ? `<p class="sec-d">${d}</p>` : ''}</div>`;
  }
  function kpi(k, v, unit, d, meter) {
    return `<div class="kpi"><div class="k">${k}</div><div class="v">${v}<small>${unit || ''}</small></div>${meter ? `<div class="meter"><i style="width:${Math.min(100, meter.v * 100)}%;--c:${meter.c}"></i></div>` : ''}<div class="d">${d || ''}</div></div>`;
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
    if (!a.rec) return `<div class="page"><div class="sec"><h2 class="sec-t">屋根に載せられるパネルがありません</h2><p class="sec-d">屋根面の面積・向き・最大枚数を確認してください。</p></div></div>`;
    const F = facts(p, a);
    const { R, eco, crit } = F;
    const rec = a.rec;
    const cust = p.customer || {};
    const name = cust.name ? `${cust.name}${cust.honorific || '様'}` : 'お客様';
    ctx.customerLabel = `${name}　太陽光発電 最適容量のご提案`;
    const total = 6;
    const pages = [];
    const co2 = R.gen * (C.co2.grid - C.co2.pv) / 1000;

    // ---- P1 表紙
    pages.push(`<section class="page cover"><div class="cover-art">${coverArt()}</div><div class="cover-in">
      <div class="cover-top"><span class="brand"><span class="mark"></span><span class="brand-name">${esc(ctx.settings.company || 'Hikari')}</span></span><span class="co">${dateJa(cust.date)}</span></div>
      <div class="cover-copy"><p class="eyebrow">SOLAR CAPACITY PROPOSAL</p><h1>太陽光発電<br>最適容量のご提案</h1></div>
      <div class="cover-name">${cust.address ? esc(cust.address) : esc(p.location.station + '・' + p.house.persons + '人家族')}<b>${esc(cust.name || 'お客様')}<small>${esc(cust.honorific || '様')}</small></b></div>
      <div class="cover-kw"><div><div class="lbl">RECOMMENDED CAPACITY</div><div class="big"><b>${f2(rec.kw)}</b><span>kW</span></div>
        <div class="spec">${esc(panelName(p))}　${p.panel.watt}W × ${rec.n}枚</div></div>
        <div class="facts">年間発電量<b>${f0(R.gen)} kWh</b><br>自給率<b>${pct(R.sufficiency)}</b><br>${eco.years}年間の手残り<b>${man(eco.net)} 万円</b></div></div>
      <div class="cover-bottom"><span>ご提案　<b>${esc(ctx.settings.company || '')}</b>${cust.staff || ctx.settings.staff ? `　担当　<b>${esc(cust.staff || ctx.settings.staff)}</b>` : ''}</span><span>${GOAL[a.goal]}${p.disaster.priority ? '＋停電対策' : ''}</span></div>
    </div></section>`);

    // ---- P2 結論
    const why = { econ: `${eco.years}年間の手残りがもっとも大きく`, netzero: '年間に使う電気をご自宅の屋根でまかなえ', max: '屋根の発電力を余さず活かせ' }[a.goal];
    const pts = points(p, a, F);
    pages.push(`<section class="page">${head(ctx)}
      ${sec('01 — CONCLUSION', 'ご提案の結論')}
      <p class="lead">${esc(name)}のご家庭には、<br><em>${f2(rec.kw)} kW</em>（${p.panel.watt}W × ${rec.n}枚）の太陽光発電をおすすめします。</p>
      <p class="lead-sub">${why}、年間 約${f0(R.gen)}kWh を発電。ご家庭で使う電気の <b>${pct(R.sufficiency)}</b> を自給し、${eco.payback != null ? `約${f1(eco.payback)}年で導入費を回収、` : ''}${eco.years}年間で <b>${man(eco.net)}万円</b> の手残りが見込めます。</p>
      <div class="kpis">
        ${kpi('年間発電量', f0(R.gen), 'kWh', `1kWあたり ${f0(R.gen / rec.kw)}kWh`)}
        ${kpi('年間ご使用量（推計）', f0(R.load), 'kWh', `全国の同人数平均 ${f0(F.stat)}kWh`)}
        ${kpi('自給率', pct(R.sufficiency), '', '使う電気のうち買わずに済む割合', { v: R.sufficiency, c: COL.gen })}
        ${kpi('自家消費率', pct(R.selfRate), '', '発電のうち家で使う割合', { v: R.selfRate, c: COL.net })}
        ${kpi('年間メリット（初年度）', man(eco.year1), '万円', `電気代 −${man(R.saving)}万 ＋ 売電 ${man(R.exp * eco.flows[0].sellPrice)}万`)}
        ${kpi('投資回収', eco.payback != null ? f1(eco.payback) : `${eco.years}年超`, eco.payback != null ? '年' : '', `太陽光の導入費 ${man(eco.capex)}万円`)}
        ${kpi(`${eco.years}年間の手残り`, man(eco.net), '万円', '導入費を差し引いた累計')}
        ${kpi('CO₂ 削減', f1(co2), 't/年', `杉の木 約${f0(co2 * 1000 / 8.8)}本分の吸収量`)}
      </div>
      <div class="cols blk">
        <div><div class="blk-t">発電した電気のゆくえ<small>年間 ${f0(R.gen)}kWh</small></div>
          ${Ch.split([{ name: 'ご家庭で使う', value: R.self, color: COL.net }, { name: '売電', value: R.exp, color: COL.gen }], (v) => f0(v) + 'kWh')}</div>
        <div><div class="blk-t">使う電気のまかない方<small>年間 ${f0(R.load)}kWh</small></div>
          ${Ch.split([{ name: '太陽光・蓄電', value: Math.max(0, R.load - R.imp), color: COL.gen }, { name: '電力会社から購入', value: R.imp, color: COL.buy }], (v) => f0(v) + 'kWh')}</div>
      </div>
      <div class="blk"><div class="blk-t">手残りの推移<small>導入費を差し引いた累計（万円）${eco.payback != null ? `・約${f1(eco.payback)}年で回収` : ''}</small></div>
        ${Ch.line({ x: [0].concat(eco.flows.map((f) => f.y)), width: 680, height: 112, yTicks: 2, yUnit: '万円', fmtX: (v) => v + '年', fmtY: (v) => f0(v),
          xTicks: [0, 5, 10, 15, eco.years].filter((v, i, a) => v <= eco.years && a.indexOf(v) === i),
          markers: eco.payback != null ? [{ x: eco.payback, label: '回収', strong: true }] : [],
          series: [{ name: '累計収支', values: [-eco.capex / 10000].concat(eco.flows.map((f) => f.cum / 10000)), color: COL.net, area: true, dot: eco.flows.length }],
          fmtTip: (i) => `<b>${i}年目</b><span><i style="--c:${COL.net}"></i>累計<em>${man(i ? eco.flows[i - 1].cum : -eco.capex)}万円</em></span>${i ? `<span>その年のメリット<em>${man(eco.flows[i - 1].benefit)}万円</em></span>` : ''}` })}</div>
      <div class="blk"><div class="blk-t">ご提案のポイント</div>
        <div class="points">${pts.map((x, i) => `<div class="pt"><div class="n">POINT ${String(i + 1).padStart(2, '0')}</div><b>${esc(x.t)}</b><p>${esc(x.d)}</p></div>`).join('')}</div></div>
      ${foot(ctx, 2, total)}</section>`);

    // ---- P3 根拠
    const cs = a.cases;
    const critCard = (key, title, c, color, desc) => {
      const on = c && c.n === rec.n && (key === a.goal || (key === 'disaster' && p.disaster.priority && crit.disaster.n === rec.n && crit[a.goal === 'netzero' ? 'netZero' : a.goal === 'max' ? 'roofMax' : 'econ'] !== crit.disaster));
      return `<div class="crit ${on ? 'on' : ''}" style="--c:${color}">${on ? '<span class="tag">採用</span>' : ''}<div class="t"><i></i>${title}</div><div class="v">${c ? f2(c.kw) : '—'}<small>kW</small></div><div class="d">${desc}</div></div>`;
    };
    const markers = [];
    const addM = (c, label, strong) => { if (c && !markers.some((m) => m.x === c.kw)) markers.push({ x: c.kw, label, strong }); };
    addM(rec, `ご提案 ${f2(rec.kw)}kW`, true);
    addM(crit.netZero, 'ネットゼロ');
    addM(crit.econ, '収支最大');
    if (F.disasterOk && crit.disaster.n < rec.n - 1) addM(crit.disaster, '停電対策');
    const xs = cs.map((c) => c.kw);
    const recIdx = cs.indexOf(rec);
    const kwTip = (i) => `<b>${f2(cs[i].kw)}kW（${cs[i].n}枚）</b>`;
    pages.push(`<section class="page">${head(ctx)}
      ${sec('02 — RATIONALE', '容量の根拠', `パネルを1枚ずつ増やしながら ${cs.length}通りを計算し、4つの基準で比べました。`)}
      <div class="crits blk">
        ${critCard('econ', `${eco.years}年収支が最大`, crit.econ, COL.net, `手残り ${man(crit.econ.eco.net)}万円`)}
        ${critCard('netzero', 'ネットゼロ', crit.netZero, COL.load, crit.netZero ? '年間の発電 ≧ 使用量' : `屋根上限で使用量の${pct(crit.roofMax.sim.gen / a.consumption)}`)}
        ${critCard('max', '屋根に載る上限', crit.roofMax, '#8A8D94', `最大 ${a.maxPanels}枚`)}
        ${F.disasterOk ? critCard('disaster', '停電対策ライン', crit.disaster, COL.buy, `冬の曇天で ${f1(crit.essential.total)}kWh/日`) : critCard('disaster', '停電対策ライン', null, COL.buy, `必要 ${f1(crit.essential.total)}kWh/日は屋根上限でも不足。蓄電で補います`)}
      </div>
      <div class="blk"><div class="blk-t">${eco.years}年間の手残り<small>容量ごとの累計収支（万円）</small></div>
        ${Ch.line({ x: xs, xMin: 0, width: 680, height: 196, yUnit: '万円', fmtX: (v) => v + 'kW', fmtY: (v) => f0(v), markers,
          series: [{ name: '累計収支', values: cs.map((c) => c.eco.net / 10000), color: COL.net, area: true, dot: recIdx }],
          fmtTip: (i) => kwTip(i) + `<span><i style="--c:${COL.net}"></i>累計収支<em>${man(cs[i].eco.net)}万円</em></span><span>回収<em>${cs[i].eco.payback != null ? f1(cs[i].eco.payback) + '年' : '—'}</em></span>` })}</div>
      <div class="blk"><div class="blk-t">自給率と自家消費率<small>載せるほど自給率は上がり、家で使い切れる割合は下がります</small></div>
        ${Ch.line({ x: xs, xMin: 0, width: 680, height: 128, yMin: 0, yMax: 100, yTicks: 2, yUnit: '%', fmtX: (v) => v + 'kW', fmtY: (v) => v + '%',
          markers: [{ x: rec.kw, strong: true }],
          series: [{ name: '自給率', values: cs.map((c) => c.sim.sufficiency * 100), color: COL.gen, dot: recIdx }, { name: '自家消費率', values: cs.map((c) => c.sim.selfRate * 100), color: COL.load, dot: recIdx }],
          fmtTip: (i) => kwTip(i) + `<span><i style="--c:${COL.gen}"></i>自給率<em>${pct(cs[i].sim.sufficiency)}</em></span><span><i style="--c:${COL.load}"></i>自家消費率<em>${pct(cs[i].sim.selfRate)}</em></span>` })}</div>
      <div class="blk"><div class="blk-t">判断の材料</div><ol class="reasons">${reasons(p, a, F).map((r) => `<li><span>${r}</span></li>`).join('')}</ol></div>
      ${foot(ctx, 3, total)}</section>`);

    // ---- P4 電気
    const loads = a.prep.lb.loads.map((l) => ({ label: l.label.replace(/（(.*)）/, ''), note: (/（(.*)）/.exec(l.label) || [])[1], value: l.annual }));
    if (F.evLoad > 0) loads.push({ label: 'EV 自宅充電', value: F.evLoad, note: `太陽光から ${pct(R.evPv / F.evLoad)}` });
    loads.sort((x, y) => y.value - x.value);
    const shown = loads.slice(0, 7);
    if (loads.length > 7) shown.push({ label: 'その他', value: loads.slice(7).reduce((s, l) => s + l.value, 0) });
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const maxCmp = Math.max(R.load, F.stat, STAT_DETACHED);
    const over = months.filter((_, i) => R.monthly.gen[i] > R.monthly.load[i]);
    const monthNote = over.length >= 6 ? `冬は発電が減り暖房・給湯が増えるため購入が多く、${over[0]}〜${over[over.length - 1]}は発電が使用を上回ります。`
      : over.length ? `${over.join('・')}は発電が使用を上回り、ほかの月は使用が発電を上回ります。冬は暖房・給湯が増えるため購入が多くなります。`
      : '1年を通して使用が発電を上回るため、発電した電気の多くを家で使い切れる計画です。';
    const day = (tr, title) => {
      if (!tr) return '';
      const cons = tr.map((r) => r.L + r.evPv + r.evGrid);
      return `<div><div class="blk-t">${title}<small>kW</small></div>${Ch.line({ x: tr.map((r) => r.h), width: 330, height: 142, yTicks: 3, fmtX: (v) => v + '時', fmtY: (v) => f1(v), xTicks: [0, 6, 12, 18, 23],
        series: [{ name: '発電', values: tr.map((r) => r.g), color: COL.gen, area: true, areaOpacity: 0.28 }, { name: '使用', values: cons, color: COL.load }, { name: '購入', values: tr.map((r) => r.imp), color: COL.buy, dash: true }],
        fmtTip: (i) => `<b>${tr[i].h}時台</b><span><i style="--c:${COL.gen}"></i>発電<em>${f1(tr[i].g)}kW</em></span><span><i style="--c:${COL.load}"></i>使用<em>${f1(cons[i])}kW</em></span><span><i style="--c:${COL.buy}"></i>購入<em>${f1(tr[i].imp)}kW</em></span>` })}</div>`;
    };
    pages.push(`<section class="page">${head(ctx)}
      ${sec('03 — ENERGY PROFILE', 'ご家庭の電気と発電', '機器ごとの使い方を積み上げ、365日×24時間で発電とのバランスを計算しました。')}
      <div class="cols w64 blk">
        <div><div class="blk-t">電気の使い道<small>年間・推計</small></div>${Ch.hbars(shown, (v) => f0(v) + 'kWh', COL.load)}</div>
        <div><div class="blk-t">年間のご使用量</div><div class="total-big">${f0(R.load)}<small>kWh</small></div>
          <div class="compare" style="margin-top:14px">
            ${[['ご家庭', R.load, 'me'], [`全国平均（${p.house.persons >= 6 ? '6人以上' : p.house.persons + '人'}）`, F.stat, ''], ['戸建の平均', STAT_DETACHED, '']].map(([l, v, c]) =>
              `<div class="cmp-row ${c}"><span class="lab">${l}</span><div><div class="bar" style="width:${(v / maxCmp * 100).toFixed(1)}%"></div></div><span class="val">${f0(v)}</span></div>`).join('')}
          </div>
          <p class="note">全国平均は環境省「家庭部門のCO2排出実態統計調査（令和5年度）」から換算。ガス併用の世帯を含みます。${a.prep.lb.calib !== 1 ? `実績 ${f0(p.calibration.annualKwh)}kWh に合わせて補正済み。` : ''}</p></div>
      </div>
      <div class="blk"><div class="blk-t">月ごとの発電と使用<small>kWh・${f2(rec.kw)}kW の場合</small></div>
        ${Ch.columns({ categories: months, width: 680, height: 168, fmtY: (v) => f0(v), barMax: 13,
          series: [{ name: '発電量', values: R.monthly.gen, color: COL.gen }, { name: '使用量', values: R.monthly.load, color: COL.load }],
          extraTip: (i) => `<span><i style="--c:${COL.buy}"></i>購入<em>${f0(R.monthly.imp[i])}</em></span>`, fmtTip: (v) => f0(v) + 'kWh' })}
        <p class="note">${monthNote}</p></div>
      <div class="cols blk">${day(a.recDetail.sim.trace[a.recDetail.traceDays[0]], '夏（8月）晴れの日')}${day(a.recDetail.sim.trace[a.recDetail.traceDays[1]], '冬（1月）晴れの日')}</div>
      ${foot(ctx, 4, total)}</section>`);

    // ---- P5 屋根・停電・比較
    const panelKw = p.panel.watt / 1000;
    const best = Math.max(...a.prep.faces.map((f) => f.yield.annual));
    const faceRows = a.prep.faces.map((f, i) => {
      const n = rec.counts[i] || 0;
      return `<tr class="${n ? '' : 'dim'}"><td>${E.DIR_LABEL[f.face.dir]}向き・${f.face.slopeSun}寸</td><td>${f0(f.face.areaM2)}㎡</td><td>${pct(f.yield.annual / best)}</td><td>${n} / ${f.maxPanels}枚</td><td>${f2(n * panelKw)}kW</td><td>${f0(n * panelKw * f.yield.annual)}kWh</td></tr>`;
    }).join('');
    const o = E.outageEstimate(p, a);
    const winterDay = crit.disasterWinterGen(rec);
    const step = Math.max(1, Math.ceil(cs.length / 11));
    const keep = new Set([rec.n, crit.econ.n, crit.roofMax.n].concat(crit.netZero ? [crit.netZero.n] : []));
    const tags = {};
    const tag = (c, t) => { if (c) tags[c.n] = (tags[c.n] || []).concat(t); };
    tag(rec, 'ご提案'); if (crit.econ !== rec) tag(crit.econ, '収支最大'); tag(crit.netZero, 'ネットゼロ'); tag(crit.roofMax, '屋根上限');
    const rows = cs.filter((c) => c.n % step === 0 || keep.has(c.n)).map((c) => `<tr class="${c.n === rec.n ? 'rec' : ''}">
      <td>${f2(c.kw)}kW<span style="color:#8A8D94">（${c.n}枚）</span>${(tags[c.n] || []).map((t) => `<span class="tag">${t}</span>`).join('')}</td><td>${f0(c.sim.gen)}</td><td>${pct(c.sim.selfRate)}</td><td>${pct(c.sim.sufficiency)}</td>
      <td>${man(c.eco.year1)}</td><td>${man(c.eco.capex)}</td><td>${c.eco.payback != null ? f1(c.eco.payback) : '—'}</td><td class="${c.eco.net < 0 ? 'neg' : ''}">${man(c.eco.net)}</td></tr>`).join('');
    pages.push(`<section class="page">${head(ctx)}
      ${sec('04 — ROOF & RESILIENCE', '屋根・もしもの備え・容量の比較')}
      <div class="blk"><div class="blk-t">屋根への割り付け<small>発電効率の高い面から順に配置</small></div>
        <table class="tbl"><thead><tr><th>屋根面</th><th>面積</th><th>発電効率</th><th>枚数（採用 / 上限）</th><th>容量</th><th>年間発電</th></tr></thead><tbody>${faceRows}</tbody></table>
        <p class="note">${esc(panelName(p))}（${p.panel.watt}W・${p.panel.l}×${p.panel.w}mm）。発電効率はもっとも条件の良い面を100%とした比。${p.allowNorth ? '' : '北向きの面は発電量が少ないため対象外としています。'}</p></div>
      <div class="blk"><div class="blk-t">もしもの停電への備え<small>必要量 ${f1(crit.essential.total)}kWh/日</small></div>
        <div class="outage"><div><p>冬（12月）の曇りの日でも、${f2(rec.kw)}kW なら日中に約 <b>${f1(winterDay)}kWh</b> を発電します（必要量の${pct(winterDay / Math.max(0.1, crit.essential.total))}）。
          ${o.selfStandOnly ? '蓄電池・V2H がない場合、停電時はパワコンの<b>自立運転コンセント（最大1.5kVA）</b>から昼間のみ使えます。夜間や冷蔵庫・ペット用エアコンの連続運転には、<b>蓄電池または V2H</b> をおすすめします。'
            : `${o.battery ? `蓄電池 ${f1(o.battery)}kWh` : ''}${o.battery && o.ev ? '・' : ''}${o.ev ? `EV ${f1(o.ev)}kWh（V2H）` : ''} に貯めた電気で、太陽が出なくても必要量を約 <b>${f1(o.daysNoSun)}日分</b> まかなえます。`}</p>
          <div class="ess-list">${crit.essential.items.map((i) => `<span>${esc(i.label)}<em>${f1(i.kwh)}</em></span>`).join('')}</div></div>
          <div class="days">${o.selfStandOnly ? `<b>昼のみ</b><span>自立運転で使用可</span>` : `<b>${f1(o.daysNoSun)}<small style="font-size:14px">日</small></b><span>日照なしで使える日数</span>`}</div></div>
        ${a.noStorage ? `<p class="note">蓄電池・V2H の平常時の効果（同じ ${f2(rec.kw)}kW で比較）：自家消費率 ${pct(a.noStorage.selfRate)} → ${pct(R.selfRate)}、自給率 ${pct(a.noStorage.sufficiency)} → ${pct(R.sufficiency)}。</p>` : ''}</div>
      <div class="blk"><div class="blk-t">容量別の比較<small>金額は万円・年間値は初年度</small></div>
        <table class="tbl"><thead><tr><th>容量</th><th>発電 kWh</th><th>自家消費率</th><th>自給率</th><th>年間メリット</th><th>導入費</th><th>回収（年）</th><th>${eco.years}年収支</th></tr></thead><tbody>${rows}</tbody></table>
        <p class="note">累計収支は電気代上昇 ${p.tariff.escalation}%/年・パネル劣化 ${p.cost.degradation}%/年・売電単価の切り替わり（${eco.fitClass}）を反映。</p></div>
      ${foot(ctx, 5, total)}</section>`);

    // ---- P6 前提と出典
    const kh = E.khMonthly(a.prep.st, p.generation).map((v) => v.toFixed(2)).join(' / ');
    const st = ctx.settings;
    pages.push(`<section class="page last">${head(ctx)}
      ${sec('05 — METHODOLOGY', '計算の前提と出典', '数値はすべて公的データ・業界標準の計算式にもとづいています。')}
      <div class="blk"><ul class="srcs">
        <li><b>発電量</b><span>月間発電量 ＝ 容量 × 傾斜面日射量 × Kh × Kpcs × Kj（太陽光発電協会 表示ガイドライン2026）。Kh＝${kh}${p.generation.method === 'jpea' ? '（JPEA参考値）' : '（JIS C 8907・温度係数' + p.panel.tc + '%/℃）'}、Kpcs＝${p.generation.pcsEff}、Kj＝${p.generation.otherLoss}。</span></li>
        <li><b>日射量</b><span>${esc(p.location.station)}：${esc(a.prep.st.src)}。気象庁 平年値（1991〜2020年）の月平均全天日射量を、PVGIS（欧州委員会 共同研究センター）で求めた月別の傾斜面／水平面比で屋根の向き・勾配に換算。</span></li>
        <li><b>天候と時間</b><span>各月に晴・曇・雨の日（日射比 ${E.WEATHER.f.join(' : ')}、出現率 ${E.WEATHER.p.map((x) => x * 100 + '%').join('・')}）を混在させ、月合計を平年値に一致。蓄電池・EV の充放電を含め 365日×24時間で計算。</span></li>
        <li><b>空調</b><span>JIS C 9612 の期間消費電力量（東京・6〜24時運転）を基準に、運転時間（24時間は1.25倍）・断熱等級・地域の気温（冷房・暖房度日）で補正。</span></li>
        <li><b>給湯・家電</b><span>エコキュートは（${C.ecocuteBase}＋${C.ecocutePerPerson}×人数）kWh を水温で地域補正。照明・家電は人数別の代表値。全国平均は環境省「家庭部門のCO2排出実態統計調査（令和5年度）」。</span></li>
        <li><b>料金・売電</b><span>買電 ${p.tariff.type === 'tou' ? `昼 ${p.tariff.day}円・夜 ${p.tariff.night}円` : `${p.tariff.flat}円`}/kWh（上昇率 ${p.tariff.escalation}%/年）。売電は10kW未満 1〜4年目 ${p.fit.res1}円・5〜10年目 ${p.fit.res2}円（初期投資支援スキーム）、卒FIT後 ${p.fit.after}円。</span></li>
        <li><b>導入費</b><span>太陽光 ${p.cost.pvFixed}万円 ＋ ${p.cost.pvPerKw}万円/kW（2025年 住宅用新築平均 28.9万円/kW 相当）。補助金・保守費・パワコン交換費は含みません。</span></li>
        <li><b>ご注意</b><span>周辺の建物・樹木の影、積雪、出力制御は${p.generation.snowLoss || a.prep.faces.some((f) => f.face.shading) ? '入力値の範囲でのみ' : ''}考慮していません。実際の発電量・電気代は天候やご使用状況により変わります。本書は推計であり、発電量や経済効果を保証するものではありません。</span></li>
      </ul></div>
      <div class="blk"><div class="blk-t">参考資料</div><div class="refs">
        <div>太陽光発電協会「表示ガイドライン（2026年度）」</div><div>気象庁「過去の気象データ検索（平年値）」</div>
        <div>European Commission JRC「PVGIS」</div><div>環境省「令和5年度 家庭部門のCO2排出実態統計調査」</div>
        <div>経済産業省「FIT・FIP制度 2026年度以降の買取価格等」</div><div>調達価格等算定委員会「令和8年度以降の調達価格等に関する意見」</div>
        <div>全国家庭電気製品公正取引協議会「電力料金目安単価」</div><div>JIS C 8907 ／ JIS C 9612 ／ JIS C 9220</div>
      </div></div>
      <div class="contact"><div><div class="co">${esc(st.company || 'ご提案者')}</div><div class="who">${[cust.staff || st.staff ? '担当　' + esc(cust.staff || st.staff) : '', st.phone ? 'TEL　' + esc(st.phone) : '', st.email ? 'MAIL　' + esc(st.email) : ''].filter(Boolean).join('<br>')}</div></div>
        <div style="text-align:right"><span class="brand"><span class="mark"></span></span><div class="who">${dateJa(cust.date)}</div></div></div>
      ${foot(ctx, 6, total)}</section>`);
    return pages.join('');
  }

  root.Proposal = { render, coverArt, STAT_BY_PERSONS, panelName, dateJa };
})(typeof window !== 'undefined' ? window : globalThis);
