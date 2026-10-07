// 工賃（賃金）向上計画。B型＝工賃向上計画、A型＝賃金向上計画。
// 前年度の平均工賃と各年度の目標 → 伸び率を自動計算。選んだ取り組みを3年間のスケジュール表に並べる。
(function () {
  'use strict';
  var KIND = [['b', '就労継続支援B型', '工賃向上計画'], ['a', '就労継続支援A型', '賃金向上計画']];
  // 計画期間（3年）。国の指針の今の期間は令和6〜8年度
  var STARTS = [2024, 2025, 2026, 2027].map(function (y) {
    return [String(y), '令和' + (y - 2018) + '〜' + (y - 2016) + '年度' + (y === 2024 ? '（今の国の計画期間）' : '')];
  });
  var AUTO = [['manual', '自分で入れる'], ['3', '毎年3%ずつ上げる'], ['5', '毎年5%ずつ上げる'], ['10', '毎年10%ずつ上げる']];
  var WORKS = [
    ['nou', '農作業', '農作業（農福連携）'],
    ['kei', '軽作業・受託作業', '軽作業・受託作業（部品の組み立て・袋詰めなど）'],
    ['shoku', '食品製造', '食品製造（パン・菓子・弁当など）'],
    ['seisou', '清掃', '清掃'],
    ['cafe', 'カフェ・飲食', 'カフェ・飲食店の運営'],
    ['shukou', '手工芸', '手工芸・雑貨の製作'],
    ['gai', '施設外就労', '施設外就労（企業の中での作業）'],
    ['it', 'パソコン・データ入力', 'パソコン作業・データ入力'],
    ['recycle', 'リサイクル', 'リサイクル（回収・分別）'],
  ];
  var ISSUES = [
    ['tanka', '作業の単価が低い', '受託作業の単価が低く、作業量に見合った収入になっていない。'],
    ['ryou', '仕事の量が安定しない', '受注量が時期によって変わり、仕事が少ない時期がある。'],
    ['hanro', '販売先が限られている', '自主製品の販売先が限られ、売上が伸びにくい。'],
    ['kakaku', '商品の価格・魅力', '自主製品の価格が材料費や手間に見合っておらず、商品の魅力づくりも十分でない。'],
    ['hinshitsu', '品質・納期のばらつき', '作業の品質や納期にばらつきがあり、続けて注文をもらうことにつながりにくい。'],
    ['kotei', '作業の手順が効率的でない', '作業の手順が整理されておらず、利用者の得意なことを生かしきれていない。'],
    ['nouhau', '職員の営業・経営の知識', '職員に、営業・商品開発・経営の知識や経験が足りない。'],
    ['nami', '通所日数・体調の波', '利用者の通所日数や体調に波があり、生産量が安定しない。'],
    ['keihi', '材料費・光熱費の上昇', '材料費や光熱費が上がり、利益が出にくくなっている。'],
    ['shushi', '生産活動の収支が足りない', '生産活動の収入から経費を引いた額が、利用者の賃金の総額に届いていない。', 'a'],
  ];
  // [id, チップの名前, 表の見出し, 1年目, 2年目, 3年目]
  var ACTS = [
    ['hanro', '販路開拓', '販路開拓', '販売先の候補を洗い出し、新しい販売先・取引先に営業する。', 'イベント販売・ネット販売など、売る場所を増やす。', '定期的に取引する販売先を定着させる。'],
    ['tanka', '単価の見直し', '単価の見直し', '受託作業の単価と原価（材料費・手間）を一覧にし、取引先と単価を相談する。', '自主製品の価格を、原価と手間に見合う額に見直す。', '採算の合わない作業を見直し、作業の組み合わせを整える。'],
    ['kyodo', '共同受注窓口の活用', '共同受注窓口', '都道府県などの共同受注窓口（複数の事業所でまとめて仕事を受ける窓口）に登録し、情報を集める。', '共同受注で、役所や企業からの仕事を受ける。', 'ほかの事業所と協力して、続けて受けられる仕事を確保する。'],
    ['kankou', '役所の仕事（優先調達）', '役所の仕事', '市町村・都道府県の担当窓口に、受けられる仕事・商品を伝える。', '役所からの注文（優先調達）を受け、実績を作る。', '毎年注文をもらえる仕事・商品を増やす。'],
    ['shohin', '商品開発', '商品開発', 'お客さんの声や売れ筋を調べ、新しい商品の案を作る。', '新しい商品を試作し、販売してみる。', '売れた商品を定番にし、包装やラベルも整える。'],
    ['hinshitsu', '品質管理', '品質管理', '作業の手順書とチェック表を作る。', '不良品や納期の遅れを記録し、原因を改善する。', '品質の基準を定着させ、取引先からの評価を確かめる。'],
    ['kenshu', '職員研修', '職員研修', '都道府県などの研修に参加し、工賃を上げる目標を全職員で共有する。', '営業・商品開発など、専門的な研修に参加する。', '研修で学んだことを事業所の中で共有し、仕組みにする。'],
    ['consul', '経営コンサル活用', '専門家の活用', '専門家（経営コンサルタント・企業OBなど）の助言を受け、経営の課題を整理する。', '助言をもとに、事業計画と収支の計画を見直す。', '取り組みの効果を確かめ、次の計画に生かす。'],
    ['kotei', '作業工程の見直し', '作業工程の見直し', '作業を工程ごとに分けて見える化し、利用者の得意な工程に配置する。', '治具（作業を助ける道具）を工夫し、作業の時間を短くする。', '1時間あたりの生産量を測り、改善を続ける。'],
    ['gai', '施設外就労', '施設外就労', '施設外就労（企業の中での作業）を受け入れてくれる企業を探す。', '施設外就労を始め、作業の種類を広げる。', '受け入れ先を増やし、一般就労への移行にもつなげる。'],
  ];
  var SHARE = [
    ['kaigi', '職員会議で説明', '職員会議で計画を説明し、全職員で目標を共有する。'],
    ['riyou', '利用者への説明', '利用者に、分かりやすい言葉で目標と取り組みを説明する。'],
    ['kazoku', '家族への説明', '家族会やおたよりで、計画と工賃の状況を伝える。'],
    ['keiji', '事業所に掲示', '目標と毎月の実績を事業所に掲示する。'],
    ['web', 'ホームページで公表', '計画と工賃の実績を、ホームページなどで公表する。'],
  ];
  // 全国平均（厚生労働省「令和6年度工賃（賃金）の実績について」）
  var NATIONAL = { b: 24141, a: 91451 };

  function reiwa(y) { return '令和' + (y - 2018) + '年度'; }
  // 数字の欄（全角・カンマ・円も受けつける）。数字でなければ null
  function num(s) {
    var t = String(s == null ? '' : s).normalize('NFKC').replace(/[,，円\s]/g, '');
    if (!/^\d+(\.\d+)?$/.test(t)) return null;
    var n = Number(t);
    return isFinite(n) ? n : null;
  }
  function yen(n) { return n == null ? '' : Math.round(n).toLocaleString('ja-JP') + '円'; }
  function rate(now, prev) {
    if (now == null || prev == null || !(prev > 0)) return '';
    var r = (now - prev) / prev * 100;
    if (!isFinite(r)) return '';
    var s = r.toFixed(1);
    if (s === '-0.0') s = '0.0';
    return (r > 0 && s !== '0.0' ? '＋' : '') + s.replace('-', '−') + '%';
  }
  function diff(now, prev) {
    if (now == null || prev == null) return '';
    var d = Math.round(now) - Math.round(prev);
    return (d > 0 ? '＋' : d < 0 ? '−' : '') + Math.abs(d).toLocaleString('ja-JP') + '円';
  }
  // 前年度の平均工賃（月額）の計算：工賃支払総額 ÷（延べ利用者数 ÷ 年間開所日数）÷ 12
  function calcBase(v) {
    if (v.kind !== 'b') return null;
    var total = num(v.total), nobe = num(v.nobe), days = num(v.days);
    if (total == null || !(nobe > 0) || !(days > 0)) return null;
    var avg = nobe / days;
    var m = total / avg / 12;
    return isFinite(m) ? { total: total, nobe: nobe, days: days, avg: avg, m: m } : null;
  }
  function plan(v) {
    var y = Number(v.start) || 2024;
    var calc = calcBase(v);
    var base = num(v.base);
    var fromCalc = false;
    if (base == null && calc) { base = calc.m; fromCalc = true; }
    var pct = v.auto === 'manual' ? 0 : Number(v.auto) || 0;
    var t = [], auto = [], prev = base;
    for (var i = 1; i <= 3; i++) {
      var x = num(v['t' + i]);
      var a = false;
      if (x == null && pct && prev != null) { x = Math.ceil(prev * (1 + pct / 100) / 100) * 100; a = true; }
      t.push(x); auto.push(a);
      prev = x;
    }
    return { y: y, base: base, fromCalc: fromCalc, calc: calc, t: t, auto: auto, pct: pct };
  }
  function word(v) { return v.kind === 'a' ? '賃金' : '工賃'; }

  Formdoc.run({
    title: '工賃向上計画',
    ai: { role: '就労継続支援事業所の管理者', doc: '工賃（賃金）向上計画', rules: ['金額・伸び率・年度は変えない。', '「現状と課題」は、選んだ課題をつなげて、事業所の状況が伝わる文章にする。', '取り組みは、だれが・いつまでに・何をするかが分かるように具体的にする。', '分からない数字や固有名詞は推測で埋めず、【要確認】と書く。'] },
    blocks: [
      { title: '事業の種類と計画期間', fields: [
        { id: 'kind', type: 'seg', options: KIND, def: 'b' },
        { id: 'start', type: 'select', label: '計画期間（3年間）', options: STARTS, def: '2024' },
        { id: 'name', type: 'text', label: '事業所名', ph: '例：〇〇作業所' },
        { id: 'cap', type: 'number', label: '利用定員（人）', ph: '例：20', half: true },
        { id: 'users', type: 'number', label: '利用者数（人）', hint: '登録している人数', ph: '例：25', half: true },
      ] },
      { title: '工賃（賃金）の実績と目標', note: '金額は1か月あたり（月額）の円で、数字だけを入れます。', fields: [
        { id: 'base', type: 'number', label: '前年度の平均工賃・賃金（月額）', hint: '計画期間が始まる前の年度の実績', ph: '例：18000' },
        { id: 'auto', type: 'select', label: '目標の入れ方', hint: '空いている年度に入ります', options: AUTO, def: 'manual' },
        { id: 't1', type: 'number', label: '1年目の目標', ph: '例：19000', half: true },
        { id: 't2', type: 'number', label: '2年目の目標', ph: '例：20000', half: true },
        { id: 't3', type: 'number', label: '3年目の目標', ph: '例：21000' },
      ] },
      { title: '平均工賃を計算する', small: '（B型・任意）', note: '前年度の平均工賃が分からないときは、ここに入れると計算します（令和6年度からの計算方法）。', fields: [
        { id: 'total', type: 'number', label: '1年間の工賃の支払総額（円）', ph: '例：4320000', show: function (v) { return v.kind === 'b'; } },
        { id: 'nobe', type: 'number', label: '延べ利用者数（人）', ph: '例：4800', half: true, show: function (v) { return v.kind === 'b'; } },
        { id: 'days', type: 'number', label: '年間の開所日数（日）', ph: '例：240', half: true, show: function (v) { return v.kind === 'b'; } },
      ] },
      { title: '生産活動と課題', fields: [
        { id: 'works', type: 'chips', label: '主な作業', options: WORKS.map(function (x) { return [x[0], x[1]]; }), def: ['kei'] },
        { id: 'workOther', type: 'text', label: 'そのほかの作業・商品', ph: '例：さをり織りのバッグ、公園の除草' },
        { id: 'issues', type: 'chips', label: '今の課題', options: function (v) { return ISSUES.filter(function (x) { return !x[3] || x[3] === v.kind; }).map(function (x) { return [x[0], x[1]]; }); }, def: ['tanka'] },
      ] },
      { title: '目標を達成するための取り組み', fields: [
        { id: 'acts', type: 'chips', label: '取り組み（年度ごとの予定を表にします）', options: ACTS.map(function (x) { return [x[0], x[1]]; }), def: ['hanro', 'tanka', 'kenshu'] },
      ] },
      { title: '推進体制', fields: [
        { id: 'boss', type: 'text', label: '責任者', ph: '例：管理者 〇〇', half: true },
        { id: 'staff', type: 'text', label: '担当者', ph: '例：職業指導員 〇〇', half: true },
        { id: 'share', type: 'chips', label: '計画の共有のしかた', options: SHARE.map(function (x) { return [x[0], x[1]]; }), def: ['kaigi', 'riyou'] },
      ] },
    ],
    build: function (v, H) {
      var W = word(v);
      var kind = KIND.filter(function (x) { return x[0] === v.kind; })[0] || KIND[0];
      var p = plan(v);
      var y = p.y;
      var years = [y, y + 1, y + 2];
      var period = reiwa(y) + '〜' + reiwa(y + 2);

      // 1. 事業所の概要
      var cap = num(v.cap), users = num(v.users);
      var people = [cap != null ? '利用定員 ' + Math.round(cap).toLocaleString('ja-JP') + '人' : '', users != null ? '利用者数 ' + Math.round(users).toLocaleString('ja-JP') + '人' : ''].filter(Boolean).join('　');
      var works = WORKS.filter(function (x) { return v.works.indexOf(x[0]) !== -1; }).map(function (x) { return x[2]; });
      var other = v.workOther.trim();
      if (other) works.push(other);

      // 2. 実績と目標
      var rows = [[reiwa(y - 1), '実績', yen(p.base), '']];
      var prev = p.base;
      for (var i = 0; i < 3; i++) {
        rows.push([reiwa(years[i]), '目標', yen(p.t[i]), rate(p.t[i], prev)]);
        prev = p.t[i];
      }
      var last = p.t[2];
      rows.push(['3年間の伸び', '', diff(last, p.base), rate(last, p.base)]);

      var how = '前年度の実績、地域の最低賃金、障害年金と合わせて地域で暮らすために必要な収入、都道府県の目標工賃を参考に設定した。';
      if (v.kind === 'a') how = '前年度の実績、地域の最低賃金、生産活動の収支の見通しを参考に設定した。';
      var basis = [['目標の考え方', 'how', how]];
      if (p.auto.some(Boolean)) basis.push(['自動で入れた目標', 'autonote', p.auto.map(function (a, k) { return a ? reiwa(years[k]) : ''; }).filter(Boolean).join('・') + 'の目標は、前年度から' + p.pct + '%上げた額にした（100円未満は切り上げ）。']);
      // 計算欄の結果は、表の「前年度の実績」と同じときだけ根拠に入れる（違う数字が並ばないように）
      if (p.calc && (p.fromCalc || Math.round(p.calc.m) === Math.round(p.base))) {
        basis.push(['平均工賃の計算', 'calc', reiwa(y - 1) + 'の実績：' + '1年間の工賃支払総額 ' + yen(p.calc.total) + ' ÷ 1日あたりの平均利用者数 ' + (Math.round(p.calc.avg * 10) / 10).toLocaleString('ja-JP') + '人（延べ ' + Math.round(p.calc.nobe).toLocaleString('ja-JP') + '人 ÷ 開所日数 ' + Math.round(p.calc.days).toLocaleString('ja-JP') + '日）÷ 12か月 ＝ ' + yen(p.calc.m)]);
      }

      // 3. 現状と課題
      var issues = ISSUES.filter(function (x) { return v.issues.indexOf(x[0]) !== -1 && (!x[3] || x[3] === v.kind); }).map(function (x) { return x[2]; });

      // 4. 取り組み（年度別）
      var acts = ACTS.filter(function (x) { return v.acts.indexOf(x[0]) !== -1; });
      // A型では「工賃」を「賃金」と書く
      var sched = acts.map(function (x) { return [x[2], x[3], x[4], x[5]].map(function (t) { return t.replace(/工賃/g, W); }); });
      sched.push(['点検・見直し', '計画を職員・利用者に説明し、毎月の' + W + 'の実績を確認する。', '前年度の実績を点検し、目標と取り組みを見直す。', '前年度の実績を点検し、3年間の結果をまとめて次の計画を作る。']);

      // 5. 推進体制
      var share = SHARE.filter(function (x) { return v.share.indexOf(x[0]) !== -1; }).map(function (x) { return x[2]; });
      var check = '毎年度、前年度の実績を点検・評価し、必要に応じて計画を見直す。';
      if (v.kind === 'b') check += '見直した場合は、都道府県の定める期限（国の指針では各年度の5月末）までに都道府県へ提出する。';

      return {
        title: kind[2],
        left: kind[1] + (v.name.trim() ? '\n' + v.name.trim() : ''),
        right: '計画期間：' + period + '\n作成日：' + H.date(''),
        sections: [
          { h: '1. 事業所の概要', w2: '110px', rows: [
            ['事業所名', 'name', v.name.trim(), '（事業所名）'],
            ['サービスの種類', 'kind', kind[1]],
            ['定員・利用者数', 'people', people, '（利用定員・利用者数）'],
            ['主な作業', 'works', works.join('、'), '（生産活動の内容）'],
            ['計画期間', 'period', period + '（3年間）'],
          ] },
          { key: 'goal', h: '2. ' + W + 'の実績と目標（1人あたりの平均' + W + '・月額）', grid: { head: ['年度', '区分', '平均' + W + '（月額）', '前年度からの伸び率'], widths: ['110px', '52px', '', ''], rowHead: true, labelCol: true, rows: rows, ph: '　' } },
          { h: '目標の根拠', w2: '110px', rows: basis },
          { h: '3. 現状と課題', w2: '110px', rows: [
            ['生産活動の状況', 'state', works.length ? works.join('、') + 'に取り組んでいる。' : '', '（今の作業と売上の状況）'],
            ['課題', 'issues', H.bullets(issues), '（' + W + 'を上げるうえでの課題）'],
            ['利用者の希望', 'voice', '', '（利用者・家族の声、働き方の希望）'],
          ] },
          { key: 'sched', h: '4. 目標を達成するための取り組み（年度別スケジュール）', grid: { head: ['取り組み', reiwa(years[0]), reiwa(years[1]), reiwa(years[2])], widths: ['124px', '', '', ''], rowHead: true, labelCol: true, rows: sched, ph: '　' } },
          { h: '5. 推進体制', w2: '110px', rows: [
            ['責任者', 'boss', v.boss.trim(), '（管理者などの職名・氏名）'],
            ['担当者', 'staff', v.staff.trim(), '（担当する職員の職名・氏名）'],
            ['点検・見直し', 'check', check],
            ['共有のしかた', 'share', H.bullets(share), '（職員・利用者・家族への説明の方法）'],
          ] },
        ],
        foot: 'この下書きは、計画の内容を整理するためのものです。様式と提出の期限は都道府県によって違うので、都道府県の様式に合わせて写してください。伸び率は前年度（1年目は前年度の実績、2年目からは前年度の目標）と比べた割合で、小数第1位まで（四捨五入）表示しています。',
      };
    },
    info: function (v) {
      var W = word(v);
      var nat = NATIONAL[v.kind] || NATIONAL.b;
      return '<span class="coverage-label">全国平均' + W + '（令和6年度・' + (v.kind === 'a' ? 'A型' : 'B型') + '）</span><span>月額 ' + yen(nat) + '</span>';
    },
    warn: function (v) {
      var W = word(v);
      var p = plan(v);
      if (p.base == null) return '前年度の平均' + W + '（月額）を入れると、各年度の伸び率を計算します。' + (v.kind === 'b' ? '分からないときは「平均工賃を計算する」の欄を使えます。' : '');
      if (p.base === 0) return '前年度の実績が0円のため、伸び率は計算できません。新しく始めた事業所は、1年目の目標から伸び率を見ます。';
      if (p.calc && !p.fromCalc && Math.round(p.calc.m) !== Math.round(p.base)) return '「平均工賃を計算する」の結果（' + yen(p.calc.m) + '）が、入れた前年度の平均工賃（' + yen(p.base) + '）と違います。どちらが正しいか確かめてください（計算の結果は書類には入れていません）。';
      var all = [p.base].concat(p.t);
      for (var i = 0; i < all.length; i++) if (all[i] != null && all[i] > 1000000) return '金額がとても大きくなっています。1か月あたり（月額）の金額で入っているか確かめてください。';
      var prev = p.base;
      for (var k = 0; k < 3; k++) {
        if (p.t[k] != null && prev != null && p.t[k] < prev) return reiwa(p.y + k) + 'の目標が、前年度を下回っています。目標は前年度以上にします' + (v.kind === 'b' ? '（国の指針）' : '') + '。';
        if (p.t[k] != null) prev = p.t[k];
      }
      if (p.t.some(function (x) { return x == null; })) return 'まだ目標が入っていない年度があります。「目標の入れ方」で自動で入れることもできます。';
      if (!v.acts.length) return '目標を達成するための取り組みを、1つ以上選んでください。';
      if (v.kind === 'a') return 'A型は、生産活動の収入から経費を引いた額が、利用者に支払う賃金の総額以上になるようにする必要があります。収支の見通しもあわせて確認しましょう。';
      return '';
    },
  });
})();
