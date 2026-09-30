// 個別支援会議（担当者会議）の記録。障害福祉サービス・障害児通所支援。本人参加の原則（令和6年度〜）に対応。
(function () {
  'use strict';
  var SECTOR = [['shogai', '障害福祉サービス'], ['jido', '児童（放デイ・児発）']];
  var PURPOSE = [['new', '新しく計画を作る'], ['update', '計画の更新（モニタリング後）'], ['change', '計画の変更']];
  var MEMBERS = {
    shogai: ['本人', '家族', 'サービス管理責任者', '生活支援員', '職業指導員', '就労支援員', '看護職員', '相談支援専門員', 'グループホームの職員'],
    jido: ['本人', '保護者', '児童発達支援管理責任者', '児童指導員', '保育士', '理学療法士・作業療法士・言語聴覚士', '相談支援専門員', '学校・園の先生'],
  };
  // [id, 選択肢, 検討した内容, 業種（空ならどちらも）]
  var ITEMS = [
    ['assess', 'アセスメントの結果の共有', 'アセスメントの結果（生活・作業・健康・対人関係などの状況）を共有した。', ''],
    ['iko', '本人・家族の意向の確認', '本人と家族の生活に対する意向を確認した。', ''],
    ['mon', '前回の計画の評価（モニタリング）', '前回の計画の目標ごとの達成状況と、支援の効果を振り返った。', ''],
    ['goal', '長期目標・短期目標', '本人の意向とアセスメントの結果をふまえ、長期目標と短期目標を検討した。', ''],
    ['naiyou', '具体的な支援内容', '目標ごとの具体的な支援内容と、担当する職員・期間を検討した。', ''],
    ['ryouiki', '5領域との関連', '本人支援の内容と、5領域（健康・生活／運動・感覚／認知・行動／言語・コミュニケーション／人間関係・社会性）との関連を確認した。', 'jido'],
    ['kazoku', '家族支援・移行支援・地域連携', '家族支援・移行支援・地域支援（地域連携）の内容を検討した。', 'jido'],
    ['shuro', '就労に向けた方針', '一般就労（または継続した利用）に向けた方針と、必要な訓練・実習を検討した。', 'shogai'],
    ['kenkou', '健康面・服薬の留意事項', '健康面・服薬に関する留意事項と、体調が悪いときの対応を確認した。', ''],
    ['renkei', '関係機関との連携', '相談支援事業所・医療機関・学校など、関係機関との連携の方法を確認した。', ''],
  ];
  var DECIDE = [
    ['gen', '原案のとおり計画を作る', '検討した内容をもとに、個別支援計画の原案を作成する。'],
    ['shusei', '目標を一部修正する', '短期目標の一部を修正する（修正内容：　　）。'],
    ['tsuika', '支援内容を追加する', '支援内容に（　　）を追加する。'],
    ['jikan', '利用日数・時間を見直す', '利用日数（時間）を（　　）に見直す。'],
    ['mon', '次回のモニタリング時期', '次回のモニタリングは（　年　月）ごろに行う。'],
  ];

  Formdoc.run({
    title: '個別支援会議 記録',
    ai: { role: '障害福祉サービス・障害児通所支援のサービス管理責任者（児童発達支援管理責任者）', doc: '個別支援会議の記録', rules: ['本人・家族の意見は、言葉をそのまま残す。', '検討した内容と決まったことを分けて書く。', '（　）の空欄は推測で埋めず、【要確認】と書く。'] },
    blocks: [
      { title: '会議の概要', fields: [
        { id: 'sector', type: 'seg', options: SECTOR },
        { id: 'purpose', type: 'select', label: '会議の目的', options: PURPOSE },
        { id: 'date', type: 'date', label: '開催日', today: true, half: true },
        { id: 'time', type: 'text', label: '時間', ph: '例：15:00〜15:40', half: true },
        { id: 'method', type: 'select', label: '方法', options: ['対面', 'オンライン（テレビ電話）', '対面とオンラインの併用'] },
      ] },
      { title: '出席者', fields: [
        { id: 'members', type: 'chips', options: function (v) { return MEMBERS[v.sector].map(function (m) { return [m, m]; }); }, def: ['本人', 'サービス管理責任者', '児童発達支援管理責任者', '保護者'] },
        { id: 'absent', type: 'text', label: '本人が欠席した場合の理由', hint: '本人が出席した場合は空欄のまま', ph: '例：体調不良のため。事前に面談で意見を聞き取った。' },
      ] },
      { title: '検討した項目', fields: [
        { id: 'items', type: 'chips', list: true, options: function (v) { return ITEMS.filter(function (x) { return !x[3] || x[3] === v.sector; }).map(function (x) { return [x[0], x[1]]; }); }, def: ['iko', 'goal', 'naiyou'] },
      ] },
      { title: '意見と決まったこと', fields: [
        { id: 'hv', type: 'text', label: '本人の意見（言葉のまま）', ph: '例：もう少し長い時間、作業をしてみたい' },
        { id: 'fv', type: 'text', label: '家族（保護者）の意見', ph: '例：家でも身の回りのことを自分でできるようになってほしい' },
        { id: 'decide', type: 'chips', label: '決まったこと', options: DECIDE.map(function (x) { return [x[0], x[1]]; }), def: ['gen', 'mon'] },
        { id: 'kadai', type: 'textarea', label: '残された課題', ph: '例：通所の手段（送迎の有無）は、次回までに家族と相談する。' },
      ] },
    ],
    build: function (v, H) {
      var sm = v.sector === 'shogai';
      var list = ITEMS.filter(function (x) { return (!x[3] || x[3] === v.sector) && v.items.indexOf(x[0]) !== -1; });
      var honninIn = v.members.indexOf('本人') !== -1;
      var hv = v.hv.trim().replace(/^「|」$/g, '');
      var fv = v.fv.trim().replace(/^「|」$/g, '');
      var after = sm
        ? '会議で検討した原案を本人に説明し、文書で同意を得たうえで、個別支援計画を本人と相談支援事業所に交付する。'
        : '会議で検討した原案を保護者（本人）に説明し、文書で同意を得たうえで、個別支援計画を交付する。相談支援事業所にも共有する。';
      return {
        title: '個別支援会議 記録',
        left: SECTOR.filter(function (x) { return x[0] === v.sector; })[0][1],
        right: '記録者：',
        sections: [
          { h: '概要', rows: [
            ['日時', 'when', H.date(v.date) + '　' + (v.time || '　　:　　〜　　:　　')],
            ['目的', 'purpose', PURPOSE.filter(function (x) { return x[0] === v.purpose; })[0][1]],
            ['方法', 'method', v.method],
            ['出席者', 'members', v.members.join('、'), '（出席者を記入）'],
            ['本人の参加', 'honnin', honninIn ? '本人が出席した。' : '本人は欠席した。' + (v.absent.trim() ? '理由：' + v.absent.trim() : '（欠席の理由と、事前に意見を聞き取った方法を記入）')],
          ] },
          { h: '内容', rows: [
            ['検討した内容', 'items', list.map(function (x, i) { return (i + 1) + '. ' + x[2]; }).join('\n'), '（検討した項目を選ぶと入ります）'],
            ['本人の意見', 'hv', hv ? '「' + hv + '」' : '', '（本人の言葉をそのまま）'],
            [sm ? '家族の意見' : '保護者の意見', 'fv', fv ? '「' + fv + '」' : '', '（必要に応じて記入）'],
            ['決まったこと', 'decide', DECIDE.filter(function (x) { return v.decide.indexOf(x[0]) !== -1; }).map(function (x) { return '・' + x[2]; }).join('\n'), '（決まったことを記入）'],
            ['残された課題', 'kadai', v.kadai.trim(), '（なし／あれば記入）'],
          ] },
          { h: 'このあと', rows: [['計画の交付まで', 'after', after]] },
        ],
        foot: '令和6年度から、個別支援計画の作成にかかる会議には、本人（児童の場合は本人・保護者）の参加が原則になりました。テレビ電話などを使った参加もできます。',
      };
    },
    warn: function (v) {
      if (v.members.indexOf('本人') === -1 && !v.absent.trim()) return '本人が出席していない場合は、欠席の理由と、事前に本人の意見を聞き取った方法を記録しましょう。';
      if (!v.hv.trim()) return '本人の意見を、言葉のまま記録しておくと、計画の「本人の意向」の根拠になります。';
      return '';
    },
  });
})();
