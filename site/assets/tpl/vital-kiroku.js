// バイタル・健康観察の記録（1名1日分）。体温・血圧・脈拍・SpO2は文字の欄で、全角・単位つきも受けつける。
// 数字でないもの・0・大きすぎる値は「未入力」として扱い、赤ペンで知らせる（NaNや undefined は出さない）。
// 「正常」「異常」などの判定はしない。数字は書いたとおりに表示する。
(function () {
  'use strict';
  var SCENE = [['mae', '利用前（送迎後）'], ['nyuyoku', '入浴前'], ['katsudo', '活動の前後'], ['hoka', 'そのほか']];
  var CMP = [['same', '変わりなし'], ['little', '少し違う'], ['clear', '明らかに違う']];
  var CMP_NOTE = { same: '変わりなし（普段と同じ様子）', little: '少し違う', clear: '明らかに違う' };
  // 気になること（どんな様子かは、書き足す欄に事実で書く）
  var WATCH = [
    ['shokuyoku', '食欲'], ['suimin', '睡眠'], ['kaoiro', '顔色'], ['seki', '咳・痰'], ['mukumi', 'むくみ'],
    ['darusa', 'だるさ'], ['itami', '痛み'], ['haisetsu', '排便・排尿'], ['furafura', 'ふらつき'], ['iki', '息苦しさ'], ['hyojo', '表情・元気'],
  ];
  var RESP = [
    ['keika', '経過観察', '経過観察とした。'],
    ['kango', '看護職員に報告', '看護職員に報告した。'],
    ['kazoku', '家族に連絡', 'ご家族に連絡した。'],
    ['shujii', '主治医へ連絡', '主治医へ連絡した。'],
    ['jushin', '受診', '受診とした。'],
    ['nyuyoku', '入浴中止', '入浴は中止とした。'],
    ['katsudo', '活動を控える', '活動を控えて過ごしていただいた。'],
  ];
  var TO = [['kango', '看護職員'], ['kanri', '管理者・相談員'], ['kazoku', '家族'], ['shujii', '主治医'], ['cm', 'ケアマネジャー']];

  // 欄ごとの単位と、入力ミスを見つけるための上限（医学的な基準ではありません）
  var SPEC = {
    temp: { name: '体温', unit: '℃', max: 45 },
    sys: { name: '血圧（上）', unit: '', max: 400 },
    dia: { name: '血圧（下）', unit: '', max: 400 },
    pulse: { name: '脈拍', unit: '回/分', max: 300 },
    spo2: { name: 'SpO2', unit: '%', max: 100 },
  };

  // 数の欄を読む。空欄は empty。全角・単位つき（36.5度、120mmHg、98%）も受けつける。
  // 数字でないもの・0・大きすぎる値は ok:false（表示しない）。
  function num(s, max) {
    var raw = String(s == null ? '' : s);
    var t = raw.normalize ? raw.normalize('NFKC') : raw;
    t = t.replace(/\s+/g, '').replace(/(°c|℃|度|mmhg|bpm|回\/分|\/分|回|%|パーセント)+$/i, '');
    if (!t) return { empty: true, ok: false, bad: false, zero: false, big: false, s: '', n: 0 };
    if (!/^\d{1,4}(\.\d{1,2})?$/.test(t)) return { empty: false, ok: false, bad: true, zero: false, big: false, s: '', n: 0 };
    var n = Number(t);
    if (!isFinite(n)) return { empty: false, ok: false, bad: true, zero: false, big: false, s: '', n: 0 };
    if (n === 0) return { empty: false, ok: false, bad: false, zero: true, big: false, s: '', n: 0 };
    if (n > max) return { empty: false, ok: false, bad: false, zero: false, big: true, s: '', n: 0 };
    return { empty: false, ok: true, bad: false, zero: false, big: false, s: t.replace(/^0+(?=\d)/, ''), n: n };
  }
  // 血圧の上の欄に「120/80」と入れたときは、上と下に分ける
  function readAll(v) {
    var sysRaw = String(v.sys == null ? '' : v.sys), diaRaw = String(v.dia == null ? '' : v.dia);
    var norm = sysRaw.normalize ? sysRaw.normalize('NFKC') : sysRaw;
    var m = /^\s*(\d+)\s*[\/／]\s*(\d+)\s*(?:mmhg)?\s*$/i.exec(norm);
    if (m && !diaRaw.trim()) { sysRaw = m[1]; diaRaw = m[2]; }
    return {
      temp: num(v.temp, SPEC.temp.max), sys: num(sysRaw, SPEC.sys.max), dia: num(diaRaw, SPEC.dia.max),
      pulse: num(v.pulse, SPEC.pulse.max), spo2: num(v.spo2, SPEC.spo2.max),
    };
  }
  function shown(x, unit) { return x.ok ? x.s + (unit ? unit : '') : ''; }
  function bpText(r) {
    if (r.sys.ok && r.dia.ok) return r.sys.s + ' ／ ' + r.dia.s + ' mmHg';
    if (r.sys.ok) return r.sys.s + ' ／ （下は未入力） mmHg';
    if (r.dia.ok) return '（上は未入力） ／ ' + r.dia.s + ' mmHg';
    return '';
  }
  function names(r, flag) {
    return Object.keys(SPEC).filter(function (k) { return r[k][flag]; }).map(function (k) { return SPEC[k].name; });
  }
  function pick(list, ids) { return list.filter(function (x) { return (ids || []).indexOf(x[0]) !== -1; }); }
  function label(list, id) { var r = list.filter(function (x) { return x[0] === id; })[0]; return r ? r[1] : ''; }
  function trim(s) { return String(s == null ? '' : s).trim(); }
  function anyMeasure(r) { return Object.keys(SPEC).some(function (k) { return r[k].ok; }); }

  // 数の欄は数字のキーボードを出す
  function numericKeyboard() {
    var panel = document.getElementById('fdPanel');
    if (!panel) return;
    var apply = function () {
      panel.querySelectorAll('input[data-f="temp"],input[data-f="sys"],input[data-f="dia"],input[data-f="pulse"],input[data-f="spo2"]').forEach(function (el) {
        if (el.getAttribute('inputmode') !== 'decimal') el.setAttribute('inputmode', 'decimal');
      });
    };
    apply();
    if (window.MutationObserver) new MutationObserver(apply).observe(panel, { childList: true });
  }

  (function addStyle() {
    var el = document.createElement('style');
    el.textContent = '#fdDoc .fd-grid td { text-align: center; }\n@media print { #fdDoc tr { break-inside: avoid; } }';
    document.head.appendChild(el);
  })();

  Formdoc.run({
    title: 'バイタル・健康観察の記録',
    ai: { role: '介護施設・通所介護の介護職員', doc: 'バイタル・健康観察の記録（1名1日分）', rules: ['体温・血圧・脈拍・SpO2の数字は、入力されたとおりに書く。変えない。', '「正常」「異常」「問題なし」など、医学的な判断になる言葉は書かない。', '普段と違うときは、看護職員などに報告した事実（誰に・いつ）を書く。', '利用者の実名は書かない（〇〇さん などにする）。分からないことは推測で埋めず、【要確認】と書く。'] },
    blocks: [
      { title: '日付・利用者', fields: [
        { id: 'date', type: 'date', label: '日付', today: true, half: true },
        { id: 'time', type: 'time', label: '測定時刻', half: true },
        { id: 'who', type: 'text', label: '利用者', hint: '名前は「〇〇さん」', ph: '例：〇〇さん' },
        { id: 'scene', type: 'select', label: '測った場面', options: SCENE, def: 'mae' },
      ] },
      { title: '測定した数字', note: '数字だけを入れます（全角や「度」「mmHg」つきでも大丈夫）。測っていない項目は空のままにします。', fields: [
        { id: 'temp', type: 'text', label: '体温（℃）', ph: '例：36.5', half: true },
        { id: 'pulse', type: 'text', label: '脈拍（回/分）', ph: '例：72', half: true },
        { id: 'sys', type: 'text', label: '血圧　上', ph: '例：128', half: true },
        { id: 'dia', type: 'text', label: '血圧　下', ph: '例：76', half: true },
        { id: 'spo2', type: 'text', label: 'SpO2（%）', ph: '例：97' },
      ] },
      { title: '普段との比較・体調の様子', fields: [
        { id: 'cmp', type: 'seg', label: '普段との比較', options: CMP, def: 'same' },
        { id: 'watch', type: 'chips', label: '気になること', options: WATCH },
        { id: 'detail', type: 'textarea', label: 'どんな様子か', hint: '見たこと・聞いたことを、そのまま', rows: 2, ph: '例：朝食は半分ほど。いつもより顔色が白っぽい。' },
        { id: 'words', type: 'text', label: '本人の言葉', hint: '「」の中身だけを入力', ph: '例：少し頭が重い' },
      ] },
      { title: '対応と報告', fields: [
        { id: 'resp', type: 'chips', label: '対応', options: RESP.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'to', type: 'chips', label: '報告した相手', options: TO },
        { id: 'rtime', type: 'time', label: '報告した時刻' },
        { id: 'memo', type: 'textarea', label: '補足・指示された内容', rows: 2, ph: '例：看護職員の指示で、午後にもう一度測る。' },
      ] },
      { title: '事業所と記入者', small: 'ほかの書類にも入ります', fields: [
        { id: 'office', type: 'text', label: '事業所名', ph: '例：〇〇事業所', half: true, profile: 'office' },
        { id: 'writer', type: 'text', label: '記入者（職種）', ph: '例：介護職員 〇〇', half: true, profile: 'writer' },
      ] },
    ],
    build: function (v, H) {
      var r = readAll(v);
      var watch = pick(WATCH, v.watch).map(function (x) { return x[1]; });
      var detail = trim(v.detail);
      var look = (watch.length ? '気になること：' + watch.join('、') : '') + (detail ? (watch.length ? '\n' : '') + detail : '');
      var words = trim(v.words).replace(/^「|」$/g, '');
      var resp = pick(RESP, v.resp).map(function (x) { return x[2]; });
      var to = pick(TO, v.to).map(function (x) { return x[1]; });
      var rtime = trim(v.rtime) ? H.time(v.rtime) : '';
      var toText = to.length ? to.join('・') + (rtime ? '　' + rtime : '') : (rtime ? rtime : '');
      var scene = label(SCENE, v.scene);
      return {
        title: 'バイタル・健康観察の記録',
        left: H.blank(v.office, '事業所名：'),
        right: H.date(v.date) + '\n記入者：' + H.blank(v.writer),
        sections: [
          { h: '1. 利用者と測定', w2: '120px', rows: [
            ['利用者', 'who', trim(v.who), '（〇〇さん）'],
            ['測定時刻', 'when', (trim(v.time) ? H.time(v.time) : '') + (scene ? (trim(v.time) ? '　' : '') + '（' + scene + '）' : ''), '（　時　分）'],
          ] },
          { key: 'vital', h: '2. 測った数字', grid: { head: ['体温', '血圧（上／下）', '脈拍', 'SpO2'], widths: ['', '', '', ''], ph: '　', rows: [[
            shown(r.temp, '℃'), bpText(r), shown(r.pulse, ' 回/分'), shown(r.spo2, '%'),
          ]] } },
          { h: '3. 普段との比較と様子', w2: '120px', rows: [
            ['普段との比較', 'cmp', CMP_NOTE[v.cmp] || '', '（変わりなし／少し違う／明らかに違う）'],
            ['体調の様子', 'look', look, '（気になることを選び、どんな様子かを書きます）'],
            ['本人の言葉', 'words', words ? '「' + words + '」' : '', '（「」で、そのまま）'],
          ] },
          { h: '4. 対応と報告', w2: '120px', rows: [
            ['対応', 'resp', H.bullets(resp), '（経過観察・報告・連絡・受診など）'],
            ['報告した相手と時刻', 'to', toText, '（誰に・何時に）'],
            ['補足', 'memo', trim(v.memo), '（指示された内容など）'],
          ] },
        ],
        foot: '数字は、測ったとおりに書いています。良い・悪いの判断は記録に書かず、普段と違うときは看護職員に伝えます。測る項目や連絡の基準は、事業所の決まりと主治医・看護職員の指示に従ってください。',
      };
    },
    warn: function (v) {
      var r = readAll(v);
      var bad = names(r, 'bad'), zero = names(r, 'zero'), big = names(r, 'big');
      if (bad.length) return bad.join('・') + 'に、数字ではないものが入っています。この項目は未入力として扱っています。数字だけで入れ直してください（血圧は上と下を別々に入れます）。';
      if (zero.length) return zero.join('・') + 'が0になっています。この項目は未入力として扱っています。測っていないときは空のままにしてください。';
      if (big.length) return big.join('・') + 'の数字が大きすぎます（入力ミスかもしれません）。この項目は未入力として扱っています。入れた数字を確かめてください。';
      if (r.sys.ok && r.dia.ok && r.dia.n > r.sys.n) return '血圧の下の数字が、上より大きくなっています。上と下が入れ違っていないか、確かめてください。';
      var reported = (v.to || []).length > 0;
      if (v.cmp === 'clear' && !reported) return '普段と「明らかに違う」のに、報告した相手が空です。看護職員などに伝えたら、相手と時刻を選んでください。まだのときは、すぐ看護職員に伝えます。';
      if ((v.watch || []).length && !trim(v.detail)) return '「気になること」を選んだら、どんな様子かを「どんな様子か」に書き足すと、次の職員にも伝わります（例：朝食は半分ほど）。';
      if (reported && !trim(v.rtime)) return '報告した相手を選んだときは、報告した時刻も入れておくと、あとから確かめられます。';
      if (!anyMeasure(r)) return '測った数字を入れると、書類に入ります。測っていない項目は空のままでかまいません。';
      if (v.cmp === 'little' && !(v.resp || []).length) return '普段と「少し違う」ときは、対応（経過観察・看護職員に報告など）も選んでおくと、次の職員が引き継げます。';
      return '';
    },
  });
  numericKeyboard();
})();
