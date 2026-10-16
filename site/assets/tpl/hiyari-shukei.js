// ヒヤリハットの月別集計表。1か月分の件数を、種類・場所・時間帯ごとに入れる。
// 合計・割合（％、小数第1位）・前月比・多い順を計算し、選んだ傾向から委員会への提案を組み立てる。
// 件数の欄は文字の欄（全角数字・「件」・カンマも受けつける）。数字でないものは0件として数え、赤ペンで知らせる。
(function () {
  'use strict';
  // [id, 入力欄の見出し, 表での名前]
  var TYPES = [
    ['tento', '転倒・転落', '転倒・転落'],
    ['goyaku', '誤薬（薬の間違い・飲み忘れ）', '誤薬'],
    ['goen', '誤嚥・窒息（むせ込み）', '誤嚥・窒息'],
    ['risetsu', '離設（所在が分からない）', '離設'],
    ['hifu', '皮膚トラブル・外傷', '皮膚トラブル・外傷'],
    ['sougei', '送迎', '送迎'],
    ['other', 'その他', 'その他'],
  ];
  var PLACES = [
    ['kyoshitsu', '居室', '居室'],
    ['toilet', 'トイレ', 'トイレ'],
    ['yokushitsu', '浴室・脱衣所', '浴室・脱衣所'],
    ['shokudo', '食堂・リビング', '食堂・リビング'],
    ['rouka', '廊下・階段', '廊下・階段'],
    ['genkan', '玄関', '玄関'],
    ['okugai', '屋外・送迎車', '屋外・送迎車'],
    ['sonota', 'その他・不明', 'その他・不明'],
  ];
  var TIMES = [
    ['asa', '朝（6〜9時ごろ）', '朝（6〜9時）'],
    ['nicchu', '日中（9〜16時ごろ）', '日中（9〜16時）'],
    ['yugata', '夕方（16〜19時ごろ）', '夕方（16〜19時）'],
    ['yakan', '夜間（19〜22時ごろ）', '夜間（19〜22時）'],
    ['shinya', '深夜・早朝（22〜6時ごろ）', '深夜・早朝（22〜6時）'],
  ];
  var GROUPS = [
    { key: 'type', name: '種類', list: TYPES, prefix: 't_' },
    { key: 'place', name: '場所', list: PLACES, prefix: 'p_' },
    { key: 'time', name: '時間帯', list: TIMES, prefix: 'h_' },
  ];
  // 目立った傾向：[id, チップの名前, 集計表の文, 委員会への提案]
  var TRENDS = [
    ['onaji', '同じ方で繰り返し', '同じ方のヒヤリハットが、繰り返し報告されている。', '繰り返している方について、介護職員・看護職員・ケアマネジャー（障害福祉ではサービス管理責任者など）でカンファレンスを開き、ケアの方法を見直す。'],
    ['yugata', '夕方に集中', '夕方（夕食の前後）に報告が集中している。', '夕方の業務の流れ（夕食の準備・送迎・申し送り）を見直し、見守りをする職員を決めておく。'],
    ['yakan', '夜間・早朝に多い', '夜間・早朝の報告が多い。', '夜間・早朝の巡回の時間と、センサーなどの見守り機器の使い方を見直す。'],
    ['nyuyoku', '入浴時に集中', '入浴の場面（脱衣所・浴室）での報告が集中している。', '入浴の手順（お湯の温度の確認・移動の介助・床のすべり止め）を確かめ、手順書を見直す。'],
    ['shokuji', '食事の時間帯に多い', '食事・配膳の時間帯の報告が多い。', '配膳・下膳の時間帯の役割分担と、食事を見守る職員の位置を決める。'],
    ['haisetsu', 'トイレ・排泄の場面', 'トイレ・排泄の場面での報告が多い。', 'トイレに誘導する時間を、一人ひとりの排泄のリズムに合わせて見直す。'],
    ['ijo', '移乗・立ち上がりの場面', '移乗・立ち上がりの場面での報告が多い。', '移乗・立ち上がりの介助の方法を、機能訓練の職員などと一緒に確かめる（福祉用具の見直しも含む）。'],
    ['shinjin', '新人職員の勤務帯', '新人職員が勤務している時間帯に報告が多い。', '新人職員の勤務帯には相談できる職員を決めておき、介助の手順を一緒に確かめる。'],
    ['teusu', '配置が手薄な時間帯', '職員の配置が手薄な時間帯に報告が多い。', '職員が少ない時間帯の仕事を洗い出し、時間をずらせる仕事・減らせる仕事がないかを検討する。'],
    ['nyusho', '利用を始めてまもない方', '利用を始めてまもない方の報告が多い。', '利用を始めたばかりの方は、はじめの数週間の見守りを手厚くし、生活のリズムや動き方を早めにつかむ。'],
    ['kusuri', '薬が変わったあと', '薬が変わったあとの方の報告がある。', '薬が変わった方は、変更後しばらくの様子（眠気・ふらつきなど）を記録し、看護職員から主治医に伝える。'],
    ['kankyo', '床・段差など環境', '床のぬれ・段差・照明など、環境が関わる報告がある。', '床のぬれ・段差・照明・手すりなど、環境の点検の日と担当を決めて、定期的に確かめる。'],
    ['hokoku', '報告が少ない気がする', '報告の件数が少なく、実際より少なく出ている可能性がある。', '報告が出にくい理由（書く時間がない・責められそう など）を職員に聞き、短く書ける様式や、口頭での報告も取り入れる。'],
  ];
  // 今月行った対策：[id, チップの名前, 集計表の文]
  var MEASURES = [
    ['kaigi', '職員ミーティングで共有', '報告された事例を、職員ミーティングで共有した。'],
    ['kanfa', '個別のカンファレンス', '繰り返している方について、多職種でカンファレンスを行った。'],
    ['kankyo', '環境の見直し', 'ベッド・家具の配置や、床・照明・手すりなどの環境を見直した。'],
    ['yogu', '福祉用具・センサーの見直し', '福祉用具やセンサーなどの見守り機器の使い方を見直した。'],
    ['haichi', '人の配置・業務の見直し', '手薄な時間帯の人の配置や、仕事の順番を見直した。'],
    ['tejun', '手順書の見直し', '介助・配薬などの手順書を見直した。'],
    ['kenshu', '研修・勉強会', '事故防止に関する研修・勉強会を行った。'],
    ['kazoku', '家族への説明', '必要な方について、家族に状況と対策を説明した。'],
  ];

  var MAX_DIGITS = 6; // 1か月の件数として受けつける桁（999,999件まで）

  // 件数の欄を読む。空欄は0件。全角数字・カンマ・「件」・前後の空白は受けつける。
  // 数字でないもの（小数・マイナス・文字・大きすぎる数）は0件として数え、bad で知らせる。
  function count(s) {
    var raw = String(s == null ? '' : s);
    var t = raw.normalize ? raw.normalize('NFKC') : raw;
    t = t.replace(/[,，、\s　]/g, '').replace(/件$/, '');
    if (!t) return { n: 0, empty: true, bad: false };
    if (!/^\d+$/.test(t)) return { n: 0, empty: false, bad: true, big: false };
    t = t.replace(/^0+(?=\d)/, '');
    if (t.length > MAX_DIGITS) return { n: 0, empty: false, bad: true, big: true };
    var n = Number(t);
    if (!isFinite(n) || n < 0) return { n: 0, empty: false, bad: true, big: false };
    return { n: n, empty: false, bad: false };
  }
  function fmt(n) { return (isFinite(n) ? Math.round(n) : 0).toLocaleString('ja-JP'); }
  function ken(n) { return fmt(n) + '件'; }
  // 割合（％、小数第1位）。合計が0なら「―」
  function pct(n, total) {
    if (!(total > 0)) return '―';
    var r = n / total * 100;
    return isFinite(r) ? r.toFixed(1) + '%' : '―';
  }
  // 割合を■の数で（■1つ＝10%、0件でなければ最低1つ）
  function bar(n, total) {
    if (!(total > 0) || !(n > 0)) return '';
    var k = Math.round(n / total * 10);
    if (!isFinite(k)) return '';
    return new Array(Math.min(10, Math.max(1, k)) + 1).join('■');
  }
  // 対象月：2026-09（月の欄）、または「2026/9」「2026年9月」などの書き方も読む
  function ym(s) {
    var t = String(s || '');
    if (t.normalize) t = t.normalize('NFKC');
    var m = /(\d{4})\D+(\d{1,2})/.exec(t);
    if (!m) return null;
    var y = Number(m[1]), mo = Number(m[2]);
    if (mo < 1 || mo > 12) return null;
    return { y: y, m: mo };
  }
  function ymText(s) {
    var d = ym(s);
    return d ? d.y + '年' + d.m + '月' : '　　年　　月';
  }
  function lastMonth() {
    var d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }
  function blank(s) {
    var t = String(s == null ? '' : s).trim();
    return t || '　　　　　　';
  }

  // 集計：グループごとの件数・合計・多い順と、読めなかった欄の一覧
  function tally(v) {
    var out = { bad: [], big: [] };
    GROUPS.forEach(function (g) {
      var rows = [], total = 0, filled = 0;
      g.list.forEach(function (x) {
        var c = count(v[g.prefix + x[0]]);
        if (c.bad) out[c.big ? 'big' : 'bad'].push(g.name + '「' + x[2] + '」');
        if (!c.empty) filled++;
        rows.push({ id: x[0], name: x[2], n: c.n });
        total += c.n;
      });
      var rank = rows.filter(function (r) { return r.n > 0; }).slice().sort(function (a, b) { return b.n - a.n; });
      out[g.key] = { rows: rows, total: total, rank: rank, filled: filled };
    });
    out.total = out.type.total;
    var p = count(v.prev);
    out.prev = p.empty || p.bad ? null : p.n;
    out.prevBad = p.bad;
    return out;
  }
  // 多い順の上位3つ（同じ件数は並べて書く）
  function top3(rank, total) {
    if (!rank.length) return '';
    return rank.slice(0, 3).map(function (r, i) { return (i + 1) + '位 ' + r.name + '（' + ken(r.n) + '・' + pct(r.n, total) + '）'; }).join('　');
  }
  function firstName(rank) { return rank.length ? rank[0].name : ''; }
  // 前月比
  function compare(t) {
    if (t.prev == null) return '';
    var d = t.total - t.prev;
    var s = '先月 ' + ken(t.prev) + ' → 今月 ' + ken(t.total);
    if (d === 0) return s + '（先月と同じ）';
    var word = d > 0 ? fmt(d) + '件増' : fmt(-d) + '件減';
    if (t.prev > 0) {
      var r = d / t.prev * 100;
      if (isFinite(r)) {
        var rs = Math.abs(r).toFixed(1);
        return s + '（' + word + '、' + (d > 0 ? '＋' : '−') + rs + '%）';
      }
    }
    return s + '（' + word + '。先月は0件のため、増えた割合は出せません）';
  }
  function compareNote(t) {
    if (t.prev == null) return '';
    var d = t.total - t.prev;
    if (d < 0) return '合計は先月より減った。減った種類・場所・時間帯を確かめ、効果のあった対策は続ける。報告が出にくくなっていないかもあわせて確かめる。';
    if (d > 0) return '合計は先月より増えた。報告が増えたこと自体は悪いことではないため、内訳から増えた種類・場所・時間帯を確かめ、理由を話し合う。';
    return '合計は先月と同じ。内訳に変化がないかを確かめる。';
  }
  function gridRows(g) {
    var rows = g.rows.map(function (r) { return [r.name, ken(r.n), pct(r.n, g.total), bar(r.n, g.total)]; });
    rows.push(['合計', ken(g.total), g.total > 0 ? '100.0%' : '―', '']);
    return rows;
  }

  // 件数の欄は数字のキーボードを出す（エンジンの欄はそのまま。描き直しても付け直す）
  function numericKeyboard() {
    var panel = document.getElementById('fdPanel');
    if (!panel) return;
    var apply = function () {
      panel.querySelectorAll('input[data-f^="t_"],input[data-f^="p_"],input[data-f^="h_"],input[data-f="prev"]').forEach(function (el) {
        if (el.getAttribute('inputmode') !== 'numeric') el.setAttribute('inputmode', 'numeric');
      });
    };
    apply();
    if (window.MutationObserver) new MutationObserver(apply).observe(panel, { childList: true });
  }

  // 集計の表は行が多いので、このツールの書類だけ行の高さを詰めて、A4の1枚に収まりやすくする
  (function addStyle() {
    var css = [
      '#fdDoc .fd-grid th, #fdDoc .fd-grid td { padding-top: 2px; padding-bottom: 2px; line-height: 1.45; }',
      '#fdDoc .fd-grid .ed { min-height: 1.45em; }',
      '#fdDoc .fd-grid-h { margin: 10px 0 4px; }',
      '#fdDoc .fd-grid td:nth-child(n+2):not(:last-child) .ed, #fdDoc .fd-grid td:last-child .ed { white-space: nowrap; }',
      // スマホ：件数・割合の列を細くして、グラフ（■）を1行に収める
      '@media (max-width: 640px) { #fdDoc .fd-grid col:nth-child(2) { width: 46px !important; } #fdDoc .fd-grid col:nth-child(3) { width: 60px !important; } #fdDoc .fd-grid td { padding-left: 4px; padding-right: 4px; font-size: 11.5px; } #fdDoc .fd-grid td:last-child { font-size: 9px; letter-spacing: -1px; } }',
      // 印刷はA4縦2枚：1枚目に数字（まとめと3つの表）、2枚目に「傾向と対策」「委員会への提案」（書き込む余白も残す）
      '@media print { #fdDoc > table:nth-of-type(5) { break-before: page; } #fdDoc tr { break-inside: avoid; } }',
    ].join('\n');
    var el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
  })();

  // 印刷の2枚目の先頭に「〇年〇月 ヒヤリハットの月別集計（つづき）事業所名」を出す（書類を作り直すたびに更新）
  function printCont(month, office) {
    var el = document.getElementById('hiyariCont');
    if (!el) { el = document.createElement('style'); el.id = 'hiyariCont'; document.head.appendChild(el); }
    var txt = (month + ' ヒヤリハットの月別集計（つづき）' + (office ? ' ' + office : '')).replace(/[\\"\r\n]/g, ' ');
    el.textContent = '@media print { #fdDoc > table:nth-of-type(5)::before { content: "' + txt + '"; display: table-caption; caption-side: top; text-align: left; font-size: 10px; padding: 0 0 6px; color: #444; } }';
  }

  function countFields(g) {
    return g.list.map(function (x) { return { id: g.prefix + x[0], type: 'text', label: x[1], ph: '0', half: true }; });
  }

  Formdoc.run({
    title: 'ヒヤリハット月別集計表',
    ai: {
      role: '介護施設・障害福祉の事業所で、事故防止委員会（安全対策委員会）の担当をしている職員',
      doc: 'ヒヤリハットの月別集計表（事故防止委員会の資料）',
      rules: [
        '件数・割合・前月比・順位の数字は変えない。',
        '「目立った傾向」は、集計の数字と選んだ傾向をつなげて、委員会で読んで分かる文章にする。',
        '職員を責める書き方にせず、場面・時間帯・環境・仕組みの課題として書く。',
        '「委員会への提案」は、だれが・いつまでに・何をするかが分かるように具体的にする。',
        '利用者や職員の実名は書かない（〇〇さん などにする）。分からないことは推測で埋めず、【要確認】と書く。',
      ],
    },
    blocks: [
      { title: '対象の月と事業所', fields: [
        { id: 'month', type: 'month', label: '対象の月', hint: 'ふつうは先月分をまとめます', def: lastMonth() },
        { id: 'office', type: 'text', label: '事業所名', ph: '例：特別養護老人ホーム〇〇', profile: 'office' },
        { id: 'writer', type: 'text', label: '記入者', hint: '安全対策の担当者など', ph: '例：介護主任 〇〇', profile: 'writer' },
      ] },
      { title: '種類ごとの件数', note: '数字だけを入れます（全角でも大丈夫）。0件の欄は空欄のままでかまいません。', fields: countFields(GROUPS[0]) },
      { title: '場所ごとの件数', note: '種類と同じ報告を、起きた場所で数えます。分からないものは「その他・不明」に。', fields: countFields(GROUPS[1]) },
      { title: '時間帯ごとの件数', note: '種類と同じ報告を、起きた時間帯で数えます。', fields: countFields(GROUPS[2]) },
      { title: '先月との比べ', small: '（任意）', fields: [
        { id: 'prev', type: 'text', label: '先月の合計（件）', hint: '入れると前月比を計算します', ph: '例：12' },
      ] },
      { title: '目立った傾向', fields: [
        { id: 'trends', type: 'chips', label: '報告を読んで気づいたこと（いくつでも）', options: TRENDS.map(function (x) { return [x[0], x[1]]; }), def: [] },
        { id: 'trendMemo', type: 'textarea', label: 'そのほかに気づいたこと', rows: 2, ph: '例：〇〇さんの夕方の立ち上がりが3件。いずれも夕食前のトイレの訴えのあと。' },
      ] },
      { title: '今月の対策と来月の重点', fields: [
        { id: 'measures', type: 'chips', label: '今月行った対策', options: MEASURES.map(function (x) { return [x[0], x[1]]; }), def: [] },
        { id: 'measureMemo', type: 'textarea', label: 'そのほかの対策', rows: 2, ph: '例：17時台に見守りの職員を1人決め、居室の巡回を増やした。' },
        { id: 'focus', type: 'textarea', label: '来月の重点', hint: '空欄なら、いちばん多かった種類から入れます', rows: 2, ph: '例：夕方の居室での転倒を減らす（17時台の見守りの職員を決める）' },
      ] },
    ],
    build: function (v, H) {
      var t = tally(v);
      var total = t.total;
      var month = ymText(v.month);
      printCont(month, String(v.office || '').trim());

      // 1. 今月のまとめ
      var summary = [
        ['報告の合計', 'total', ken(total)],
        ['前月比', 'compare', compare(t), '（先月の合計を入れると計算します）'],
        ['多い種類', 'topType', top3(t.type.rank, t.type.total), '（件数を入れると入ります）'],
        ['多い場所', 'topPlace', top3(t.place.rank, t.place.total), '（件数を入れると入ります）'],
        ['多い時間帯', 'topTime', top3(t.time.rank, t.time.total), '（件数を入れると入ります）'],
      ];

      // 2. 傾向と対策
      var obs = [];
      if (total > 0) {
        var r0 = t.type.rank[0];
        var s = 'いちばん多い種類は「' + r0.name + '」（' + ken(r0.n) + '・' + pct(r0.n, total) + '）。';
        var pl = firstName(t.place.rank), tm = firstName(t.time.rank);
        if (pl || tm) s += (pl ? '場所は「' + pl + '」' : '') + (pl && tm ? '、' : '') + (tm ? '時間帯は「' + tm + '」' : '') + 'が多い。';
        obs.push(s);
      }
      TRENDS.forEach(function (x) { if (v.trends.indexOf(x[0]) !== -1) obs.push(x[2]); });
      var memo = String(v.trendMemo || '').trim();
      if (memo) obs.push(memo);
      if (t.prev != null) obs.push(compareNote(t));

      var meas = MEASURES.filter(function (x) { return v.measures.indexOf(x[0]) !== -1; }).map(function (x) { return x[2]; });
      var mm = String(v.measureMemo || '').trim();
      if (mm) meas.push(mm);

      var focus = String(v.focus || '').trim();
      if (!focus && total > 0) {
        var top = t.type.rank[0];
        focus = '今月いちばん多かった「' + top.name + '」を減らす取り組みを重点にする。';
        var pl2 = firstName(t.place.rank), tm2 = firstName(t.time.rank);
        if (pl2 || tm2) focus += '特に' + [pl2, tm2].filter(Boolean).join('・') + 'の見守りと環境を確かめる。';
      }

      // 3. 委員会への提案
      var props = TRENDS.filter(function (x) { return v.trends.indexOf(x[0]) !== -1; }).map(function (x) { return x[3]; });
      if (total > 0) props.push('件数の多い「' + t.type.rank[0].name + '」の報告を読み合わせ、本人・職員・環境の3つの面から原因を話し合う。');
      props.push('決めた対策を職員に周知し、来月の集計で効果を確かめる。');

      var g = GROUPS.map(function (gr) { return t[gr.key]; });
      var head = function (name) { return [name, '件数', '割合', 'グラフ（■1つ＝10%）']; };
      var widths = ['', '76px', '76px', '38%'];

      return {
        title: 'ヒヤリハット月別集計表',
        left: '事業所名：' + blank(v.office),
        right: '対象月：' + month + '分\n作成日：' + H.date('') + '\n記入者：' + blank(v.writer),
        sections: [
          { h: '1. 今月のまとめ', w2: '96px', rows: summary },
          { key: 'type', h: '2. 種類別の件数', grid: { head: head('種類'), widths: widths, rowHead: true, labelCol: true, rows: gridRows(g[0]), ph: '　' } },
          { key: 'place', h: '3. 場所別の件数', grid: { head: head('場所'), widths: widths, rowHead: true, labelCol: true, rows: gridRows(g[1]), ph: '　' } },
          { key: 'time', h: '4. 時間帯別の件数', grid: { head: head('時間帯'), widths: widths, rowHead: true, labelCol: true, rows: gridRows(g[2]), ph: '　' } },
          { h: '5. 傾向と対策', w2: '96px', rows: [
            ['目立った傾向', 'obs', H.bullets(obs), '（報告を読んで気づいたこと）'],
            ['今月の対策', 'measures', H.bullets(meas), '（今月行った対策）'],
            ['来月の重点', 'focus', focus, '（来月いちばん力を入れること）'],
          ] },
          { h: '6. 委員会への提案', w2: '96px', rows: [
            ['提案', 'props', H.bullets(props)],
            ['委員会で決めたこと', 'kime', '', '（委員会で話し合ったあとに記入）'],
            ['職員への周知', 'shuchi', '', '（いつ・どの方法で伝えるか。例：〇月の職員会議、掲示）'],
          ] },
        ],
        foot: '割合は、その表の合計に対する割合で、小数第1位まで（四捨五入）表示しています。四捨五入のため、足しても100%にならないことがあります。ヒヤリハットの集計は、職員を評価するためではなく、事故を防ぐ場面を見つけるためのものです。',
      };
    },
    info: function (v) {
      var t = tally(v);
      var html = '<span class="coverage-label">今月の合計</span><span>' + ken(t.total) + '</span>';
      if (t.prev != null) {
        var d = t.total - t.prev;
        html += '<span>先月比 ' + (d > 0 ? '＋' + fmt(d) : d < 0 ? '−' + fmt(-d) : '±0') + '件</span>';
      }
      return html;
    },
    warn: function (v) {
      var t = tally(v);
      if (t.bad.length) return t.bad.slice(0, 3).join('・') + (t.bad.length > 3 ? ' など' : '') + 'の欄に、数字ではないもの（文字・小数・マイナスなど）が入っています。0件として数えているので、件数を数字だけで入れ直してください。';
      if (t.big.length) return t.big.slice(0, 3).join('・') + 'の欄の数が大きすぎます（' + MAX_DIGITS + 'けたまで）。0件として数えているので、1か月分の件数か確かめてください。';
      if (t.prevBad) return '先月の合計に、数字ではないものが入っています。前月比は計算していません。数字だけで入れ直してください。';
      if (t.total === 0) {
        if (t.place.total || t.time.total) return '種類ごとの件数が入っていません。合計と割合は、種類ごとの件数から計算します。';
        return '種類ごとの件数を入れると、合計・割合・多い順を計算します。報告が0件の月も、0件として記録に残しておきましょう。';
      }
      if (t.total > 1000) return '件数がとても大きくなっています。1か月分の件数か確かめてください。';
      var diffs = [];
      if (t.place.filled && t.place.total !== t.total) diffs.push('場所の合計（' + ken(t.place.total) + '）');
      if (t.time.filled && t.time.total !== t.total) diffs.push('時間帯の合計（' + ken(t.time.total) + '）');
      if (diffs.length) return '種類の合計（' + ken(t.total) + '）と、' + diffs.join('・') + 'が合っていません。1件の報告を、それぞれの表で1回ずつ数えます。分からないものは「その他・不明」に入れてください。';
      if (!t.place.filled || !t.time.filled) return '場所・時間帯ごとの件数も入れると、「どこで・いつ」起きやすいかが分かります。';
      if (!v.trends.length) return '報告を読んで気づいた傾向を選ぶと、委員会への提案が入ります。';
      return '';
    },
  });
  numericKeyboard();
})();
