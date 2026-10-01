/* 画面制御：お客様一覧 → ヒアリング（6ステップ） → 提案書（PDF） */
(function () {
  'use strict';
  const E = window.SolarEngine, C = window.SOLAR_CATALOG, CL = window.SOLAR_CLIMATE, Ch = window.Charts, P = window.Proposal;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const Store = window.HikariStore;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ok = (v) => v != null && isFinite(v);
  const f0 = (v) => (ok(v) ? Math.round(v).toLocaleString('ja-JP') : '—');
  const f1 = (v) => (ok(v) ? (Math.round(v * 10) / 10).toFixed(1) : '—');
  const f2 = (v) => (ok(v) ? v.toFixed(2) : '—');
  const pct = (v) => (ok(v) ? Math.round(v * 100) + '%' : '—');
  const man = (y) => (ok(y) ? (Math.round(y / 1000) / 10).toFixed(1) : '—');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  // ------------------------------------------------------------ 保存 ---
  // お客様データと提案者情報は store.js（アーティファクトではデータベース、ローカルではブラウザ内）
  let customers = Store.customers;
  let settings = Store.settings;
  let loading = !!window.claude;

  function defaults() {
    const panel = C.panels.find((p) => p.id === 'gen-topcon-430');
    const s = {
      customer: { name: '', honorific: '様', address: '', date: today(), staff: settings.staff || '', memo: '' },
      location: { pref: '東京都', station: '東京' },
      house: { persons: 4, lifestyle: 'dual', remoteWorkers: 0, floorTsubo: 35, floors: 2, insulation: 'g5' },
      calibration: { enabled: false, annualKwh: 0 },
      roofShape: { type: 'kirizuma', mainDir: 'S', slopeSun: 4 },
      roof: [], roofManual: false, allowNorth: false,
      panelId: panel.id, panel: { watt: panel.watt, l: panel.l, w: panel.w, tc: panel.tc },
      generation: { method: 'jpea', pcsEffPct: 96, otherLossPct: 95, snowLoss: 0, pcsKw: 0 },
      ac: { central: false, units: [
        { name: 'LDK', tatami: 18, count: 1, pattern: 'day', season: 'both', pet: false },
        { name: '主寝室', tatami: 8, count: 1, pattern: 'evening', season: 'both', pet: false },
        { name: '子ども部屋', tatami: 6, count: 2, pattern: 'evening', season: 'both', pet: false },
      ] },
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
  function merge(s, d) {
    for (const k of Object.keys(d)) {
      if (s[k] == null) s[k] = d[k];
      else if (typeof d[k] === 'object' && !Array.isArray(d[k])) merge(s[k], d[k]);
    }
    return s;
  }

  let cur = null;      // { id, state }
  let step = 1;
  let last = null;     // { p, a }

  function persist() {
    if (!cur) return;
    const a = last && last.a;
    Store.save(cur.id, {
      id: cur.id, state: cur.state, updatedAt: Date.now(), createdAt: (customers[cur.id] && customers[cur.id].createdAt) || Date.now(),
      summary: a && a.rec ? { kw: a.rec.kw, n: a.rec.n, gen: a.recDetail.sim.gen, net: a.recDetail.eco.net, suff: a.recDetail.sim.sufficiency } : null,
    });
  }

  // ------------------------------------------------------- ルーティング ---
  // 画面遷移は内部状態で管理（アーティファクトの枠内でも同じ動き）
  function go(view, id, s) {
    $$('.view').forEach((v) => v.classList.remove('on'));
    if ((view === 'edit' || view === 'proposal') && customers[id]) {
      if (!cur || cur.id !== id) { cur = { id, state: merge(JSON.parse(JSON.stringify(customers[id].state)), defaults()) }; last = null; }
      if (view === 'edit') { step = Math.min(6, Math.max(1, +s || 1)); showWizard(); }
      else showProposal();
    } else { showHome(); }
    window.scrollTo(0, 0);
  }

  // ------------------------------------------------------------ ホーム ---
  function showHome() {
    $('#view-home').classList.add('on');
    if (loading) { $('#custCount').textContent = ''; $('#custGrid').innerHTML = `<div class="empty"><b>お客様を読み込んでいます</b>保存済みの提案がここに並びます。</div>`; return; }
    const list = Object.values(customers).sort((x, y) => y.updatedAt - x.updatedAt);
    $('#custCount').textContent = list.length ? `${list.length}件` : '';
    $('#custGrid').innerHTML = list.length ? list.map((c) => {
      const s = c.state, sm = c.summary;
      const d = new Date(c.updatedAt);
      return `<article class="cust">
        <div class="cust-top"><div><div class="cust-name">${esc(s.customer.name || '（お名前未入力）')}<span class="muted" style="font-size:13px"> ${esc(s.customer.honorific || '様')}</span></div>
          <div class="cust-meta">${esc(s.location.station)}・${s.house.persons}人家族・${s.house.floorTsubo}坪　更新 ${d.getMonth() + 1}/${d.getDate()}</div></div>
          <div class="cust-kw">${sm ? `<b>${f2(sm.kw)}</b><small>kW</small>` : ''}</div></div>
        <div class="cust-facts">${sm ? `<span>発電 ${f0(sm.gen)}kWh</span><span>自給率 ${pct(sm.suff)}</span><span>手残り ${man(sm.net)}万円</span>` : '<span>未計算</span>'}${s.ev.enabled ? '<span>EV</span>' : ''}${s.ac.units.some((u) => u.pet) ? '<span>ペット</span>' : ''}</div>
        <div class="cust-actions"><button class="btn-ink" data-open="${c.id}">提案書</button><button class="btn-line" data-edit="${c.id}">ヒアリング</button><span class="sp"></span>
          <button class="btn-quiet x" data-dup="${c.id}">複製</button><button class="btn-quiet x" data-del="${c.id}">${pendingDel === c.id ? '本当に削除する' : '削除'}</button></div></article>`;
    }).join('') : `<div class="empty"><b>まだお客様がいません</b>「新しいお客様の提案をつくる」からヒアリングを始めるか、例のお客様で流れを確かめられます。<div style="margin-top:18px"><button class="btn-line" data-action="sample">例のお客様で試す</button></div></div>`;
  }

  function newCustomer() {
    if (loading) { toast('お客様データを読み込み中です。少しお待ちください'); return; }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    cur = { id, state: defaults() }; last = null; step = 1;
    Store.save(id, { id, state: cur.state, createdAt: Date.now(), updatedAt: Date.now(), summary: null });
    go('edit', id, 1);
  }
  function sampleCustomer() {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const st = defaults();
    Object.assign(st.customer, { name: '例）日向 太郎', address: '東京都世田谷区（例）', memo: '動作確認用の例です。削除してかまいません。' });
    Object.assign(st.ac.units[0], { pet: true, pattern: '24h' });
    st.disaster.items.push('petac');
    Object.assign(st.ev, { enabled: true, v2h: true, homeDaysPerWeek: 2 });
    cur = { id, state: st }; last = null; step = 1;
    persist(); go('proposal', id);
  }

  // -------------------------------------------------------- ヒアリング ---
  const STEPS = $$('.step').map((s) => ({ n: +s.dataset.step, t: s.dataset.title, sub: s.dataset.sub }));
  function showWizard() {
    $('#view-wizard').classList.add('on');
    fillDynamic();
    writeInputs();
    showStep(step);
    run();
  }
  function showStep(n) {
    step = n;
    $$('.step').forEach((s) => {
      const on = +s.dataset.step === n;
      s.classList.toggle('on', on);
      if (on && !s.querySelector('.step-head')) {
        s.insertAdjacentHTML('afterbegin', `<div class="step-head"><div class="k">STEP ${String(n).padStart(2, '0')}</div><h2>${s.dataset.title}</h2><p>${s.dataset.sub}</p></div>`);
      }
    });
    $('#stepper').innerHTML = STEPS.map((s) => `<button type="button" class="st ${s.n === n ? 'on' : s.n < n ? 'done' : ''}" data-go="${s.n}"><span class="n">${s.n < n ? '✓' : s.n}</span><span class="t">${s.t}<small>${s.sub}</small></span></button>`).join('');
    $('#wzCount').textContent = `${String(n).padStart(2, '0')} / ${String(STEPS.length).padStart(2, '0')}`;
    $('#btnPrev').style.visibility = n === 1 ? 'hidden' : 'visible';
    $('#btnNext').textContent = n === STEPS.length ? '提案書をつくる →' : '次へ →';
  }

  const getP = (o, path) => path.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  const setP = (o, path, v) => { const ks = path.split('.'); const l = ks.pop(); ks.reduce((a, k) => (a[k] = a[k] || {}), o)[l] = v; };
  const opt = (v, label, sel) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(label)}</option>`;

  function fillStatic() {
    const prefs = [];
    Object.values(CL.stations).forEach((s) => { if (!prefs.includes(s.pref)) prefs.push(s.pref); });
    $('#selPref').innerHTML = prefs.map((p) => opt(p, p)).join('');
    $('#selInsulation').innerHTML = C.insulation.map((x) => opt(x.id, x.label)).join('');
    $('#selDryer').innerHTML = C.dryers.map((x) => opt(x.id, x.label)).join('');
    $('#selFloorHeat').innerHTML = C.floorHeating.map((x) => opt(x.id, x.label)).join('');
    const whNote = { ecocute: '深夜に沸かす一般的な使い方', ecocute_day: '昼の太陽光で沸かす', hybrid: '電気＋ガスの併用', electric: 'ヒーター式（消費が大きい）', gas: '電気はほぼ使わない' };
    $('#waterChoices').innerHTML = C.waterHeaters.map((w) => `<button type="button" data-v="${w.id}"><b>${esc(w.label.replace(/（.*）/, ''))}</b><span>${esc((w.label.match(/（(.*)）/) || [])[1] || whNote[w.id])}</span></button>`).join('');
    $('#evPresets').innerHTML = C.evPresets.map((x) => `<button type="button" data-v="${x.id}">${esc(x.label)}</button>`).join('');
    $('#panelList').innerHTML = C.panels.map((p) => `<button type="button" data-panel="${p.id}"><span class="pm">${esc(p.maker)}</span><span class="pn">${esc(p.model)}</span><span class="ps">${p.watt}W <span>${(p.watt / E.panelArea(p) / 10).toFixed(1)}%</span> <span>${p.tc}%/℃</span></span></button>`).join('') +
      `<button type="button" data-panel="custom"><span class="pm">その他</span><span class="pn">手入力のパネル</span><span class="ps"><span>下の「パネル仕様」で入力</span></span></button>`;
  }
  function fillDynamic() {
    const pref = cur.state.location.pref;
    $('#selStation').innerHTML = Object.entries(CL.stations).filter(([, s]) => s.pref === pref).map(([n, s]) => opt(n, n + (s.src.startsWith('推計') ? '（推計値）' : ''))).join('');
  }

  function writeInputs() {
    const s = cur.state;
    $('#selPref').value = s.location.pref;
    fillDynamic();
    $$('[data-k]').forEach((el) => {
      const v = getP(s, el.dataset.k);
      if (el.type === 'checkbox') el.checked = !!v; else el.value = v == null ? '' : v;
    });
    syncChoices();
    $('#chkPet').checked = s.ac.units.some((u) => u.pet);
    renderFaces(); renderAc(); renderEssentials(); visibility(); panelNote(); stationNote();
    $('#wzCustomer').textContent = s.customer.name ? `${s.customer.name} ${s.customer.honorific}` : '新しいお客様';
  }
  function syncChoices() {
    const s = cur.state;
    $$('[data-choice]').forEach((g) => {
      const v = String(getP(s, g.dataset.choice));
      $$('button[data-v]', g).forEach((b) => b.classList.toggle('on', b.dataset.v === v));
    });
    $$('#panelList button').forEach((b) => b.classList.toggle('on', b.dataset.panel === s.panelId));
    const ang = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 }[s.roofShape.mainDir] || 180;
    $('#needle').style.transform = `rotate(${ang + 180}deg)`;
  }
  function visibility() {
    $$('[data-show]').forEach((el) => {
      const c = el.dataset.show;
      let show;
      if (c.includes('=')) { const [k, v] = c.split('='); show = String(getP(cur.state, k)) === v; } else show = !!getP(cur.state, c);
      el.dataset.hidden = show ? '0' : '1';
    });
  }
  function panelNote() {
    const p = C.panels.find((x) => x.id === cur.state.panelId);
    $('#panelNote').textContent = p ? `${p.note}。${p.tcAssumed ? '温度係数は一般的な値です。提案前にカタログ値をご確認ください。' : ''}` : 'カタログの公称最大出力・外形寸法・温度係数を入力してください。';
  }
  function stationNote() {
    const st = CL.stations[cur.state.location.station];
    if (!st) return;
    const h = st.H.reduce((a, v, m) => a + v * E.DAYS[m], 0);
    $('#stationNote').textContent = `${cur.state.location.station}：水平面の年間日射量 ${f0(h)}kWh/㎡（${st.src}）`;
  }

  function renderFaces() {
    const s = cur.state;
    $('#tblFaces').innerHTML = `<thead><tr><th></th><th>向き</th><th>勾配(寸)</th><th>面積(㎡)</th><th>有効率(%)</th><th>影(%)</th><th>最大枚数</th><th style="text-align:right">載る量</th><th></th></tr></thead><tbody>` +
      s.roof.map((f, i) => {
        const max = E.faceMaxPanels(f, s.panel);
        return `<tr data-i="${i}"><td><input type="checkbox" class="ck" data-f="enabled" ${f.enabled !== false ? 'checked' : ''}></td>
          <td><select data-f="dir">${E.DIRS.map((d) => opt(d, E.DIR_LABEL[d], d === f.dir)).join('')}</select></td>
          <td><input type="number" step="0.5" min="0" max="7" data-f="slopeSun" value="${f.slopeSun}"></td>
          <td><input type="number" step="0.5" min="0" data-f="areaM2" value="${f.areaM2}"></td>
          <td><input type="number" step="5" min="10" max="100" data-f="usablePct" value="${f.usablePct}"></td>
          <td><input type="number" step="5" min="0" max="90" data-f="shading" value="${f.shading || 0}"></td>
          <td><input type="number" min="0" data-f="maxPanels" value="${f.maxPanels == null ? '' : f.maxPanels}" placeholder="自動"></td>
          <td class="out">${max}枚<small>${f2(max * s.panel.watt / 1000)}kW</small></td>
          <td><button type="button" class="x-btn" data-del-face="${i}" title="削除">×</button></td></tr>`;
      }).join('') + `</tbody><tfoot><tr><td colspan="9"><button type="button" class="btn-quiet" id="btnAddFace">＋ 屋根面を追加</button></td></tr></tfoot>`;
  }
  function renderAc() {
    const s = cur.state;
    $('#tblAc').innerHTML = `<thead><tr><th>お部屋</th><th>畳数</th><th>台数</th><th>運転時間</th><th>季節</th><th title="ペット用">ペット</th><th></th></tr></thead><tbody>` +
      s.ac.units.map((u, i) => `<tr data-i="${i}"><td><input data-a="name" value="${esc(u.name)}"></td>
        <td><select data-a="tatami">${C.acSizes.map((z) => opt(z.tatami, z.tatami + '畳', +u.tatami === z.tatami)).join('')}</select></td>
        <td><input type="number" min="1" max="9" data-a="count" value="${u.count}"></td>
        <td><select data-a="pattern">${C.acPatterns.map((p) => opt(p.id, p.short, u.pattern === p.id)).join('')}</select></td>
        <td><select data-a="season">${C.acSeasons.map((p) => opt(p.id, p.short, u.season === p.id)).join('')}</select></td>
        <td style="text-align:center"><input type="checkbox" class="ck" data-a="pet" ${u.pet ? 'checked' : ''}></td>
        <td><button type="button" class="x-btn" data-del-ac="${i}" title="削除">×</button></td></tr>`).join('') + '</tbody>';
  }
  function renderEssentials(petKwh) {
    const s = cur.state;
    $('#essentials').innerHTML = C.essentials.map((e) => {
      const kwh = e.dynamic === 'petac' ? (petKwh != null ? f1(petKwh) : '自動') : e.kwh;
      return `<button type="button" data-ess="${e.id}" class="${s.disaster.items.includes(e.id) ? 'on' : ''}">${esc(e.label)}<em>${kwh} kWh/日</em></button>`;
    }).join('');
  }

  function onInput(e) {
    const el = e.target, s = cur.state;
    if (el.dataset.k) {
      const k = el.dataset.k;
      setP(s, k, el.type === 'checkbox' ? el.checked : el.type === 'number' ? (el.value === '' ? 0 : +el.value) : el.value);
      if (k.startsWith('panel.') && s.panelId !== 'custom') { s.panelId = 'custom'; syncChoices(); panelNote(); }
      if (k.startsWith('panel.')) renderFaces();
      if (/^house\.(floorTsubo|floors)/.test(k) && !s.roofManual && e.type === 'change') { s.roof = E.estimateRoof(s); renderFaces(); }
      if (k === 'location.station') { s.location.pref = CL.stations[s.location.station].pref; stationNote(); }
      if (k === 'customer.name' || k === 'customer.honorific') $('#wzCustomer').textContent = s.customer.name ? `${s.customer.name} ${s.customer.honorific}` : '新しいお客様';
      visibility();
    } else if (el.id === 'selPref') {
      s.location.pref = el.value; fillDynamic(); s.location.station = $('#selStation').value; stationNote();
    } else if (el.dataset.f) {
      const i = +el.closest('tr').dataset.i, f = el.dataset.f;
      s.roof[i][f] = el.type === 'checkbox' ? el.checked : el.tagName === 'SELECT' ? el.value : el.value === '' ? null : +el.value;
      s.roofManual = true;
      if (e.type === 'change') renderFaces();
    } else if (el.dataset.a) {
      const i = +el.closest('tr').dataset.i, k = el.dataset.a;
      s.ac.units[i][k] = el.type === 'checkbox' ? el.checked : (el.type === 'number' || k === 'tatami') ? +el.value : el.value;
      if (k === 'pet' && el.checked) s.ac.units[i].pattern = '24h';
      if (k === 'pet') { $('#chkPet').checked = s.ac.units.some((u) => u.pet); renderAc(); }
    } else if (el.id === 'chkPet') {
      if (el.checked) {
        if (!s.ac.units.length) s.ac.units.push({ name: 'LDK', tatami: 14, count: 1, pattern: '24h', season: 'both', pet: true });
        Object.assign(s.ac.units[0], { pet: true, pattern: '24h' });
        if (!s.disaster.items.includes('petac')) s.disaster.items.push('petac');
      } else {
        s.ac.units.forEach((u) => { if (u.pet) Object.assign(u, { pet: false, pattern: 'day' }); });
        s.disaster.items = s.disaster.items.filter((x) => x !== 'petac');
      }
      renderAc(); renderEssentials();
    } else return;
    schedule();
  }

  function onClick(e) {
    const t = e.target.closest('button');
    if (!t) return;
    const s = cur.state;
    const group = t.closest('[data-choice]');
    if (group && t.dataset.v != null) {
      const k = group.dataset.choice;
      setP(s, k, group.hasAttribute('data-num') ? +t.dataset.v : t.dataset.v);
      if (k === 'ev.preset') { const pr = C.evPresets.find((x) => x.id === t.dataset.v); Object.assign(s.ev, { batteryKwh: pr.kwh, kmPerKwh: pr.kmPerKwh }); writeInputs(); }
      if (k.startsWith('roofShape.') && !s.roofManual) { s.roof = E.estimateRoof(s); renderFaces(); }
      if (k.startsWith('roofShape.') && s.roofManual) toast('屋根面は手入力中です。反映するには「屋根面を計算し直す」を押してください');
      syncChoices(); visibility(); schedule(); return;
    }
    if (t.dataset.panel) {
      s.panelId = t.dataset.panel;
      const p = C.panels.find((x) => x.id === s.panelId);
      if (p) s.panel = { watt: p.watt, l: p.l, w: p.w, tc: p.tc };
      else $('details.adv').open = true;
      writeInputs(); schedule(); return;
    }
    if (t.dataset.ess) {
      const id = t.dataset.ess;
      s.disaster.items = s.disaster.items.includes(id) ? s.disaster.items.filter((x) => x !== id) : s.disaster.items.concat(id);
      t.classList.toggle('on'); schedule(); return;
    }
    if (t.id === 'btnRoofAuto') { s.roofManual = false; s.roof = E.estimateRoof(s); renderFaces(); schedule(); }
    else if (t.id === 'btnAddFace') { s.roof.push({ dir: 'S', slopeSun: 4, areaM2: 20, usablePct: 75, shading: 0, maxPanels: null, enabled: true }); s.roofManual = true; renderFaces(); schedule(); }
    else if (t.dataset.delFace != null) { s.roof.splice(+t.dataset.delFace, 1); s.roofManual = true; renderFaces(); schedule(); }
    else if (t.id === 'btnAddAc') { s.ac.units.push({ name: '洋室', tatami: 6, count: 1, pattern: 'evening', season: 'both', pet: false }); renderAc(); schedule(); }
    else if (t.dataset.delAc != null) { s.ac.units.splice(+t.dataset.delAc, 1); renderAc(); schedule(); }
  }

  let timer = null;
  function schedule() { clearTimeout(timer); timer = setTimeout(() => { run(); persist(); }, 160); }

  // ------------------------------------------------------------- 計算 ---
  function toEngine(s) {
    const p = JSON.parse(JSON.stringify(s));
    p.generation = {
      method: s.generation.method, mount: s.roofShape.type === 'rikuyane' ? 'rack' : 'roof', tempCoef: s.panel.tc,
      pcsEff: (s.generation.pcsEffPct || 96) / 100, otherLoss: (s.generation.otherLossPct || 95) / 100,
      snowLoss: s.generation.snowLoss || 0, pcsKw: s.generation.pcsKw || 0,
    };
    p.fit = Object.assign({}, C.fitDefaults, s.fit);
    return p;
  }
  function compute() {
    const p = toEngine(cur.state);
    const a = E.analyze(p);
    if (a.rec && ((p.battery && p.battery.enabled) || (p.ev && p.ev.enabled && p.ev.v2h))) {
      const q = JSON.parse(JSON.stringify(p)); q.battery.enabled = false; q.ev.v2h = false;
      a.noStorage = E.simulate(E.prepare(q), q, a.rec.counts.map((c) => c * p.panel.watt / 1000));
    }
    last = { p, a };
    return last;
  }
  function run() {
    const live = $('#live');
    try {
      const { a } = compute();
      const pet = a.crit.essential && a.crit.essential.items.find((x) => x.id === 'petac');
      if ($('#view-wizard').classList.contains('on')) renderEssentials(pet ? pet.kwh : null);
      if (!a.rec) { live.innerHTML = `<div class="lk">RECOMMENDED</div><p class="err" style="margin-top:14px">屋根に載せられるパネルがありません。屋根面の面積・向きを確認してください。</p>`; return; }
      const R = a.recDetail.sim, eco = a.recDetail.eco;
      const nets = a.cases.map((c) => c.eco.net);
      live.innerHTML = `<div class="lk">RECOMMENDED</div>
        <div class="lv"><b>${f2(a.rec.kw)}</b><span>kW</span></div>
        <div class="ls">${cur.state.panel.watt}W × ${a.rec.n}枚　/　屋根上限 ${f2(a.crit.roofMax.kw)}kW</div>
        <span class="lgoal">${{ econ: '経済性重視', netzero: '自給重視', max: '屋根いっぱい' }[a.goal]}${cur.state.disaster.priority ? '＋停電対策' : ''}</span>
        ${Ch.spark(nets, a.cases.indexOf(a.rec), '#F4A84A', 260, 64)}
        <div class="lcap"><span>${f2(a.cases[0].kw)}kW</span><span>容量ごとの${eco.years}年収支</span><span>${f2(a.crit.roofMax.kw)}kW</span></div>
        <dl><dt>年間発電量</dt><dd>${f0(R.gen)}<small>kWh</small></dd>
          <dt>年間ご使用量</dt><dd>${f0(R.load)}<small>kWh</small></dd>
          <dt>自給率</dt><dd>${pct(R.sufficiency)}</dd>
          <dt>投資回収</dt><dd>${eco.payback != null ? f1(eco.payback) + '<small>年</small>' : '—'}</dd>
          <dt>${eco.years}年間の手残り</dt><dd>${man(eco.net)}<small>万円</small></dd></dl>
        <button class="btn-sun" data-action="proposal"><span>提案書を見る</span><i>→</i></button>`;
    } catch (err) {
      console.error(err);
      live.innerHTML = `<div class="lk">RECOMMENDED</div><p class="err" style="margin-top:14px">計算エラー：${esc(err.message)}</p>`;
    }
  }

  // ------------------------------------------------------------ 提案書 ---
  function showProposal() {
    $('#view-proposal').classList.add('on');
    if (!last) compute();
    persist();
    const s = cur.state;
    $('#pvHint').textContent = Store.downloads ? '「PDFで保存」を押すと、この6ページがPDFファイルになります。' : '「PDFで保存」→ 印刷画面の送信先で「PDFに保存」を選ぶと、この提案書がPDFになります。';
    $('#pvTitle').innerHTML = `${esc(s.customer.name || 'お客様')} ${esc(s.customer.honorific)}<small>太陽光発電 最適容量のご提案</small>`;
    $('#pages').innerHTML = P.render(last.p, last.a, { settings }).replace(/<section class="page/g, '<div class="page-holder"><section class="page').replace(/<\/section>/g, '</section></div>');
    fitPages();
  }
  function fitPages() {
    const avail = Math.min(window.innerWidth - 24, 794);
    const sc = Math.min(1, avail / 794);
    $$('.page-holder').forEach((h) => {
      const pg = h.firstElementChild;
      h.style.width = 794 * sc + 'px'; h.style.height = 1123 * sc + 'px';
      pg.style.transform = sc < 1 ? `scale(${sc})` : '';
    });
  }
  const fileName = (ext) => `太陽光発電ご提案書_${cur.state.customer.name || 'お客様'}${cur.state.customer.honorific || '様'}.${ext}`;
  let pdfBusy = false;
  async function savePdf() {
    if (pdfBusy) return;
    if (!Store.downloads) {
      // ローカル：ブラウザの印刷 →「PDFに保存」
      const t = document.title;
      document.title = fileName('pdf').replace(/\.pdf$/, '');
      const restore = () => { document.title = t; window.removeEventListener('afterprint', restore); };
      window.addEventListener('afterprint', restore);
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => window.print());
      return;
    }
    pdfBusy = true;
    const btn = $('[data-action="pdf"] span');
    const label = btn.textContent;
    try {
      const r = await Store.savePdf($('#pages'), fileName('pdf'), (i, n) => { btn.textContent = `作成中 ${i}/${n}`; });
      if (r === 'saved') toast('PDFを保存しました');
    } catch (e) {
      console.error(e);
      toast('PDFを作成できませんでした。もう一度お試しください');
    } finally {
      btn.textContent = label; pdfBusy = false;
    }
  }

  // ------------------------------------------------------------ 共通 ---
  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2600);
  }
  Store.onError = (e) => toast(e && e.code === 'quota_exceeded' ? '保存容量の上限です。不要なお客様を削除してください' : '保存できませんでした。通信状態を確かめてください');
  async function exportJson() {
    persist();
    const r = await Store.saveText(`提案データ_${cur.state.customer.name || '無題'}.json`, JSON.stringify({ app: 'hikari', version: 1, customer: customers[cur.id] }, null, 2));
    if (r === 'saved') toast('データを書き出しました');
  }
  function importJson(file) {
    file.text().then((t) => {
      const d = JSON.parse(t);
      const rec = d.customer || (d.state ? d : { state: d });
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      Store.save(id, { id, state: merge(rec.state, defaults()), createdAt: Date.now(), updatedAt: Date.now(), summary: rec.summary || null });
      showHome(); toast('読み込みました');
    }).catch((e) => toast('読み込めませんでした：' + e.message));
  }

  let pendingDel = null;
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action],[data-open],[data-edit],[data-dup],[data-del],[data-go]');
    if (!b) return;
    const act = b.dataset.action;
    if (!b.dataset.del && pendingDel) { pendingDel = null; if ($('#view-home').classList.contains('on')) showHome(); }
    if (act === 'new') newCustomer();
    else if (act === 'sample') sampleCustomer();
    else if (act === 'home') { if (cur) persist(); go('home'); }
    else if (act === 'settings') openSettings();
    else if (act === 'save') { persist(); Store.saveNow(cur.id); toast('保存しました'); }
    else if (act === 'proposal') { persist(); go('proposal', cur.id); }
    else if (act === 'edit') go('edit', cur.id, step || 1);
    else if (act === 'pdf') savePdf();
    else if (act === 'export') exportJson();
    else if (b.dataset.open) go('proposal', b.dataset.open);
    else if (b.dataset.edit) go('edit', b.dataset.edit, 1);
    else if (b.dataset.go) showStep(+b.dataset.go);
    else if (b.dataset.dup) {
      const src = customers[b.dataset.dup]; const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const st = JSON.parse(JSON.stringify(src.state)); st.customer.name = (st.customer.name || '') + '（コピー）';
      Store.save(id, { id, state: st, createdAt: Date.now(), updatedAt: Date.now(), summary: src.summary });
      showHome(); toast('複製しました');
    } else if (b.dataset.del) {
      // 2回押すと削除（確認ダイアログを使わない）
      if (pendingDel === b.dataset.del) { Store.remove(b.dataset.del); pendingDel = null; if (cur && cur.id === b.dataset.del) cur = null; toast('削除しました'); }
      else pendingDel = b.dataset.del;
      showHome();
    }
  });

  function openSettings() {
    $('#setCompany').value = settings.company || ''; $('#setStaff').value = settings.staff || '';
    $('#setPhone').value = settings.phone || ''; $('#setEmail').value = settings.email || '';
    $('#dlgSettings').showModal();
  }
  $('#dlgSettings').addEventListener('close', () => {
    if ($('#dlgSettings').returnValue !== 'ok') return;
    settings = { company: $('#setCompany').value.trim(), staff: $('#setStaff').value.trim(), phone: $('#setPhone').value.trim(), email: $('#setEmail').value.trim() };
    Store.saveSettings(settings); toast('提案者情報を保存しました');
  });

  const form = $('#form');
  form.addEventListener('input', onInput);
  form.addEventListener('change', onInput);
  form.addEventListener('click', onClick);
  $('#btnPrev').onclick = () => { showStep(Math.max(1, step - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  $('#btnNext').onclick = () => {
    if (step < STEPS.length) { showStep(step + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else { persist(); go('proposal', cur.id); }
  };
  $('#fileImport').onchange = (e) => { if (e.target.files[0]) importJson(e.target.files[0]); e.target.value = ''; };
  window.addEventListener('resize', () => { if ($('#view-proposal').classList.contains('on')) fitPages(); });

  fillStatic();
  $('#heroArt').innerHTML = P.coverArt('hero');
  go('home');
  Store.ready.then(() => {
    customers = Store.customers; settings = Store.settings; loading = false;
    if ($('#view-home').classList.contains('on')) showHome();
  });
  window.__hikari = { get state() { return cur && cur.state; }, get last() { return last; }, run, compute, newCustomer };
})();
