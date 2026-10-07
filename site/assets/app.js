// 計画書の下書きを組み立てる。入力内容はブラウザの外に出さない。
(function () {
  'use strict';
  var D = window.PLANNER_DATA;
  var domainById = {};
  D.domains.forEach(function (d) { domainById[d.id] = d; });
  var issueById = {};
  D.issues.forEach(function (i) { issueById[i.id] = i; });
  var ageById = {};
  D.ages.forEach(function (a) { ageById[a.id] = a; });

  var MAX = 6;
  var STAFF = '児童指導員・保育士';
  var MANAGER = '児童発達支援管理責任者';
  // edits: 計画書上で書き換えた文章（キーごと）
  var state = { age: 'lower', picked: [], goalIndex: {}, fill: false, edits: {} };

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var domainNames = function (ids) { return ids.map(function (id) { return domainById[id].name; }).join('／'); };

  // 文例ページからの導線：?issues=a,b&age=teen
  var params = new URLSearchParams(location.search);
  (params.get('issues') || '').split(',').forEach(function (id) {
    if (issueById[id] && state.picked.indexOf(id) === -1 && state.picked.length < MAX) state.picked.push(id);
  });
  if (ageById[params.get('age')]) state.age = params.get('age');
  var fromUrl = params.has('issues') || params.has('age');
  var auto = null; // 自動保存（下の「自動保存」）
  function persist() { if (auto) auto.save(); }

  // ── 計画の組み立て ──
  function supportsText(i) {
    var doms = [];
    i.supports.forEach(function (s) { s.domains.forEach(function (d) { if (doms.indexOf(d) === -1) doms.push(d); }); });
    return {
      text: i.supports.map(function (s) { return '・' + s.text; }).join('\n') + '\n【5領域】' + domainNames(doms),
      domains: doms,
    };
  }

  function buildPlan() {
    var age = ageById[state.age];
    var issues = state.picked.map(function (id) { return issueById[id]; });
    var likes = $('likes').value.trim();
    var covered = {};
    var rows = issues.map(function (i, n) {
      var s = supportsText(i);
      s.domains.forEach(function (d) { covered[d] = true; });
      return {
        key: 'r-' + i.id,
        issueId: i.id,
        item: '本人支援',
        goal: i.shortGoals[(state.goalIndex[i.id] || 0) % i.shortGoals.length],
        content: s.text,
        period: n === 0 ? '3か月後' : '6か月後',
        staff: STAFF,
        note: i.note,
        priority: String(n + 1),
      };
    });
    var missing = D.domains.filter(function (d) { return !covered[d.id]; });
    if (state.fill) {
      missing.forEach(function (d) {
        rows.push({
          key: 'g-' + d.id, item: '本人支援', goal: '日々の活動の中で、' + d.name + 'に関わる力を育む。',
          content: '・' + d.generic + '\n【5領域】' + d.name, period: '6か月後', staff: STAFF, note: '', priority: String(rows.length + 1),
        });
      });
    }
    var focus = [];
    issues.forEach(function (i) {
      var name = domainById[i.domain].name;
      if (focus.indexOf(name) === -1) focus.push(name);
    });
    var partner = age.partner;
    var familyGoals = issues.length ? issues[0].familyGoal : '保護者が、支援の方向性を事業所と共有し、家庭でも同じ関わりをすることができる。';
    return {
      age: age,
      wish: $('wish').value.trim(),
      policy: issues.length
        ? (likes ? '本人の好きなこと・得意なこと（' + likes + '）を活かしながら、' : '本人の好きなことや得意なことを活かしながら、') +
          '「' + focus.join('」「') + '」を中心に支援を行う。' +
          '5領域の視点をふまえた総合的な支援を行い、家庭・' + partner + '・関係機関と連携しながら、' + age.context + 'を安心して過ごせるよう支える。'
        : '',
      long: issues.length
        ? issues.slice(0, 2).map(function (i) { return i.longGoal; }).join('、') + '、' + age.context + 'を自信を持って過ごすことができる。\n（期間：1年）'
        : '',
      short: issues.length
        ? rows.filter(function (r) { return r.issueId; }).slice(0, 2).map(function (r) { return '・' + r.goal; }).join('\n') + '\n（期間：6か月）'
        : '',
      time: $('time').value.trim(),
      rows: rows,
      others: issues.length ? [
        {
          key: 'fam', item: '家族支援', goal: familyGoals,
          content: issues.map(function (i) { return '・' + i.family; }).join('\n'),
          period: '6か月後', staff: MANAGER, note: '家族支援加算を算定する場合は、実施方法・頻度を記載する。',
        },
        { key: 'tr', item: '移行支援', goal: age.transitionGoal, content: age.transition, period: '6か月後', staff: MANAGER + '\n（連携先：' + partner + '）', note: '' },
        { key: 'com', item: '地域支援・地域連携', goal: age.communityGoal, content: age.community, period: '6か月後', staff: MANAGER + '\n（連携先：' + partner + '・相談支援事業所）', note: '関係機関連携加算を算定する場合は、その旨を記載する。' },
      ] : [],
      missing: state.fill ? [] : missing,
      covered: covered,
    };
  }

  // 書き換えがあればそちらを使う
  function val(key, fallback) { return Object.prototype.hasOwnProperty.call(state.edits, key) ? state.edits[key] : fallback; }

  // ── 表示 ──
  function renderAges() {
    $('ageOptions').innerHTML = D.ages.map(function (a) {
      return '<button type="button" data-age="' + a.id + '" aria-pressed="' + (a.id === state.age) + '">' +
        esc(a.name) + '<small>' + esc(a.service) + '</small></button>';
    }).join('');
  }

  function renderIssues() {
    var q = $('issueSearch').value.trim();
    var html = D.domains.map(function (d) {
      var items = D.issues.filter(function (i) {
        return i.domain === d.id && (!q || (i.label + ' ' + i.keywords).indexOf(q) !== -1);
      });
      if (!items.length) return '';
      var n = items.filter(function (i) { return state.picked.indexOf(i.id) !== -1; }).length;
      return '<div class="issue-group"><div class="issue-group-head"><span class="c-' + d.id + '"><span class="sq"></span><span style="color:var(--ink)">' +
        esc(d.name) + '</span></span><span class="cnt">' + (n ? n + '件選択' : '') + '</span></div>' +
        items.map(function (i) {
          var idx = state.picked.indexOf(i.id);
          return '<label class="issue-row' + (idx !== -1 ? ' is-on' : '') + '"><input type="checkbox" value="' + i.id + '"' +
            (idx !== -1 ? ' checked' : '') + '><span class="box">' + (idx !== -1 ? idx + 1 : '') + '</span><span>' + esc(i.label) + '</span></label>';
        }).join('') + '</div>';
    }).join('');
    $('issueList').innerHTML = html || '<p class="no-hit">見つかりませんでした。別の言葉で探してみてください。</p>';
  }

  function renderPicked() {
    $('pickedCaption').hidden = state.picked.length === 0;
    $('picked').innerHTML = state.picked.map(function (id, n) {
      return '<li><span class="num">' + (n + 1) + '</span><span>' + esc(issueById[id].label) + '</span><span class="ops">' +
        '<button type="button" data-up="' + id + '" aria-label="優先順位を上げる"' + (n === 0 ? ' disabled' : '') + '>↑</button>' +
        '<button type="button" data-remove="' + id + '" aria-label="外す">×</button></span></li>';
    }).join('');
  }

  function cell(key, text, placeholder) {
    var v = val(key, text);
    var edited = Object.prototype.hasOwnProperty.call(state.edits, key);
    return '<div class="ed' + (edited ? ' is-edited' : '') + '" contenteditable="true" spellcheck="false" data-key="' + key + '"' +
      (placeholder ? ' data-ph="' + esc(placeholder) + '"' : '') + '>' +
      (v ? esc(v) : placeholder ? '<span class="ph">' + esc(placeholder) + '</span>' : '') + '</div>';
  }

  function rowHtml(r, isSelf) {
    return '<tr><th>' + esc(r.item) + '</th>' +
      '<td>' + cell(r.key + '-goal', r.goal) +
      (r.issueId && issueById[r.issueId].shortGoals.length > 1 ? '<button type="button" class="link-btn cycle" data-cycle="' + r.issueId + '">別の文例にする</button>' : '') + '</td>' +
      '<td>' + cell(r.key + '-content', r.content) + '</td>' +
      '<td class="center">' + cell(r.key + '-period', r.period) + '</td>' +
      '<td>' + cell(r.key + '-staff', r.staff) + '</td>' +
      '<td>' + cell(r.key + '-note', r.note) + '</td>' +
      (isSelf ? '<td class="center">' + cell(r.key + '-prio', r.priority) + '</td>' : '<td class="diag"></td>') + '</tr>';
  }

  function renderDoc() {
    var p = buildPlan();
    var has = state.picked.length > 0;
    ['copyTable', 'copyText', 'printPlan', 'aiPlan', 'shareLink'].forEach(function (id) { $(id).disabled = !has; });

    var selfRows = p.rows.length ? p.rows.map(function (r) { return rowHtml(r, true); }).join('')
      : '<tr><th>本人支援</th><td colspan="6"><p class="doc-empty">左の「二」で課題を選ぶと、ここに支援目標と支援内容の文例が入ります。</p></td></tr>';
    var otherRows = p.others.length ? p.others.map(function (r) { return rowHtml(r, false); }).join('')
      : ['家族支援', '移行支援', '地域支援・地域連携'].map(function (t) { return '<tr><th>' + t + '</th><td></td><td></td><td></td><td></td><td></td><td class="diag"></td></tr>'; }).join('');

    $('doc').innerHTML =
      '<div class="doc-head"><div class="meta">利用児氏名：<span class="blank"></span></div><div class="title">個別支援計画書</div>' +
      '<div class="meta">作成年月日：　　年　　月　　日</div></div>' +
      '<table class="form form-top"><colgroup><col style="width:150px"><col><col style="width:130px"><col style="width:22%"></colgroup>' +
      '<tr><th>利用児及び家族の<br>生活に対する意向</th><td colspan="3">' + cell('wish', p.wish, '（本人・家族から聞き取った意向を記入）') + '</td></tr>' +
      '<tr><th>総合的な支援の方針</th><td colspan="3">' + cell('policy', p.policy, has ? '' : '（課題を選ぶと文例が入ります）') + '</td></tr>' +
      '<tr><th>長期目標<small>（内容・期間等）</small></th><td>' + cell('long', p.long, has ? '' : '（課題を選ぶと文例が入ります）') + '</td>' +
      '<th rowspan="2">支援の標準的な<br>提供時間等<small>（曜日・頻度、時間）</small></th><td rowspan="2">' + cell('time', p.time, '（例：月・水・金 14:30〜17:30）') + '</td></tr>' +
      '<tr><th>短期目標<small>（内容・期間等）</small></th><td>' + cell('short', p.short, has ? '' : '（課題を選ぶと文例が入ります）') + '</td></tr>' +
      '</table>' +
      '<p class="form-sub">○支援目標及び具体的な支援内容等</p>' +
      '<table class="form form-main"><colgroup><col style="width:70px"><col style="width:21%"><col style="width:35%"><col style="width:74px"><col style="width:14%"><col><col style="width:50px"></colgroup>' +
      '<thead><tr><th>項目</th><th>支援目標<small>（具体的な到達目標）</small></th><th>支援内容<small>（内容・支援の提供上のポイント・5領域との関連性等）</small></th>' +
      '<th>達成<br>時期</th><th>担当者<br>提供機関</th><th>留意事項</th><th>優先<br>順位</th></tr></thead><tbody>' +
      selfRows + otherRows + '</tbody></table>' +
      '<div class="doc-foot"><div><p>提供する支援内容について、本計画書に基づき説明しました。</p><p>児童発達支援管理責任者氏名：<span class="blank"></span></p></div>' +
      '<div><p>本計画書に基づき支援の説明を受け、内容に同意しました。</p><p>　　年　　月　　日（保護者署名）<span class="blank"></span></p></div></div>';

    // 5領域の網羅
    var covered = {};
    p.rows.forEach(function (r) {
      if (r.issueId) supportsText(issueById[r.issueId]).domains.forEach(function (d) { covered[d] = true; });
      else if (r.key.indexOf('g-') === 0) covered[r.key.slice(2)] = true;
    });
    $('coverage').innerHTML = '<span class="coverage-label">5領域</span>' + D.domains.map(function (d) {
      return '<span class="cov' + (covered[d.id] ? ' on' : '') + '"><span class="mk"></span>' + esc(d.name) + '</span>';
    }).join('');

    $('warn').innerHTML = has && (p.missing.length || state.fill)
      ? '<div class="redpen warn"><span class="redpen-label">赤ペン</span><p>' +
        (state.fill
          ? '日々の支援として、不足していた領域の行を追加しています。<button type="button" class="link-btn" id="fillToggle">追加した行を外す</button>'
          : '「' + esc(p.missing.map(function (d) { return d.name; }).join('」「')) + '」に関わる支援がまだありません。重点でない領域も、日々の支援として書いておくと5領域を網羅した計画になります。' +
            '<button type="button" class="link-btn" id="fillToggle">日々の支援の文例を追加する</button>') +
        '</p></div>'
      : '';

    $('mobileCount').textContent = has ? state.picked.length + '件の課題を選択中' : '';
    $('mobileBar').classList.toggle('show', has);
    persist();
  }

  // 特性から課題の候補を出す（選ぶときの手がかり。診断ではない）
  var trait = '';
  function renderTraits() {
    if (!D.traits) return;
    var t = D.traits.filter(function (x) { return x.id === trait; })[0];
    var sugg = t ? t.issues.filter(function (id) { return issueById[id] && state.picked.indexOf(id) === -1; }) : [];
    $('traits').innerHTML = '<p class="traits-label">特性から候補を出す<small>任意</small></p><div class="traits-row">' +
      D.traits.map(function (x) { return '<button type="button" class="trait' + (x.id === trait ? ' on' : '') + '" data-trait="' + x.id + '">' + esc(x.label) + '</button>'; }).join('') + '</div>' +
      (t ? '<div class="sugg"><span>よく一緒に選ばれる課題：</span>' + (sugg.length ? sugg.map(function (id) {
        return '<button type="button" class="sugg-btn" data-add="' + id + '">＋ ' + esc(issueById[id].label) + '</button>';
      }).join('') : '<em>候補はすべて選んでいます</em>') + '</div>' : '');
  }
  function renderAll() { renderPicked(); renderTraits(); renderIssues(); renderDoc(); }

  // ── コピー用テキスト（書き換えを反映）──
  function collect() {
    var p = buildPlan();
    var rowOut = function (r, self) {
      return {
        item: r.item, goal: val(r.key + '-goal', r.goal), content: val(r.key + '-content', r.content),
        period: val(r.key + '-period', r.period), staff: val(r.key + '-staff', r.staff), note: val(r.key + '-note', r.note),
        prio: self ? val(r.key + '-prio', r.priority) : '',
      };
    };
    return {
      wish: val('wish', p.wish), policy: val('policy', p.policy), long: val('long', p.long), short: val('short', p.short), time: val('time', p.time),
      rows: p.rows.map(function (r) { return rowOut(r, true); }).concat(p.others.map(function (r) { return rowOut(r, false); })),
    };
  }

  function planTsv() {
    var c = collect();
    var q = function (s) { return '"' + String(s || '').replace(/"/g, '""') + '"'; };
    var out = [['項目', '支援目標（具体的な到達目標）', '支援内容（内容・支援の提供上のポイント・5領域との関連性等）', '達成時期', '担当者・提供機関', '留意事項', '優先順位'].map(q).join('\t')];
    c.rows.forEach(function (r) { out.push([r.item, r.goal, r.content, r.period, r.staff, r.note, r.prio].map(q).join('\t')); });
    return out.join('\n');
  }

  function planText() {
    var c = collect();
    var lines = [
      '【利用児及び家族の生活に対する意向】', c.wish, '',
      '【総合的な支援の方針】', c.policy, '',
      '【長期目標】', c.long, '',
      '【短期目標】', c.short, '',
      '【支援の標準的な提供時間等】', c.time, '',
      '【支援目標及び具体的な支援内容等】',
    ];
    c.rows.forEach(function (r) {
      lines.push('■' + r.item + (r.prio ? '（優先順位 ' + r.prio + '）' : ''), '支援目標：' + r.goal, '支援内容：', r.content,
        '達成時期：' + r.period + '　担当者：' + r.staff.replace(/\n/g, ''));
      if (r.note) lines.push('留意事項：' + r.note);
      lines.push('');
    });
    return lines.join('\n');
  }

  function copy(text, message) {
    var done = function () { toast(message); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else { fallbackCopy(text); done(); }
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* 何もしない */ }
    document.body.removeChild(ta);
  }
  var timer;
  function toast(msg) {
    $('toast').textContent = msg; $('toast').classList.add('show');
    clearTimeout(timer); timer = setTimeout(function () { $('toast').classList.remove('show'); }, 2600);
  }

  // ── 操作 ──
  $('ageOptions').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-age]');
    if (!b) return;
    state.age = b.getAttribute('data-age');
    renderAges(); renderDoc();
  });
  $('issueList').addEventListener('change', function (e) {
    var id = e.target.value;
    var i = state.picked.indexOf(id);
    if (e.target.checked && i === -1) {
      if (state.picked.length >= MAX) {
        e.target.checked = false;
        toast('課題は' + MAX + 'つまでです。重点を絞ると、評価しやすい計画になります。');
        return;
      }
      state.picked.push(id);
    } else if (!e.target.checked && i !== -1) {
      state.picked.splice(i, 1);
    }
    renderAll();
  });
  $('picked').addEventListener('click', function (e) {
    var up = e.target.getAttribute('data-up');
    var rm = e.target.getAttribute('data-remove');
    if (up) {
      var i = state.picked.indexOf(up);
      if (i > 0) { state.picked.splice(i, 1); state.picked.splice(i - 1, 0, up); }
    } else if (rm) {
      state.picked.splice(state.picked.indexOf(rm), 1);
    } else return;
    renderAll();
  });
  $('issueSearch').addEventListener('input', renderIssues);
  $('traits').addEventListener('click', function (e) {
    var t = e.target.getAttribute('data-trait');
    var add = e.target.getAttribute('data-add');
    if (t) { trait = trait === t ? '' : t; renderTraits(); }
    if (add && state.picked.indexOf(add) === -1) {
      if (state.picked.length >= MAX) { toast('課題は' + MAX + 'つまでです。'); return; }
      state.picked.push(add); renderAll();
    }
  });
  $('shareLink').addEventListener('click', function () {
    var url = location.origin + location.pathname + '?age=' + state.age + '&issues=' + state.picked.join(',') + '#tool';
    window.Otasuke.copy(url, '選んだ課題のリンクをコピーしました。同僚に送ると、同じ下書きが開きます（入力した文章は含まれません）');
  });
  ['likes', 'wish', 'time'].forEach(function (id) { $(id).addEventListener('input', renderDoc); });

  // 計画書上での書き換え：再描画せずに記録だけする（カーソル位置を保つため）
  $('doc').addEventListener('focusin', function (e) {
    var ed = e.target.closest('.ed');
    if (ed && ed.querySelector('.ph')) ed.textContent = '';
  });
  $('doc').addEventListener('input', function (e) {
    var ed = e.target.closest('.ed');
    if (!ed) return;
    state.edits[ed.getAttribute('data-key')] = ed.innerText.replace(/\n$/, '');
    ed.classList.add('is-edited');
    persist();
  });
  $('doc').addEventListener('focusout', function (e) {
    var ed = e.target.closest('.ed');
    if (ed && !ed.textContent && ed.getAttribute('data-ph')) ed.innerHTML = '<span class="ph">' + esc(ed.getAttribute('data-ph')) + '</span>';
  });
  $('doc').addEventListener('paste', function (e) {
    // 書式つきの貼り付けを防ぎ、文字だけにする
    if (!e.target.closest('.ed')) return;
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData('text');
    document.execCommand('insertText', false, text);
  });
  $('doc').addEventListener('click', function (e) {
    var id = e.target.getAttribute('data-cycle');
    if (!id) return;
    state.goalIndex[id] = (state.goalIndex[id] || 0) + 1;
    delete state.edits['r-' + id + '-goal'];
    renderDoc();
  });
  $('warn').addEventListener('click', function (e) {
    if (e.target.id !== 'fillToggle') return;
    state.fill = !state.fill;
    renderDoc();
  });
  $('copyTable').addEventListener('click', function () { copy(planTsv(), '表をコピーしました。Excelのセルを選んで貼り付けてください'); });
  $('copyText').addEventListener('click', function () { copy(planText(), '文章をコピーしました'); });
  $('printPlan').addEventListener('click', function () { window.print(); });
  $('aiPlan').addEventListener('click', function () {
    window.Otasuke.copyAiPrompt({
      role: '放課後等デイサービス・児童発達支援の児童発達支援管理責任者',
      doc: '個別支援計画書',
      rules: [
        '支援目標は、こども本人が主語の「〜できる。」で、場面・回数・時間など評価できる書き方にする。',
        '支援内容は、職員が行う支援・工夫・配慮として具体的に書き、【5領域】の行はそのまま残す。',
        '家族支援・移行支援・地域支援の見出しは残し、5領域は書かない。',
        'こども家庭庁の「個別支援計画書の記載のポイント」（令和6年）に沿った書き方にそろえる。',
      ],
      draft: planText(),
    });
  });

  // ── 自動保存（この端末の localStorage だけ。7日で消える。common.js の Otasuke.draft） ──
  var TEXTS = ['likes', 'wish', 'time'];
  function restore(d) {
    if (ageById[d.age]) state.age = d.age;
    if (Array.isArray(d.picked)) {
      state.picked = [];
      d.picked.forEach(function (id) {
        if (typeof id === 'string' && issueById[id] && state.picked.indexOf(id) === -1 && state.picked.length < MAX) state.picked.push(id);
      });
    }
    if (d.goalIndex && typeof d.goalIndex === 'object') {
      Object.keys(d.goalIndex).forEach(function (k) { var n = d.goalIndex[k]; if (issueById[k] && typeof n === 'number' && n >= 0 && n < 1000) state.goalIndex[k] = Math.floor(n); });
    }
    if (typeof d.fill === 'boolean') state.fill = d.fill;
    if (d.edits && typeof d.edits === 'object') {
      Object.keys(d.edits).forEach(function (k) { if (typeof d.edits[k] === 'string') state.edits[k] = d.edits[k]; });
    }
    var v = d.v || {};
    TEXTS.forEach(function (id) { if (typeof v[id] === 'string') $(id).value = v[id]; });
  }
  function snapshot() {
    var v = {};
    TEXTS.forEach(function (id) { v[id] = $(id).value; });
    return { age: state.age, picked: state.picked, goalIndex: state.goalIndex, fill: state.fill, edits: state.edits, v: v };
  }
  // リセット：入力・書き換え・この端末の保存をすべて消して、最初の状態に戻す
  $('resetPlan').addEventListener('click', function () {
    if (!window.confirm('選んだ課題・入力した内容・書き換えた文章を消して、最初の状態に戻します。\nこの端末に保存していた内容も消えます。よろしいですか？')) return;
    state = { age: 'lower', picked: [], goalIndex: {}, fill: false, edits: {} };
    trait = '';
    TEXTS.concat('issueSearch').forEach(function (id) { $(id).value = ''; });
    renderAges();
    renderAll();
    auto.clear();
    toast('入力を消して、最初の状態に戻しました');
  });

  auto = window.Otasuke.draft.auto({ id: 'jido-keikaku', fromUrl: fromUrl, restore: restore, get: snapshot, note: $('planSave'), hash: '#tool' });
  renderAges();
  renderAll();
  auto.announce();
})();
