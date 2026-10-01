/*
 * 太陽光 適正容量シミュレーター 計算エンジン
 *
 * 1. 発電量  : JPEA 表示ガイドライン / JIS C 8907 の月別計算式
 *              E = P[kW] × H傾斜面[kWh/㎡] × Kh × Kpcs × Kj
 * 2. 消費量  : 機器ごとの積み上げ（人数・断熱・地域の気温で補正）
 * 3. 需給    : 365日×24時間の簡易シミュレーション（晴/曇/雨の日を混在、蓄電池・EV/V2H を考慮）
 * 4. 経済性  : FIT（初期投資支援スキーム）・電気代上昇・経年劣化を考慮した N 年累計収支
 * 5. 推奨容量: 経済性最大・ネットゼロ・屋根上限・停電対策の各基準から決定
 */
(function (root) {
  'use strict';
  const CLIMATE = root.SOLAR_CLIMATE || (typeof require !== 'undefined' ? require('./data/climate.js') : null);
  const CATALOG = root.SOLAR_CATALOG || (typeof require !== 'undefined' ? require('./data/catalog.js') : null);

  const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const MONTH_START = DAYS.reduce((a, d, i) => (a.push(i ? a[i - 1] + DAYS[i - 1] : 0), a), []);
  const TSUBO = 3.30579;
  // 8方位 → PVGIS方位角（0=南, +西, -東）と climate.js の列番号
  const DIRS = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
  const DIR_LABEL = { S: '南', SW: '南西', W: '西', NW: '北西', N: '北', NE: '北東', E: '東', SE: '南東' };
  const DIR_AZ = { S: 0, SW: 45, W: 90, NW: 135, N: 180, NE: -135, E: -90, SE: -45 };
  const AZ_COL = { S: 0, SW: 1, SE: 2, W: 3, E: 4, NW: 5, NE: 6, N: 7 };
  // JPEA 表示ガイドライン（2026年度）結晶系シリコン 補正係数Kh 参考値
  const KH_JPEA = [0.90, 0.90, 0.90, 0.85, 0.85, 0.80, 0.80, 0.80, 0.80, 0.85, 0.85, 0.90];
  // JIS C 8907 の加算温度 ΔT（屋根置き形 / 架台設置形）
  const DELTA_T = { roof: 21.5, rack: 18.4 };
  // 天候の日タイプ（晴・曇・雨）の出現割合と日射の相対値（月平均が1になるよう正規化）
  const WEATHER = { p: [0.45, 0.35, 0.20], f: [1.45, 0.75, 0.25], label: ['晴', '曇', '雨'] };

  const sum = (a) => a.reduce((s, v) => s + v, 0);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const norm = (a) => { const s = sum(a); return s > 0 ? a.map((v) => v / s) : a.map(() => 0); };
  const sunToDeg = (sun) => (sun > 0 ? Math.atan(sun / 10) * 180 / Math.PI : 0);
  const rotateDir = (d, steps) => DIRS[(DIRS.indexOf(d) + steps + 80) % 8];

  function station(name) {
    const s = CLIMATE.stations[name];
    if (!s) throw new Error('観測地点が見つかりません: ' + name);
    return s;
  }

  // ---------------------------------------------------------------- 発電 ---
  /** 傾斜面/水平面 日射量比（月 m）。傾斜は表の間を線形補間 */
  function tiltRatio(st, tiltDeg, dir, m) {
    const tilts = CLIMATE.meta.tilts;
    const t = clamp(tiltDeg, 0, tilts[tilts.length - 1]);
    if (t <= 0) return 1;
    const col = AZ_COL[dir];
    let i = 0;
    while (i < tilts.length - 2 && t > tilts[i + 1]) i++;
    const a = st.ratio[i][col][m] / 1000, b = st.ratio[i + 1][col][m] / 1000;
    return a + (b - a) * (t - tilts[i]) / (tilts[i + 1] - tilts[i]);
  }

  /** 月別の補正係数 Kh（温度損失など） */
  function khMonthly(st, gen) {
    if (gen.method === 'jpea') return KH_JPEA.slice();
    const dT = DELTA_T[gen.mount] || DELTA_T.roof;
    const tc = (gen.tempCoef != null ? gen.tempCoef : -0.41) / 100;
    // JIS C 8907: K_HD(日射量年変動 0.97) × K_PD(経時変化・汚れ 0.95) × K_PT(温度)
    return st.temp.map((T) => 0.97 * 0.95 * (1 + tc * (T + dT - 25)));
  }

  /** 1kWあたりの月別発電量 [kWh/kW] とその内訳 */
  function monthlyYieldPerKw(st, face, gen) {
    const tilt = sunToDeg(face.slopeSun);
    const kh = khMonthly(st, gen);
    const kpcs = gen.pcsEff, kj = gen.otherLoss;
    const shade = 1 - (face.shading || 0) / 100;
    const snow = gen.snowLoss || 0;
    const out = [], hTilt = [];
    for (let m = 0; m < 12; m++) {
      const H = st.H[m] * DAYS[m] * tiltRatio(st, tilt, face.dir, m); // kWh/㎡/月（傾斜面）
      const snowF = (m <= 2 || m === 11) ? 1 - snow / 100 : 1;
      hTilt.push(H);
      out.push(H * kh[m] * kpcs * kj * shade * snowF);
    }
    return { monthly: out, hTilt, kh, annual: sum(out) };
  }

  /** 月 m の1日の発電の時間配分（24要素、合計1） */
  function solarShape(st, m, dir) {
    const doy = MONTH_START[m] + 15;
    const decl = 23.45 * Math.sin(2 * Math.PI * (284 + doy) / 365) * Math.PI / 180;
    const lat = st.lat * Math.PI / 180;
    const cosw = clamp(-Math.tan(lat) * Math.tan(decl), -1, 1);
    const half = Math.acos(cosw) * 12 / Math.PI;                 // 日の出〜南中の時間
    const noon = 12 - (st.lon - 135) / 15;                        // 南中時刻（日本標準時）
    const az = DIR_AZ[dir] * Math.PI / 180;
    const center = noon + 1.3 * Math.sin(az) * (dir === 'N' ? 0 : 1); // 東向きは午前、西向きは午後にピーク
    const w = new Array(24).fill(0);
    for (let h = 0; h < 24; h++) {
      for (let k = 0; k < 4; k++) {
        const t = h + (k + 0.5) / 4;
        if (t < noon - half || t > noon + half) continue;
        const x = (t - center) / (half + 0.6);
        if (Math.abs(x) >= 1) continue;
        w[h] += Math.pow(Math.cos(Math.PI * x / 2), 1.6);
      }
    }
    return norm(w);
  }

  // -------------------------------------------------------------- 屋根 ---
  /** 屋根形状・延床面積から屋根面を概算 */
  function estimateRoof(p) {
    const floorM2 = (p.house.floorTsubo || 30) * TSUBO;
    const floors = Math.max(1, p.house.floors || 2);
    const footprint = Math.min(floorM2, floorM2 / floors * (floors >= 2 ? 1.1 : 1));
    const proj = footprint * 1.15; // 軒の出を含む水平投影面積
    const r = p.roofShape || { type: 'kirizuma', mainDir: 'S', slopeSun: 4 };
    const d = r.mainDir || 'S';
    const s = r.type === 'rikuyane' ? (r.slopeSun || 2) : (r.slopeSun || 4);
    const cos = 1 / Math.sqrt(1 + Math.pow((r.type === 'rikuyane' ? 0 : s) / 10, 2));
    const defs = {
      katanagare: [[d, 1, 0.75]],
      kirizuma: [[d, 0.5, 0.75], [rotateDir(d, 4), 0.5, 0.75]],
      yosemune: [[d, 0.35, 0.6], [rotateDir(d, 4), 0.35, 0.6], [rotateDir(d, 2), 0.15, 0.4], [rotateDir(d, -2), 0.15, 0.4]],
      rikuyane: [['S', 1, 0.5]],
    }[r.type] || [[d, 1, 0.75]];
    return defs.map(([dir, share, usable]) => ({
      dir, slopeSun: s, areaM2: Math.round(proj * share / cos * 10) / 10, usablePct: usable * 100,
      shading: 0, maxPanels: null, enabled: true,
    }));
  }

  function panelArea(panel) { return panel.l * panel.w / 1e6; }
  function faceMaxPanels(face, panel) {
    if (face.maxPanels != null && face.maxPanels !== '') return Math.max(0, Math.floor(+face.maxPanels));
    return Math.max(0, Math.floor(face.areaM2 * face.usablePct / 100 / panelArea(panel)));
  }

  // ------------------------------------------------------------ 消費量 ---
  function degreeDays(st) {
    const hdd = st.temp.map((T, m) => Math.max(0, 15 - T) * DAYS[m]);
    const cdd = st.temp.map((T, m) => Math.max(0, T - 20) * DAYS[m]);
    return { hdd, cdd, H: sum(hdd), C: sum(cdd) };
  }

  const HOURS = (list) => { const a = new Array(24).fill(0); list.forEach((h) => (a[h] = 1)); return a; };
  const RANGE = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const AC_ON = {
    evening: HOURS([6, 7, 18, 19, 20, 21, 22, 23]),
    day: HOURS(RANGE(8, 21)),
    '18h': HOURS(RANGE(6, 23)),
    '24h': new Array(24).fill(1),
  };
  const COOL_W = Array.from({ length: 24 }, (_, h) => (h >= 9 && h <= 21 ? 1 + 0.6 * Math.sin(Math.PI * (h - 9) / 12) : 0.7));
  const HEAT_W = Array.from({ length: 24 }, (_, h) => (h >= 5 && h <= 9 ? 1.5 : h >= 10 && h <= 16 ? 0.7 : h >= 17 && h <= 23 ? 1.1 : 1.2));
  // 照明・家電の時刻別パターン（平日不在 / 在宅）
  const BASE_AWAY = [0.5, 0.45, 0.42, 0.42, 0.45, 0.7, 1.3, 1.4, 0.8, 0.5, 0.45, 0.45, 0.5, 0.45, 0.45, 0.5, 0.6, 0.9, 1.5, 1.7, 1.7, 1.5, 1.2, 0.8];
  const BASE_HOME = [0.5, 0.45, 0.42, 0.42, 0.45, 0.7, 1.2, 1.3, 1.1, 1.0, 1.0, 1.0, 1.1, 1.0, 0.95, 0.95, 1.0, 1.1, 1.5, 1.6, 1.6, 1.4, 1.1, 0.8];
  const BASE_SEASON = [1.08, 1.06, 1.02, 0.97, 0.94, 0.93, 0.97, 1.0, 0.95, 0.97, 1.03, 1.08];

  /**
   * 機器ごとの年間・月別消費電力量と時刻パターンを作る
   * 各要素: { key, label, group, monthly[12], profile(m, away) => 24要素の重み }
   */
  function buildLoads(p, st) {
    const C = CATALOG, h = p.house, n = clamp(h.persons || 3, 1, 6);
    const tokyo = degreeDays(CLIMATE.stations['東京']);
    const dd = degreeDays(st);
    const rh = dd.H / tokyo.H, rc = dd.C / tokyo.C;
    const ins = (C.insulation.find((x) => x.id === h.insulation) || C.insulation[1]).ac;
    const loads = [];
    const add = (key, label, group, annual, monthW, profile, extra) => {
      if (!(annual > 0)) return;
      const w = norm(monthW);
      loads.push(Object.assign({ key, label, group, annual, monthly: w.map((x) => x * annual), profile }, extra || {}));
    };
    const fixed = (arr) => () => arr;
    const awayAware = (awayArr, homeArr) => (m, away) => (away ? awayArr : homeArr);

    // 照明・冷蔵庫・家電
    const baseKwh = C.baseByPersons[n - 1] + ((h.floorTsubo || 30) - 30) * 15;
    add('base', '照明・冷蔵庫・家電・待機電力', '生活', baseKwh, BASE_SEASON, awayAware(BASE_AWAY, BASE_HOME));
    add('vent', '24時間換気', '生活', C.ventilationKwh, new Array(12).fill(1), fixed(new Array(24).fill(1)));
    if (h.remoteWorkers > 0) {
      const prof = HOURS(RANGE(9, 18));
      add('remote', `在宅ワーク（${h.remoteWorkers}人）`, '生活', C.remoteWorkKwh * h.remoteWorkers, new Array(12).fill(1),
        (m, away, weekend) => (weekend ? new Array(24).fill(0).map((_, i) => (i === 20 ? 1 : 0)) : prof));
    }

    // 個別エアコン
    const acs = (p.ac && p.ac.units) || [];
    acs.forEach((u, i) => {
      const size = C.acSizes.find((s) => s.tatami === +u.tatami) || C.acSizes[0];
      const pat = C.acPatterns.find((x) => x.id === u.pattern) || C.acPatterns[2];
      const count = Math.max(1, +u.count || 1);
      const base = size.kwh * pat.factor * ins * count;
      const cool = u.season === 'heat' ? 0 : base * C.acCoolShare * rc;
      const heat = u.season === 'cool' ? 0 : base * (1 - C.acCoolShare) * rh;
      const on = AC_ON[pat.id];
      const pc = norm(on.map((v, k) => v * COOL_W[k])), ph = norm(on.map((v, k) => v * HEAT_W[k]));
      const name = `${u.name || 'エアコン' + (i + 1)}（${size.tatami}畳用${count > 1 ? '×' + count : ''}・${pat.short || pat.id}）`;
      const coolM = dd.cdd.map((v) => (dd.C ? v / dd.C * cool : 0));
      const heatM = dd.hdd.map((v) => (dd.H ? v / dd.H * heat : 0));
      const annual = cool + heat;
      if (annual > 0) {
        loads.push({
          key: 'ac' + i, label: name, group: '空調', annual, pet: !!u.pet, pattern: pat.id,
          monthly: coolM.map((v, m) => v + heatM[m]),
          profile: (m) => {
            const c = coolM[m], hh = heatM[m], t = c + hh;
            return t > 0 ? pc.map((v, k) => (v * c + ph[k] * hh) / t) : pc;
          },
        });
      }
    });

    // 全館空調
    if (p.ac && p.ac.central) {
      const floorM2 = (h.floorTsubo || 30) * TSUBO;
      const base = C.centralKwhPerM2 * floorM2 * (ins / 0.8);
      const cool = base * 0.35 * rc, heat = base * 0.65 * rh;
      const coolM = dd.cdd.map((v) => (dd.C ? v / dd.C * cool : 0));
      const heatM = dd.hdd.map((v) => (dd.H ? v / dd.H * heat : 0));
      const pc = norm(COOL_W), ph = norm(HEAT_W);
      const fan = floorM2 * 2.0; // 送風・換気ファン
      loads.push({
        key: 'central', label: '全館空調（24時間）', group: '空調', annual: cool + heat + fan,
        monthly: coolM.map((v, m) => v + heatM[m] + fan / 12),
        profile: (m) => {
          const c = coolM[m], hh = heatM[m], f = fan / 12, t = c + hh + f;
          return pc.map((v, k) => (v * c + ph[k] * hh + f / 24) / t);
        },
      });
    }

    // 床暖房
    const fh = C.floorHeating.find((x) => x.id === (p.extras && p.extras.floorHeating)) || C.floorHeating[0];
    if (fh.kwhPerM2 > 0) {
      const annual = fh.kwhPerM2 * (p.extras.floorHeatingM2 || 15) * rh * (ins / 0.8);
      const prof = norm(HOURS([6, 7, 8, 17, 18, 19, 20, 21, 22]));
      const profHome = norm(HOURS(RANGE(6, 22)));
      add('floorheat', `床暖房（${fh.label}）`, '空調', annual, dd.hdd, awayAware(prof, profHome));
    }

    // 給湯
    const wh = C.waterHeaters.find((x) => x.id === p.waterHeater) || C.waterHeaters[0];
    if (wh.mult > 0) {
      const tW = (T) => 45 - T;
      const regional = sum(st.temp.map(tW)) / sum(CLIMATE.stations['東京'].temp.map(tW));
      const annual = (C.ecocuteBase + C.ecocutePerPerson * n) * wh.mult * regional;
      const prof = wh.time === 'day' ? norm([0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 1, 1, 1, 1, 0.6, 0, 0, 0, 0, 0, 0, 0, 0, 0])
        : norm(HOURS([1, 2, 3, 4, 5]));
      add('water', wh.label, '給湯', annual, st.temp.map(tW), fixed(prof), { waterTime: wh.time });
    }

    // 調理
    const ck = C.cookers.find((x) => x.id === p.cooker) || C.cookers[0];
    if (ck.base + ck.perPerson > 0) {
      const away = norm([0, 0, 0, 0, 0, 0, 0.3, 0.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.3, 0.6, 0.6, 0, 0, 0, 0]);
      const home = norm([0, 0, 0, 0, 0, 0, 0.3, 0.3, 0, 0, 0, 0.3, 0.3, 0, 0, 0, 0, 0.3, 0.6, 0.6, 0, 0, 0, 0]);
      add('cook', ck.label, '調理', ck.base + ck.perPerson * n, new Array(12).fill(1), awayAware(away, home));
    }

    // 家事家電
    const ex = p.extras || {};
    if (ex.dishwasher) add('dish', '食器洗い乾燥機', '家事', C.dishwasherKwhPerUse * 365, new Array(12).fill(1), fixed(HOURS([21])));
    const dr = C.dryers.find((x) => x.id === ex.dryer) || C.dryers[0];
    if (dr.kwhPerUse > 0) {
      const perWeek = ex.dryerPerWeek != null ? +ex.dryerPerWeek : 7;
      add('dryer', `衣類乾燥（${dr.label}）`, '家事', dr.kwhPerUse * perWeek * 52, [1.15, 1.15, 1.05, 0.95, 0.9, 1.0, 0.95, 0.9, 1.0, 0.95, 1.0, 1.1],
        awayAware(norm(HOURS([21, 22])), norm(HOURS([10, 11, 12]))));
    }
    if (ex.bathDryerPerWeek > 0) {
      add('bathdry', '浴室換気乾燥機', '家事', C.bathDryerKwhPerUse * ex.bathDryerPerWeek * 52, [1.1, 1.1, 1, 1, 0.9, 1.1, 0.9, 0.9, 1, 1, 1, 1.1], fixed(norm(HOURS([22, 23]))));
    }
    if (ex.otherKwhMonth > 0) {
      add('other', ex.otherLabel || 'その他（入力値）', '生活', ex.otherKwhMonth * 12, new Array(12).fill(1), fixed(new Array(24).fill(1)));
    }

    // 実績値での補正（EVを除く）
    let calib = 1;
    const modelTotal = sum(loads.map((l) => l.annual));
    if (p.calibration && p.calibration.enabled && p.calibration.annualKwh > 0) {
      calib = p.calibration.annualKwh / modelTotal;
      loads.forEach((l) => { l.annual *= calib; l.monthly = l.monthly.map((v) => v * calib); });
    }
    return { loads, calib, modelTotal, dd, rh, rc, ins };
  }

  // ----------------------------------------------------------- EV 設定 ---
  function evSetup(p) {
    const ev = p.ev || {};
    if (!ev.enabled) return null;
    const driveKwh = (ev.kmPerYear || 8000) / (ev.kmPerKwh || 6.5);  // 電池側の年間走行エネルギー
    const homeRatio = clamp((ev.homeChargePct != null ? ev.homeChargePct : 100) / 100, 0, 1);
    const cap = ev.batteryKwh || 40;
    return {
      cap, chargerKw: ev.chargerKw || (ev.v2h ? 6 : 3), eff: 0.9,
      dailyNeed: driveKwh * homeRatio / 365,
      reserve: clamp((ev.reservePct != null ? ev.reservePct : 30) / 100, 0, 0.9) * cap,
      maxSoc: 0.9 * cap,
      v2h: !!ev.v2h, solarCharge: ev.solarCharge !== false,
      homeDays: clamp(ev.homeDaysPerWeek != null ? +ev.homeDaysPerWeek : 2, 0, 7),
      annualHomeGridSide: driveKwh * homeRatio / 0.9,
    };
  }

  // -------------------------------------------------- 年間シミュレーション ---
  function seededRandom(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  /** 気象（日タイプ）・曜日・時刻別負荷・面ごとの 1kW 発電 を 8760 時間で準備 */
  function prepare(p) {
    const st = station(p.location.station);
    const gen = p.generation;
    const panel = p.panel;
    const lb = buildLoads(p, st);
    const ev = evSetup(p);
    const lifestyle = p.house.lifestyle || 'dual';

    // 天候列（毎年同じ乱数列＝再現性あり）
    const rnd = seededRandom(20260401);
    const dayType = new Array(365), dayFactor = new Array(365);
    for (let m = 0; m < 12; m++) {
      let s = 0;
      for (let d = 0; d < DAYS[m]; d++) {
        const r = rnd(); const t = r < WEATHER.p[0] ? 0 : r < WEATHER.p[0] + WEATHER.p[1] ? 1 : 2;
        dayType[MONTH_START[m] + d] = t; s += WEATHER.f[t];
      }
      const k = DAYS[m] / s;
      for (let d = 0; d < DAYS[m]; d++) dayFactor[MONTH_START[m] + d] = WEATHER.f[dayType[MONTH_START[m] + d]] * k;
    }

    // 時刻別負荷（EV充電を除く）
    const load = new Float64Array(8760);
    const dow0 = 3; // 2026/1/1 は木曜（0=月）
    const weekendArr = new Array(365);
    for (let d = 0; d < 365; d++) {
      const m = monthOf(d);
      const dow = (dow0 + d) % 7, weekend = dow >= 5;
      weekendArr[d] = weekend;
      const away = lifestyle === 'dual' && !weekend;
      for (const l of lb.loads) {
        const daily = l.monthly[m] / DAYS[m];
        const prof = l.profile(m, away, weekend);
        const ps = sum(prof);
        if (ps > 0) for (let h = 0; h < 24; h++) load[d * 24 + h] += daily * prof[h] / ps;
      }
    }

    // 面ごとの 1kW あたり時刻別発電
    const faces = (p.roof || []).filter((f) => f.enabled !== false && f.areaM2 > 0);
    const faceInfo = faces.map((f) => {
      const y = monthlyYieldPerKw(st, f, gen);
      const shapes = Array.from({ length: 12 }, (_, m) => solarShape(st, m, f.dir));
      const hourly = new Float64Array(8760);
      for (let d = 0; d < 365; d++) {
        const m = monthOf(d);
        const daily = y.monthly[m] / DAYS[m] * dayFactor[d];
        for (let h = 0; h < 24; h++) hourly[d * 24 + h] = daily * shapes[m][h];
      }
      return { face: f, yield: y, hourly, maxPanels: faceMaxPanels(f, panel) };
    });

    // EV の在宅日（週末から優先して割り当て）
    const evHomeDay = new Array(365).fill(false);
    if (ev) {
      const order = [5, 6, 2, 0, 4, 1, 3]; // 土,日,水,月,金,火,木
      const homeDows = new Set(order.slice(0, Math.round(ev.homeDays)));
      for (let d = 0; d < 365; d++) evHomeDay[d] = homeDows.has((dow0 + d) % 7);
    }

    return { st, lb, ev, load, faces: faceInfo, dayType, dayFactor, weekendArr, evHomeDay, panel };
  }

  function monthOf(d) { let m = 0; while (m < 11 && d >= MONTH_START[m + 1]) m++; return m; }

  function priceAt(tariff, h) {
    if (tariff.type !== 'tou') return tariff.flat;
    const ns = tariff.nightStart, ne = tariff.nightEnd;
    const night = ns > ne ? (h >= ns || h < ne) : (h >= ns && h < ne);
    return night ? tariff.night : tariff.day;
  }

  /**
   * 指定の面別容量 kwFaces[] で1年間を時刻別に計算
   * opts.trace = true なら代表日の時刻別データも返す
   */
  function simulate(prep, p, kwFaces, opts) {
    opts = opts || {};
    const tariff = p.tariff, ev = prep.ev;
    const bat = p.battery && p.battery.enabled ? {
      cap: p.battery.kwh || 7, pow: p.battery.kw || 3, eta: Math.sqrt((p.battery.roundTrip || 90) / 100),
    } : null;
    const panelKw = sum(kwFaces);
    const pcsKw = p.generation.pcsKw > 0 ? p.generation.pcsKw : (panelKw < 10 ? Infinity : 9.9);
    const nightStart = tariff.nightStart != null ? tariff.nightStart : 23, nightEnd = tariff.nightEnd != null ? tariff.nightEnd : 7;
    const isNight = (h) => (nightStart > nightEnd ? (h >= nightStart || h < nightEnd) : (h >= nightStart && h < nightEnd));

    const M = () => new Array(12).fill(0);
    const r = {
      gen: M(), load: M(), imp: M(), exp: M(), self: M(), clip: 0, evPv: 0, evGrid: 0, evPublic: 0,
      batOut: 0, v2hOut: 0, cost: 0, baseCost: 0, peakGen: 0,
    };
    let soc = bat ? bat.cap * 0.5 : 0;
    let evSoc = ev ? ev.reserve + ev.dailyNeed : 0;
    const trace = opts.trace ? {} : null;

    for (let d = 0; d < 365; d++) {
      const m = monthOf(d);
      const carHome = ev ? prep.evHomeDay[d] : false;
      for (let h = 0; h < 24; h++) {
        const i = d * 24 + h;
        let g = 0;
        for (let f = 0; f < kwFaces.length; f++) if (kwFaces[f]) g += kwFaces[f] * prep.faces[f].hourly[i];
        if (g > pcsKw) { r.clip += g - pcsKw; g = pcsKw; }
        if (g > r.peakGen) r.peakGen = g;
        const L = prep.load[i];
        const price = priceAt(tariff, h);
        let imp = 0, exp = 0, evCharge = 0;
        const present = ev && (carHome || h < 8 || h >= 18);

        // 走行（18時に帰宅して当日分を消費したとみなす）
        if (ev && h === 18) {
          evSoc -= ev.dailyNeed;
          if (evSoc < 0) { r.evPublic += -evSoc; evSoc = 0; }
        }

        let net = g - L;
        let batC = 0, batD = 0, v2hD = 0, evPv = 0;
        if (net >= 0) {
          let s = net;
          if (bat) { batC = Math.min(s, bat.pow, (bat.cap - soc) / bat.eta); soc += batC * bat.eta; s -= batC; }
          if (ev && present && ev.solarCharge && evSoc < ev.maxSoc) {
            evPv = Math.min(s, ev.chargerKw, (ev.maxSoc - evSoc) / ev.eff); evSoc += evPv * ev.eff; s -= evPv;
          }
          exp = s;
        } else {
          let dd = -net;
          if (bat) { batD = Math.min(dd, bat.pow, soc * bat.eta); soc -= batD / bat.eta; dd -= batD; }
          if (ev && ev.v2h && present) {
            const floor = ev.reserve + ev.dailyNeed;
            const avail = Math.max(0, evSoc - floor);
            v2hD = Math.min(dd, ev.chargerKw, avail * ev.eff); evSoc -= v2hD / ev.eff; dd -= v2hD;
          }
          imp = dd;
        }
        // 夜間の系統充電（翌日の走行分＋残量下限まで）
        if (ev && present && isNight(h)) {
          const target = ev.reserve + ev.dailyNeed;
          if (evSoc < target) { evCharge = Math.min(ev.chargerKw, (target - evSoc) / ev.eff); evSoc += evCharge * ev.eff; imp += evCharge; r.evGrid += evCharge; }
        }
        r.evPv += evPv; r.batOut += batD; r.v2hOut += v2hD;
        r.gen[m] += g; r.load[m] += L + evPv + evCharge; r.imp[m] += imp; r.exp[m] += exp;
        r.self[m] += g - exp;
        r.cost += imp * price;
        r.baseCost += L * price;
        if (trace && opts.traceDays && opts.traceDays.includes(d)) {
          (trace[d] = trace[d] || []).push({ h, g, L, evPv, evGrid: evCharge, imp, exp, batC, batD, v2hD, soc, evSoc });
        }
      }
    }
    // 太陽光なしの場合の EV 充電コスト（夜間に自宅充電）
    if (ev) r.baseCost += ev.annualHomeGridSide * priceAt(tariff, 2);
    const T = (a) => sum(a);
    const out = {
      panelKw, pcsKw: isFinite(pcsKw) ? pcsKw : panelKw,
      monthly: r,
      gen: T(r.gen), load: T(r.load), imp: T(r.imp), exp: T(r.exp), self: T(r.self),
      clip: r.clip, evPv: r.evPv, evGrid: r.evGrid, evPublic: r.evPublic, batOut: r.batOut, v2hOut: r.v2hOut,
      cost: r.cost, baseCost: r.baseCost, peakGen: r.peakGen, trace,
    };
    // 自家消費率・自給率
    out.selfRate = out.gen > 0 ? out.self / out.gen : 0;
    out.sufficiency = out.load > 0 ? 1 - out.imp / out.load : 0;
    out.saving = out.baseCost - out.cost;
    return out;
  }

  // ------------------------------------------------------------- 経済性 ---
  function economics(p, sim) {
    const fit = p.fit, c = p.cost;
    const years = c.years || 20;
    const fitKw = Math.min(sim.panelKw, sim.pcsKw);
    const big = fitKw >= 10;
    const priceFor = (y) => {
      if (!big) return y <= fit.res1Years ? fit.res1 : y <= fit.res1Years + fit.res2Years ? fit.res2 : fit.after;
      return y <= fit.big1Years ? fit.big1 : y <= fit.big1Years + fit.big2Years ? fit.big2 : fit.after;
    };
    const capex = (c.pvFixed + c.pvPerKw * sim.panelKw) * 10000;
    const extra = ((p.battery && p.battery.enabled ? c.battery : 0) + (p.ev && p.ev.v2h ? c.v2h : 0)) * 10000;
    const deg = (c.degradation || 0) / 100, esc = (p.tariff.escalation || 0) / 100;
    let cum = -capex, payback = null;
    const flows = [];
    for (let y = 1; y <= years; y++) {
      const g = Math.pow(1 - deg, y - 1), e = Math.pow(1 + esc, y - 1);
      const benefit = sim.saving * g * e + sim.exp * g * priceFor(y);
      const prev = cum;
      cum += benefit;
      if (payback == null && cum >= 0) payback = y - 1 + (-prev) / benefit;
      flows.push({ y, benefit, cum, sellPrice: priceFor(y) });
    }
    return {
      capex, extra, years, flows, net: cum, netWithExtra: cum - extra, payback, big,
      year1: flows[0] ? flows[0].benefit : 0,
      fitClass: big ? '10kW以上（屋根設置・地域活用要件あり）' : '住宅用（10kW未満）',
      warnSelf30: big && sim.selfRate < 0.3,
    };
  }

  // ------------------------------------------------------------ 推奨 ---
  /** 停電時の必要電力量 [kWh/日] */
  function essentialDaily(p, lb) {
    const list = CATALOG.essentials;
    const sel = (p.disaster && p.disaster.items) || list.filter((e) => e.on).map((e) => e.id);
    let total = 0; const items = [];
    for (const e of list) {
      if (!sel.includes(e.id)) continue;
      let kwh = e.kwh;
      if (e.dynamic === 'petac') {
        const pets = lb.loads.filter((l) => l.pet || l.pattern === '24h');
        const ac = pets[0] || lb.loads.find((l) => l.group === '空調');
        kwh = ac ? Math.max(...ac.monthly.map((v, m) => v / DAYS[m] / (l2count(ac) || 1))) : 0;
      }
      total += kwh; items.push({ id: e.id, label: e.label, kwh });
    }
    return { total, items };
  }
  function l2count(l) { const m = /×(\d+)/.exec(l.label); return m ? +m[1] : 1; }

  /** 容量を1枚ずつ増やしながら全ケースを計算し、推奨容量を決める */
  function analyze(p) {
    const prep = prepare(p);
    const panelKw = p.panel.watt / 1000;
    // 発電量の多い面から順に載せる（北面は既定では除外）
    const order = prep.faces.map((f, i) => ({ i, y: f.yield.annual, max: f.maxPanels, dir: f.face.dir }))
      .filter((f) => f.max > 0 && (p.allowNorth || !['N', 'NE', 'NW'].includes(f.dir) || prep.faces.length === 1))
      .sort((a, b) => b.y - a.y);
    const maxPanels = sum(order.map((o) => o.max));
    const alloc = (n) => {
      const counts = new Array(prep.faces.length).fill(0);
      let left = n;
      for (const o of order) { const k = Math.min(left, o.max); counts[o.i] = k; left -= k; }
      return counts;
    };
    const cases = [];
    for (let n = 1; n <= maxPanels; n++) {
      const counts = alloc(n);
      const sim = simulate(prep, p, counts.map((c) => c * panelKw));
      const eco = economics(p, sim);
      cases.push({ n, counts, kw: n * panelKw, sim, eco });
    }
    const zero = simulate(prep, p, prep.faces.map(() => 0));
    const consumption = zero.load;

    // 各基準
    const crit = {};
    if (cases.length) {
      const best = cases.reduce((a, b) => (b.eco.net > a.eco.net ? b : a));
      crit.econ = best;
      const thr = best.eco.net - Math.abs(best.eco.net) * 0.05;
      const inRange = cases.filter((c) => c.eco.net >= thr);
      crit.econRange = [inRange[0], inRange[inRange.length - 1]];
      crit.netZero = cases.find((c) => c.sim.gen >= consumption) || null;
      crit.roofMax = cases[cases.length - 1];
      // 停電対策：12月の曇天日でも日中の発電で必要量を賄える容量
      const ess = essentialDaily(p, prep.lb);
      crit.essential = ess;
      const winterPerPanel = (c) => {
        let s = 0;
        c.counts.forEach((k, f) => { s += k * panelKw * prep.faces[f].yield.monthly[11] / 31 * WEATHER.f[1] / 0.97; });
        return s;
      };
      crit.disaster = cases.find((c) => winterPerPanel(c) >= ess.total) || crit.roofMax;
      crit.disasterWinterGen = winterPerPanel;
    }
    const goal = p.goal || 'econ';
    let rec = null;
    if (cases.length) {
      if (goal === 'netzero') rec = crit.netZero || crit.roofMax;
      else if (goal === 'max') rec = crit.roofMax;
      else rec = crit.econ;
      if (p.disaster && p.disaster.priority && crit.disaster && crit.disaster.n > rec.n) rec = crit.disaster;
    }
    let recDetail = null;
    if (rec) {
      const days = [MONTH_START[7] + 10, MONTH_START[0] + 15];
      // 代表日：8月と1月の「晴れの日」
      const pickClear = (m) => { for (let d = MONTH_START[m]; d < MONTH_START[m] + DAYS[m]; d++) if (prep.dayType[d] === 0) return d; return MONTH_START[m]; };
      const traceDays = [pickClear(7), pickClear(0), pickClear(4)];
      const sim = simulate(prep, p, rec.counts.map((c) => c * panelKw), { trace: true, traceDays });
      recDetail = { sim, traceDays, eco: economics(p, sim) };
      void days;
    }
    return { prep, cases, crit, rec, recDetail, consumption, zero, maxPanels, order, goal };
  }

  /** 停電時の自立日数の目安 */
  function outageEstimate(p, analysis) {
    const ess = analysis.crit.essential ? analysis.crit.essential.total : 0;
    const bat = p.battery && p.battery.enabled ? (p.battery.kwh || 0) * 0.9 : 0;
    const ev = p.ev && p.ev.enabled && p.ev.v2h ? (p.ev.batteryKwh || 0) * 0.8 * 0.9 : 0;
    const storage = bat + ev;
    return {
      essential: ess, storage, battery: bat, ev,
      daysNoSun: ess > 0 ? storage / ess : null,
      selfStandOnly: !bat && !ev,
    };
  }

  const API = {
    DAYS, DIRS, DIR_LABEL, KH_JPEA, WEATHER, TSUBO,
    station, tiltRatio, khMonthly, monthlyYieldPerKw, solarShape, estimateRoof, faceMaxPanels, panelArea,
    buildLoads, degreeDays, evSetup, prepare, simulate, economics, analyze, essentialDaily, outageEstimate, sunToDeg,
  };
  root.SolarEngine = API;
  if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
