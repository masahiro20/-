// 作業日報・工賃の記録（1日分）。就労継続支援B型・A型、就労移行支援。
// 作業の種類・時間・出来高（数量×単価）→ 出来高の合計・作業時間の合計を自動計算。本人の様子・支援したことを選んで文にする。
// 数の欄は文字の欄（全角数字・カンマ・「円」も受けつける）。数字でないもの・大きすぎる数は0として数え、赤ペンで知らせる。
(function () {
  'use strict';
  var SVC = [['b', '就労継続支援B型'], ['a', '就労継続支援A型'], ['iko', '就労移行支援']];
  var WEATHER = [['', '（書かない）'], ['hare', '晴れ'], ['kumori', 'くもり'], ['ame', '雨'], ['yuki', '雪']];
  var BODY = [['', '（書かない）'], ['good', '元気そう'], ['normal', 'いつもどおり'], ['tired', '疲れ気味'], ['bad', '体調がすぐれない']];
  var ATTEND = [['full', '出勤（通常どおり）'], ['late', '遅刻'], ['early', '早退'], ['home', '在宅での作業'], ['absent', '欠席']];
  // [id, チップの名前]
  var WORKS = [
    ['nou', '農作業'], ['kei', '軽作業・受託'], ['shoku', '食品製造'], ['seisou', '清掃'],
    ['cafe', 'カフェ・接客'], ['shukou', '手工芸'], ['pc', 'パソコン作業'], ['gai', '施設外就労'],
  ];
  // [id, チップの名前, 日報の文]
  var DID = [
    ['shuchu', '集中して取り組めた', '集中して作業に取り組めた。'],
    ['tejun', '手順書を見て自分で進めた', '手順書を見ながら、自分で作業を進められた。'],
    ['ryou', '前より多くできた', '前回より、できた量が増えた。'],
    ['teinei', '丁寧に仕上げた', '丁寧に仕上げられた（やり直しが少なかった）。'],
    ['kyukei', '自分から休憩をとれた', '疲れたときに、自分から休憩をとれた。'],
    ['shitsumon', '分からないことを聞けた', '分からないところを、自分から職員に聞けた。'],
    ['kyoryoku', '仲間と協力できた', 'ほかの利用者と声をかけ合って作業できた。'],
    ['saigo', '最後まで続けられた', '最後まで作業を続けられた。'],
  ];
  var HARD = [
    ['tsukare', '午後に疲れが出た', '午後になると疲れが見え、手が止まることが増えた。'],
    ['shuchu', '集中が続かなかった', '集中が続かず、作業から離れることがあった。'],
    ['tejun', '手順が分からなくなった', '手順が分からなくなり、職員の確認が必要だった。'],
    ['yarinaoshi', 'やり直しが出た', 'やり直し（不良）が出た。'],
    ['pace', '作業のペースが落ちた', '作業のペースが、いつもより落ちた。'],
    ['kimochi', '気持ちが落ち着かなかった', '気持ちが落ち着かず、作業を中断することがあった。'],
    ['kankyo', '音・暑さが気になった', '音や暑さなど、環境が気になる様子だった。'],
    ['kankei', '人との関わりで困った', 'ほかの人との関わりで困ることがあった。'],
    ['taicho', '体調の不調を訴えた', '体調のすぐれなさを訴えた。'],
  ];
  var SUPPORT = [
    ['tejun', '手順を写真・見本で示した', '作業の手順を、写真や見本で示した。'],
    ['kowake', '作業を小分けにした', '作業を小分けにして、一つ終わるごとに確認した。'],
    ['kyukei', '休憩のタイミングを一緒に決めた', '休憩のタイミングを、本人と一緒に決めた。'],
    ['koe', '声かけで作業に戻れるよう促した', '手が止まったときに、次にすることを短く伝えた。'],
    ['homeru', 'できたことを具体的に伝えた', 'できたことを、具体的に本人に伝えた。'],
    ['kankyo', '作業の場所・環境を調整した', '作業の場所や環境（席・音・温度など）を調整した。'],
    ['kensa', '品質を一緒に確認した', '仕上がりを本人と一緒に確認した。'],
    ['mendan', '本人の話を聞いた', '個別に時間をとり、本人の気持ちや体調を聞いた。'],
    ['renraku', '家族・関係機関に連絡した', '家族・関係機関に、本日の様子を連絡した。'],
  ];
  var ITEMS = 3; // 出来高の品目の数

  var MAX_Q = 10000000; // 数量の上限（1,000万まで）
  var MAX_P = 1000000;  // 単価の上限（100万円まで）
  var MAX_BRK = 1440;   // 休憩（分）の上限

  // 数の欄を読む。空欄は empty。全角数字・カンマ・「円」・空白は受けつける。
  // 数字でないもの（文字・マイナス・大きすぎる数）は0として数え、bad で知らせる。
  function num(s, max) {
    var raw = String(s == null ? '' : s);
    var t = raw.normalize ? raw.normalize('NFKC') : raw;
    t = t.replace(/[,，、\s　]/g, '').replace(/円$/, '');
    if (!t) return { n: 0, empty: true, bad: false, big: false };
    if (!/^\d+(\.\d+)?$/.test(t)) return { n: 0, empty: false, bad: true, big: false };
    var n = Number(t);
    if (!isFinite(n)) return { n: 0, empty: false, bad: true, big: true };
    if (n > max) return { n: 0, empty: false, bad: true, big: true };
    return { n: n, empty: false, bad: false, big: false };
  }
  function fmt(n, digits) {
    if (!isFinite(n)) return '0';
    return n.toLocaleString('ja-JP', { maximumFractionDigits: digits == null ? 0 : digits });
  }
  function yen(n) { return fmt(Math.round(n)) + '円'; }
  function mins(s) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    var h = Number(m[1]), mi = Number(m[2]);
    return h > 23 || mi > 59 ? null : h * 60 + mi;
  }
  function dur(m) {
    if (!(m > 0)) return '0分';
    var h = Math.floor(m / 60), r = Math.round(m % 60);
    return (h ? h + '時間' : '') + (r || !h ? r + '分' : '');
  }

  // 作業時間：開始〜終了から休憩を引く
  function workTime(v) {
    var s = mins(v.start), e = mins(v.end);
    var b = num(v.brk, MAX_BRK);
    var out = { s: s, e: e, brk: Math.round(b.n), brkBad: b.bad, span: 0, net: 0, order: false, brkOver: false, has: s != null && e != null };
    if (!out.has) return out;
    if (e <= s) { out.order = true; return out; }
    out.span = e - s;
    out.net = out.span - out.brk;
    if (out.net < 0) { out.net = 0; out.brkOver = true; }
    return out;
  }

  // 出来高：品目ごとに 数量×単価。合計は各行の金額（円未満は四捨五入）の和
  function pieces(v) {
    var rows = [], total = 0, bad = [], big = [], half = [];
    for (var i = 1; i <= ITEMS; i++) {
      var name = String(v['n' + i] || '').trim();
      var q = num(v['q' + i], MAX_Q), p = num(v['p' + i], MAX_P);
      var label = name || (i + '行目');
      if (q.bad) (q.big ? big : bad).push(label + 'の数量');
      if (p.bad) (p.big ? big : bad).push(label + 'の単価');
      var amount = null;
      if (!q.empty && !p.empty) {
        amount = Math.round(Number((q.n * p.n).toPrecision(12))); // 浮動小数の誤差で .5 が落ちないようにする
        if (!isFinite(amount)) amount = 0;
        total += amount;
      } else if ((!q.empty || !p.empty) && !q.bad && !p.bad) {
        half.push(label);
      }
      rows.push({ name: name, q: q, p: p, amount: amount, any: !!name || !q.empty || !p.empty });
    }
    if (!isFinite(total)) total = 0;
    return { rows: rows, total: total, bad: bad, big: big, half: half, any: rows.some(function (r) { return r.any; }) };
  }
  function heads(v) {
    var h = num(v.heads, 10000);
    return h.bad || h.empty || !(h.n >= 1) ? { n: 1, given: false, bad: h.bad } : { n: Math.floor(h.n), given: true, bad: false };
  }
  // 時間あたりの金額（参考）
  function hourly(v) {
    var t = workTime(v), p = pieces(v), h = heads(v);
    if (!(t.net > 0) || !(p.total > 0)) return null;
    var r = p.total / (h.n * t.net / 60);
    return isFinite(r) ? r : null;
  }
  function hourlyText(r) {
    return '約' + r.toLocaleString('ja-JP', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '円';
  }

  function pick(list, ids) { return list.filter(function (x) { return ids.indexOf(x[0]) !== -1; }); }
  function label(list, id) { var r = id ? list.filter(function (x) { return x[0] === id; })[0] : null; return r ? r[1] : ''; }

  // 数の欄は数字のキーボードを出す
  function numericKeyboard() {
    var panel = document.getElementById('fdPanel');
    if (!panel) return;
    var apply = function () {
      panel.querySelectorAll('input[data-f^="q"],input[data-f^="p"],input[data-f="brk"],input[data-f="heads"]').forEach(function (el) {
        if (el.getAttribute('inputmode') !== 'decimal') el.setAttribute('inputmode', 'decimal');
      });
    };
    apply();
    if (window.MutationObserver) new MutationObserver(apply).observe(panel, { childList: true });
  }

  // 書類の見た目：表の数字は右そろえ、行を詰めてA4の1枚に収める
  (function addStyle() {
    var css = [
      '#fdDoc .fd-grid th, #fdDoc .fd-grid td { padding-top: 2px; padding-bottom: 2px; line-height: 1.45; }',
      '#fdDoc .fd-grid td:nth-child(n+2) .ed { text-align: right; }',
      '#fdDoc .fd-grid tr:last-child td, #fdDoc .fd-grid tr:last-child th { font-weight: 700; }',
      '#fdDoc .fd-grid-h { margin: 10px 0 4px; }',
      '@media print { #fdDoc tr { break-inside: avoid; } }',
    ].join('\n');
    var el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
  })();

  var itemFields = [];
  for (var i = 1; i <= ITEMS; i++) {
    itemFields.push({ id: 'n' + i, type: 'text', label: i + 'つ目の品目', ph: i === 1 ? '例：袋詰め（個）' : i === 2 ? '例：シール貼り（枚）' : '例：除草（㎡）' });
    itemFields.push({ id: 'q' + i, type: 'text', label: '数量', ph: '例：120', half: true });
    itemFields.push({ id: 'p' + i, type: 'text', label: '単価（円）', ph: '例：5', half: true });
  }

  Formdoc.run({
    title: '作業日報',
    ai: { role: '就労継続支援事業所の職業指導員・生活支援員', doc: '作業日報（1日分）', rules: ['数量・単価・金額・作業時間の数字は変えない。', '見たこと・聞いたことを書き、「がんばっていた」などの主観的な言葉は避ける。', '本人の様子と、職員の支援を分けて書く。', '利用者の実名は書かない（〇〇さん などにする）。分からないことは推測で埋めず、【要確認】と書く。'] },
    blocks: [
      { title: 'サービスと日付', fields: [
        { id: 'svc', type: 'seg', options: SVC, def: 'b' },
        { id: 'date', type: 'date', label: '日付', today: true },
        { id: 'weather', type: 'select', label: '天気', options: WEATHER, def: '', half: true },
        { id: 'body', type: 'select', label: '体調の様子', options: BODY, def: '', half: true },
      ] },
      { title: '利用者と出欠', fields: [
        { id: 'who', type: 'text', label: '利用者', hint: '名前は「〇〇さん」。グループでも', ph: '例：〇〇さん　／　農作業班' },
        { id: 'heads', type: 'text', label: '利用者の人数（人）', hint: '班やグループで書くとき', ph: '例：6', half: true },
        { id: 'attend', type: 'select', label: '出欠', options: ATTEND, def: 'full', half: true },
        { id: 'reason', type: 'text', label: '遅刻・早退・欠席の理由', ph: '例：通院のため、14時に早退' },
      ] },
      { title: '作業の種類と時間', fields: [
        { id: 'works', type: 'chips', label: '作業の種類', options: WORKS, def: ['kei'] },
        { id: 'workMemo', type: 'text', label: '作業の内容', ph: '例：パンフレットの封入、〇〇社の部品の袋詰め' },
        { id: 'start', type: 'time', label: '開始', def: '09:30', half: true },
        { id: 'end', type: 'time', label: '終了', def: '15:30', half: true },
        { id: 'brk', type: 'text', label: '休憩（分）', hint: '昼休みなど、合わせて', ph: '例：60', def: '60' },
      ] },
      { title: '出来高（数量×単価）', note: '数字だけを入れます（全角でも大丈夫）。品目ごとに、数量と1つあたりの単価（円）を入れると、金額と合計を計算します。', fields: itemFields },
      { title: '本人の様子', fields: [
        { id: 'did', type: 'chips', label: 'できたこと', options: DID.map(function (x) { return [x[0], x[1]]; }), def: ['shuchu'] },
        { id: 'hard', type: 'chips', label: '困ったこと', options: HARD.map(function (x) { return [x[0], x[1]]; }), def: [] },
        { id: 'lookMemo', type: 'textarea', label: '補足（本人の言葉など）', hint: '見たこと・聞いたことをそのまま', rows: 2, ph: '例：「明日は箱づくりをやってみたい」と話していた。' },
      ] },
      { title: '支援したこと', fields: [
        { id: 'sup', type: 'chips', label: '職員がした支援', options: SUPPORT.map(function (x) { return [x[0], x[1]]; }), def: [] },
        { id: 'supMemo', type: 'textarea', label: 'そのほかの支援', rows: 2, ph: '例：午後は静かな席に移って作業した。' },
      ] },
      { title: '特記事項と工賃への反映', fields: [
        { id: 'note', type: 'textarea', label: '特記事項', rows: 2, ph: '例：納品が明日のため、残りの作業は明日続ける。' },
        { id: 'kouchin', type: 'textarea', label: '工賃への反映メモ', hint: '月の工賃を計算するときに気をつけること', rows: 2, ph: '例：施設外就労の時間は、別の記録で確認する。' },
      ] },
      { title: '事業所と記入者', small: 'ほかの書類にも入ります', fields: [
        { id: 'office', type: 'text', label: '事業所名', ph: '例：〇〇作業所', half: true, profile: 'office' },
        { id: 'writer', type: 'text', label: '記入者（職種）', ph: '例：職業指導員 〇〇', half: true, profile: 'writer' },
      ] },
    ],
    build: function (v, H) {
      var svcName = label(SVC, v.svc) || SVC[0][1];
      var t = workTime(v), p = pieces(v), h = heads(v);
      var wtr = label(WEATHER, v.weather), body = label(BODY, v.body);

      // 利用者と出欠
      var who = String(v.who || '').trim();
      var hd = num(v.heads, 10000);
      var whoText = who;
      if (!hd.empty && !hd.bad && hd.n >= 1) whoText = (who ? who + '（' : '利用者 ') + fmt(Math.floor(hd.n)) + '人' + (who ? '）' : '');
      var reason = String(v.reason || '').trim();
      var attendText = label(ATTEND, v.attend) + (reason ? '（' + reason + '）' : '');
      var bodyText = [wtr ? '天気：' + wtr : '', body ? '体調：' + body : ''].filter(Boolean).join('　');

      // 作業の種類と時間
      var works = pick(WORKS, v.works).map(function (x) { return x[1]; });
      var memo = String(v.workMemo || '').trim();
      var worksText = works.join('、') + (memo ? (works.length ? '（' + memo + '）' : memo) : '');
      var timeText = '';
      if (t.has && !t.order) timeText = H.time(v.start) + '〜' + H.time(v.end) + (t.brk ? '（休憩 ' + t.brk + '分）' : '');
      var netText = t.has && !t.order ? dur(t.net) : '';

      // 出来高の表
      var rows = p.rows.map(function (r) {
        return [r.name, r.q.empty || r.q.bad ? '' : fmt(r.q.n, 4), r.p.empty || r.p.bad ? '' : fmt(r.p.n, 4), r.amount == null ? '' : fmt(r.amount)];
      });
      rows.push(['合計', '', '', p.any || p.total ? fmt(p.total) + '円' : '']);

      // まとめ
      var hr = hourly(v);
      var hrText = hr == null ? '' : hourlyText(hr) + (h.given ? '（利用者1人あたり・参考）' : '（参考）');

      // 本人の様子・支援
      var did = pick(DID, v.did).map(function (x) { return x[2]; });
      var hard = pick(HARD, v.hard).map(function (x) { return x[2]; });
      var look = String(v.lookMemo || '').trim();
      var sup = pick(SUPPORT, v.sup).map(function (x) { return x[2]; });
      var sm = String(v.supMemo || '').trim();
      if (sm) sup.push(sm);

      return {
        title: '作業日報',
        left: H.blank(v.office, '事業所名：') + '\n' + svcName,
        right: H.date(v.date) + '\n記入者：' + H.blank(v.writer),
        sections: [
          { h: '1. 利用者と出欠', w2: '120px', rows: [
            ['利用者', 'who', whoText, '（〇〇さん、または人数）'],
            ['出欠', 'attend', attendText],
            ['天気・体調', 'body', bodyText, '（天気・体調の様子）'],
          ] },
          { h: '2. 作業の内容と時間', w2: '120px', rows: [
            ['作業の種類', 'works', worksText, '（作業の種類・内容）'],
            ['作業時間', 'time', timeText, '（　時　分〜　時　分、休憩　分）'],
            ['実作業時間', 'net', netText, '（開始・終了・休憩から計算します）'],
          ] },
          { key: 'piece', h: '3. 出来高（数量×単価）', grid: { head: ['品目', '数量', '単価（円）', '金額'], widths: ['', '90px', '90px', '120px'], rows: rows, ph: '　' } },
          { h: '4. 出来高と時間のまとめ', w2: '120px', rows: [
            ['出来高の合計', 'total', p.any || p.total ? yen(p.total) : '', '（品目を入れると計算します）'],
            ['作業時間の合計', 'nettotal', netText ? netText + (h.given ? '（1人あたり）' : '') : '', '（作業時間から計算します）'],
            ['時間あたりの金額', 'hourly', hrText, '（出来高÷作業時間。目安です）'],
          ] },
          { h: '5. 本人の様子', w2: '120px', rows: [
            ['できたこと', 'did', H.bullets(did), '（できたことを選ぶと入ります）'],
            ['困ったこと', 'hard', H.bullets(hard), '（困ったことを選ぶと入ります）'],
            ['補足', 'look', look, '（本人の言葉など。見たこと・聞いたことをそのまま）'],
          ] },
          { h: '6. 支援したこと', w2: '120px', rows: [
            ['支援', 'sup', H.bullets(sup), '（職員がした支援を選ぶと入ります）'],
          ] },
          { h: '7. 特記事項', w2: '120px', rows: [
            ['特記事項', 'note', String(v.note || '').trim(), '（引き継ぎ・連絡など）'],
            ['工賃への反映', 'kouchin', String(v.kouchin || '').trim(), '（月の工賃を計算するときのメモ）'],
          ] },
        ],
        foot: '出来高の金額は「数量×単価」で、各行の円未満は四捨五入して合計しています。時間あたりの金額は、出来高の合計を実作業時間で割った目安（小数第1位まで）で、工賃や賃金の額を決めるものではありません。' +
          (v.svc === 'a' ? 'A型の賃金は、雇用契約・最低賃金などの決まりに沿って別に計算してください。' : v.svc === 'b' ? '工賃の決め方は、事業所の規程に従ってください。' : '') +
          'この日報は、工賃の計算・個別支援計画のモニタリング・生産活動の収支を確かめる資料になります。',
      };
    },
    info: function (v) {
      var p = pieces(v), t = workTime(v);
      var html = '<span class="coverage-label">出来高の合計</span><span>' + yen(p.total) + '</span>';
      if (t.has && !t.order) html += '<span>実作業時間 ' + dur(t.net) + '</span>';
      var hr = hourly(v);
      if (hr != null) html += '<span>時間あたり ' + hourlyText(hr) + '（参考）</span>';
      return html;
    },
    warn: function (v) {
      var p = pieces(v), t = workTime(v), h = heads(v);
      if (p.bad.length) return p.bad.slice(0, 3).join('・') + (p.bad.length > 3 ? ' など' : '') + 'に、数字ではないもの（文字・マイナスなど）が入っています。0として数えているので、数字だけで入れ直してください。';
      if (p.big.length) return p.big.slice(0, 3).join('・') + 'の数が大きすぎます（数量は1,000万まで、単価は100万円まで）。0として数えているので、入れた数を確かめてください。';
      if (t.brkBad) return '休憩（分）に、数字ではないもの、または大きすぎる数が入っています。0分として数えているので、分の数字だけで入れ直してください。';
      if (h.bad) return '利用者の人数に、数字ではないもの、または大きすぎる数が入っています。1人として数えているので、人数だけを数字で入れ直してください。';
      if (t.order) return '終了の時刻が、開始より前になっています。作業時間は計算していません。時刻を確かめてください。';
      if (t.brkOver) return '休憩の時間が、開始から終了までより長くなっています。実作業時間は0分としています。確かめてください。';
      if (v.attend === 'absent' && (p.total > 0 || t.net > 0)) return '出欠が「欠席」になっていますが、出来高や作業時間が入っています。確かめてください。';
      if (p.half.length) return p.half.slice(0, 3).join('・') + 'は、数量か単価のどちらかが空です。金額は、数量と単価の両方が入ると計算します。';
      if (!p.any) return '品目と数量・単価を入れると、出来高の合計を計算します。出来高がない日は、そのまま空欄でかまいません。';
      if (p.total > 100000000) return '出来高の合計がとても大きくなっています。数量と単価の桁を確かめてください。';
      if (!v.did.length && !v.hard.length && !String(v.lookMemo || '').trim()) return '本人の様子（できたこと・困ったこと）を書いておくと、モニタリングの材料になります。';
      if (v.svc === 'a') return 'A型の賃金は、雇用契約や最低賃金などの決まりに沿って計算します。この日報の時間あたりの金額は参考です。';
      return '';
    },
  });
  numericKeyboard();
})();
