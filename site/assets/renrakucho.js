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
  $('rOut').addEventListener('input', function () { edited = true; count(); });
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
  render();
})();
