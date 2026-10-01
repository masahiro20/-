// 実行: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/data/climate.js');
require('../js/data/catalog.js');
const E = require('../js/engine.js');
const CL = globalThis.SOLAR_CLIMATE;
const C = globalThis.SOLAR_CATALOG;

const clone = (o) => JSON.parse(JSON.stringify(o));
function baseParams() {
  const p = {
    location: { station: '東京' },
    house: { persons: 4, lifestyle: 'dual', remoteWorkers: 0, floorTsubo: 35, floors: 2, insulation: 'g5' },
    roofShape: { type: 'kirizuma', mainDir: 'S', slopeSun: 4 },
    panel: { watt: 430, l: 1722, w: 1134, tc: -0.29 },
    generation: { method: 'jpea', mount: 'roof', tempCoef: -0.29, pcsEff: 0.96, otherLoss: 0.95, snowLoss: 0, pcsKw: 0 },
    ac: { central: false, units: [
      { name: 'LDK', tatami: 18, count: 1, pattern: 'day', season: 'both' },
      { name: '寝室', tatami: 8, count: 1, pattern: 'evening', season: 'both' },
    ] },
    waterHeater: 'ecocute', cooker: 'ih', extras: { dishwasher: true, dryer: 'none' },
    ev: { enabled: false }, battery: { enabled: false },
    disaster: { items: ['fridge', 'light', 'comm', 'cook'], priority: false },
    tariff: Object.assign({ type: 'flat' }, C.tariffDefaults), fit: clone(C.fitDefaults), cost: clone(C.costDefaults), goal: 'econ',
  };
  p.roof = E.estimateRoof(p);
  return p;
}
const yieldAt = (st, dir, sun, gen) => E.monthlyYieldPerKw(E.station(st), { dir, slopeSun: sun }, gen || baseParams().generation).annual;

test('気象データ：47都道府県をすべてカバーし、値が妥当', () => {
  const prefs = new Set(Object.values(CL.stations).map((s) => s.pref));
  assert.equal(prefs.size, 47);
  for (const [name, s] of Object.entries(CL.stations)) {
    assert.equal(s.H.length, 12, name);
    s.H.forEach((h) => assert.ok(h > 0.5 && h < 8, `${name} H=${h}`));
    assert.equal(s.temp.length, 12);
    // 南向き傾斜面は冬に水平面より日射が多い
    assert.ok(s.ratio[5][0][0] > 1000, `${name} 1月 南31°比`);
  }
});

test('発電量：東京・南30°の1kWあたり年間発電量が一般的な範囲（1,050〜1,300kWh）', () => {
  const y = yieldAt('東京', 'S', 5.8);
  assert.ok(y > 1050 && y < 1300, String(y));
});

test('発電量：地域差（名古屋 > 東京 > 富山）と方位差（南 > 東≒西 > 北）', () => {
  assert.ok(yieldAt('名古屋', 'S', 5) > yieldAt('東京', 'S', 5));
  assert.ok(yieldAt('東京', 'S', 5) > yieldAt('富山', 'S', 5));
  const s = yieldAt('東京', 'S', 4), e = yieldAt('東京', 'E', 4), w = yieldAt('東京', 'W', 4), n = yieldAt('東京', 'N', 4);
  assert.ok(s > e && s > w && e > n && w > n);
  assert.ok(Math.abs(e - w) / s < 0.06, 'east/west');
  assert.ok(e / s > 0.75 && e / s < 0.92, 'east ratio ' + e / s);
});

test('発電量：JIS方式では温度係数が小さいパネルほど発電量が多い', () => {
  const g = Object.assign(baseParams().generation, { method: 'jis' });
  const a = yieldAt('東京', 'S', 5, Object.assign({}, g, { tempCoef: -0.26 }));
  const b = yieldAt('東京', 'S', 5, Object.assign({}, g, { tempCoef: -0.41 }));
  assert.ok(a > b);
});

