// 送迎記録（乗車・降車の人数確認・車内の見回り・引き渡し）。児童発達支援・放課後等デイサービス、生活介護・就労系などの通所向け。
// 根拠：指定通所支援基準 第40条の3（車を使うときの所在の確認。放デイは第71条で準用）、第21条（提供の記録）。
// 送迎加算の取扱いは留意事項通知（障発0330第16号・障発第1031001号）。単位数は書類に入れない（改定されるため）。
// 毎日使う書類なので、押すだけで埋まるようにする。利用者名は「〇〇さん」。名前の欄（textarea）は共有リンクに入らない。
(function () {
  'use strict';
  var KIND = [['jido', '児童（児発・放デイ）'], ['shogai', '障害（生活介護など）']];
  var BIN = [['both', '迎え・送り'], ['mukae', '迎えだけ'], ['okuri', '送りだけ']];
  // 出発前の確認 [id, 名前, 児童のときだけ]
  var MAE = [
    ['meibo', '乗車名簿と当日の出欠の照合', false],
    ['tenken', '車の日常点検（タイヤ・ライトなど）', false],
    ['taicho', '運転者の体調', false],
    ['alc', 'アルコールチェック', false],
    ['buzzer', '置き去り防止の装置（ブザー等）', true],
    ['phone', '緊急連絡用の携帯電話', false],
  ];
  // 人数の確認 [id, 名前（左の欄）, 書類での名前]
  var CHK = [
    ['on', '乗車時の人数確認', '乗車時の人数確認（顔を見て点呼）'],
    ['off', '降車時の人数確認', '降車時の人数確認（顔を見て点呼）'],
    ['look', '車内の見回り', '車内の見回り（一番後ろの席・座席の下まで）'],
  ];
  // 受け取り（迎え）・引き渡し（送り） [id, 迎えの名前, 送りの名前]
  var HAND = [
    ['home', '自宅（保護者から）', '自宅（保護者へ）'],
    ['school', '学校（先生から）', '学校（先生へ）'],
    ['self', '本人（集合場所など）', '本人（ひとりで帰宅）'],
    ['gh', 'グループホーム（職員から）', 'グループホーム（職員へ）'],
    ['other', 'ほかの事業所（職員から）', 'ほかの事業所（職員へ）'],
  ];
  // 欠席・変更 [id, 名前, 書類の文（メモがないとき）]
  var CHG = [
    ['kesseki', '欠席がいた', '欠席：〇〇さん（理由：　　　／連絡：　　時　　分　　　より）'],
    ['jikan', '時間の変更', '時間の変更：〇〇さん（　　時　　分に変更／連絡：　　　より）'],
    ['basho', '乗る・降りる場所の変更', '場所の変更：〇〇さん（　　　　→　　　　）'],
    ['kazoku', '家族の送り迎えに変更', '家族の送り迎え：〇〇さん（　　　が送迎）'],
    ['tsuika', '予定にない人が乗った', '予定にない乗車：〇〇さん（理由：　　　／管理者の了承：済・未）'],
  ];
  // 特記事項 [id, 名前, 書類の文]
  var TOKU = [
    ['taicho', '体調の変化', '体調：〇〇さん（車内でのようす：　　　　）→ 保護者・職員に伝えた（済・未）'],
    ['wasure', '忘れ物', '忘れ物：〇〇さん（　　　　）→ 保護者に連絡（済・未）'],
    ['hiyari', 'ヒヤリ・ハット', 'ヒヤリ・ハット：（いつ・どこで・何が　　　　）→ 管理者に報告・報告書（済・未）'],
    ['okure', '遅れ（渋滞・学校の都合など）', '遅れ：（　　分。理由：　　　　）→ 保護者・学校に連絡（済・未）'],
    ['car', '車の不具合', '車の不具合：（　　　　）→ 管理者に報告（済・未）'],
  ];
  var WD = ['日', '月', '火', '水', '木', '金', '土'];

  var showM = function (v) { return v.bin !== 'okuri'; };
  var showO = function (v) { return v.bin !== 'mukae'; };
  var num = function (s) { var n = parseInt(String(s || '').replace(/[^\d]/g, ''), 10); return isNaN(n) ? null : n; };
  var BLANK = '（　　　　）';

  function wday(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? '（' + WD[new Date(Date.UTC(+m[1], m[2] - 1, +m[3])).getUTCDay()] + '）' : '（　）';
  }

  // 便ごとの入力欄（p = 'm' 迎え / 'o' 送り）
  function binFields(p, show) {
    var mukae = p === 'm';
    return [
      { id: p + 'Dep', type: 'time', label: '事業所を出た時刻', half: true, show: show },
      { id: p + 'Arr', type: 'time', label: '事業所に着いた時刻', half: true, show: show },
      { id: p + 'Plan', type: 'number', label: '予定の人数', ph: '例：5', half: true, show: show },
      { id: p + 'Act', type: 'number', label: '実際に乗った人数', ph: '例：4', half: true, show: show },
      { id: p + 'Chk', type: 'chips', label: '人数の確認・見回り（済んだものを押す）', options: CHK.map(function (c) { return [c[0], c[1]]; }), show: show },
      { id: p + 'Dbl', type: 'text', label: 'ダブルチェックした職員', hint: '運転者のほかに確かめた人', ph: '例：〇〇（同乗）', show: show },
      { id: p + 'Hand', type: 'chips', label: mukae ? '受け取り（どこで・だれから）' : '引き渡し（どこで・だれへ）', options: HAND.map(function (h) { return [h[0], mukae ? h[1] : h[2]]; }), def: mukae ? [] : ['home'], show: show },
      { id: p + 'Chg', type: 'chips', label: '欠席・変更', options: CHG.map(function (c) { return [c[0], c[1]]; }), show: show },
      { id: p + 'Memo', type: 'text', label: '欠席・変更のメモ', hint: '書くと上の選択より優先', ph: '例：〇〇さん 欠席（母より7:50に電話）', show: show },
    ];
  }

  Formdoc.run({
    title: '送迎記録',
    ai: { role: '障害児通所支援・障害福祉サービスの送迎担当の職員', doc: '送迎記録（乗車・降車の人数確認と引き渡しの記録）', rules: ['時刻・人数・確認の「済／未」は変えない。「未」を「済」に書き換えない。', '利用者の実名は入れず「〇〇さん」のままにする。', '新人職員にも分かるやさしい言葉にする。'] },
    blocks: [
      { title: '今日の送迎', fields: [
        { id: 'kind', type: 'seg', label: '事業所', options: KIND, profile: 'svc' },
        { id: 'bin', type: 'seg', label: '記録する便', hint: '「迎え・送り」は2便を1枚に', options: BIN },
        { id: 'date', type: 'date', label: '日付', today: true, half: true },
        { id: 'car', type: 'text', label: '車両', ph: '例：1号車（白のワゴン）', half: true },
        { id: 'office', type: 'text', label: '事業所名', ph: '例：〇〇子どもクラブ', half: true, profile: 'office' },
        { id: 'writer', type: 'text', label: '記入者', ph: '例：〇〇', half: true, profile: 'writer' },
      ] },
      { title: '乗った職員と出発前の確認', fields: [
        { id: 'driver', type: 'text', label: '運転者', ph: '例：〇〇', half: true },
        { id: 'staff', type: 'text', label: '同乗職員', hint: 'いない便は空欄', ph: '例：〇〇', half: true },
        { id: 'mae', type: 'chips', label: '出発前に確かめたこと', options: function (v) { return MAE.filter(function (m) { return !m[2] || v.kind === 'jido'; }).map(function (m) { return [m[0], m[1]]; }); }, def: ['meibo', 'tenken'] },
      ] },
      { title: '迎えの便', fields: binFields('m', showM) },
      { title: '送りの便', fields: binFields('o', showO) },
      { title: '利用者ごとの記録', fields: [
        { id: 'list', type: 'seg', label: '書き方', options: [['count', '人数だけ'], ['meibo', '名簿つき（1人1行）']] },
        { id: 'names', type: 'textarea', label: '乗る人（1行に1人）', hint: '空欄なら「〇〇さん」の行を人数分', ph: '〇〇さん\n△△さん', rows: 4, show: function (v) { return v.list === 'meibo'; } },
      ] },
      { title: '特記事項', fields: [
        { id: 'toku', type: 'chips', label: 'あったこと', options: TOKU.map(function (t) { return [t[0], t[1]]; }) },
        { id: 'memo', type: 'textarea', label: 'くわしく', ph: '例：送りの便で〇〇さんが車内で眠そうだった。母に伝えた。', rows: 2 },
      ] },
    ],
    build: function (v, H) {
      var jido = v.kind === 'jido';
      var bins = [];
      if (showM(v)) bins.push('m');
      if (showO(v)) bins.push('o');
      var both = bins.length === 2;

      var mae = H.pick(MAE, v.mae).filter(function (m) { return !m[2] || jido; });
      var head = [
        ['日付・車両', 'd.car', H.date(v.date) + wday(v.date) + '　車両：' + (v.car.trim() || '　　　　')],
        ['乗った職員', 'd.staff', '運転者：' + (v.driver.trim() || '　　　　') + '　／　同乗職員：' + (v.staff.trim() || 'なし（運転者のみ）')],
        ['出発前の確認', 'd.mae', mae.length ? mae.map(function (m) { return m[1]; }).join('、') + '：済' : '', '（確かめたことを記入）'],
      ];
      var sections = [{ h: '運行', w1: '84px', w2: '120px', rows: head }];

      bins.forEach(function (p) {
        var mukae = p === 'm';
        var plan = num(v[p + 'Plan']), act = num(v[p + 'Act']);
        var n = '予定 ' + (plan == null ? '　　' : plan) + '人 → 実際 ' + (act == null ? '　　' : act) + '人';
        if (plan != null && act != null && plan !== act) n += '（予定より' + Math.abs(plan - act) + '人' + (act < plan ? '少ない' : '多い') + '）';
        var chk = CHK.map(function (c) {
          var ok = v[p + 'Chk'].indexOf(c[0]) !== -1;
          return c[2] + '：' + (ok ? '済' : '未（要確認）');
        }).join('\n');
        var who = '確認した人：運転者 ' + (v.driver.trim() || '　　　　') + '・' + (v[p + 'Dbl'].trim() || v.staff.trim() || '　　　　');
        var hand = H.pick(HAND, v[p + 'Hand']).map(function (h) { return mukae ? h[1] : h[2]; });
        var chg = H.pick(CHG, v[p + 'Chg']);
        var memo = v[p + 'Memo'].trim();
        var chgText = memo ? (chg.length ? chg.map(function (c) { return c[1]; }).join('・') + '\n' : '') + memo : chg.map(function (c) { return c[2]; }).join('\n');
        sections.push({ h: mukae ? '迎えの便' : '送りの便', w1: '84px', w2: '120px', rows: [
          ['時刻', p + '.time', '事業所を出発 ' + H.time(v[p + 'Dep']) + ' → 事業所に到着 ' + H.time(v[p + 'Arr'])],
          ['人数', p + '.num', n],
          ['人数の確認', p + '.chk', chk + '\n' + who],
          [mukae ? '受け取り' : '引き渡し', p + '.hand', hand.join('、'), mukae ? '（どこで・だれから）' : '（どこで・だれへ）'],
          ['欠席・変更', p + '.chg', chgText, '（なし）'],
        ] });
      });

      // 利用者ごとの記録（名簿つき）。名前がなければ「〇〇さん」を人数分
      if (v.list === 'meibo') {
        var names = v.names.split(/\n/).map(function (s) { return s.trim(); }).filter(Boolean);
        var count = 0;
        bins.forEach(function (p) { count = Math.max(count, num(v[p + 'Plan']) || 0, num(v[p + 'Act']) || 0); });
        var rowsN = Math.min(Math.max(names.length || count || 5, 1), 20);
        var g = both
          ? { head: ['No.', '利用者', '迎え乗車', '迎え降車', '送り乗車', '送り降車', '引き渡し・メモ'], widths: ['7%', '22%', '13%', '13%', '13%', '13%', ''] }
          : { head: ['No.', '利用者', '乗車', '降車', bins[0] === 'm' ? '受け取り・メモ' : '引き渡し・メモ'], widths: ['7%', '30%', '16%', '16%', ''] };
        var rows = [];
        for (var i = 0; i < rowsN; i++) {
          var r = [String(i + 1), names[i] || '〇〇さん'];
          for (var c = 2; c < g.head.length; c++) r.push('');
          rows.push(r);
        }
        sections.push({ key: 'list', h: '利用者ごとの記録（乗車・降車は ✓ か時刻を記入）', grid: { head: g.head, widths: g.widths, rowHead: true, rows: rows, ph: '　' } });
      }

      var toku = H.pick(TOKU, v.toku).map(function (t) { return t[2]; });
      if (v.memo.trim()) toku.push(v.memo.trim());
      sections.push({ h: '特記事項', w1: '84px', w2: '120px', rows: [
        ['体調・忘れ物・ヒヤリなど', 'toku', toku.join('\n'), '（特になし）'],
        ['確認', 'sign', '記入者：' + (v.writer.trim() || '　　　　') + '　　' + (jido ? '児童発達支援管理責任者' : 'サービス管理責任者') + '・管理者の確認：　　　　'],
      ] });

      return {
        title: '送迎記録' + (both ? '（迎え・送り）' : bins[0] === 'm' ? '（迎え）' : '（送り）'),
        left: (v.office.trim() ? v.office.trim() + '\n' : '') + H.label(KIND, v.kind),
        right: H.date(v.date) + wday(v.date) + '\n記入：' + (v.writer.trim() || '　　　　'),
        sections: sections,
        foot: (jido
          ? '指定通所支援基準 第40条の3（自動車を運行する場合の所在の確認。放課後等デイサービスは第71条で準用）にもとづく乗車・降車時の確認と、送迎の実績を残すための下書きです。'
          : '送迎の実績と、乗車・降車時の人数確認を残すための下書きです。') +
          '送迎加算の要件は、最新の告示・通知と指定権者の資料でご確認ください。',
      };
    },
    info: function (v) {
      var out = [];
      [['m', '迎え', showM], ['o', '送り', showO]].forEach(function (b) {
        if (!b[2](v)) return;
        var n = v[b[0] + 'Chk'].length;
        out.push('<span>' + b[1] + ' ' + n + '/' + CHK.length + ' 済' + (n < CHK.length ? '（未あり）' : '') + '</span>');
      });
      return '<span class="coverage-label">人数の確認</span>' + out.join('');
    },
    warn: function (v) {
      var jido = v.kind === 'jido';
      var miss = [], look = [];
      [['m', '迎えの便', showM], ['o', '送りの便', showO]].forEach(function (b) {
        if (!b[2](v)) return;
        var c = v[b[0] + 'Chk'];
        var m = [];
        if (c.indexOf('on') === -1) m.push('乗車時');
        if (c.indexOf('off') === -1) m.push('降車時');
        if (m.length) miss.push(b[1] + 'の' + m.join('・'));
        if (c.indexOf('look') === -1) look.push(b[1]);
      });
      if (miss.length) return '【要確認】' + miss.join('、') + 'の人数確認が「未」です。まだ確認していないときは、今すぐ車内を一番後ろの席まで見回り、乗車名簿と事業所の出欠を照らし合わせてください。姿が確かめられない人がいたら、すぐに管理者に知らせ、保護者や学校などにも連絡して所在を確かめます。' +
        (jido ? '子どもが乗るとき・降りるときに点呼などで居場所を確かめることは、基準（指定通所支援基準 第40条の3）で決まっています。' : '') + '確認が済んでいたときだけ「済」を押してください（確認していないのに「済」にしないでください）。';
      if (look.length) return '【要確認】' + look.join('・') + 'の車内の見回りが「未」です。全員が降りたら、運転者が一番後ろの席まで歩いて、座席の下や物かげまで見回りましょう。もう1人の職員も確かめると安心です。';
      var dbl = [];
      [['m', '迎えの便', showM], ['o', '送りの便', showO]].forEach(function (b) { if (b[2](v) && !v[b[0] + 'Dbl'].trim() && !v.staff.trim()) dbl.push(b[1]); });
      if (dbl.length) return dbl.join('・') + 'は、運転者のほかに確かめた職員の名前が入っていません。運転者だけの便では、事業所に着いたあとに別の職員がもう一度車内を見回り（ダブルチェック）、その名前を書きましょう。';
      var diff = [];
      [['m', '迎えの便', showM], ['o', '送りの便', showO]].forEach(function (b) {
        if (!b[2](v)) return;
        var plan = num(v[b[0] + 'Plan']), act = num(v[b[0] + 'Act']);
        if (plan != null && act != null && plan !== act && !v[b[0] + 'Chg'].length && !v[b[0] + 'Memo'].trim()) diff.push(b[1]);
      });
      if (diff.length) return diff.join('・') + 'で、予定と実際の人数がちがいます。だれが・なぜ（欠席・家族の送り迎えなど）を「欠席・変更」に書き、事業所の出欠と合っているか確かめましょう。';
      if (v.toku.indexOf('hiyari') !== -1) return 'ヒヤリ・ハットがあったときは、その日のうちに管理者に伝え、「ヒヤリハット報告書の下書き」でも記録を残しましょう。同じことが起きないよう、送迎の手順や乗車名簿の見直しにつなげます。';
      return '';
    },
  });
})();
