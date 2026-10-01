/* 画面制御：入力 ⇄ 状態 ⇄ 計算 ⇄ 結果表示 */
(function () {
  'use strict';
  const E = window.SolarEngine, C = window.SOLAR_CATALOG, CL = window.SOLAR_CLIMATE, Ch = window.Charts;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const LS_CUR = 'solar-sizer-current', LS_CASES = 'solar-sizer-cases';
  const COLORS = { gen: '#e8890c', load: '#2563c9', imp: '#c8433a', exp: '#f2b552', self: '#1f9d6b', net: '#1f9d6b', suff: '#2563c9', selfr: '#7a4cc2', bat: '#7a4cc2' };
  const GROUP_COLORS = { 生活: '#8aa1b8', 空調: '#2563c9', 給湯: '#e05d4f', 調理: '#d99a1e', 家事: '#7a9e3e', EV: '#7a4cc2' };
  // 環境省「令和5年度 家庭部門のCO2排出実態統計調査」世帯人数別 電気のCO2排出量[t] ÷ 0.427（全国 1.67t ↔ 3,911kWh）
  const STAT_BY_PERSONS = [2412, 3934, 5105, 5831, 6604, 8852];

  const f0 = (v) => (v == null || !isFinite(v) ? '—' : Math.round(v).toLocaleString('ja-JP'));
  const f1 = (v) => (v == null || !isFinite(v) ? '—' : (Math.round(v * 10) / 10).toLocaleString('ja-JP', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  const f2 = (v) => (v == null || !isFinite(v) ? '—' : v.toFixed(2));
  const pct = (v) => (v == null || !isFinite(v) ? '—' : Math.round(v * 100) + '%');
  const man = (yen) => (yen == null || !isFinite(yen) ? '—' : (Math.round(yen / 1000) / 10).toLocaleString('ja-JP', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ------------------------------------------------------------ 既定値 ---
  function defaults() {
    const panel = C.panels.find((p) => p.id === 'gen-topcon-430');
    const s = {
      customer: { name: '' },
      location: { pref: '東京都', station: '東京' },
      house: { persons: 4, lifestyle: 'dual', remoteWorkers: 0, floorTsubo: 35, floors: 2, insulation: 'g5' },
      calibration: { enabled: false, annualKwh: 0 },
      roofShape: { type: 'kirizuma', mainDir: 'S', slopeSun: 4 },
      roof: [], roofManual: false, allowNorth: false,
      panelId: panel.id,
      panel: { watt: panel.watt, l: panel.l, w: panel.w, tc: panel.tc },
      generation: { method: 'jpea', pcsEffPct: 96, otherLossPct: 95, snowLoss: 0, pcsKw: 0 },
      ac: {
        central: false,
        units: [
          { name: 'LDK', tatami: 18, count: 1, pattern: 'day', season: 'both', pet: false },
          { name: '主寝室', tatami: 8, count: 1, pattern: 'evening', season: 'both', pet: false },
          { name: '子ども部屋', tatami: 6, count: 2, pattern: 'evening', season: 'both', pet: false },
        ],
      },
      waterHeater: 'ecocute', cooker: 'ih',
      extras: { dishwasher: true, dryer: 'none', dryerPerWeek: 4, bathDryerPerWeek: 0, floorHeating: 'none', floorHeatingM2: 15, otherKwhMonth: 0 },
      ev: { enabled: false, preset: 'compact', batteryKwh: 40, kmPerKwh: 6.5, kmPerYear: 8000, homeChargePct: 100, homeDaysPerWeek: 2, v2h: false, reservePct: 30, solarCharge: true },
      battery: { enabled: false, kwh: 7, kw: 3, roundTrip: 90 },
      disaster: { items: C.essentials.filter((e) => e.on).map((e) => e.id), priority: false },
      tariff: Object.assign({ type: 'flat' }, C.tariffDefaults),
      fit: Object.assign({}, C.fitDefaults),
      cost: Object.assign({}, C.costDefaults),
      goal: 'econ',
    };
    s.roof = E.estimateRoof(s);
    return s;
  }

  let state = load(LS_CUR) || defaults();
  state = mergeDefaults(state, defaults());

  function mergeDefaults(s, d) {
    for (const k of Object.keys(d)) {
      if (s[k] == null) s[k] = d[k];
      else if (typeof d[k] === 'object' && !Array.isArray(d[k]) && d[k] !== null) mergeDefaults(s[k], d[k]);
    }
    return s;
  }
  function load(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
  function store(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* 保存できない環境 */ } }

  // ------------------------------------------------------- パス操作 ---
  const getP = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  const setP = (o, path, v) => { const ks = path.split('.'); const last = ks.pop(); const t = ks.reduce((a, k) => (a[k] = a[k] || {}), o); t[last] = v; };

  // ------------------------------------------------------ 選択肢生成 ---
  const opt = (v, label, sel) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(label)}</option>`;
  function fillStaticOptions() {
    const prefs = [];
    for (const [name, s] of Object.entries(CL.stations)) if (!prefs.includes(s.pref)) prefs.push(s.pref);
    $('#selPref').innerHTML = prefs.map((p) => opt(p, p)).join('');
    $('#selLifestyle').innerHTML = C.lifestyles.map((x) => opt(x.id, x.label)).join('');
    $('#selInsulation').innerHTML = C.insulation.map((x) => opt(x.id, x.label)).join('');
    $('#selMainDir').innerHTML = E.DIRS.map((d) => opt(d, E.DIR_LABEL[d])).join('');
    $('#selWater').innerHTML = C.waterHeaters.map((x) => opt(x.id, x.label)).join('');
    $('#selCooker').innerHTML = C.cookers.map((x) => opt(x.id, x.label)).join('');
    $('#selDryer').innerHTML = C.dryers.map((x) => opt(x.id, x.label)).join('');
    $('#selFloorHeat').innerHTML = C.floorHeating.map((x) => opt(x.id, x.label)).join('');
    $('#selEvPreset').innerHTML = C.evPresets.map((x) => opt(x.id, x.label)).join('');
    const makers = [...new Set(C.panels.map((p) => p.maker))];
    $('#selPanel').innerHTML = makers.map((m) => `<optgroup label="${esc(m)}">` +
      C.panels.filter((p) => p.maker === m).map((p) => opt(p.id, `${p.model}（${p.watt}W）`)).join('') + '</optgroup>').join('') +
      opt('custom', '手入力（その他メーカー）');
  }
  function fillStations() {
    const pref = state.location.pref;
    const list = Object.entries(CL.stations).filter(([, s]) => s.pref === pref);
    $('#selStation').innerHTML = list.map(([n, s]) => opt(n, `${n}${s.src.startsWith('推計') ? '（推計）' : ''}`)).join('');
  }

  // ------------------------------------------------------ 入力の反映 ---
  function writeInputs() {
    $('#selPref').value = state.location.pref;
    fillStations();
    $$('[data-k]').forEach((el) => {
      const v = getP(state, el.dataset.k);
      if (el.type === 'checkbox') el.checked = !!v;
      else el.value = v == null ? '' : v;
    });
    $('#chkPet').checked = state.ac.units.some((u) => u.pet);
    renderFaces(); renderAc(); renderEssentials(); updateVisibility(); updatePanelNote();
    $('#caseList').innerHTML = opt('', '— 保存済み —') + Object.keys(load(LS_CASES) || {}).map((k) => opt(k, k)).join('');
  }

  function readInput(el) {
    let v;
    if (el.type === 'checkbox') v = el.checked;
    else if (el.type === 'number' || el.hasAttribute('data-num')) v = el.value === '' ? 0 : +el.value;
    else v = el.value;
    return v;
  }

  function updateVisibility() {
    $$('[data-show]').forEach((el) => {
      const cond = el.dataset.show;
      let show;
      if (cond.includes('=')) { const [k, val] = cond.split('='); show = String(getP(state, k)) === val; }
      else show = !!getP(state, cond);
      el.dataset.hidden = show ? '0' : '1';
    });
  }

  function updatePanelNote() {
    const p = C.panels.find((x) => x.id === state.panelId);
    $('#panelNote').textContent = p
      ? `${p.note}。1枚 ${E.panelArea(p).toFixed(2)}㎡、${(p.watt / E.panelArea(p) / 10).toFixed(1)}%相当。${p.tcAssumed ? '温度係数は一般的な値（要カタログ確認）。' : ''}`
      : '手入力の機種です。カタログの公称最大出力・外形寸法・温度係数を入力してください。';
  }

  // 屋根面テーブル
  function renderFaces() {
    const panel = state.panel;
    const rows = state.roof.map((f, i) => {
      const max = E.faceMaxPanels(f, panel);
      return `<tr data-i="${i}">
        <td><input type="checkbox" data-f="enabled" ${f.enabled !== false ? 'checked' : ''}></td>
        <td><select data-f="dir">${E.DIRS.map((d) => opt(d, E.DIR_LABEL[d], d === f.dir)).join('')}</select></td>
        <td><input type="number" step="0.5" min="0" max="7" data-f="slopeSun" value="${f.slopeSun}"></td>
        <td><input type="number" step="0.5" min="0" data-f="areaM2" value="${f.areaM2}"></td>
        <td><input type="number" step="5" min="10" max="100" data-f="usablePct" value="${f.usablePct}"></td>
        <td><input type="number" step="5" min="0" max="90" data-f="shading" value="${f.shading || 0}"></td>
        <td><input type="number" step="1" min="0" data-f="maxPanels" value="${f.maxPanels == null ? '' : f.maxPanels}" placeholder="自動"></td>
        <td class="num-out">${max}枚<br>${f2(max * panel.watt / 1000)}kW</td>
        <td><button type="button" class="icon" data-del-face="${i}" title="削除">×</button></td></tr>`;
    }).join('');
    $('#tblFaces').innerHTML = `<thead><tr><th></th><th>向き</th><th>勾配<br>(寸)</th><th>面積<br>(㎡)</th><th>有効率<br>(%)</th><th>影<br>(%)</th><th>最大枚数<br>(上書き)</th><th>載る量</th><th></th></tr></thead><tbody>${rows}</tbody>
      <tfoot><tr><td colspan="9"><button type="button" class="ghost small" id="btnAddFace">＋ 屋根面を追加</button></td></tr></tfoot>`;
  }

  // エアコンテーブル
  function renderAc() {
    const rows = state.ac.units.map((u, i) => `<tr data-i="${i}">
      <td><input data-a="name" value="${esc(u.name)}" placeholder="部屋名"></td>
      <td><select data-a="tatami">${C.acSizes.map((s) => opt(s.tatami, s.tatami + '畳', +u.tatami === s.tatami)).join('')}</select></td>
      <td><input type="number" min="1" max="9" data-a="count" value="${u.count}"></td>
      <td><select data-a="pattern">${C.acPatterns.map((p) => opt(p.id, p.short, u.pattern === p.id)).join('')}</select></td>
      <td><select data-a="season">${C.acSeasons.map((p) => opt(p.id, p.short, u.season === p.id)).join('')}</select></td>
      <td title="ペット用"><input type="checkbox" data-a="pet" ${u.pet ? 'checked' : ''}></td>
      <td><button type="button" class="icon" data-del-ac="${i}" title="削除">×</button></td></tr>`).join('');
    $('#tblAc').innerHTML = `<thead><tr><th>部屋</th><th>能力</th><th>台数</th><th>運転時間</th><th>季節</th><th>🐾</th><th></th></tr></thead><tbody>${rows}</tbody>`;
  }

  function renderEssentials(petKwh) {
    $('#essentials').innerHTML = C.essentials.map((e) => {
      const kwh = e.dynamic === 'petac' ? (petKwh != null ? f1(petKwh) : '自動') : e.kwh;
      return `<label class="check"><input type="checkbox" data-ess="${e.id}" ${state.disaster.items.includes(e.id) ? 'checked' : ''}>${esc(e.label)}<span class="hint" style="margin:0">（${kwh}kWh/日）</span></label>`;
    }).join('');
  }

  // ------------------------------------------------------ イベント ---
  function onChange(e) {
    const el = e.target;
    if (el.dataset.k) {
      const k = el.dataset.k;
      setP(state, k, readInput(el));
      if (k === 'panelId') {
        const p = C.panels.find((x) => x.id === state.panelId);
        if (p) state.panel = { watt: p.watt, l: p.l, w: p.w, tc: p.tc };
        writeInputs();
      } else if (k.startsWith('panel.')) {
        if (state.panelId !== 'custom') { state.panelId = 'custom'; $('#selPanel').value = 'custom'; updatePanelNote(); }
        renderFaces();
      } else if (k === 'ev.preset') {
        const p = C.evPresets.find((x) => x.id === state.ev.preset);
        if (p) { state.ev.batteryKwh = p.kwh; state.ev.kmPerKwh = p.kmPerKwh; }
        writeInputs();
      } else if (/^(roofShape\.|house\.floorTsubo|house\.floors)/.test(k) && !state.roofManual) {
        state.roof = E.estimateRoof(state); renderFaces();
      }
      if (k === 'location.station') state.location.pref = CL.stations[state.location.station].pref;
      updateVisibility();
    } else if (el.id === 'selPref') {
      state.location.pref = el.value;
      fillStations();
      state.location.station = $('#selStation').value;
    } else if (el.dataset.f) {
      const i = +el.closest('tr').dataset.i, f = el.dataset.f;
      let v = el.type === 'checkbox' ? el.checked : el.tagName === 'SELECT' ? el.value : el.value === '' ? null : +el.value;
      if (f === 'maxPanels') v = el.value === '' ? null : +el.value;
      state.roof[i][f] = v;
      state.roofManual = true;
      if (e.type === 'change') renderFaces();
    } else if (el.dataset.a) {
      const i = +el.closest('tr').dataset.i, a = el.dataset.a;
      state.ac.units[i][a] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? +el.value : (a === 'tatami' ? +el.value : el.value);
      if (a === 'pet' && el.checked) state.ac.units[i].pattern = '24h';
      if (a === 'pet') { $('#chkPet').checked = state.ac.units.some((u) => u.pet); if (e.type === 'change') renderAc(); }
    } else if (el.dataset.ess) {
      const id = el.dataset.ess;
      state.disaster.items = el.checked ? [...new Set([...state.disaster.items, id])] : state.disaster.items.filter((x) => x !== id);
    } else if (el.id === 'chkPet') {
      if (el.checked) {
        if (!state.ac.units.length) state.ac.units.push({ name: 'LDK', tatami: 14, count: 1, pattern: '24h', season: 'both', pet: true });
        state.ac.units[0].pet = true; state.ac.units[0].pattern = '24h';
        if (!state.disaster.items.includes('petac')) state.disaster.items.push('petac');
      } else {
        state.ac.units.forEach((u) => { if (u.pet) { u.pet = false; u.pattern = 'day'; } });
        state.disaster.items = state.disaster.items.filter((x) => x !== 'petac');
      }
      renderAc(); renderEssentials();
    } else return;
    schedule();
  }

  function onClick(e) {
    const t = e.target;
    if (t.id === 'btnRoofAuto') { state.roofManual = false; state.roof = E.estimateRoof(state); renderFaces(); schedule(); }
    else if (t.id === 'btnAddFace') { state.roof.push({ dir: 'S', slopeSun: 4, areaM2: 20, usablePct: 75, shading: 0, maxPanels: null, enabled: true }); state.roofManual = true; renderFaces(); schedule(); }
    else if (t.dataset.delFace != null) { state.roof.splice(+t.dataset.delFace, 1); state.roofManual = true; renderFaces(); schedule(); }
    else if (t.id === 'btnAddAc') { state.ac.units.push({ name: '洋室', tatami: 6, count: 1, pattern: 'evening', season: 'both', pet: false }); renderAc(); schedule(); }
    else if (t.dataset.delAc != null) { state.ac.units.splice(+t.dataset.delAc, 1); renderAc(); schedule(); }
  }

  let timer = null;
  function schedule() { clearTimeout(timer); timer = setTimeout(run, 200); store(LS_CUR, state); }

  // ------------------------------------------------- 計算パラメータ ---
  function toEngine(s) {
    const p = JSON.parse(JSON.stringify(s));
    p.generation = {
      method: s.generation.method,
      mount: s.roofShape.type === 'rikuyane' ? 'rack' : 'roof',
      tempCoef: s.panel.tc,
      pcsEff: (s.generation.pcsEffPct || 96) / 100,
      otherLoss: (s.generation.otherLossPct || 95) / 100,
      snowLoss: s.generation.snowLoss || 0,
      pcsKw: s.generation.pcsKw || 0,
    };
    p.fit = Object.assign({}, C.fitDefaults, s.fit);
    return p;
  }

  // ------------------------------------------------------- 計算実行 ---
  let last = null;
  function run() {
    const out = $('#out');
    try {
      const p = toEngine(state);
      const t0 = performance.now();
      const a = E.analyze(p);
      a.ms = performance.now() - t0;
      // 蓄電池・V2H の効果比較用（同じ容量で蓄電池・V2Hなし）
      if (a.rec && ((p.battery && p.battery.enabled) || (p.ev && p.ev.enabled && p.ev.v2h))) {
        const q = JSON.parse(JSON.stringify(p)); q.battery.enabled = false; q.ev.v2h = false;
        const pr = E.prepare(q);
        a.noStorage = E.simulate(pr, q, a.rec.counts.map((c) => c * p.panel.watt / 1000));
      }
      last = { p, a };
      out.innerHTML = renderResults(p, a);
      const pet = a.crit.essential && a.crit.essential.items.find((x) => x.id === 'petac');
      renderEssentials(pet ? pet.kwh : null);
    } catch (err) {
      console.error(err);
      out.innerHTML = `<div class="card warn">計算でエラーが発生しました：${esc(err.message)}</div>`;
    }
  }

  // ------------------------------------------------------- 結果表示 ---
  function renderResults(p, a) {
    const st = a.prep.st, stName = p.location.station;
    const panelKw = p.panel.watt / 1000;
    if (!a.cases.length) {
      return `<div class="card warn">屋根に載せられるパネルがありません。屋根面（面積・有効率・最大枚数・向き）を確認してください。</div>`;
    }
    const rec = a.rec, R = a.recDetail.sim, eco = a.recDetail.eco, crit = a.crit;
    const goalLabel = { econ: '経済性重視', netzero: '自給重視（ネットゼロ）', max: '屋根いっぱい' }[a.goal];
    const yearsN = eco.years;
    const evLoad = R.evPv + R.evGrid;
    const totalLoad = R.load;
    const co2 = R.gen * (C.co2.grid - C.co2.pv) / 1000;

    // 南30°相当の地域の基準発電量
    const refFace = { dir: 'S', slopeSun: 5.8, shading: 0 };
    const refYield = E.monthlyYieldPerKw(st, refFace, p.generation).annual;
    const hSum = st.H.reduce((s, v, m) => s + v * E.DAYS[m], 0);

    let html = '';
    html += `<div class="print-only print-head"><div><h1>太陽光発電 適正容量のご提案</h1><div>${esc(p.customer.name || '')}</div></div><div>${new Date().toLocaleDateString('ja-JP')}</div></div>`;

    // ---- ヒーロー
    html += `<div class="card hero">
      <div class="big">
        <div class="lbl">${esc(p.customer.name ? p.customer.name + 'に' : '')}おすすめの容量</div>
        <div class="kw">${f2(rec.kw)}<span>kW</span></div>
        <div class="sub2">${esc(p.panelId === 'custom' ? '手入力パネル' : (C.panels.find((x) => x.id === p.panelId) || {}).model || '')}<br>${p.panel.watt}W × ${rec.n}枚</div>
        <div class="goal">${goalLabel}${p.disaster.priority ? '＋停電対策' : ''}</div>
      </div>
      <div class="kpis">
        ${kpi('年間発電量', f0(R.gen), 'kWh', `1kWあたり ${f0(R.gen / rec.kw)}kWh`)}
        ${kpi('年間消費量（推計）', f0(totalLoad), 'kWh', evLoad > 0 ? `うちEV充電 ${f0(evLoad)}kWh` : `全国同人数平均 ${f0(STAT_BY_PERSONS[p.house.persons - 1])}kWh`)}
        ${kpi('自給率', pct(R.sufficiency), '', '消費のうち買わずに済む割合')}
        ${kpi('自家消費率', pct(R.selfRate), '', '発電のうち家で使う割合')}
        ${kpi('年間メリット（1年目）', man(eco.year1), '万円', `電気代削減 ${man(R.saving)}万＋売電 ${man(R.exp * eco.flows[0].sellPrice)}万`)}
        ${kpi('投資回収', eco.payback != null ? f1(eco.payback) : `${yearsN}年超`, eco.payback != null ? '年' : '', `導入費 ${man(eco.capex)}万円（太陽光）`)}
        ${kpi(`${yearsN}年間の累計収支`, man(eco.net), '万円', '導入費を差し引いた手残り')}
        ${kpi('CO₂削減', f1(co2), 't/年', `杉の木 約${f0(co2 * 1000 / 8.8)}本分`)}
      </div></div>`;

    // ---- 根拠
    const cards = [];
    const mk = (key, title, c, color, desc, extra) => cards.push(`<div class="crit ${rec && c && c.n === rec.n && key === a.goalKey ? 'on' : ''}">
      ${c && rec.n === c.n ? '<span class="tag">採用</span>' : ''}
      <div class="t"><i style="background:${color}"></i>${title}</div>
      <div class="v">${c ? f2(c.kw) : '—'}<small> kW${c ? `（${c.n}枚）` : ''}</small></div>
      <div class="d">${desc}${extra || ''}</div></div>`);
    a.goalKey = a.goal;
    mk('econ', `${yearsN}年収支が最大`, crit.econ, COLORS.net, `累計 ${man(crit.econ.eco.net)}万円`, crit.econRange ? `<br>最大の95%以上：${f2(crit.econRange[0].kw)}〜${f2(crit.econRange[1].kw)}kW` : '');
    mk('netzero', '年間ネットゼロ（発電≧消費）', crit.netZero, COLORS.load, crit.netZero ? `年間消費 ${f0(a.consumption)}kWh を賄う` : `屋根上限でも消費の ${pct(crit.roofMax.sim.gen / a.consumption)} まで`);
    mk('max', '屋根に載る上限', crit.roofMax, '#6b7787', `${a.prep.faces.filter((f) => f.maxPanels > 0).length}面・最大${a.maxPanels}枚`);
    mk('disaster', '停電対策ライン', crit.disaster, COLORS.imp, `冬の曇天日に ${f1(crit.essential.total)}kWh/日 を発電`);

    html += `<div class="card"><h2>この容量をおすすめする根拠 <small>容量を1枚ずつ変えて ${a.cases.length}通りを計算（${Math.round(a.ms)}ms）</small></h2>
      <div class="criteria">${cards.join('')}</div>
      ${Ch.line(capacityChart(a, p))}
      <ol class="reasons">${reasons(p, a, refYield, hSum).map((r) => `<li>${r}</li>`).join('')}</ol>
      <div class="conclusion">${conclusion(p, a)}</div>
      ${eco.warnSelf30 ? `<div class="warn">10kW以上（パワコン容量も10kW以上）は FIT の地域活用要件で「自家消費率30%以上」が必要です。現在の自家消費率は ${pct(R.selfRate)} です。パワコンを9.9kWにする（過積載）などをご検討ください。</div>` : ''}
      ${R.clip > R.gen * 0.005 ? `<div class="note">※ パワコン容量 ${f1(R.pcsKw)}kW を超える分（年間約${f0(R.clip)}kWh）はピークカットとして差し引いています。</div>` : ''}
    </div>`;

    // ---- 月別・代表日
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    html += `<div class="two">
      <div class="card"><h2>月別の発電量と消費量 <small>${f2(rec.kw)}kW の場合</small></h2>
      ${Ch.bars({ categories: months, width: 520, height: 300, fmtY: (v) => f0(v), yLabel: 'kWh',
        series: [{ name: '発電量', values: R.monthly.gen, color: COLORS.gen }, { name: '消費量', values: R.monthly.load, color: COLORS.load }],
        lines: [{ name: '買電量', values: R.monthly.imp, color: COLORS.imp }] })}
      <p class="note">冬は発電が減り空調・給湯が増えるため買電が多くなります。夏は発電が消費を大きく上回り、余りは売電（または蓄電池・EVへ充電）になります。</p></div>
      <div class="card"><h2>晴れの日の1日の流れ <small>${f2(rec.kw)}kW・8月と1月</small></h2>
      ${dayChart(a.recDetail.sim.trace[a.recDetail.traceDays[0]], '8月の晴れの日')}
      ${dayChart(a.recDetail.sim.trace[a.recDetail.traceDays[1]], '1月の晴れの日')}
      </div></div>`;

    // ---- 消費の内訳
    const loads = a.prep.lb.loads.map((l) => ({ label: l.label, value: l.annual, color: GROUP_COLORS[l.group] || '#999', group: l.group }));
    if (evLoad > 0) loads.push({ label: 'EV 自宅充電', value: evLoad, color: GROUP_COLORS.EV, group: 'EV' });
    loads.sort((x, y) => y.value - x.value);
    const stat = STAT_BY_PERSONS[p.house.persons - 1];
    html += `<div class="two" style="margin-top:14px">
      <div class="card"><h2>電気の使い道（推計） <small>年間 ${f0(totalLoad)} kWh</small></h2>
      ${Ch.hbars(loads, (v) => f0(v) + ' kWh')}
      <p class="note">参考：同じ${p.house.persons}${p.house.persons >= 6 ? '人以上' : '人'}世帯の全国平均 約${f0(stat)}kWh/年（環境省 家庭CO2統計 R5 から換算、ガス併用世帯を含む）／戸建平均 約4,917kWh/年。
      ${a.prep.lb.calib !== 1 ? `<br>※ 実績 ${f0(p.calibration.annualKwh)}kWh に合わせ、モデル値 ${f0(a.prep.lb.modelTotal)}kWh を ×${a.prep.lb.calib.toFixed(2)} 補正しています。` : ''}</p></div>
      ${roofCard(p, a)}
    </div>`;

    // ---- 停電対策・蓄電
    html += outageCard(p, a);

    // ---- 容量別一覧
    html += casesTable(p, a);

    // ---- 前提と出典
    html += assumptions(p, a, refYield, hSum);
    return html;
  }

  function kpi(k, v, unit, d) {
    return `<div class="kpi"><div class="k">${k}</div><div class="v">${v}<small>${unit}</small></div><div class="d">${d}</div></div>`;
  }

  function capacityChart(a, p) {
    const cs = a.cases;
    const markers = [];
    const add = (c, label, color, row) => c && markers.push({ x: c.kw, label, color, row });
    add(a.rec, '推奨 ' + f2(a.rec.kw) + 'kW', '#e8890c', 0);
    if (a.crit.netZero && a.crit.netZero.n !== a.rec.n) add(a.crit.netZero, 'ネットゼロ', COLORS.load, 1);
    if (a.crit.econ.n !== a.rec.n) add(a.crit.econ, '収支最大', COLORS.net, 2);
    if (p.disaster.priority && a.crit.disaster.n !== a.rec.n) add(a.crit.disaster, '停電対策', COLORS.imp, 3);
    markers[0].width = 2.5; markers[0].dash = '0';
    const idx = cs.indexOf(a.rec);
    return {
      x: cs.map((c) => c.kw), xMin: 0, height: 320, xLabel: '搭載容量 kW', yLabel: '累計収支 万円', y2Label: '%',
      fmtX: (v) => v + 'kW', fmtY: (v) => f0(v), fmtY2: (v) => v + '%', y2Max: 100,
      series: [
        { name: `${a.recDetail.eco.years}年累計収支（万円）`, values: cs.map((c) => c.eco.net / 10000), color: COLORS.net, highlight: idx },
        { name: '自給率', values: cs.map((c) => c.sim.sufficiency * 100), color: COLORS.suff, axis: 'right', width: 2 },
        { name: '自家消費率', values: cs.map((c) => c.sim.selfRate * 100), color: COLORS.selfr, axis: 'right', dash: true, width: 2 },
      ],
      markers,
    };
  }

  function dayChart(tr, title) {
    if (!tr) return '';
    const hrs = tr.map((r) => r.h);
    const cons = tr.map((r) => r.L + r.evPv + r.evGrid);
    const store = tr.map((r) => r.batD + r.v2hD);
    const series = [
      { name: '発電', values: tr.map((r) => r.g), color: COLORS.gen, type: 'area', opacity: 0.35 },
      { name: '消費', values: cons, color: COLORS.load },
      { name: '買電', values: tr.map((r) => r.imp), color: COLORS.imp, dash: true, width: 2 },
    ];
    if (store.some((v) => v > 0.01)) series.push({ name: '蓄電池/V2H放電', values: store, color: COLORS.bat, width: 2 });
    return `<div class="note" style="margin-top:4px">${title}</div>` + Ch.line({
      x: hrs, width: 520, height: 230, fmtX: (v) => v + '時', fmtY: (v) => f1(v), yLabel: 'kW', xTicks: [0, 3, 6, 9, 12, 15, 18, 21],
      series,
    });
  }

  function roofCard(p, a) {
    const panelKw = p.panel.watt / 1000;
    const rows = a.prep.faces.map((f, i) => {
      const n = a.rec.counts[i] || 0;
      return `<tr><td>${E.DIR_LABEL[f.face.dir]}・${f.face.slopeSun}寸</td><td>${f0(f.face.areaM2)}㎡</td><td>${f.maxPanels}枚</td><td><b>${n}枚</b></td><td>${f2(n * panelKw)}</td><td>${f0(f.yield.annual)}</td><td>${f0(n * panelKw * f.yield.annual)}</td></tr>`;
    }).join('');
    const best = Math.max(...a.prep.faces.map((f) => f.yield.annual));
    const yieldRel = a.prep.faces.map((f) => `${E.DIR_LABEL[f.face.dir]} ${pct(f.yield.annual / best)}`).join('・');
    return `<div class="card"><h2>屋根への割り付け <small>${f2(a.rec.kw)}kW</small></h2>
      <div class="table-wrap"><table class="data"><thead><tr><th>屋根面</th><th>面積</th><th>上限</th><th>採用</th><th>kW</th><th>kWh/kW年</th><th>年間kWh</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="note">発電量の多い面から順に載せています（面ごとの発電効率：${yieldRel}）。${p.allowNorth ? '' : '北向きの面は既定で対象外です。'}影・積雪・出力制御の影響は入力値以外考慮していません。</p></div>`;
  }

  function outageCard(p, a) {
    const o = E.outageEstimate(p, a);
    const ess = a.crit.essential;
    const R = a.recDetail.sim;
    const winterDay = a.crit.disasterWinterGen(a.rec);
    const items = ess.items.map((i) => `${i.label} ${f1(i.kwh)}`).join('、');
    let storeTxt;
    if (o.selfStandOnly) {
      storeTxt = `<div class="warn">蓄電池・V2H がないため、停電時は昼間にパワコンの<b>自立運転コンセント（最大1.5kVA）</b>からのみ電気を使えます。夜間や冷蔵庫の連続運転、ペット用エアコンの24時間運転には<b>蓄電池または V2H</b> が必要です。</div>`;
    } else {
      storeTxt = `<div class="ok">停電時に使える蓄電量 約${f1(o.storage)}kWh（${o.battery ? `蓄電池 ${f1(o.battery)}kWh` : ''}${o.battery && o.ev ? '＋' : ''}${o.ev ? `EV ${f1(o.ev)}kWh（80%・効率90%）` : ''}）→ 太陽が出なくても約 <b>${f1(o.daysNoSun)}日分</b>。晴れた日は太陽光で再充電でき、長期停電でも生活を続けやすくなります。</div>`;
    }
    let storageEffect = '';
    if (a.noStorage) {
      const n = a.noStorage;
      storageEffect = `<p class="note">蓄電池・V2H の平常時効果（同じ ${f2(a.rec.kw)}kW で比較）：自家消費率 ${pct(n.selfRate)} → <b>${pct(R.selfRate)}</b>、自給率 ${pct(n.sufficiency)} → <b>${pct(R.sufficiency)}</b>、年間メリット ＋${man((R.saving - n.saving) - (n.exp - R.exp) * 8.3)}万円程度（売電単価8.3円換算）。</p>`;
    }
    return `<div class="card"><h2>停電・災害への備え <small>必要量 ${f1(ess.total)} kWh/日</small></h2>
      <p class="note">想定する機器：${esc(items)}（kWh/日）</p>
      <p>冬（12月）の曇りの日でも ${f2(a.rec.kw)}kW なら日中に約 <b>${f1(winterDay)}kWh</b> 発電 → 必要量の ${pct(winterDay / Math.max(0.1, ess.total))}。
      停電対策ラインは <b>${f2(a.crit.disaster.kw)}kW</b> です。</p>
      ${storeTxt}${storageEffect}</div>`;
  }

  function casesTable(p, a) {
    const cs = a.cases;
    const step = Math.max(1, Math.round(cs.length / 14));
    const keep = new Set([a.rec.n, a.crit.econ.n, a.crit.roofMax.n, a.crit.disaster.n].concat(a.crit.netZero ? [a.crit.netZero.n] : []));
    const marks = {};
    const addMark = (c, m) => { if (c) marks[c.n] = (marks[c.n] ? marks[c.n] + '・' : '') + m; };
    addMark(a.rec, '推奨'); addMark(a.crit.econ, '収支最大'); addMark(a.crit.netZero, 'ネットゼロ'); addMark(a.crit.roofMax, '屋根上限');
    if (p.disaster.priority) addMark(a.crit.disaster, '停電対策');
    const rows = cs.filter((c) => c.n % step === 0 || keep.has(c.n)).map((c) => `<tr class="${c.n === a.rec.n ? 'rec' : ''}">
      <td>${f2(c.kw)}kW（${c.n}枚）${marks[c.n] ? `<span class="mk-tag">${esc(marks[c.n])}</span>` : ''}</td><td>${f0(c.sim.gen)}</td><td>${pct(c.sim.selfRate)}</td><td>${pct(c.sim.sufficiency)}</td>
      <td>${f0(c.sim.imp)}</td><td>${f0(c.sim.exp)}</td><td>${man(c.eco.year1)}</td><td>${man(c.eco.capex)}</td>
      <td>${c.eco.payback != null ? f1(c.eco.payback) : '—'}</td><td class="${c.eco.net < 0 ? 'neg' : 'pos'}">${man(c.eco.net)}</td></tr>`).join('');
    return `<div class="card"><h2>容量別の比較表 <small>年間値は1年目・金額は万円</small></h2>
      <div class="table-wrap"><table class="data"><thead><tr><th>容量</th><th>発電kWh</th><th>自家消費率</th><th>自給率</th><th>買電kWh</th><th>売電kWh</th><th>年間メリット</th><th>導入費</th><th>回収年</th><th>${a.recDetail.eco.years}年収支</th></tr></thead>
      <tbody>${rows}</tbody></table></div>
      <p class="note">年間メリット＝電気代削減額＋売電収入（1年目）。累計収支は電気代上昇率 ${p.tariff.escalation}%/年・劣化 ${p.cost.degradation}%/年・FIT単価の切り替わりを反映。</p></div>`;
  }

  function reasons(p, a, refYield, hSum) {
    const R = a.recDetail.sim, crit = a.crit, st = a.prep.st;
    const loads = a.prep.lb.loads;
    const total = R.load;
    const out = [];
    // 1. 消費量
    const groups = {};
    loads.forEach((l) => (groups[l.group] = (groups[l.group] || 0) + l.annual));
    const evLoad = R.evPv + R.evGrid;
    if (evLoad) groups.EV = evLoad;
    const top = Object.entries(groups).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([g, v]) => `${g} ${pct(v / total)}`).join('、');
    const stat = STAT_BY_PERSONS[p.house.persons - 1];
    out.push(`<b>ご家庭の電気の使用量</b>：設備と暮らし方から年間 <b>${f0(total)}kWh</b> と推計（${top}）。同じ人数の全国平均 約${f0(stat)}kWh の <b>${(total / stat).toFixed(1)}倍</b>です。`);
    const pet = loads.filter((l) => l.pet || l.pattern === '24h');
    if (pet.length) out.push(`<b>24時間空調</b>（${esc(pet.map((l) => l.label.replace(/（.*/, '')).join('・'))}）で年間 約${f0(pet.reduce((s, l) => s + l.annual, 0))}kWh。留守中も止められない電気なので、<b>昼間は太陽光</b>、夜間は${p.battery.enabled || (p.ev.enabled && p.ev.v2h) ? '蓄電池・V2H' : '蓄電池・V2H（導入すれば）'}で賄うと効果的です。`);
    if (evLoad) out.push(`<b>EV の自宅充電</b>は年間 約${f0(evLoad)}kWh。そのうち <b>${f0(R.evPv)}kWh（${pct(R.evPv / evLoad)}）</b>を太陽光の余剰でまかなえます（日中に車が家にある日：週${p.ev.homeDaysPerWeek}日${p.ev.v2h ? '、V2Hで夜間に家へ給電 ' + f0(R.v2hOut) + 'kWh' : ''}）。`);
    // 2. 日射
    out.push(`<b>${esc(p.location.station)}の日射量</b>：水平面で年間 ${f0(hSum)}kWh/㎡（${esc(st.src)}）。南向き30°なら 1kWあたり年間 <b>約${f0(refYield)}kWh</b> 発電します（${p.generation.method === 'jpea' ? 'JPEA表示ガイドラインの計算式' : 'JIS C 8907 の計算式'}、パワコン効率${f1(p.generation.pcsEff * 100)}%・その他損失${f1(p.generation.otherLoss * 100)}%）。`);
    // 3. 屋根
    out.push(`<b>屋根の上限</b>：${a.prep.faces.length}面のうち発電に適した面に最大 ${a.maxPanels}枚＝<b>${f2(crit.roofMax.kw)}kW</b> まで載せられます。`);
    // 4. 経済性
    const e = crit.econ;
    const next = a.cases.find((c) => c.kw >= e.kw + 1);
    let econTxt = `<b>経済性</b>：容量を変えながら${a.recDetail.eco.years}年間の収支を比べると <b>${f2(e.kw)}kW で最大（${man(e.eco.net)}万円）</b>。`;
    if (next) econTxt += `これ以上増やしても、増えた発電の多くは売電（5年目以降 ${p.fit.res2}円・卒FIT後 ${p.fit.after}円）となり、追加費用（${p.cost.pvPerKw}万円/kW）を回収しにくくなります（+1kW で累計 ${man(next.eco.net - e.eco.net)}万円）。`;
    else econTxt += `屋根の上限まで載せるほど収支が良くなります（増やした分の発電価値が追加費用を上回るため）。`;
    if (crit.econRange && crit.econRange[0].n !== crit.econRange[1].n) econTxt += ` 収支が最大の95%以上になるのは ${f2(crit.econRange[0].kw)}〜${f2(crit.econRange[1].kw)}kW の範囲です。`;
    out.push(econTxt);
    // 5. ネットゼロ
    out.push(crit.netZero
      ? `<b>自給</b>：年間の発電量が消費量（${f0(a.consumption)}kWh）を上回る「ネットゼロ」には <b>${f2(crit.netZero.kw)}kW</b> 必要です。`
      : `<b>自給</b>：屋根の上限まで載せても年間消費の ${pct(crit.roofMax.sim.gen / a.consumption)} の発電です。省エネ（断熱・機器効率）との組み合わせが有効です。`);
    // 6. 停電
    out.push(`<b>停電時</b>：最低限の生活に必要な ${f1(crit.essential.total)}kWh/日 を冬の曇りの日でも発電できる容量は <b>${f2(crit.disaster.kw)}kW</b> です${crit.disaster.n === crit.roofMax.n && a.crit.disasterWinterGen(crit.roofMax) < crit.essential.total ? '（屋根上限でも不足）' : ''}。`);
    return out;
  }

  function conclusion(p, a) {
    const rec = a.rec, R = a.recDetail.sim, eco = a.recDetail.eco;
    const why = { econ: `${eco.years}年間の収支が最も良く`, netzero: '年間の電気をすべて自宅の屋根でまかなえ', max: '屋根の発電ポテンシャルを最大限に活かせ' }[a.goal];
    return `以上から、<b>${f2(rec.kw)}kW（${p.panel.watt}W×${rec.n}枚）</b>をおすすめします。${why}、
      年間 約${f0(R.gen)}kWh を発電し、ご家庭の電気の <b>${pct(R.sufficiency)}</b> を自給、<b>${eco.payback != null ? '約' + f1(eco.payback) + '年で回収' : '評価期間内の回収は困難'}</b>、
      ${eco.years}年間で <b>${man(eco.net)}万円</b> の手残りが見込めます。`;
  }

  function assumptions(p, a, refYield) {
    const st = a.prep.st;
    const kh = E.khMonthly(st, p.generation).map((v) => v.toFixed(2)).join(' / ');
    return `<div class="card"><h2>計算の前提と出典</h2>
      <ul class="src">
        <li><b>発電量</b>：E[kWh/月] = 容量[kW] × 傾斜面日射量[kWh/㎡/月] × Kh × Kpcs × Kj（JPEA 表示ガイドライン2026 の計算式）。Kh（${p.generation.method === 'jpea' ? 'JPEA参考値' : 'JIS C 8907: 0.97×0.95×温度補正'}）= ${kh}、Kpcs = ${p.generation.pcsEff}、Kj = ${p.generation.otherLoss}。</li>
        <li><b>日射量</b>：${esc(p.location.station)}（${esc(st.src)}）。気象庁 平年値（1991〜2020年）の月平均全天日射量を、PVGIS（欧州委員会JRC、ERA5 2005〜2020年）で求めた月別の傾斜面/水平面比で屋根の向き・勾配に換算。</li>
        <li><b>天候のばらつき</b>：各月に晴・曇・雨の日（日射比 ${E.WEATHER.f.join(' : ')}、出現率 ${E.WEATHER.p.map((x) => x * 100 + '%').join(' / ')}）を混在させ、月合計は平年値に一致させています。蓄電池・EV の充放電を365日×24時間で計算。</li>
        <li><b>エアコン</b>：JIS C 9612 の期間消費電力量（東京・6〜24時運転）を基準に、運転時間・断熱等級・地域の気温（冷房：月平均20℃超、暖房：15℃未満の度日）で補正。</li>
        <li><b>給湯・家電</b>：エコキュートは (${C.ecocuteBase}+${C.ecocutePerPerson}×人数)kWh を水温（気温）で地域補正。照明・家電は人数別の代表値。全国平均は環境省「家庭部門のCO2排出実態統計調査」（令和5年度）。</li>
        <li><b>売電</b>：住宅用（10kW未満）1〜4年目 ${p.fit.res1}円、5〜10年目 ${p.fit.res2}円（2025年10月〜の初期投資支援スキーム）、卒FIT後 ${p.fit.after}円。10kW以上は ${p.fit.big1}円（1〜5年）→ ${p.fit.big2}円。</li>
        <li><b>費用</b>：太陽光 ${p.cost.pvFixed}万円＋${p.cost.pvPerKw}万円/kW（2025年 住宅用新築平均 28.9万円/kW 相当）。補助金・メンテナンス費・パワコン交換費は含みません。</li>
        <li><b>考慮していないもの</b>：周辺の建物・樹木の影（入力値を除く）、積雪（入力値を除く）、出力制御、停電、機器故障。実際の発電量・電気代は天候や使い方で変わります。</li>
      </ul></div>`;
  }

  // ------------------------------------------------- 保存・読込 ---
  function bindTop() {
    $('#btnSave').onclick = () => {
      const name = prompt('保存名（お客様名など）', state.customer.name || '');
      if (!name) return;
      const cases = load(LS_CASES) || {}; cases[name] = state; store(LS_CASES, cases); writeInputs(); $('#caseList').value = name;
    };
    $('#btnLoad').onclick = () => {
      const name = $('#caseList').value; if (!name) return;
      const cases = load(LS_CASES) || {}; if (!cases[name]) return;
      state = mergeDefaults(JSON.parse(JSON.stringify(cases[name])), defaults()); writeInputs(); schedule();
    };
    $('#btnNew').onclick = () => { if (confirm('入力内容を初期値に戻しますか？')) { state = defaults(); writeInputs(); schedule(); } };
    $('#btnExport').onclick = () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `太陽光シミュレーション_${state.customer.name || '無題'}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    };
    $('#fileImport').onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((t) => { state = mergeDefaults(JSON.parse(t), defaults()); writeInputs(); schedule(); }).catch((err) => alert('読み込めませんでした: ' + err.message));
      e.target.value = '';
    };
    $('#btnPrint').onclick = () => window.print();
  }

  // ------------------------------------------------------------ 起動 ---
  fillStaticOptions();
  writeInputs();
  const form = $('#form');
  form.addEventListener('input', onChange);
  form.addEventListener('change', onChange);
  form.addEventListener('click', onClick);
  bindTop();
  run();
  window.__solar = { get state() { return state; }, get last() { return last; }, run };
})();