test('日射の時間配分：合計1、東向きは午前、西向きは午後にピーク', () => {
  const st = E.station('東京');
  const e = E.solarShape(st, 6, 'E'), w = E.solarShape(st, 6, 'W');
  assert.ok(Math.abs(e.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  const peak = (a) => a.indexOf(Math.max(...a));
  assert.ok(peak(e) < peak(w));
  assert.equal(e[0] + e[23], 0);
});

test('屋根の推定：切妻は2面（対向）、寄棟は4面', () => {
  const p = baseParams();
  assert.deepEqual(E.estimateRoof(p).map((f) => f.dir), ['S', 'N']);
  p.roofShape = { type: 'yosemune', mainDir: 'S', slopeSun: 4 };
  assert.deepEqual(E.estimateRoof(p).map((f) => f.dir).sort(), ['E', 'N', 'S', 'W']);
  p.roofShape = { type: 'kirizuma', mainDir: 'E', slopeSun: 4 };
  assert.deepEqual(E.estimateRoof(p).map((f) => f.dir), ['E', 'W']);
});

test('消費量：人数・24時間空調・断熱・寒冷地の影響が正しい向き', () => {
  const total = (p) => E.buildLoads(p, E.station(p.location.station)).loads.reduce((s, l) => s + l.annual, 0);
  const p = baseParams();
  const q = clone(p); q.house.persons = 2;
  assert.ok(total(q) < total(p));
  const r = clone(p); r.ac.units[0].pattern = '24h';
  assert.ok(total(r) > total(p));
  const s = clone(p); s.house.insulation = 'g7';
  assert.ok(total(s) < total(p));
  const t = clone(p); t.location.station = '札幌';
  const acT = E.buildLoads(t, E.station('札幌')).loads.filter((l) => l.group === '空調').reduce((a, l) => a + l.annual, 0);
  const acP = E.buildLoads(p, E.station('東京')).loads.filter((l) => l.group === '空調').reduce((a, l) => a + l.annual, 0);
  assert.ok(acT > acP);
});

test('エネルギー収支：蓄電池・EVなしでは 買電＋自家消費 ＝ 消費', () => {
  const p = baseParams();
  const prep = E.prepare(p);
  const sim = E.simulate(prep, p, [5, 0]);
  assert.ok(Math.abs(sim.imp + (sim.gen - sim.exp) - sim.load) < 1e-6);
  assert.ok(Math.abs(sim.self - (sim.gen - sim.exp)) < 1e-6);
  // 月別に積み上げても一致
  const mg = sim.monthly.gen.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(mg - sim.gen) < 1e-6);
  // 年間発電量は 月別計算式（JPEA）と一致（時間配分・天候配分で総量が変わらない）
  const y = prep.faces[0].yield.annual * 5;
  assert.ok(Math.abs(sim.gen - y) / y < 1e-6);
});

test('蓄電池・V2H・余剰充電で自家消費率と自給率が上がる', () => {
  const p = baseParams();
  const base = E.simulate(E.prepare(p), p, [6, 0]);
  const q = clone(p); q.battery = { enabled: true, kwh: 7, kw: 3, roundTrip: 90 };
  const withBat = E.simulate(E.prepare(q), q, [6, 0]);
  assert.ok(withBat.selfRate > base.selfRate + 0.1);
  assert.ok(withBat.sufficiency > base.sufficiency);
  const r = clone(p); r.ev = { enabled: true, batteryKwh: 40, kmPerKwh: 6.5, kmPerYear: 10000, homeChargePct: 100, homeDaysPerWeek: 3, v2h: true, reservePct: 30, solarCharge: true };
  const withEv = E.simulate(E.prepare(r), r, [6, 0]);
  assert.ok(withEv.evPv > 0 && withEv.v2hOut > 0);
  assert.ok(withEv.selfRate > base.selfRate);
  assert.equal(Math.round(withEv.evPublic), 0);
});

test('経済性：FIT区分と回収年数', () => {
  const p = baseParams();
  const prep = E.prepare(p);
  const sim = E.simulate(prep, p, [5, 0]);
  const eco = E.economics(p, sim);
  assert.equal(eco.big, false);
  assert.equal(eco.flows[0].sellPrice, 24);
  assert.equal(eco.flows[4].sellPrice, 8.3);
  assert.equal(eco.flows[10].sellPrice, 8.0);
  assert.equal(eco.capex, (30 + 22 * 5) * 10000);
  if (eco.payback != null) {
    // 回収年の前後で累計がマイナス→プラスに
    const y = Math.floor(eco.payback);
    assert.ok(y === 0 || eco.flows[y - 1].cum < 0);
    assert.ok(eco.flows[y].cum >= 0);
  }
  // パワコン10kW以上なら事業用区分
  const q = clone(p); q.generation.pcsKw = 10;
  const sim2 = E.simulate(E.prepare(q), q, [11, 0]);
  assert.equal(E.economics(q, sim2).big, true);
  // パネル11kWでもパワコン自動(9.9kW)なら住宅用区分＋ピークカット
  const sim3 = E.simulate(prep, p, [11, 0]);
  assert.equal(E.economics(p, sim3).big, false);
  assert.ok(sim3.clip >= 0 && sim3.peakGen <= 9.9 + 1e-9);
});

test('推奨容量：目的ごとの選択ルール', () => {
  const p = baseParams();
  p.roofShape = { type: 'katanagare', mainDir: 'S', slopeSun: 4 };
  p.roof = E.estimateRoof(p);
  const a = E.analyze(p);
  assert.ok(a.cases.length > 10);
  assert.ok(a.rec.n >= 1 && a.rec.n <= a.maxPanels);
  assert.equal(a.rec.eco.net, Math.max(...a.cases.map((c) => c.eco.net)));
  if (a.crit.netZero) {
    assert.ok(a.crit.netZero.sim.gen >= a.consumption);
    const prev = a.cases[a.crit.netZero.n - 2];
    if (prev) assert.ok(prev.sim.gen < a.consumption);
  }
  const m = clone(p); m.goal = 'max';
  assert.equal(E.analyze(m).rec.n, a.maxPanels);
  const nz = clone(p); nz.goal = 'netzero';
  const b = E.analyze(nz);
  assert.equal(b.rec.n, (b.crit.netZero || b.crit.roofMax).n);
  // 費用が高いほど経済最適容量は小さく（または同じ）なる
  const ex = clone(p); ex.cost.pvPerKw = 40;
  assert.ok(E.analyze(ex).crit.econ.n <= a.crit.econ.n);
});

test('停電対策を優先すると、推奨は停電対策ライン以上になる', () => {
  const p = baseParams();
  p.ac.units[0].pattern = '24h'; p.ac.units[0].pet = true;
  p.disaster = { items: ['fridge', 'light', 'comm', 'cook', 'petac'], priority: true };
  p.cost.pvPerKw = 60; // 経済性だけなら小さい容量になる条件
  const a = E.analyze(p);
  assert.ok(a.crit.essential.total > 5);
  assert.ok(a.rec.n >= a.crit.disaster.n);
});
