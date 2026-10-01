/*
 * 機器・制度などの前提値（すべて画面上で上書き可能）
 * 出典は docs/根拠と計算方法.md にまとめています。
 * ※ メーカー機種の数値は「代表値」です。提案時は必ず最新カタログ値で確認してください。
 */
(function (root) {
  const CATALOG = {
    // ---- 太陽電池モジュール ------------------------------------------------
    // watt: 公称最大出力[W] / l,w: 外形寸法[mm] / tc: 最大出力温度係数[%/℃] / tcAssumed: 温度係数が推定値か
    panels: [
      { id: 'sharp-nq241bt', maker: 'シャープ', model: 'BLACKSOLAR ZERO NQ-241BT', watt: 241, l: 1146, w: 996, tc: -0.35, tcAssumed: true, note: '2025年発売（同社ニュースリリース）。寄棟・小屋根向けの割付けしやすい形状' },
      { id: 'sharp-nq290bp', maker: 'シャープ', model: 'NQ-290BP', watt: 290, l: 1721, w: 768, tc: -0.35, tcAssumed: true, note: '2025年発売。細長形状' },
      { id: 'sharp-nq161bt', maker: 'シャープ', model: 'BLACKSOLAR ZERO NQ-161BT（ハーフ）', watt: 161, l: 779, w: 996, tc: -0.35, tcAssumed: true, note: '隙間埋め用の小型モジュール' },
      { id: 'gen-topcon-430', maker: '汎用（海外大手）', model: 'n型TOPCon 430W級（54セル相当）', watt: 430, l: 1722, w: 1134, tc: -0.29, tcAssumed: true, note: 'LONGi / Jinko / Trina / Canadian Solar 等の住宅向け主力サイズの代表値' },
      { id: 'gen-perc-410', maker: '汎用（海外大手）', model: 'p型PERC 410W級（54セル相当）', watt: 410, l: 1722, w: 1134, tc: -0.34, tcAssumed: true, note: 'Qcells / Canadian Solar 等の従来型の代表値' },
      { id: 'gen-hjt-400', maker: '汎用（国内メーカー系）', model: 'ヘテロ接合(HJT) 400W級', watt: 400, l: 1722, w: 1134, tc: -0.26, tcAssumed: true, note: '高温時の出力低下が小さいタイプの代表値' },
      { id: 'gen-small-250', maker: '汎用（国内メーカー系）', model: '小型高効率 250W級', watt: 250, l: 1300, w: 900, tc: -0.30, tcAssumed: true, note: '狭小屋根・寄棟向けの代表値' },
    ],

    // ---- 断熱性能（冷暖房負荷の補正係数）----------------------------------
    // JIS C 9612 の期間消費電力量が想定する住宅（平均的な木造住宅）を 1.0 とした相対値
    insulation: [
      { id: 'g3', label: '断熱等級3以下（1999年以前の基準・既存住宅）', ac: 1.0 },
      { id: 'g4', label: '断熱等級4（2025年4月以降の新築最低基準）', ac: 0.8 },
      { id: 'g5', label: '断熱等級5（ZEH水準）', ac: 0.7 },
      { id: 'g6', label: '断熱等級6（HEAT20 G2相当）', ac: 0.55 },
      { id: 'g7', label: '断熱等級7（HEAT20 G3相当）', ac: 0.42 },
    ],

    // ---- 個別エアコン：JIS C 9612 期間消費電力量（東京・18h運転・標準機の代表値）--------
    acSizes: [
      { tatami: 6, kw: 2.2, kwh: 700 },
      { tatami: 8, kw: 2.5, kwh: 800 },
      { tatami: 10, kw: 2.8, kwh: 900 },
      { tatami: 12, kw: 3.6, kwh: 1150 },
      { tatami: 14, kw: 4.0, kwh: 1400 },
      { tatami: 18, kw: 5.6, kwh: 1900 },
      { tatami: 20, kw: 6.3, kwh: 2100 },
      { tatami: 23, kw: 7.1, kwh: 2400 },
      { tatami: 26, kw: 8.0, kwh: 2800 },
    ],
    // 運転パターン：JIS 想定（6〜24時の18時間）に対する比率
    acPatterns: [
      { id: 'evening', label: '在室時のみ（朝・夜 約8時間）', short: '在室時のみ', factor: 0.5 },
      { id: 'day', label: '日中＋夜（約14時間）', short: '日中＋夜', factor: 0.8 },
      { id: '18h', label: '6時〜24時（約18時間・JIS標準）', short: '18時間', factor: 1.0 },
      { id: '24h', label: '24時間つけっぱなし（ペット・高齢者等）', short: '24時間', factor: 1.25 },
    ],
    acSeasons: [
      { id: 'both', label: '冷房＋暖房', short: '冷暖' },
      { id: 'cool', label: '冷房のみ', short: '冷房' },
      { id: 'heat', label: '暖房のみ', short: '暖房' },
    ],
    // JIS 期間消費電力量のうち冷房期間が占める割合（東京条件・代表値）
    acCoolShare: 0.27,
    // 全館空調：断熱等級4・東京相当での年間消費電力量原単位 [kWh/㎡・年]
    centralKwhPerM2: 30,

    // ---- 給湯 -------------------------------------------------------------
    waterHeaters: [
      { id: 'ecocute', label: 'エコキュート（夜間沸き上げ）', mult: 1.0, time: 'night' },
      { id: 'ecocute_day', label: 'エコキュート（昼間沸き上げ・太陽光連携）', mult: 0.92, time: 'day' },
      { id: 'hybrid', label: 'ハイブリッド給湯機（電気＋ガス）', mult: 0.6, time: 'night' },
      { id: 'electric', label: '電気温水器（ヒーター式）', mult: 3.0, time: 'night' },
      { id: 'gas', label: 'ガス給湯器（電気はほぼ使わない）', mult: 0.0, time: 'night' },
    ],
    // エコキュート年間消費電力量 = (基礎 + 1人あたり × 人数) × 地域補正
    ecocuteBase: 500, ecocutePerPerson: 250,

    cookers: [
      { id: 'ih', label: 'IHクッキングヒーター', base: 200, perPerson: 120 },
      { id: 'gas', label: 'ガスコンロ', base: 0, perPerson: 0 },
    ],
    dryers: [
      { id: 'none', label: 'なし（外干し）', kwhPerUse: 0 },
      { id: 'hp', label: 'ドラム式（ヒートポンプ乾燥）', kwhPerUse: 0.9 },
      { id: 'heater', label: 'ヒーター式乾燥機', kwhPerUse: 2.5 },
    ],
    bathDryerKwhPerUse: 1.3,
    dishwasherKwhPerUse: 0.8,
    floorHeating: [
      { id: 'none', label: 'なし', kwhPerM2: 0 },
      { id: 'hp', label: '温水式（ヒートポンプ）', kwhPerM2: 35 },
      { id: 'heater', label: '電気ヒーター式', kwhPerM2: 90 },
    ],

    // 照明・冷蔵庫・家電・待機電力（人数別の年間消費電力量 kWh）
    baseByPersons: [1700, 2300, 2700, 3000, 3300, 3600],
    ventilationKwh: 200, // 24時間換気
    remoteWorkKwh: 250,  // 在宅ワーク1人あたりの追加

    lifestyles: [
      { id: 'dual', label: '共働き等で平日日中は不在' },
      { id: 'home', label: '日中も誰か在宅（子育て・シニア等）' },
      { id: 'remote', label: '在宅ワーク中心' },
    ],

    // ---- EV / V2H ----------------------------------------------------------
    evPresets: [
      { id: 'kei', label: '軽EV（20kWh級）', kwh: 20, kmPerKwh: 7.0 },
      { id: 'compact', label: 'コンパクト〜ミドル（40kWh級）', kwh: 40, kmPerKwh: 6.5 },
      { id: 'large', label: 'ミドル〜SUV（60〜70kWh級）', kwh: 65, kmPerKwh: 5.5 },
      { id: 'phev', label: 'PHEV（約20kWh）', kwh: 20, kmPerKwh: 5.5 },
    ],

    // ---- 停電時に使いたい機器（1日あたり kWh）----------------------------
    essentials: [
      { id: 'fridge', label: '冷蔵庫', kwh: 1.2, on: true },
      { id: 'light', label: '照明（LED 数か所）', kwh: 0.4, on: true },
      { id: 'comm', label: 'スマホ充電・Wi-Fi・TV', kwh: 0.5, on: true },
      { id: 'cook', label: '電子レンジ・炊飯器', kwh: 0.6, on: true },
      { id: 'petac', label: 'ペット用エアコン1台（24時間）', kwh: 0, on: false, dynamic: 'petac' },
      { id: 'water', label: 'エコキュート沸き上げ', kwh: 4.5, on: false },
      { id: 'ih', label: 'IH調理', kwh: 1.5, on: false },
      { id: 'medical', label: '医療機器など', kwh: 1.0, on: false },
    ],

    // ---- 制度・単価（2026年10月時点の公表値）------------------------------
    tariffDefaults: {
      flat: 31,         // 円/kWh（全国家庭電気製品公正取引協議会 目安単価・税込）
      day: 38, night: 28, nightStart: 23, nightEnd: 7,
      escalation: 1.0,  // 電気料金上昇率 %/年
    },
    fitDefaults: {
      // 住宅用(10kW未満) 初期投資支援スキーム（2025年10月〜、2026年度も同水準）
      res1: 24, res1Years: 4, res2: 8.3, res2Years: 6,
      // 10kW以上（屋根設置・地域活用要件：自家消費30%以上）
      big1: 19, big1Years: 5, big2: 8.3, big2Years: 15,
      after: 8.0,       // 卒FIT後の買取単価（想定）
    },
    costDefaults: {
      // 住宅用システム費用（2025年 新築平均 28.9万円/kW を固定費＋比例費に分解した想定）
      pvFixed: 30, pvPerKw: 22,  // 万円
      battery: 0, v2h: 0,        // 万円（比較用・任意）
      degradation: 0.5,          // %/年
      years: 20,
    },
    co2: { grid: 0.423, pv: 0.0455 }, // kg-CO2/kWh（JPEA表示ガイドライン2026）
  };
  root.SOLAR_CATALOG = CATALOG;
  if (typeof module !== 'undefined') module.exports = CATALOG;
})(typeof window !== 'undefined' ? window : globalThis);
