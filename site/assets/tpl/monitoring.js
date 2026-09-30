// モニタリング記録（障害福祉サービス・障害児通所支援）。目標ごとの達成度と評価 → 本人・家族の意見 → 今後の方針 → 計画変更の要否。
(function () {
  'use strict';
  var SVC = [
    ['b', '就労継続支援B型', 6], ['a', '就労継続支援A型', 6], ['iko', '就労移行支援', 3], ['jiritsu', '自立訓練', 3],
    ['seikatsu', '生活介護', 6], ['gh', '共同生活援助（グループホーム）', 6],
    ['houday', '放課後等デイサービス', 6], ['jihatsu', '児童発達支援', 6],
  ];
  var LEVEL = [['tassei', '達成'], ['ohomune', 'おおむね達成'], ['ichibu', '一部達成'], ['mitassei', '未達成']];
  var LEVEL_TEXT = {
    tassei: '目標を達成した。',
    ohomune: 'おおむね達成している。場面によっては、まだ支援が必要なことがある。',
    ichibu: '一部達成している。',
    mitassei: '現時点では、目標の達成には至っていない。',
  };
  var SEEN = [
    ['jibun', '自分から取り組む場面が増えた', '自分から取り組む場面が増えている。'],
    ['kaisu', 'できる回数・時間が増えた', 'できる回数（時間）が増えている（開始時：　 → 現在：　）。'],
    ['shien', '支援があればできる', '職員の声かけや支援があればできるが、一人ではまだ難しい場面がある。'],
    ['basho', '慣れた場面ならできる', '慣れた場面ではできるが、初めての場面や人が多い場面では難しい。'],
    ['kufuu', '支援の工夫が合っていた', '（支援の工夫）が本人に合っており、効果が見られた。'],
    ['taichou', '体調・環境の影響があった', '体調や環境の変化の影響で、取り組めない時期があった。'],
    ['iyoku', '本人の意欲が高い', '本人の意欲が高く、続けたいと話している。'],
  ];
  var NEXT = [
    ['keizoku', '同じ目標で続ける', '同じ目標で、支援を続ける。'],
    ['step', '目標を一段上げる', '目標を一段上げ、次の段階（　　）を目指す。'],
    ['houhou', '支援の方法を変える', '目標は続け、支援の方法を（　　）に変更する。'],
    ['chiisaku', '目標を小さく分ける', '目標を小さく分け、まず（　　）から取り組む。'],
    ['shuryo', 'この目標は終了', '達成したため、この目標は終了とする。'],
  ];
  var HONNIN = [
    ['manzoku', '今の支援に満足している', '今の支援に満足していると話している。'],
    ['tsuzuke', '今の目標を続けたい', '今の目標を続けたいと話している。'],
    ['chousen', '新しいことに挑戦したい', '新しいこと（　　）に挑戦したいと話している。'],
    ['futan', '負担を感じている', '（　　）に負担を感じていると話している。'],
    ['shigoto', '就職・作業に関する希望がある', '（仕事・作業について）「　　」という希望がある。'],
  ];
  var KAZOKU = [
    ['manzoku', '家での様子もよくなっている', '家庭でも（　　）ができるようになってきたと話されている。'],
    ['tsuzuke', '今の支援を続けてほしい', '今の支援を続けてほしいとの希望がある。'],
    ['shinpai', '心配なことがある', '（　　）について心配されている。'],
    ['katei', '家での関わり方を知りたい', '家庭での関わり方について、助言がほしいとの希望がある。'],
  ];
  var NUMS = [['1', '1つ'], ['2', '2つ'], ['3', '3つ']];

  function goalFields(n) {
    return {
      title: '目標' + n, show: n, fields: [
        { id: 'g' + n, type: 'textarea', label: '目標（計画から貼り付け）', ph: n === 1 ? '例：作業の手順書を見ながら、一人で袋詰めを最後までできる。' : '', show: function (v) { return Number(v.num) >= n; } },
        { id: 'l' + n, type: 'select', label: '達成の度合い', options: LEVEL, def: 'ichibu', show: function (v) { return Number(v.num) >= n; } },
        { id: 's' + n, type: 'chips', label: '見られた変化・様子', options: SEEN.map(function (x) { return [x[0], x[1]]; }), show: function (v) { return Number(v.num) >= n; } },
        { id: 'n' + n, type: 'select', label: 'これから', options: NEXT.map(function (x) { return [x[0], x[1]]; }), show: function (v) { return Number(v.num) >= n; } },
      ],
    };
  }

  Formdoc.run({
    title: 'モニタリング記録',
    ai: { role: '障害福祉サービス・障害児通所支援のサービス管理責任者（児童発達支援管理責任者）', doc: 'モニタリング記録', rules: ['達成の度合いは変えない。', '評価は「どの場面で・どのくらい」できるようになったかを具体的に書く。', '（　）の空欄は推測で埋めず、【要確認】と書く。'] },
    blocks: [
      { title: 'サービスと時期', fields: [
        { id: 'svc', type: 'select', label: 'サービス', options: SVC.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'date', type: 'date', label: '実施日', today: true, half: true },
        { id: 'how', type: 'select', label: '方法', options: ['本人と面談', '本人・家族と面談', '家族と面談（本人の意見は事前に聞き取り）', '電話・オンライン'], half: true },
        { id: 'num', type: 'seg', label: '目標の数', options: NUMS, def: '2' },
      ] },
      goalFields(1), goalFields(2), goalFields(3),
      { title: '本人・家族の意見', fields: [
        { id: 'honnin', type: 'chips', label: '本人の意見', options: HONNIN.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'hvoice', type: 'text', label: '本人の言葉', ph: '例：もっと早くできるようになりたい' },
        { id: 'kazoku', type: 'chips', label: '家族の意見', options: KAZOKU.map(function (x) { return [x[0], x[1]]; }) },
      ] },
    ],
    build: function (v, H) {
      var svc = SVC.filter(function (x) { return x[0] === v.svc; })[0];
      var n = Number(v.num);
      var rows = [];
      var change = false;
      for (var i = 1; i <= n; i++) {
        var seen = SEEN.filter(function (x) { return v['s' + i].indexOf(x[0]) !== -1; }).map(function (x) { return x[2]; }).join('');
        var nx = NEXT.filter(function (x) { return x[0] === v['n' + i]; })[0];
        if (nx[0] !== 'keizoku') change = true;
        rows.push(['目標' + i, v['g' + i].trim(), LEVEL.filter(function (x) { return x[0] === v['l' + i]; })[0][1], LEVEL_TEXT[v['l' + i]] + seen, nx[2]]);
      }
      var honnin = HONNIN.filter(function (x) { return v.honnin.indexOf(x[0]) !== -1; }).map(function (x) { return x[2]; }).join('');
      var hv = v.hvoice.trim().replace(/^「|」$/g, '');
      if (hv) honnin += '「' + hv + '」';
      var kazoku = KAZOKU.filter(function (x) { return v.kazoku.indexOf(x[0]) !== -1; }).map(function (x) { return x[2]; }).join('');
      var m = /^(\d{4})-(\d{2})/.exec(v.date);
      var next = '';
      if (m) { var y = Number(m[1]), mo = Number(m[2]) + svc[2]; while (mo > 12) { mo -= 12; y++; } next = y + '年' + mo + '月ごろまでに実施する（' + svc[1] + '：' + svc[2] + 'か月に1回以上）。'; }
      return {
        title: 'モニタリング記録',
        left: svc[1],
        right: '実施日：' + H.date(v.date) + '\n実施者：',
        sections: [
          { h: '実施の概要', rows: [['方法', 'how', v.how], ['対象期間', 'period', '', '（前回の計画作成日〜今回）']] },
          { key: 'goals', h: '目標ごとの評価', grid: { head: ['', '目標', '達成度', '評価（見られた変化）', 'これから'], widths: ['52px', '', '72px', '', ''], rowHead: true, rows: rows, ph: '（記入）' } },
          { h: '意見と方針', rows: [
            ['本人の意見', 'honnin', honnin, '（本人から聞き取った内容）'],
            ['家族の意見', 'kazoku', kazoku, '（必要に応じて記入）'],
            ['今後の方針', 'policy', change ? '評価をふまえ、目標と支援内容を見直した個別支援計画を作成する。' : '現在の個別支援計画の目標と支援内容で、支援を続ける。'],
            ['計画の変更', 'change', change ? '変更あり' : '変更なし'],
            ['次回のモニタリング', 'next', next],
          ] },
        ],
        foot: '計画を変更する場合は、個別支援会議を開いて原案を作り、本人（保護者）に説明して同意を得てから交付します。',
      };
    },
    warn: function (v) {
      for (var i = 1; i <= Number(v.num); i++) if (!v['g' + i].trim()) return '目標' + i + 'の欄に、個別支援計画の目標を貼り付けてください。';
      if (!v.honnin.length && !v.hvoice.trim()) return '本人の意見を必ず聞き取り、記録しましょう。家族だけと面談した場合も、事前に本人の意見を聞いておきます。';
      return '';
    },
  });
})();
