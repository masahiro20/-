// 障害福祉の支援記録（日々の記録）。通所の状況 → 活動 → 様子 → 本人の言葉 → 支援 → 結果 → 計画とのつながり。
(function () {
  'use strict';
  var SVC = [['b', '就労B'], ['a', '就労A'], ['iko', '就労移行'], ['seikatsu', '生活介護'], ['gh', 'グループホーム']];
  var ACTS = {
    b: ['袋詰め・シール貼り', '部品の組み立て', '清掃作業', '農作業', 'パン・お菓子づくり', 'パソコン入力', '施設外就労', '販売・接客'],
    a: ['製造ライン', '清掃作業', '調理・盛り付け', '検品・梱包', 'パソコン入力', '施設外就労', '販売・接客'],
    iko: ['ビジネスマナーの訓練', 'パソコンの訓練', '模擬作業', '面接の練習', '求人の検索・応募書類づくり', '企業での実習', '職場見学'],
    seikatsu: ['創作活動', '軽運動・体操', '散歩', '音楽活動', '入浴', '機能訓練', '生産活動（軽作業）'],
    gh: ['起床・身支度', '食事', '服薬', 'お金の管理', '買い物', '余暇の過ごし方', '通院の同行', '掃除・洗濯'],
  };
  var ATTEND = [
    ['teiji', '通所（予定どおり）'], ['chikoku', '遅刻'], ['soutai', '早退'], ['zaitaku', '在宅での支援'], ['gh', '（GH）在宅・日中活動へ'],
  ];
  // [id, 選択肢, 文]
  var LOOK = [
    ['shuchu', '集中して取り組めた', '作業中は手を止めることなく、集中して取り組んでいた。'],
    ['kyukei', '休憩をはさみながら', '途中で2回休憩をはさみながら、最後まで取り組んだ。'],
    ['tejun', '手順を自分で確認できた', '手順書を自分で見返しながら進めていた。'],
    ['ryou', 'できた量が増えた', '前回より作業量が増えた（　個 → 　個）。'],
    ['shitsumon', '職員に質問できた', '分からないところを、自分から職員に質問できた。'],
    ['kaiwa', 'ほかの利用者と会話', '休憩時間に、ほかの利用者と会話を楽しんでいた。'],
    ['tsukare', '疲れた様子', '午後になると手が止まることが増え、疲れた様子だった。'],
    ['katai', '表情がかたい', '朝から表情がかたく、あいさつの声も小さかった。'],
    ['iraira', 'いらいらした様子', '作業がうまく進まず、道具を強く置く場面があった。'],
    ['fuchou', '体調の不調を訴えた', '（時刻）ごろ、頭痛を訴えた。'],
  ];
  var SUPPORT = [
    ['photo', '手順を写真・カードで示した', '作業の手順を写真カードで示した。'],
    ['kowake', '作業を小分けにした', '作業を小分けにし、一つ終わるごとに確認した。'],
    ['kyukei', '休憩のタイミングを一緒に決めた', '休憩をとるタイミングを、本人と一緒に決めた。'],
    ['koekake', '声かけで作業に戻れるよう促した', '手が止まったときは、次にすることを短く伝えた。'],
    ['homeru', 'できたことを具体的に伝えた', '「今日は自分で手順書を確認できましたね」と、できたことを具体的に伝えた。'],
    ['soudan', '困ったときの伝え方を練習', '困ったときに「手伝ってください」と伝える練習をした。'],
    ['mendan', '面談で気持ちを聞き取った', '個別に時間をとり、気持ちを聞き取った。'],
    ['fukuyaku', '服薬の確認・声かけ', '昼食後の服薬を声かけし、飲んだことを確認した。'],
    ['kankyo', '作業の場所・環境を調整', '音が気になる様子だったため、作業の場所を静かな席に変えた。'],
    ['renraku', '家族・関係機関に連絡', 'ご家族（相談支援専門員）に、本日の様子を連絡した。'],
  ];
  var RESULT = [
    ['hitori', '最後まで一人でできた', '最後まで一人で作業を終えることができた。'],
    ['jibun', '自分から休憩を申し出た', '疲れたときに、自分から「休憩します」と伝えることができた。'],
    ['modoru', '声かけで作業に戻れた', '声かけのあと、自分で作業に戻ることができた。'],
    ['ochitsuku', '気持ちが落ち着いた', '話を聞いたあとは表情がやわらぎ、午後の作業に参加できた。'],
    ['soutai', '途中で帰宅した', '体調が戻らず、（時刻）に早退した。'],
    ['kadai', '課題が残った', '（残った課題）については、次回も同じ支援を続けて様子を見る。'],
  ];

  Formdoc.run({
    title: '支援記録',
    ai: { role: '障害福祉サービス事業所の支援員', doc: '支援記録（日々の記録）', rules: ['主観的な言葉を避け、見たこと・聞いたことを書く。', '本人の言葉は「」でそのまま残す。', '支援内容と、その結果を必ずセットで書く。', '個別支援計画の目標とのつながりが分かるように書く。'] },
    blocks: [
      { title: 'サービスと通所の状況', fields: [
        { id: 'svc', type: 'seg', options: SVC },
        { id: 'date', type: 'date', label: '日付', today: true, half: true },
        { id: 'attend', type: 'select', label: '通所の状況', options: ATTEND, half: true },
        { id: 'inout', type: 'text', label: '時間', ph: '例：9:30〜15:30' },
      ] },
      { title: '活動と様子', fields: [
        { id: 'acts', type: 'chips', label: '活動・作業', max: 3, options: function (v) { return ACTS[v.svc].map(function (a, i) { return [v.svc + i, a]; }); } },
        { id: 'look', type: 'chips', label: '様子', options: LOOK.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'words', type: 'text', label: '本人の言葉', hint: '「」の中身をそのまま', ph: '例：明日はもっとたくさんやりたい' },
      ] },
      { title: '支援と結果', fields: [
        { id: 'sup', type: 'chips', label: '職員がした支援', options: SUPPORT.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'res', type: 'chips', label: '結果', options: RESULT.map(function (x) { return [x[0], x[1]]; }) },
      ] },
      { title: '個別支援計画とのつながり', fields: [
        { id: 'goal', type: 'textarea', label: '関係する目標', hint: '計画の短期目標を貼り付け', ph: '例：困ったときに、自分から職員に伝えることができる。' },
      ] },
    ],
    build: function (v, H) {
      var svcName = SVC.filter(function (x) { return x[0] === v.svc; })[0][1];
      var acts = ACTS[v.svc].filter(function (a, i) { return v.acts.indexOf(v.svc + i) !== -1; });
      var pick = function (list, ids) { return list.filter(function (x) { return ids.indexOf(x[0]) !== -1; }).map(function (x) { return x[2]; }).join(''); };
      var words = v.words.trim().replace(/^「|」$/g, '');
      var attend = ATTEND.filter(function (x) { return x[0] === v.attend; })[0][1] + (v.inout ? '（' + v.inout + '）' : '');
      var goal = v.goal.trim();
      return {
        title: '支援記録',
        left: svcName,
        right: H.date(v.date) + '\n記録者：',
        sections: [
          { h: '記録', w2: '120px', rows: [
            ['通所の状況', 'attend', attend],
            ['活動・作業', 'acts', acts.length ? '本日は、' + acts.join('、') + 'に取り組んだ。' : '', '（活動を選ぶと入ります）'],
            ['様子', 'look', pick(LOOK, v.look), '（様子を選ぶと入ります）'],
            ['本人の言葉', 'words', words ? '「' + words + '」' : '', '（本人の言葉をそのまま）'],
            ['支援内容', 'sup', pick(SUPPORT, v.sup), '（支援を選ぶと入ります）'],
            ['結果', 'res', pick(RESULT, v.res), '（結果を選ぶと入ります）'],
            ['計画とのつながり', 'goal', goal ? '短期目標「' + goal + '」に向けた支援。' + (v.res.length ? '本日の結果をモニタリングの材料とする。' : '') : '', '（関係する目標を貼り付け）'],
          ] },
        ],
      };
    },
    warn: function (v) {
      if (v.sup.length && !v.res.length) return '支援内容だけでなく、その結果（本人がどうだったか）も書くと、支援の効果が分かり、モニタリングの根拠になります。';
      if (!v.goal.trim()) return '個別支援計画の目標を貼り付けておくと、「計画にもとづいた支援をしている」記録になります。運営指導でも見られるところです。';
      return '';
    },
  });
})();
