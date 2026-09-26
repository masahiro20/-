// 個別支援計画のたたき台を組み立てるツール。入力内容はブラウザの外に出さない。
(function () {
  'use strict';
  var D = window.PLANNER_DATA;
  var domainById = {};
  D.domains.forEach(function (d) { domainById[d.id] = d; });
  var issueById = {};
  D.issues.forEach(function (i) { issueById[i.id] = i; });

  var MAX_ISSUES = 6;
  var FAMILY_GOAL = '保護者と支援の方向性を共有し、家庭でも一貫した関わりができる。';
  var state = { age: 'lower', selected: [], goalIndex: {}, fill: false };

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  // URL の ?issues=a,b で課題を選んだ状態から始められる（文例ページからの導線）
  var params = new URLSearchParams(location.search);
  (params.get('issues') || '').split(',').forEach(function (id) {
    if (issueById[id] && state.selected.length < MAX_ISSUES) state.selected.push(id);
  });
  if (params.get('age') && D.ages.some(function (a) { return a.id === params.get('age'); })) {
    state.age = params.get('age');
  }

  function renderAges() {
    $('ageOptions').innerHTML = D.ages.map(function (a) {
      return '<label class="chip"><input type="radio" name="age" value="' + a.id + '"' +
        (a.id === state.age ? ' checked' : '') + '><span>' + esc(a.name) + '</span></label>';
    }).join('');
  }

  function renderIssues() {
    var q = $('issueSearch').value.trim();
    $('issueGroups').innerHTML = D.domains.map(function (d) {
      var items = D.issues.filter(function (i) {
        return i.domain === d.id && (!q || (i.label + i.keywords).indexOf(q) !== -1);
      });
      if (!items.length) return '';
      return '<fieldset class="issue-group"><legend><span class="tag tag-' + d.id + '">' + esc(d.name) +
        '</span></legend><div class="chips">' + items.map(function (i) {
          var on = state.selected.indexOf(i.id) !== -1;
          return '<label class="chip' + (on ? ' is-on' : '') + '"><input type="checkbox" value="' + i.id + '"' +
            (on ? ' checked' : '') + '><span>' + esc(i.label) + '</span></label>';
        }).join('') + '</div></fieldset>';
    }).join('') || '<p class="muted">該当する課題が見つかりませんでした。別の言葉で探してみてください。</p>';
  }

  function buildPlan() {
    var age = D.ages.filter(function (a) { return a.id === state.age; })[0];
    var issues = state.selected.map(function (id) { return issueById[id]; });
    var covered = {};
    var rows = issues.map(function (i) {
      var domains = [];
      i.supports.forEach(function (s) {
        s.domains.forEach(function (d) {
          covered[d] = true;
          if (domains.indexOf(d) === -1) domains.push(d);
        });
      });
      return {
        issueId: i.id,
        category: '本人支援',
        goal: i.shortGoals[(state.goalIndex[i.id] || 0) % i.shortGoals.length],
        supports: i.supports.map(function (s) { return s.text; }),
        domains: domains,
      };
    });
    var missing = D.domains.filter(function (d) { return !covered[d.id]; });
    if (state.fill) {
      missing.forEach(function (d) {
        rows.push({ category: '本人支援', goal: '日々の活動を通して、' + d.name + 'の力を育む。', supports: [d.generic], domains: [d.id] });
      });
    }
    var focus = [];
    issues.forEach(function (i) {
      var name = domainById[i.domain].name;
      if (focus.indexOf(name) === -1) focus.push(name);
    });
    var longGoal = issues.slice(0, 2).map(function (i) { return i.longGoal; }).join('、') +
      '、' + age.context + 'を自信を持って過ごすことができる。';
    return {
      age: age,
      policy: '「' + focus.join('」「') + '」の領域を中心に、本人の得意なことや興味を活かしながら、' + age.context +
        'を安心して過ごせるよう支援する。5領域の視点から総合的に支援を行い、家庭・学校等の関係機関と連携しながら取り組む。',
      longGoal: longGoal,
      shortGoals: rows.filter(function (r) { return r.issueId; }).map(function (r) { return r.goal; }),
      rows: rows,
      family: { goal: FAMILY_GOAL, supports: issues.map(function (i) { return i.family; }) },
      transition: { goal: age.transitionGoal, supports: [age.transition, age.inclusion] },
      community: { goal: '関係機関と情報を共有し、支援の方向性をそろえる。', supports: [age.community] },
      missing: state.fill ? [] : missing,
      wishChild: $('wishChild').value.trim(),
      wishParent: $('wishParent').value.trim(),
      timeWeekday: $('timeWeekday').value.trim(),
      timeHoliday: $('timeHoliday').value.trim(),
    };
  }

  function domainNames(ids) {
    return ids.map(function (id) { return domainById[id].name; }).join('／');
  }

  function renderCoverage() {
    var covered = {};
    buildPlan().rows.forEach(function (r) { r.domains.forEach(function (d) { covered[d] = true; }); });
    $('coverage').innerHTML = state.selected.length ? D.domains.map(function (d) {
      return '<span class="cov' + (covered[d.id] ? ' cov-on tag-' + d.id : '') + '" title="' + esc(d.name) + '">' + esc(d.short) + '</span>';
    }).join('') : '';
  }

  function renderOutput() {
    var has = state.selected.length > 0;
    ['copyText', 'copyTable', 'fillDomains', 'printPlan'].forEach(function (id) { $(id).disabled = !has; });
    renderCoverage();
    if (!has) {
      $('output').innerHTML = '<p class="empty">左の「2」で課題を選ぶと、ここに計画のたたき台が表示されます。</p>';
      return;
    }
    var p = buildPlan();
    $('fillDomains').textContent = state.fill ? '補った領域を外す' : '不足領域を補う';
    $('fillDomains').disabled = !state.fill && p.missing.length === 0;
    var ph = function (v, fallback) { return v ? esc(v) : '<span class="placeholder">' + fallback + '</span>'; };
    var row = function (r) {
      return '<tr><th>' + esc(r.category) + '</th><td>' + esc(r.goal) +
        (r.issueId && issueById[r.issueId].shortGoals.length > 1
          ? '<button type="button" class="link-btn" data-cycle="' + r.issueId + '">別の文例</button>' : '') +
        '</td><td><ul>' + r.supports.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></td><td>' +
        (r.domains.length ? r.domains.map(function (d) { return '<span class="tag tag-' + d + '">' + esc(domainById[d].name) + '</span>'; }).join('') : '―') +
        '</td></tr>';
    };
    var other = function (label, o) { return row({ category: label, goal: o.goal, supports: o.supports, domains: [] }); };
    $('output').innerHTML =
      '<dl class="plan">' +
      '<dt>本人の意向</dt><dd>' + ph(p.wishChild, '（本人から聞き取った内容を記入）') + '</dd>' +
      '<dt>保護者の意向</dt><dd>' + ph(p.wishParent, '（保護者から聞き取った内容を記入）') + '</dd>' +
      '<dt>総合的な支援の方針</dt><dd>' + esc(p.policy) + '</dd>' +
      '<dt>長期目標（おおむね1年）</dt><dd>' + esc(p.longGoal) + '</dd>' +
      '<dt>短期目標（おおむね6か月）</dt><dd><ul>' + p.shortGoals.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') + '</ul></dd>' +
      '<dt>支援の標準的な提供時間</dt><dd>平日：' + ph(p.timeWeekday, '（記入）') + '　休日・長期休暇：' + ph(p.timeHoliday, '（記入）') + '</dd>' +
      '</dl>' +
      (p.missing.length ? '<p class="warn">計画に関連の出てこない領域があります：<strong>' + esc(p.missing.map(function (d) { return d.name; }).join('、')) +
        '</strong>。「不足領域を補う」で日々の支援の文例を追加できます。</p>' : '') +
      '<div class="table-wrap"><table class="plan-table"><thead><tr><th>項目</th><th>支援目標</th><th>支援内容</th><th>5領域</th></tr></thead><tbody>' +
      p.rows.map(row).join('') +
      other('家族支援', p.family) +
      other('移行支援', p.transition) +
      other('地域支援・地域連携', p.community) +
      '</tbody></table></div>' +
      '<p class="note">※ 文例は「たたき台」です。回数・時間などをお子さまの様子に合わせて書き換えてください。</p>';
  }

  function planText() {
    var p = buildPlan();
    var lines = [];
    var block = function (title, o) {
      lines.push('■' + title, '支援目標：' + o.goal);
      o.supports.forEach(function (s) { lines.push('・' + s); });
      if (o.domains && o.domains.length) lines.push('関連する5領域：' + domainNames(o.domains));
      lines.push('');
    };
    lines.push('【本人の意向】' + (p.wishChild || ''), '【保護者の意向】' + (p.wishParent || ''), '');
    lines.push('【総合的な支援の方針】', p.policy, '');
    lines.push('【長期目標（おおむね1年）】', p.longGoal, '');
    lines.push('【短期目標（おおむね6か月）】');
    p.shortGoals.forEach(function (g) { lines.push('・' + g); });
    lines.push('', '【支援内容】');
    p.rows.forEach(function (r, n) { block('本人支援' + (n + 1), r); });
    block('家族支援', p.family);
    block('移行支援（インクルージョンの観点を含む）', p.transition);
    block('地域支援・地域連携', p.community);
    lines.push('【支援の標準的な提供時間】平日：' + (p.timeWeekday || '') + '　休日・長期休暇：' + (p.timeHoliday || ''));
    return lines.join('\n');
  }

  function planTsv() {
    var p = buildPlan();
    var cell = function (s) { return '"' + String(s).replace(/"/g, '""') + '"'; };
    var out = [['項目', '支援目標', '支援内容', '関連する5領域'].map(cell).join('\t')];
    var add = function (label, o) {
      out.push([label, o.goal, o.supports.map(function (s) { return '・' + s; }).join('\n'), o.domains ? domainNames(o.domains) : ''].map(cell).join('\t'));
    };
    p.rows.forEach(function (r) { add('本人支援', r); });
    add('家族支援', p.family);
    add('移行支援', p.transition);
    add('地域支援・地域連携', p.community);
    return out.join('\n');
  }

  function copy(text, message) {
    var done = function () { toast(message); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
    } else {
      fallbackCopy(text);
      done();
    }
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* 失敗時は何もしない */ }
    document.body.removeChild(ta);
  }
  var toastTimer;
  function toast(msg) {
    $('toast').textContent = msg;
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $('toast').classList.remove('show'); }, 2400);
  }

  $('ageOptions').addEventListener('change', function (e) {
    state.age = e.target.value;
    renderOutput();
  });
  $('issueGroups').addEventListener('change', function (e) {
    var id = e.target.value;
    var i = state.selected.indexOf(id);
    if (e.target.checked) {
      if (state.selected.length >= MAX_ISSUES) {
        e.target.checked = false;
        toast('課題は' + MAX_ISSUES + 'つまで選べます。重点を絞ると、評価しやすい計画になります。');
        return;
      }
      if (i === -1) state.selected.push(id);
    } else if (i !== -1) {
      state.selected.splice(i, 1);
    }
    e.target.closest('.chip').classList.toggle('is-on', e.target.checked);
    renderOutput();
  });
  $('issueSearch').addEventListener('input', renderIssues);
  ['wishChild', 'wishParent', 'timeWeekday', 'timeHoliday'].forEach(function (id) {
    $(id).addEventListener('input', renderOutput);
  });
  $('output').addEventListener('click', function (e) {
    var id = e.target.getAttribute('data-cycle');
    if (!id) return;
    state.goalIndex[id] = (state.goalIndex[id] || 0) + 1;
    renderOutput();
  });
  $('copyText').addEventListener('click', function () { copy(planText(), '文章をコピーしました'); });
  $('copyTable').addEventListener('click', function () { copy(planTsv(), '表をコピーしました。Excelのセルに貼り付けてください'); });
  $('fillDomains').addEventListener('click', function () { state.fill = !state.fill; renderOutput(); });
  $('printPlan').addEventListener('click', function () { window.print(); });

  renderAges();
  renderIssues();
  renderOutput();
})();
