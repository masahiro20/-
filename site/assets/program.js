// 支援プログラムの下書きを組み立てる。入力内容はこの端末の localStorage にだけ保存する。
(function () {
  'use strict';
  var P = window.PROGRAM_DATA;
  var KEY = 'bunreicho-program-v1';
  var DOMAINS = [
    ['health', '健康・生活'], ['motor', '運動・感覚'], ['cognition', '認知・行動'],
    ['language', '言語・コミュニケーション'], ['social', '人間関係・社会性'],
  ];
  var GROUPS = [
    ['family', '⑧ 家族支援（きょうだいへの支援を含む）', P.FAMILY_SUPPORT],
    ['transition', '⑨ 移行支援', P.TRANSITION_SUPPORT],
    ['community', '⑩ 地域支援・地域連携', P.COMMUNITY_SUPPORT],
    ['staff', '⑪ 職員の質の向上に資する取組', P.STAFF_QUALITY],
  ];
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  var range = function (n) { var a = []; for (var i = 0; i < n; i++) a.push(i); return a; };

  function defaults() {
    return {
      service: '放課後等デイサービス', name: '', date: new Date().toISOString().slice(0, 10),
      philosophy: P.PROGRAM_EXAMPLE.philosophy, policy: P.PROGRAM_EXAMPLE.policy, hours: '', transport: 'あり',
      checked: {
        health: [0, 1, 3], motor: [0, 1, 2], cognition: [0, 1, 2], language: [0, 1, 2], social: [0, 1, 2],
        family: [0, 1, 2, 4], transition: [0, 1, 3], community: [0, 1, 2], staff: [0, 2, 3, 4, 6],
        events: range(P.EVENTS.length), regular: [0, 1],
      },
      extra: {}, edits: {},
    };
  }
  var state;
  try { state = JSON.parse(localStorage.getItem(KEY)) || defaults(); } catch (e) { state = defaults(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 保存できなくても続ける */ } }

  // ── 左のチェック欄 ──
  function checkRow(group, i, text) {
    var on = (state.checked[group] || []).indexOf(i) !== -1;
    return '<label class="issue-row' + (on ? ' is-on' : '') + '"><input type="checkbox" data-g="' + group + '" value="' + i + '"' +
      (on ? ' checked' : '') + '><span class="box">' + (on ? '✓' : '') + '</span><span>' + esc(text) + '</span></label>';
  }
  function extraBox(group) {
    return '<label class="field" style="margin:8px 12px 12px">その他（自由記入・1行に1つ）<textarea class="input" rows="2" data-extra="' + group + '">' +
      esc(state.extra[group] || '') + '</textarea></label>';
  }
  function renderChecks() {
    var html = '<h3 class="panel-title"><span class="no">二</span>⑦ 本人支援（5領域）</h3><div class="issue-list" style="max-height:none">';
    DOMAINS.forEach(function (d) {
      html += '<div class="issue-group"><div class="issue-group-head"><span class="c-' + d[0] + '"><span class="sq"></span><span style="color:var(--ink)">' +
        esc(d[1]) + '</span></span></div>' + P.SELF_SUPPORT[d[0]].map(function (t, i) { return checkRow(d[0], i, t); }).join('') + extraBox(d[0]) + '</div>';
    });
    html += '</div>';
    GROUPS.forEach(function (g, n) {
      html += '<h3 class="panel-title" style="margin-top:20px"><span class="no">' + '三四五六'[n] + '</span>' + esc(g[1]) + '</h3><div class="issue-list" style="max-height:none"><div class="issue-group">' +
        g[2].map(function (t, i) { return checkRow(g[0], i, t); }).join('') + extraBox(g[0]) + '</div></div>';
    });
    html += '<h3 class="panel-title" style="margin-top:20px"><span class="no">七</span>⑫ 主な行事等</h3><div class="issue-list" style="max-height:none"><div class="issue-group">' +
      P.EVENTS.map(function (e, i) { return checkRow('events', i, e[0] + '　' + e[1]); }).join('') +
      P.EVENTS_REGULAR.map(function (e, i) { return checkRow('regular', i, e); }).join('') + extraBox('events') + '</div></div>';
    $('pChecks').innerHTML = html;
  }

  // ── 下書きの内容 ──
  function lines(group, list) {
    var picked = (state.checked[group] || []).slice().sort(function (a, b) { return a - b; }).map(function (i) { return list[i]; });
    var extra = (state.extra[group] || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    return picked.concat(extra).map(function (s) { return '・' + s; }).join('\n');
  }
  function eventsText() {
    var months = (state.checked.events || []).slice().sort(function (a, b) { return a - b; }).map(function (i) { return P.EVENTS[i][0] + '：' + P.EVENTS[i][1]; });
    var regular = (state.checked.regular || []).slice().sort(function (a, b) { return a - b; }).map(function (i) { return P.EVENTS_REGULAR[i]; });
    var extra = (state.extra.events || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    var out = months.join('\n');
    if (regular.length || extra.length) out += (out ? '\n' : '') + '通年：' + regular.concat(extra).join('、');
    return out;
  }
  function has(key) { return Object.prototype.hasOwnProperty.call(state.edits, key); }
  function val(key, v) { return has(key) ? state.edits[key] : v; }
  function formatDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? m[1] + '年' + Number(m[2]) + '月' + Number(m[3]) + '日' : (s || '');
  }
  function build() {
    var rows = [
      ['name', '事業所名', state.name], ['date', '作成年月日', formatDate(state.date)],
      ['philosophy', '法人（事業所）理念', state.philosophy], ['policy', '支援方針', state.policy],
      ['hours', '営業時間', state.hours], ['transport', '送迎実施の有無', state.transport],
    ];
    var self = DOMAINS.map(function (d) { return ['self-' + d[0], d[1], lines(d[0], P.SELF_SUPPORT[d[0]])]; });
    var others = GROUPS.map(function (g) { return [g[0], g[1].replace(/^[⑧⑨⑩⑪]\s*/, ''), lines(g[0], g[2])]; })
      .concat([['events', '主な行事等', eventsText()]]);
    var v = function (r) { return [r[0], r[1], val(r[0], r[2])]; };
    return { service: state.service, basic: rows.map(v), self: self.map(v), others: others.map(v) };
  }

  function cell(key, text, ph) {
    return '<div class="ed' + (has(key) ? ' is-edited' : '') + '" contenteditable="true" spellcheck="false" data-key="' + key + '" data-ph="' + esc(ph || '') + '">' +
      (text ? esc(text) : '<span class="ph">' + esc(ph || '（記入）') + '</span>') + '</div>';
  }
  function renderDoc() {
    var b = build();
    var ph = { name: '（事業所名を入力）', hours: '（営業時間を入力）' };
    $('pDoc').innerHTML =
      '<div class="doc-head"><div class="meta"></div><div class="title">支援プログラム</div><div class="meta">' + esc(b.service) + '</div></div>' +
      '<table class="form form-top"><colgroup><col style="width:150px"><col></colgroup>' +
      b.basic.map(function (r) { return '<tr><th>' + esc(r[1]) + '</th><td>' + cell(r[0], r[2], ph[r[0]]) + '</td></tr>'; }).join('') + '</table>' +
      '<p class="form-sub">○支援内容</p><table class="form form-main"><colgroup><col style="width:92px"><col style="width:140px"><col></colgroup>' +
      b.self.map(function (r, i) {
        return '<tr>' + (i === 0 ? '<th rowspan="5">本人支援</th>' : '') + '<th>' + esc(r[1]) + '</th><td>' + cell(r[0], r[2], '（取り組みを選ぶか、記入）') + '</td></tr>';
      }).join('') +
      b.others.map(function (r) { return '<tr><th colspan="2">' + esc(r[1]) + '</th><td>' + cell(r[0], r[2], '（取り組みを選ぶか、記入）') + '</td></tr>'; }).join('') +
      '</table>';
    renderCoverage(b);
  }
  function renderCoverage(b) {
    b = b || build();
    var missing = b.basic.concat(b.self, b.others).filter(function (r) { return !String(r[2] || '').trim(); }).map(function (r) { return r[1]; });
    $('pCoverage').innerHTML = missing.length
      ? '<span class="coverage-label">未記入</span><span class="cov">' + esc(missing.join('、')) + '</span>'
      : '<span class="coverage-label">①〜⑫</span><span class="cov on"><span class="mk"></span>すべて記入済み</span>';
  }

  // ── 出力 ──
  function toText() {
    var b = build();
    var out = ['支援プログラム（' + b.service + '）', ''];
    b.basic.forEach(function (r) { out.push('【' + r[1] + '】' + (r[2] || '')); });
    out.push('', '【本人支援の内容と5領域の関連性】');
    b.self.forEach(function (r) { out.push('＜' + r[1] + '＞', r[2] || '', ''); });
    b.others.forEach(function (r) { out.push('【' + r[1] + '】', r[2] || '', ''); });
    return out.join('\n');
  }
  function toHtml() {
    var b = build();
    var th = 'style="border:1px solid #999;padding:8px;background:#f3f1ec;text-align:left;vertical-align:top;white-space:nowrap"';
    var td = 'style="border:1px solid #999;padding:8px;vertical-align:top"';
    var br = function (s) { return esc(s || '').replace(/\n/g, '<br>'); };
    return '<h2>支援プログラム（' + esc(b.service) + '）</h2>\n<table style="border-collapse:collapse;width:100%">\n' +
      b.basic.map(function (r) { return '<tr><th ' + th + ' colspan="2">' + esc(r[1]) + '</th><td ' + td + '>' + br(r[2]) + '</td></tr>'; }).join('\n') + '\n' +
      b.self.map(function (r, i) { return '<tr>' + (i === 0 ? '<th ' + th + ' rowspan="5">本人支援</th>' : '') + '<th ' + th + '>' + esc(r[1]) + '</th><td ' + td + '>' + br(r[2]) + '</td></tr>'; }).join('\n') + '\n' +
      b.others.map(function (r) { return '<tr><th ' + th + ' colspan="2">' + esc(r[1]) + '</th><td ' + td + '>' + br(r[2]) + '</td></tr>'; }).join('\n') +
      '\n</table>';
  }
  function copy(text, msg) {
    var done = function () { toast(msg); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
    else { fallback(text); done(); }
  }
  function fallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* 何もしない */ }
    document.body.removeChild(ta);
  }
  var timer;
  function toast(msg) {
    $('toast').textContent = msg; $('toast').classList.add('show');
    clearTimeout(timer); timer = setTimeout(function () { $('toast').classList.remove('show'); }, 2600);
  }

  // ── 入力欄 ──
  var fields = { pService: 'service', pName: 'name', pDate: 'date', pPhilosophy: 'philosophy', pPolicy: 'policy', pHours: 'hours', pTransport: 'transport' };
  function fillFields() { Object.keys(fields).forEach(function (id) { $(id).value = state[fields[id]] || ''; }); }
  Object.keys(fields).forEach(function (id) {
    $(id).addEventListener('input', function () {
      state[fields[id]] = $(id).value;
      delete state.edits[fields[id]]; // 左で入力し直したら、下書き側の書き換えより優先する
      save(); renderDoc();
    });
  });
  $('pChecks').addEventListener('change', function (e) {
    var g = e.target.getAttribute('data-g');
    if (!g) return;
    var i = Number(e.target.value);
    var list = state.checked[g] || (state.checked[g] = []);
    var at = list.indexOf(i);
    if (e.target.checked && at === -1) list.push(i);
    if (!e.target.checked && at !== -1) list.splice(at, 1);
    var row = e.target.closest('.issue-row');
    row.classList.toggle('is-on', e.target.checked);
    row.querySelector('.box').textContent = e.target.checked ? '✓' : '';
    delete state.edits[g === 'regular' ? 'events' : (P.SELF_SUPPORT[g] ? 'self-' + g : g)];
    save(); renderDoc();
  });
  $('pChecks').addEventListener('input', function (e) {
    var g = e.target.getAttribute('data-extra');
    if (!g) return;
    state.extra[g] = e.target.value;
    delete state.edits[P.SELF_SUPPORT[g] ? 'self-' + g : g];
    save(); renderDoc();
  });
  $('pDoc').addEventListener('focusin', function (e) {
    var ed = e.target.closest('.ed');
    if (ed && ed.querySelector('.ph')) ed.textContent = '';
  });
  $('pDoc').addEventListener('input', function (e) {
    var ed = e.target.closest('.ed');
    if (!ed) return;
    state.edits[ed.getAttribute('data-key')] = ed.innerText.replace(/\n$/, '');
    ed.classList.add('is-edited');
    save();
  });
  $('pDoc').addEventListener('focusout', function (e) {
    var ed = e.target.closest('.ed');
    if (ed && !ed.textContent) ed.innerHTML = '<span class="ph">' + esc(ed.getAttribute('data-ph') || '（記入）') + '</span>';
    renderCoverage();
  });
  $('pDoc').addEventListener('paste', function (e) {
    if (!e.target.closest('.ed')) return;
    e.preventDefault();
    document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text'));
  });
  $('pCopyHtml').addEventListener('click', function () { copy(toHtml(), 'ホームページ掲載用のHTMLをコピーしました'); });
  $('pCopyText').addEventListener('click', function () { copy(toText(), '文章をコピーしました'); });
  $('pPrint').addEventListener('click', function () { window.print(); });
  $('pAi').addEventListener('click', function () {
    window.Otasuke.copyAiPrompt({
      role: '児童発達支援・放課後等デイサービス事業所の管理者',
      doc: '支援プログラム（事業所の支援の実施に関する計画）',
      rules: [
        '利用を考えている保護者が読んで分かりやすい、やわらかい言葉にする。',
        '「本人支援」の5領域（健康・生活／運動・感覚／認知・行動／言語・コミュニケーション／人間関係・社会性）の区分はそのまま残す。',
        '事業所が実際に行っていない取り組みを書き足さない。',
      ],
      draft: toText(),
    });
  });
  $('pReset').addEventListener('click', function () {
    if (!window.confirm('入力した内容を消して、最初の状態に戻しますか？')) return;
    state = defaults(); save(); fillFields(); renderChecks(); renderDoc();
  });

  fillFields();
  renderChecks();
  renderDoc();
})();
