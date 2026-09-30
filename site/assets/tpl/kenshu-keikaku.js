// 研修・訓練・委員会の年間計画表。サービスの種類ごとの回数の目安に合わせて、12か月に割り振る。
(function () {
  'use strict';
  var SVC = [
    ['k-shisetsu', '介護：施設（特養・老健・介護医療院）'],
    ['k-kyoju', '介護：グループホーム・特定施設'],
    ['k-tanki', '介護：短期入所・小規模多機能'],
    ['k-tsusho', '介護：通所系（デイサービス・デイケア）'],
    ['k-houmon', '介護：訪問系・居宅介護支援'],
    ['s-nitchu', '障害福祉：通所・入所・グループホーム'],
    ['s-houmon', '障害福祉：訪問系・相談支援'],
    ['jido', '児童：放課後等デイ・児童発達支援'],
  ];
  // [id, 名前, 列(kenshu|kunren|iinkai), 回数{svc:n}, 開始月からの位置, まとめる相手]
  var ITEMS = [
    ['gyakutai', '虐待防止の研修', 'kenshu', { 'k-shisetsu': 2, 'k-kyoju': 2, 'k-tanki': 1, 'k-tsusho': 1, 'k-houmon': 1, 's-nitchu': 1, 's-houmon': 1, jido: 1 }, 1],
    ['kousoku', '身体拘束等の適正化の研修', 'kenshu', { 'k-shisetsu': 2, 'k-kyoju': 2, 'k-tanki': 2, 'k-tsusho': 0, 'k-houmon': 0, 's-nitchu': 1, 's-houmon': 1, jido: 1 }, 2, 'gyakutai'],
    ['kansen', '感染症の予防・まん延防止の研修', 'kenshu', { 'k-shisetsu': 2, 'k-kyoju': 2, 'k-tanki': 1, 'k-tsusho': 1, 'k-houmon': 1, 's-nitchu': 2, 's-houmon': 1, jido: 2 }, 6],
    ['bcp', '業務継続計画（BCP）の研修', 'kenshu', { 'k-shisetsu': 2, 'k-kyoju': 2, 'k-tanki': 1, 'k-tsusho': 1, 'k-houmon': 1, 's-nitchu': 1, 's-houmon': 1, jido: 1 }, 3, 'kansen'],
    ['jiko', '事故発生の防止の研修', 'kenshu', { 'k-shisetsu': 2 }, 8],
    ['anzen', '安全計画に基づく研修（送迎・置き去り防止など）', 'kenshu', { jido: 1 }, 0],
    ['kansen-k', '感染症の訓練（発生時のシミュレーション）', 'kunren', { 'k-shisetsu': 2, 'k-kyoju': 2, 'k-tanki': 1, 'k-tsusho': 1, 'k-houmon': 1, 's-nitchu': 2, 's-houmon': 1, jido: 2 }, 7],
    ['bcp-k', 'BCPの訓練（机上訓練・参集訓練など）', 'kunren', { 'k-shisetsu': 2, 'k-kyoju': 2, 'k-tanki': 1, 'k-tsusho': 1, 'k-houmon': 1, 's-nitchu': 1, 's-houmon': 1, jido: 1 }, 4, 'bousai'],
    ['bousai', '消火・避難訓練', 'kunren', { 'k-shisetsu': 2, 'k-kyoju': 2, 'k-tanki': 2, 'k-tsusho': 2, 's-nitchu': 2, jido: 2 }, 5],
    ['anzen-k', '安全計画に基づく訓練（送迎時の確認など）', 'kunren', { jido: 1 }, 2],
    ['gyakutai-i', '虐待防止委員会', 'iinkai', { 'k-shisetsu': 1, 'k-kyoju': 1, 'k-tanki': 1, 'k-tsusho': 1, 'k-houmon': 1, 's-nitchu': 1, 's-houmon': 1, jido: 1 }, 1],
    ['kousoku-i', '身体拘束等適正化検討委員会', 'iinkai', { 'k-shisetsu': 4, 'k-kyoju': 4, 'k-tanki': 4, 's-nitchu': 1, 's-houmon': 1, jido: 1 }, 1],
    ['kansen-i', '感染対策委員会', 'iinkai', { 'k-shisetsu': 4, 'k-kyoju': 2, 'k-tanki': 2, 'k-tsusho': 2, 'k-houmon': 2, 's-nitchu': 4, 's-houmon': 2, jido: 4 }, 0],
    ['jiko-i', '事故防止検討委員会', 'iinkai', { 'k-shisetsu': 1 }, 0],
  ];
  var COLS = [['kenshu', '研修'], ['kunren', '訓練'], ['iinkai', '委員会']];
  function countText(n, it, svc) {
    var shisetsu = svc === 'k-shisetsu' || svc === 'k-kyoju';
    var base = it[2] === 'iinkai' ? (n === 4 ? '3か月に1回以上' : n === 2 ? '6か月に1回以上' : '年1回以上') : '年' + n + '回以上';
    if (it[2] === 'kenshu' && ['gyakutai', 'kousoku', 'kansen'].indexOf(it[0]) !== -1 && (shisetsu || it[0] === 'gyakutai')) base += '＋新規採用時';
    return base;
  }

  Formdoc.run({
    title: '研修・訓練・委員会 年間計画表',
    ai: { role: '介護・障害福祉事業所の管理者', doc: '研修・訓練・委員会の年間計画表', rules: ['月ごとの割り振りと回数は変えない。', '各月の研修のテーマ案と、担当者の役割分担の例を添える。'] },
    blocks: [
      { title: 'サービスの種類', fields: [
        { id: 'svc', type: 'seg', wide: true, options: SVC },
      ] },
      { title: '計画の期間', fields: [
        { id: 'year', type: 'select', label: '年（年度）', options: (function () { var y = new Date().getFullYear(); var m = new Date().getMonth() + 1; var b = m >= 4 ? y : y - 1; return [[String(b), String(b)], [String(b + 1), String(b + 1)]]; })(), half: true },
        { id: 'start', type: 'select', label: '始まりの月', options: [['4', '4月'], ['1', '1月'], ['10', '10月']], half: true },
        { id: 'combine', type: 'seg', label: '関連する研修・訓練', options: [['sep', 'べつべつの月に'], ['join', '同じ月にまとめる']], def: 'sep' },
      ] },
    ],
    build: function (v) {
      var start = Number(v.start);
      var cells = [];
      for (var i = 0; i < 12; i++) cells.push({ kenshu: [], kunren: [], iinkai: [] });
      var offsets = {};
      ITEMS.forEach(function (it) { offsets[it[0]] = it[4]; });
      if (v.combine === 'join') ITEMS.forEach(function (it) { if (it[5]) offsets[it[0]] = offsets[it[5]]; });
      var summary = [];
      ITEMS.forEach(function (it) {
        var n = it[3][v.svc] || 0;
        if (!n) return;
        var step = 12 / n;
        for (var k = 0; k < n; k++) cells[(offsets[it[0]] + Math.round(k * step)) % 12][it[2]].push(it[2] === 'kenshu' ? it[1].replace(/の研修$/, '') : it[1]);
        summary.push([it[1], countText(n, it, v.svc)]);
      });
      var rows = cells.map(function (c, i) {
        var mo = ((start - 1 + i) % 12) + 1;
        return [mo + '月', c.kenshu.join('\n'), c.kunren.join('\n'), c.iinkai.join('\n'), ''];
      });
      var label = SVC.filter(function (x) { return x[0] === v.svc; })[0][1];
      var y = Number(v.year);
      var yearText = v.start === '1' ? y + '年（1月〜12月）' : v.start === '10' ? y + '年10月〜' + (y + 1) + '年9月' : y + '年度（' + y + '年4月〜' + (y + 1) + '年3月）';
      return {
        title: '研修・訓練・委員会 年間計画表',
        left: label,
        right: yearText,
        sections: [
          { key: 'plan', grid: { head: ['月', '研修', '訓練', '委員会', '担当・メモ'], widths: ['52px', '', '', '', '120px'], rowHead: true, rows: rows, ph: '　' } },
          { key: 'sum', h: '回数の目安', grid: { head: ['研修・訓練・委員会', '回数の目安'], widths: ['', '200px'], rowHead: true, rows: summary.length ? summary : [['（なし）', '']] } },
        ],
        foot: '回数はサービスの種類ごとの目安です（介護は松山市の資料、障害福祉は各自治体の資料をもとに作成）。自治体によって求めが異なるため、必ず指定権者の資料で確認してください。関連する研修・訓練（虐待防止と身体拘束、感染症とBCP、BCPと消火・避難訓練など）は一体で行ってもかまいませんが、それぞれの内容を実施したことが分かるように記録します。',
      };
    },
    warn: function (v) {
      if (v.svc === 'k-tsusho' || v.svc === 'k-houmon') return '訪問系・通所系は身体拘束の委員会・研修の義務はありませんが、身体拘束を行う場合の記録は必要です。年1回の研修を求める自治体もあります。';
      if (v.svc === 'jido') return '放課後等デイサービス・児童発達支援は、安全計画（送迎・置き去り防止を含む）の研修と訓練も必要です。児童発達支援センターは避難・消火訓練を毎月行う必要があるなど、施設の種類で回数が変わります。';
      return '';
    },
  });
})();
