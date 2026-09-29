// 障害福祉サービスの個別支援計画の下書き。入力内容はブラウザの外に出さない。
(function () {
  'use strict';
  var D = window.SHOGAI_DATA;
  var byId = function (list) { var m = {}; list.forEach(function (x) { m[x.id] = x; }); return m; };
  var svcById = byId(D.services);
  var issueById = byId(D.issues);
  var MAX = 6;
  var state = { svc: 'b', picked: [], goalIndex: {}, edits: {} };
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };

  var params = new URLSearchParams(location.search);
  if (svcById[params.get('svc')]) state.svc = params.get('svc');

  function available() {
    return D.issues.filter(function (i) { return i.services.indexOf(state.svc) !== -1; });
  }

  // ── 計画の組み立て ──
  function build() {
    var svc = svcById[state.svc];
    var issues = state.picked.map(function (id) { return issueById[id]; });
    var strength = $('sStrength').value.trim();
    var wishSelf = $('sWishSelf').value.trim();
    var wishFamily = $('sWishFamily').value.trim();
    var rows = issues.map(function (i, n) {
      return {
        key: 'r-' + i.id, issueId: i.id, prio: String(n + 1), need: i.need,
        goal: i.goals[(state.goalIndex[i.id] || 0) % i.goals.length],
        content: i.supports.map(function (s) { return '・' + s; }).join('\n'),
        period: n === 0 && svc.review === 6 ? '3か月後' : svc.review + 'か月後',
        staff: svc.staff + '\nサービス管理責任者', note: i.note,
      };
    });
    var has = issues.length > 0;
    return {
      svc: svc,
      wish: (wishSelf || wishFamily) ? ('（本人）' + (wishSelf || '') + '\n（家族）' + (wishFamily || '')) : '',
      policy: has ? (strength ? '本人の得意なことや好きなこと（' + strength + '）を活かしながら、' : '本人の得意なことや好きなことを活かしながら、') +
        '本人の希望に沿って' + svc.context + 'ことができるよう支援する。' +
        '家族・相談支援事業所・医療機関等の関係機関と連携し、本人と一緒に計画を見直しながら取り組む。' : '',
      long: has ? issues.slice(0, 2).map(function (i) { return i.longGoal; }).join('') + svc.context + 'ことができる。\n（期間：1年）' : '',
      short: has ? rows.slice(0, 2).map(function (r) { return '・' + r.goal; }).join('\n') + '\n（期間：' + svc.review + 'か月）' : '',
      period: '　　年　　月　　日　〜　　　年　　月　　日（' + svc.review + 'か月）',
      rows: rows,
    };
  }
  function has(key) { return Object.prototype.hasOwnProperty.call(state.edits, key); }
  function val(key, v) { return has(key) ? state.edits[key] : v; }

  // ── 表示 ──
  function renderSvc() {
    $('svcOptions').innerHTML = D.services.map(function (s) {
      return '<button type="button" data-svc="' + s.id + '" aria-pressed="' + (s.id === state.svc) + '">' + esc(s.name) +
        '<small>見直し：' + s.review + 'か月ごと</small></button>';
    }).join('');
  }
  function renderIssues() {
    var q = $('sSearch').value.trim();
    var list = available();
    var html = D.categories.map(function (c) {
      var items = list.filter(function (i) { return i.cat === c.id && (!q || (i.label + i.need).indexOf(q) !== -1); });
      if (!items.length) return '';
      return '<div class="issue-group"><div class="issue-group-head"><span>' + esc(c.name) + '</span></div>' +
        items.map(function (i) {
          var idx = state.picked.indexOf(i.id);
          return '<label class="issue-row' + (idx !== -1 ? ' is-on' : '') + '"><input type="checkbox" value="' + i.id + '"' + (idx !== -1 ? ' checked' : '') +
            '><span class="box">' + (idx !== -1 ? idx + 1 : '') + '</span><span>' + esc(i.label) + '</span></label>';
        }).join('') + '</div>';
    }).join('');
    $('sIssueList').innerHTML = html || '<p class="no-hit">見つかりませんでした。別の言葉で探してみてください。</p>';
  }
  function renderPicked() {
    $('sPickedCaption').hidden = !state.picked.length;
    $('sPicked').innerHTML = state.picked.map(function (id, n) {
      return '<li><span class="num">' + (n + 1) + '</span><span>' + esc(issueById[id].label) + '</span><span class="ops">' +
        '<button type="button" data-up="' + id + '" aria-label="優先順位を上げる"' + (n === 0 ? ' disabled' : '') + '>↑</button>' +
        '<button type="button" data-remove="' + id + '" aria-label="外す">×</button></span></li>';
    }).join('');
  }
  function cell(key, text, ph) {
    var v = val(key, text);
    return '<div class="ed' + (has(key) ? ' is-edited' : '') + '" contenteditable="true" spellcheck="false" data-key="' + key + '"' +
      (ph ? ' data-ph="' + esc(ph) + '"' : '') + '>' + (v ? esc(v) : (ph ? '<span class="ph">' + esc(ph) + '</span>' : '')) + '</div>';
  }
  function renderDoc() {
    var p = build();
    var has1 = state.picked.length > 0;
    ['sCopyTable', 'sCopyText', 'sPrint', 'sAi'].forEach(function (id) { $(id).disabled = !has1; });
    var rows = p.rows.length ? p.rows.map(function (r) {
      var i = issueById[r.issueId];
      return '<tr><td class="center">' + cell(r.key + '-prio', r.prio) + '</td><td>' + cell(r.key + '-need', r.need) + '</td><td>' + cell(r.key + '-goal', r.goal) +
        (i.goals.length > 1 ? '<button type="button" class="link-btn cycle" data-cycle="' + i.id + '">別の文例にする</button>' : '') + '</td><td>' +
        cell(r.key + '-content', r.content) + '</td><td class="center">' + cell(r.key + '-period', r.period) + '</td><td>' + cell(r.key + '-staff', r.staff) +
        '</td><td>' + cell(r.key + '-note', r.note) + '</td></tr>';
    }).join('') : '<tr><td colspan="7"><p class="doc-empty">左の「二」で課題を選ぶと、ここに目標と支援内容の文例が入ります。</p></td></tr>';
    var ph = has1 ? '' : '（課題を選ぶと文例が入ります）';
    $('sDoc').innerHTML =
      '<div class="doc-head"><div class="meta">利用者氏名：<span class="blank"></span></div><div class="title" style="letter-spacing:.2em">個別支援計画書</div>' +
      '<div class="meta">作成日：　　年　　月　　日<br>' + esc(p.svc.name) + '</div></div>' +
      '<table class="form form-top"><colgroup><col style="width:170px"><col></colgroup>' +
      '<tr><th>利用者及びその家族の<br>生活に対する意向</th><td>' + cell('wish', p.wish, '（本人・家族の希望を、本人の言葉を大切にして記入）') + '</td></tr>' +
      '<tr><th>総合的な支援の方針</th><td>' + cell('policy', p.policy, ph) + '</td></tr>' +
      '<tr><th>長期目標</th><td>' + cell('long', p.long, ph) + '</td></tr>' +
      '<tr><th>短期目標</th><td>' + cell('short', p.short, ph) + '</td></tr>' +
      '<tr><th>計画期間</th><td>' + cell('period', p.period) + '</td></tr></table>' +
      '<p class="form-sub">○生活全般の質を向上させるための課題と支援内容</p>' +
      '<table class="form form-main"><colgroup><col style="width:50px"><col style="width:17%"><col style="width:19%"><col style="width:29%"><col style="width:74px"><col style="width:12%"><col></colgroup>' +
      '<thead><tr><th>優先<br>順位</th><th>課題（ニーズ）</th><th>支援目標</th><th>支援内容<small>（本人の役割を含む）</small></th><th>達成<br>時期</th><th>担当者</th><th>留意事項</th></tr></thead><tbody>' +
      rows + '</tbody></table>' +
      '<div class="doc-foot"><div><p>上記の個別支援計画について説明しました。</p><p>サービス管理責任者氏名：<span class="blank"></span></p></div>' +
      '<div><p>上記の個別支援計画について説明を受け、同意しました。</p><p>　　年　　月　　日（本人署名）<span class="blank"></span></p><p class="small muted">交付先：本人／相談支援事業所</p></div></div>';
    $('sInfo').innerHTML = '<span class="coverage-label">見直し</span><span class="cov on"><span class="mk"></span>' + p.svc.review + 'か月に1回以上</span>';
    $('sMobileCount').textContent = has1 ? state.picked.length + '件の課題を選択中' : '';
    $('sMobileBar').classList.toggle('show', has1);
  }
  function renderAll() { renderPicked(); renderIssues(); renderDoc(); }

  // ── 出力 ──
  function collect() {
    var p = build();
    return {
      svc: p.svc, wish: val('wish', p.wish), policy: val('policy', p.policy), long: val('long', p.long), short: val('short', p.short), period: val('period', p.period),
      rows: p.rows.map(function (r) {
        return { prio: val(r.key + '-prio', r.prio), need: val(r.key + '-need', r.need), goal: val(r.key + '-goal', r.goal), content: val(r.key + '-content', r.content),
          period: val(r.key + '-period', r.period), staff: val(r.key + '-staff', r.staff), note: val(r.key + '-note', r.note) };
      }),
    };
  }
  function toText() {
    var c = collect();
    var out = ['個別支援計画書（' + c.svc.name + '）', '', '【利用者及びその家族の生活に対する意向】', c.wish, '', '【総合的な支援の方針】', c.policy, '',
      '【長期目標】', c.long, '', '【短期目標】', c.short, '', '【計画期間】', c.period, '', '【生活全般の質を向上させるための課題と支援内容】'];
    c.rows.forEach(function (r) {
      out.push('■優先順位 ' + r.prio + '：' + r.need, '支援目標：' + r.goal, '支援内容：', r.content, '達成時期：' + r.period + '　担当者：' + r.staff.replace(/\n/g, '・'), '留意事項：' + r.note, '');
    });
    return out.join('\n');
  }
  function toTsv() {
    var c = collect();
    var q = function (s) { return '"' + String(s || '').replace(/"/g, '""') + '"'; };
    return [['優先順位', '課題（ニーズ）', '支援目標', '支援内容（本人の役割を含む）', '達成時期', '担当者', '留意事項'].map(q).join('\t')]
      .concat(c.rows.map(function (r) { return [r.prio, r.need, r.goal, r.content, r.period, r.staff, r.note].map(q).join('\t'); })).join('\n');
  }

  // ── 操作 ──
  $('svcOptions').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-svc]');
    if (!b) return;
    state.svc = b.getAttribute('data-svc');
    state.picked = state.picked.filter(function (id) { return issueById[id].services.indexOf(state.svc) !== -1; });
    renderSvc(); renderAll();
  });
  $('sIssueList').addEventListener('change', function (e) {
    var id = e.target.value;
    var i = state.picked.indexOf(id);
    if (e.target.checked && i === -1) {
      if (state.picked.length >= MAX) { e.target.checked = false; window.Otasuke.toast('課題は' + MAX + 'つまでです。優先するものに絞ると、評価しやすい計画になります。'); return; }
      state.picked.push(id);
    } else if (!e.target.checked && i !== -1) state.picked.splice(i, 1);
    renderAll();
  });
  $('sPicked').addEventListener('click', function (e) {
    var up = e.target.getAttribute('data-up');
    var rm = e.target.getAttribute('data-remove');
    if (up) { var i = state.picked.indexOf(up); if (i > 0) { state.picked.splice(i, 1); state.picked.splice(i - 1, 0, up); } }
    else if (rm) state.picked.splice(state.picked.indexOf(rm), 1);
    else return;
    renderAll();
  });
  $('sSearch').addEventListener('input', renderIssues);
  ['sWishSelf', 'sWishFamily', 'sStrength'].forEach(function (id) { $(id).addEventListener('input', renderDoc); });
  var doc = $('sDoc');
  doc.addEventListener('focusin', function (e) { var ed = e.target.closest('.ed'); if (ed && ed.querySelector('.ph')) ed.textContent = ''; });
  doc.addEventListener('input', function (e) {
    var ed = e.target.closest('.ed');
    if (!ed) return;
    state.edits[ed.getAttribute('data-key')] = ed.innerText.replace(/\n$/, '');
    ed.classList.add('is-edited');
  });
  doc.addEventListener('focusout', function (e) {
    var ed = e.target.closest('.ed');
    if (ed && !ed.textContent && ed.getAttribute('data-ph')) ed.innerHTML = '<span class="ph">' + esc(ed.getAttribute('data-ph')) + '</span>';
  });
  doc.addEventListener('paste', function (e) {
    if (!e.target.closest('.ed')) return;
    e.preventDefault();
    document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text'));
  });
  doc.addEventListener('click', function (e) {
    var id = e.target.getAttribute('data-cycle');
    if (!id) return;
    state.goalIndex[id] = (state.goalIndex[id] || 0) + 1;
    delete state.edits['r-' + id + '-goal'];
    renderDoc();
  });
  $('sCopyTable').addEventListener('click', function () { window.Otasuke.copy(toTsv(), '表をコピーしました。Excelのセルを選んで貼り付けてください'); });
  $('sCopyText').addEventListener('click', function () { window.Otasuke.copy(toText(), '文章をコピーしました'); });
  $('sPrint').addEventListener('click', function () { window.print(); });
  $('sAi').addEventListener('click', function () {
    window.Otasuke.copyAiPrompt({
      role: '障害福祉サービス事業所（' + svcById[state.svc].name + '）のサービス管理責任者',
      doc: '個別支援計画書',
      rules: [
        '課題（ニーズ）は、本人の思いが伝わる「〜したい」の形にする。',
        '支援目標は本人が主語の「〜できる。」で、回数・時間・場面など評価できる書き方にする。',
        '支援内容は、職員が行う支援と、（本人）が取り組むことを分けて具体的に書く。',
        '指定障害福祉サービス基準の記載事項（意向・総合的な支援の方針・生活全般の質を向上させるための課題・目標と達成時期・留意事項）の見出しは残す。',
      ],
      draft: toText(),
    });
  });

  renderSvc();
  renderAll();
})();
