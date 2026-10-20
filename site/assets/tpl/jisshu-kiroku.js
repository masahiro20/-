// 実習記録・振り返りシート（就労移行支援ほか）。実施概要 → 本人の振り返り → 実習先の評価（表）→ 支援員の所見 → 次の目標。
// 実習先の評価は「未評価」を先頭の選択肢にして、集計には入れない。強み（できたこと）を必ず書く形にする。
(function () {
  'use strict';
  var SVC = [['iko', '就労移行支援'], ['b', '就労継続支援B型'], ['a', '就労継続支援A型']];
  var SAKI = [['', '（選ばない）'], ['ippan', '一般企業'], ['tokurei', '特例子会社'], ['jigyosho', '事業所内・施設外就労先'], ['jichitai', '自治体・官公庁'], ['other', 'その他']];
  var SAKI_TEXT = { ippan: '一般企業', tokurei: '特例子会社', jigyosho: '事業所内・施設外就労先', jichitai: '自治体・官公庁', other: 'その他' };
  var WORKS = [
    ['seiso', '清掃'], ['jimu', '事務補助（データ入力・書類整理）'], ['keisagyo', '軽作業（袋詰め・検品）'], ['shokuhin', '調理補助・食品加工'],
    ['hanbai', '接客・販売'], ['bakku', 'バックヤード（品出し・梱包）'], ['pc', 'パソコン作業'], ['nou', '農作業・園芸'],
  ];
  var AIMS = [
    ['tekisei', '職業適性の確認', '職業適性の確認'], ['tsukin', '通勤の練習', '通勤の練習'], ['tairyoku', '体力・持久力の確認', '体力・持久力の確認'],
    ['taijin', '対人コミュニケーション', '対人コミュニケーション'], ['hairyo', '配慮事項の確認', '必要な配慮事項の確認'], ['shushoku', '就職先の候補探し', '就職先の候補探し'],
  ];
  var GOOD = [
    ['ensei', '遅刻・欠席なく通えた', '遅刻や欠席なく、最後まで通うことができた。'],
    ['aisatsu', 'あいさつや返事ができた', '自分からあいさつをし、返事をすることができた。'],
    ['tejun', '手順を覚えて進められた', '手順を覚えて、自分で作業を進めることができた。'],
    ['teinei', '丁寧に仕上げられた', '作業を丁寧に仕上げることができた。'],
    ['shitsumon', '分からないことを聞けた', '分からないことを、自分から聞くことができた。'],
    ['kyukei', '自分で休憩をとれた', '疲れたときに、自分で休憩をとることができた。'],
    ['tsuzuke', '最後まで集中できた', '集中して最後まで取り組むことができた。'],
    ['hito', '職場の人と話せた', '職場の人と、落ち着いて話すことができた。'],
  ];
  var HARD = [
    ['tsukare', '午後に疲れが出た', '午後になると疲れが出て、作業のペースが落ちた。'],
    ['speed', '作業に時間がかかった', '作業に時間がかかった。'],
    ['houren', '報告や相談がしづらかった', '困ったときの報告や相談が、うまくできなかった。'],
    ['shiji', '口頭の指示が分かりにくかった', '口頭だけの指示は、分かりにくいことがあった。'],
    ['kankyo', '音・人の多さが気になった', '音や人の多さが気になった。'],
    ['tsukin', '通勤が大変だった', '通勤が大変だった。'],
    ['kinchou', '緊張して疲れた', '緊張して、疲れが出た。'],
  ];
  var WANT = [
    ['tsuzuke', 'この仕事をもっと続けてみたい', 'この仕事をもっと続けてみたい'],
    ['betsu', '別の仕事も体験したい', '別の仕事も体験してみたい'],
    ['jikan', '短い時間から始めたい', '短い時間から始めたい'],
    ['shushoku', '就職活動に進みたい', '就職活動に進みたい'],
    ['renshu', 'もう少し練習してから挑戦したい', 'もう少し練習してから挑戦したい'],
  ];
  // 実習先の評価：先頭は「未評価」。集計に入れない
  var ANS = [['mi', '未評価'], ['ok', 'できている'], ['shien', '支援が\nあれば'], ['ng', '難しい']];
  var ANS_NAME = { mi: '未評価', ok: 'できている', shien: '支援があればできる', ng: '難しい' };
  var ITEMS = [
    ['e1', '出勤（時間・身だしなみ）'], ['e2', '報告・連絡・相談'], ['e3', '作業の正確さ'], ['e4', '作業の速さ'],
    ['e5', 'ルールや指示の理解'], ['e6', '職場の人との関わり'], ['e7', '体調の管理'],
  ];
  var HAIRYO = [
    ['shiji', '指示を紙や見本で示した', '指示を口頭だけにせず、紙や見本で示した。'],
    ['kowake', '作業を小分けにした', '作業を小分けにして、一つずつ確認した。'],
    ['kyukei', '休憩を決めてとれるようにした', '休憩の時間を決め、とりやすくした。'],
    ['kankyo', '静かな席・場所にした', '音や人の動きが少ない席・場所にした。'],
    ['tantou', '相談する担当者を決めた', '困ったときに相談する担当者を決めた。'],
    ['jikan', '時間を短くした・段階的に延ばした', '実習の時間を短くし、少しずつ延ばした。'],
  ];
  var KADAI = [
    ['speed', '作業の速さを上げる', '作業の速さ'],
    ['houren', '困ったときに自分から伝える', '困ったときに自分から伝えること'],
    ['taichou', '体調に合わせた休憩のとり方', '体調に合わせた休憩のとり方'],
    ['tairyoku', '長い時間でも続けられる体力をつける', '長い時間続けられる体力'],
    ['tsukin', '通勤の練習を続ける', '通勤の練習'],
    ['shiji', '指示を聞き返す・メモをとる', '指示を聞き返す、メモをとること'],
  ];
  var NEXT = [
    ['dosame', '同じ実習先で、期間や時間を延ばす', '同じ実習先で、期間や時間を延ばして実習を続ける。'],
    ['betsu', '別の職種・実習先で体験する', '別の職種・実習先でも実習し、適性を確かめる。'],
    ['kunren', '事業所内で課題の練習をする', '事業所内の訓練で、課題の練習をしてから、次の実習に進む。'],
    ['shushoku', '就職活動に進む', '実習の結果をふまえ、就職活動に進む。'],
    ['jikan', '配慮を整理して実習先と共有する', '有効だった配慮を整理して、就職活動で伝えられるようにする。'],
  ];
  var OREI = [
    ['orei', '実習のお礼を伝えた', '実習のお礼を、実習先に伝えた。'],
    ['feedback', '実習先に評価の聞き取りをした', '実習先の担当者から、評価の聞き取りをした。'],
    ['kyoyu', '振り返りの結果を実習先に共有した', '振り返りの結果を、本人の同意を得て実習先に共有した。'],
    ['tsugi', '次の実習・面接の相談をした', '次の実習や面接について、実習先と相談した。'],
  ];
  var SETSUMEI = [
    ['honnin', '本人に結果を説明した', '本人に、実習の結果と次の目標を説明した。'],
    ['kazoku', '家族にも説明した', '家族にも、本人の同意を得て説明した。'],
    ['keikaku', '個別支援計画の見直しにつなげる', '結果は、個別支援計画の見直し（モニタリング）に生かす。'],
  ];

  function ck(list, ids) { return H0.pick(list, ids); }
  var H0 = { pick: function (list, ids) { var o = []; list.forEach(function (x) { if ((ids || []).indexOf(x[0]) !== -1) o.push(x); }); return o; } };
  function pairs(list) { return list.map(function (x) { return [x[0], x[1]]; }); }
  function join(list, ids, i) { return ck(list, ids).map(function (x) { return x[i]; }).join(''); }
  function tally(v) {
    var c = { ok: 0, shien: 0, ng: 0, mi: 0 };
    ITEMS.forEach(function (it) { var a = v[it[0]]; if (!ANS_NAME[a]) a = 'mi'; c[a]++; });
    return c;
  }
  function trim(s) { return String(s || '').trim(); }

  (function addStyle() {
    var css = [
      '#fdPanel .seg[data-f^="e"] { grid-template-columns: 52px repeat(3, minmax(0, 1fr)); }',
      '#fdPanel .seg[data-f^="e"] button, #fdPanel .seg[data-f^="e"] button:nth-child(2n), #fdPanel .seg[data-f^="e"] button:nth-last-child(-n+2) { border-bottom: 0; border-right: 1px solid var(--rule); padding: 4px 3px; font-size: 13px; line-height: 1.3; white-space: pre-line; }',
      '#fdPanel .seg[data-f^="e"] button:last-child { border-right: 0; }',
      '#fdPanel .seg[data-f^="e"] button[data-v="mi"] { font-size: 11px; color: var(--ink-3); background: var(--head-cell); }',
      '#fdPanel .seg[data-f^="e"] button[data-v="mi"][aria-pressed="true"] { background: #d9d4ca; color: var(--ink); }',
    ].join('\n');
    var el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
  })();

  Formdoc.run({
    title: '実習記録・振り返りシート',
    ai: {
      role: '就労移行支援事業所の就労支援員',
      doc: '職場実習の記録・振り返りシート',
      rules: [
        '実習先の評価（できている・支援があればできる・難しい・未評価）は変えない。',
        '強み（できたこと）を最初に書き、課題は「次にこうしてみる」という目標の形で書く。',
        '企業名・本人や職員の実名は書かない（〇〇さん などにする）。',
        '（　）の空欄は推測で埋めず、【要確認】と書く。',
      ],
    },
    blocks: [
      { title: '実施の概要', fields: [
        { id: 'svc', type: 'select', label: 'サービス', options: SVC },
        { id: 'saki', type: 'select', label: '実習先の種類', hint: '企業名は書かなくてかまいません', options: SAKI, half: true },
        { id: 'saki2', type: 'text', label: '実習先の名前（任意）', ph: '例：〇〇株式会社', half: true },
        { id: 'from', type: 'date', label: '実習の開始日', half: true },
        { id: 'to', type: 'date', label: '実習の終了日', half: true },
        { id: 'days', type: 'text', label: '実習した日数', ph: '例：5', half: true },
        { id: 'hours', type: 'text', label: '1日の時間', ph: '例：10時〜15時（休憩1時間）', half: true },
        { id: 'works', type: 'chips', label: '職種・作業内容', options: pairs(WORKS) },
        { id: 'work2', type: 'text', label: '作業内容の補足（任意）', ph: '例：店内の床の清掃、備品の補充' },
        { id: 'aims', type: 'chips', label: '実習の目的', options: pairs(AIMS) },
      ] },
      { title: '本人の振り返り', small: '本人の言葉を大切に', fields: [
        { id: 'good', type: 'chips', label: 'できたこと', options: pairs(GOOD) },
        { id: 'hard', type: 'chips', label: '難しかったこと', options: pairs(HARD) },
        { id: 'want', type: 'chips', label: 'やってみたいこと', options: pairs(WANT) },
        { id: 'voice', type: 'textarea', label: '本人の言葉', ph: '例：人に聞くのは緊張したけれど、教えてもらえてうれしかった', rows: 3 },
      ] },
      { title: '実習先の評価', small: '聞き取った内容を選びます', note: 'はじめは全部「未評価」です。実習先から聞けた項目だけ選んでください。未評価の項目は集計に入りません。', fields: ITEMS.map(function (it) {
        return { id: it[0], type: 'seg', label: it[1], options: ANS, def: 'mi' };
      }).concat([
        { id: 'ecomment', type: 'textarea', label: '実習先からのコメント', ph: '例：毎日あいさつがていねいで、教えたことをすぐメモしていた。', rows: 3 },
      ]) },
      { title: '支援員の所見', fields: [
        { id: 'strong', type: 'textarea', label: '本人の強み（必ず書きましょう）', ph: '例：決められた手順を守って、毎日同じ質で作業を続けられる。', rows: 3 },
        { id: 'kizuki', type: 'textarea', label: '支援員の気づき', ph: '例：午前は集中できるが、午後2時ごろから疲れが出やすい。', rows: 3 },
        { id: 'hairyo', type: 'chips', label: '有効だった配慮', options: pairs(HAIRYO) },
        { id: 'hairyo2', type: 'text', label: '配慮の補足（任意）', ph: '例：作業の手順を写真つきの紙にした' },
      ] },
      { title: '課題と次の目標', fields: [
        { id: 'kadai', type: 'chips', label: '課題', options: pairs(KADAI) },
        { id: 'next', type: 'chips', label: '次のステップ', options: pairs(NEXT) },
        { id: 'goal', type: 'textarea', label: '次の目標（本人と一緒に）', ph: '例：困ったときに、昼休みまでに担当の方に相談する。', rows: 2 },
      ] },
      { title: '連絡と説明', fields: [
        { id: 'orei', type: 'chips', label: '実習先への連絡・お礼', options: pairs(OREI) },
        { id: 'setsu', type: 'chips', label: '本人・家族への説明', options: pairs(SETSUMEI) },
      ] },
      { title: '事業所と記入者', small: 'ほかの書類にも入ります', fields: [
        { id: 'office', type: 'text', label: '事業所名', ph: '例：〇〇事業所', half: true, profile: 'office' },
        { id: 'writer', type: 'text', label: '記入者（職種）', ph: '例：就労支援員 〇〇', half: true, profile: 'writer' },
      ] },
    ],
    build: function (v, H) {
      var svcName = H.label(SVC, v.svc);
      var saki = SAKI_TEXT[v.saki] || '';
      if (trim(v.saki2)) saki += (saki ? '（' : '') + trim(v.saki2) + (saki ? '）' : '');
      var period = (v.from || v.to) ? H.date(v.from) + ' 〜 ' + H.date(v.to) : '';
      var days = trim(v.days);
      var daysText = (days ? days + '日間' : '') + (trim(v.hours) ? (days ? '　' : '') + '1日 ' + trim(v.hours) : '');
      var works = ck(WORKS, v.works).map(function (x) { return x[1]; });
      if (trim(v.work2)) works.push(trim(v.work2));
      var aims = ck(AIMS, v.aims).map(function (x) { return x[2]; });

      // 本人の振り返り
      var good = join(GOOD, v.good, 2);
      var hard = join(HARD, v.hard, 2);
      var want = ck(WANT, v.want).map(function (x) { return x[2]; });
      var wantText = want.length ? want.join('、') + 'と話している。' : '';
      var voice = trim(v.voice).replace(/^「|」$/g, '');

      // 評価の表と集計（未評価は集計に入れない）
      var t = tally(v);
      var done = t.ok + t.shien + t.ng;
      var rows = ITEMS.map(function (it) {
        var a = ANS_NAME[v[it[0]]] ? v[it[0]] : 'mi';
        return [it[1], a === 'mi' ? '' : ANS_NAME[a]];
      });
      var oks = ITEMS.filter(function (it) { return v[it[0]] === 'ok'; }).map(function (it) { return it[1]; });
      var sumText = done
        ? '評価した ' + done + ' 項目のうち、できている ' + t.ok + '、支援があればできる ' + t.shien + '、難しい ' + t.ng + '。' + (t.mi ? '（未評価 ' + t.mi + ' 項目は集計に含めていません）' : '')
        : '';

      // 強み：支援員が書いた強み → 「できている」の項目
      var strong = trim(v.strong);
      if (!strong && oks.length) strong = '実習先の評価で「できている」とされた項目：' + oks.join('、') + '。';
      var hairyo = join(HAIRYO, v.hairyo, 2) + (trim(v.hairyo2) ? trim(v.hairyo2) + '。' : '');
      var kadai = ck(KADAI, v.kadai).map(function (x) { return x[2]; });
      var next = join(NEXT, v.next, 2);
      var rensetsu = join(OREI, v.orei, 2) + join(SETSUMEI, v.setsu, 2);

      return {
        title: '実習記録・振り返りシート',
        left: H.blank(v.office, '事業所名：') + '\n' + svcName,
        right: '実習期間：' + (period || '　　年　　月　　日 〜 　　年　　月　　日') + '\n記入者：' + H.blank(v.writer),
        sections: [
          { h: '実施の概要', rows: [
            ['実習先の種類', 'saki', saki, '（一般企業・特例子会社など）'],
            ['日数・時間', 'days', daysText, '（　　日間　1日　　時間）'],
            ['職種・作業内容', 'works', works.join('、'), '（実習で行った作業）'],
            ['実習の目的', 'aims', aims.join('、'), '（何を確かめるための実習か）'],
          ] },
          { h: '本人の振り返り', rows: [
            ['できたこと', 'good', good, '（本人が「できた」と感じたこと）'],
            ['難しかったこと', 'hard', hard, '（本人が「難しかった」と感じたこと）'],
            ['やってみたいこと', 'want', wantText, '（これからやってみたいこと）'],
            ['本人の言葉', 'voice', voice ? '「' + voice + '」' : '', '（本人の言葉をそのまま記入）'],
          ] },
          { key: 'eval', h: '実習先の評価', grid: { head: ['項目', '評価'], widths: ['', '40%'], rowHead: true, labelCol: true, rows: rows, ph: '　' } },
          { h: '評価のまとめ', rows: [
            ['集計', 'sum', sumText, '（評価した項目の数）'],
            ['実習先のコメント', 'ecomment', trim(v.ecomment), '（実習先から聞き取った内容）'],
          ] },
          { h: '支援員の所見', rows: [
            ['本人の強み', 'strong', strong, '（できたこと・よいところを最初に記入）'],
            ['支援員の気づき', 'kizuki', trim(v.kizuki), '（実習中のようす）'],
            ['有効だった配慮', 'hairyo', hairyo, '（就職活動や職場で伝えたい配慮）'],
          ] },
          { h: '次の目標', rows: [
            ['課題', 'kadai', kadai.length ? kadai.join('、') + 'について、練習や配慮を続ける。' : '', '（課題は、次にやってみることの形で記入）'],
            ['次の目標', 'goal', trim(v.goal), '（本人と一緒に決めた目標）'],
            ['次のステップ', 'next', next, '（次の実習・就職活動など）'],
          ] },
          { h: '連絡と説明', rows: [['実施したこと', 'renraku', rensetsu, '（実習先への連絡、本人・家族への説明）']] },
        ],
        foot: '実習の結果は、個別支援計画の見直し（モニタリング）やアセスメントの更新に生かします。実習先に伝える内容は、本人の同意を得てから共有します。',
      };
    },
    info: function (v) {
      var t = tally(v);
      return '<span class="coverage-label">評価 ' + (t.ok + t.shien + t.ng) + '／' + ITEMS.length + '</span>' +
        '<span>できている ' + t.ok + '</span><span>支援があれば ' + t.shien + '</span><span>難しい ' + t.ng + '</span>';
    },
    warn: function (v) {
      if (!trim(v.strong) && !v.good.length) return '本人の強み（できたこと）を、まず書きましょう。「できたこと」を選ぶか、支援員の所見の「本人の強み」に書いてください。';
      if (!trim(v.strong)) return '支援員の所見の「本人の強み」も書いておくと、次の計画や就職活動で使いやすくなります。';
      if (v.from && v.to && v.to < v.from) return '実習の終了日が、開始日より前になっています。';
      return '';
    },
  });
})();
