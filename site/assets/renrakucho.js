// 連絡帳の文例メーカー。入力内容はブラウザの外に出さない。
(function () {
  'use strict';
  var R = window.RENRAKU_DATA;
  var $ = function (id) { return document.getElementById(id); };
  var byId = function (list) { var m = {}; list.forEach(function (x) { m[x.id] = x; }); return m; };
  var lists = { act: byId(R.ACTIVITIES), mood: byId(R.MOODS), done: byId(R.DONE) };
  var closing = {};
  R.CLOSINGS.forEach(function (c) { closing[c[0]] = c[1]; });
  var picked = { act: ['park'], mood: ['smile'], done: ['wait'] };
  var variant = 0;
  var edited = false;

  // ── 自動保存（この端末の localStorage だけ。7日で消える。common.js の Otasuke.draft） ──
  var D = window.Otasuke && window.Otasuke.draft;
  var DRAFT_ID = 'renrakucho';
  var SELECTS = ['rSnack', 'rToilet', 'rHealth', 'rClosing'];
  var canSave = !!(D && D.available());
  var saved = canSave ? D.load(DRAFT_ID) : null;
  var restored = null;
  if (saved && saved.d) {
    var sd = saved.d;
    Object.keys(picked).forEach(function (g) {
      if (Array.isArray(sd.picked && sd.picked[g])) picked[g] = sd.picked[g].filter(function (id) { return typeof id === 'string' && lists[g][id]; });
    });
    SELECTS.forEach(function (id) {
      var el = $(id), v = sd.sel && sd.sel[id];
      if (typeof v === 'string' && Array.prototype.some.call(el.options, function (o) { return o.value === v; })) el.value = v;
    });
    if (typeof sd.extra === 'string') $('rExtra').value = sd.extra;
    if (typeof sd.variant === 'number' && sd.variant >= 0) variant = Math.floor(sd.variant);
    if (sd.edited && typeof sd.out === 'string') { edited = true; $('rOut').textContent = sd.out; }
    restored = saved.t;
  }
  var saveTimer = null;
  function saveNow() {
    clearTimeout(saveTimer); saveTimer = null;
    if (!canSave) return;
    var sel = {};
    SELECTS.forEach(function (id) { sel[id] = $(id).value; });
    D.save(DRAFT_ID, { picked: picked, sel: sel, extra: $('rExtra').value, variant: variant, edited: edited, out: edited ? $('rOut').innerText : '' });
  }
  function persist() { if (!canSave) return; clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 400); }
  window.addEventListener('pagehide', function () { if (saveTimer) saveNow(); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && saveTimer) saveNow(); });

  function pick(item, n) { return item.lines[(variant + n) % item.lines.length]; }
  function build() {
    var acts = picked.act.map(function (id, n) { var t = pick(lists.act[id], n); return n ? 'また、' + t.replace(/^今日は/, '') : t; });
    var about = picked.mood.map(function (id, n) { return pick(lists.mood[id], n); })
      .concat(picked.done.map(function (id, n) { return pick(lists.done[id], n + 1); }));
    // 様子・できたことの最初の一文に、名前（〇〇さん）を入れる
    if (about.length) about[0] = '〇〇さんは' + (/^[ぁ-ん]/.test(about[0]) ? '、' : '') + about[0];
    var life = [$('rSnack').value, $('rToilet').value, $('rHealth').value].filter(Boolean).join('');
    var extra = $('rExtra').value.trim();
    return [acts.join('') + about.join(''), life, extra, closing[$('rClosing').value] || ''].filter(Boolean).join('\n');
  }
  function render() {
    persist();
    if (edited) return;
    $('rOut').textContent = build();
    count();
  }
  function count() { $('rCount').textContent = $('rOut').innerText.replace(/\s/g, '').length + '字'; }

  // 初期状態のチェック
  document.querySelectorAll('.chips2 input').forEach(function (c) {
    if ((picked[c.getAttribute('data-g')] || []).indexOf(c.value) !== -1) c.checked = true;
  });
  document.querySelector('.tool').addEventListener('change', function (e) {
    var g = e.target.getAttribute('data-g');
    if (g) {
      var list = picked[g];
      var i = list.indexOf(e.target.value);
      if (e.target.checked && i === -1) list.push(e.target.value);
      if (!e.target.checked && i !== -1) list.splice(i, 1);
    }
    edited = false;
    render();
  });
  $('rExtra').addEventListener('input', function () { edited = false; render(); });
  $('rOut').addEventListener('input', function () { edited = true; count(); persist(); });
  $('rShuffle').addEventListener('click', function () { variant++; edited = false; render(); });
  $('rCopy').addEventListener('click', function () { window.Otasuke.copy($('rOut').innerText, '文章をコピーしました'); });
  $('rAi').addEventListener('click', function () {
    window.Otasuke.copyAiPrompt({
      role: '放課後等デイサービス・児童発達支援の職員',
      doc: '保護者あての連絡帳',
      rules: [
        '保護者が読んでうれしくなる、あたたかく具体的な文章にする。です・ます調。',
        'できたことは「何を・どんな場面で」が伝わるように書く。',
        '150〜200字程度にまとめる。',
        '「〇〇さん」はそのまま残す。',
      ],
      draft: $('rOut').innerText,
    });
  });
  $('rReset').addEventListener('click', function () {
    if (!window.confirm('選んだ内容と書き換えた文章を消して、最初の状態に戻します。\nこの端末に保存していた内容も消えます。よろしいですか？')) return;
    picked = { act: ['park'], mood: ['smile'], done: ['wait'] };
    document.querySelectorAll('.chips2 input').forEach(function (c) { c.checked = (picked[c.getAttribute('data-g')] || []).indexOf(c.value) !== -1; });
    SELECTS.forEach(function (id) { $(id).selectedIndex = 0; });
    $('rExtra').value = '';
    variant = 0; edited = false;
    render();
    clearTimeout(saveTimer); saveTimer = null;
    if (canSave) D.clear(DRAFT_ID);
    window.Otasuke.toast('入力を消して、最初の状態に戻しました');
  });
  if (canSave) {
    $('rSave').innerHTML = '<b>自動保存</b>：この端末にだけ保存しています（' + D.days + '日で自動的に消えます）。共有の端末では「リセット」で消してください。';
    $('rSave').hidden = false;
  }
  if (edited) count(); else { $('rOut').textContent = build(); count(); }
  if (restored) {
    var dt = new Date(restored);
    window.Otasuke.toast('前回の入力（' + (dt.getMonth() + 1) + '月' + dt.getDate() + '日 ' + dt.getHours() + ':' + String(dt.getMinutes()).padStart(2, '0') + '）を復元しました');
  }
})();
