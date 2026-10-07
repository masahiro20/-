// 事故報告書（標準様式）の下書き。入力内容はブラウザの外に出さない。
(function () {
  'use strict';
  var J = window.JIKO_DATA;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  var typeById = {};
  J.TYPES.forEach(function (t) { typeById[t.id] = t; });
  var GROUPS = [['person', '本人要因'], ['staff', '職員要因'], ['env', '環境要因']];
  var KINDS = [['proc', '手順の変更'], ['env', '環境の変更'], ['other', 'その他の対応']];
  var state = { type: 'tento', factors: [], edits: {} };
  var params = new URLSearchParams(location.search);
  if (typeById[params.get('type')]) state.type = params.get('type');
  state.factors = (params.get('f') || '').split(',').filter(Boolean);
  var fromUrl = params.has('type') || params.has('f');
  var auto = null; // 自動保存（下の「自動保存」）
  function persist() { if (auto) auto.save(); }

  function allFactors() {
    var out = [];
    GROUPS.forEach(function (g) { J.FACTORS[g[0]].forEach(function (f) { out.push({ group: g[0], f: f }); }); });
    return out;
  }
  function applicable(f) { return f.types.indexOf('all') !== -1 || f.types.indexOf(state.type) !== -1; }

  // ── 左の入力欄 ──
  function renderTypes() {
    $('jType').innerHTML = J.TYPES.map(function (t) {
      return '<button type="button" data-type="' + t.id + '" aria-pressed="' + (t.id === state.type) + '">' + esc(t.name) +
        (t.std !== t.name ? '<small>標準様式：' + esc(t.std) + '</small>' : '') + '</button>';
    }).join('');
    $('jSituation').innerHTML = typeById[state.type].situations.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '<option value="">（補足欄に書く）</option>';
  }
  function renderFactors() {
    $('jFactors').innerHTML = GROUPS.map(function (g) {
      var items = J.FACTORS[g[0]].filter(applicable);
      return '<div class="issue-group"><div class="issue-group-head"><span>' + g[1] + '</span></div>' + items.map(function (f) {
        var on = state.factors.indexOf(f.id) !== -1;
        return '<label class="issue-row' + (on ? ' is-on' : '') + '"><input type="checkbox" value="' + f.id + '"' + (on ? ' checked' : '') +
          '><span class="box">' + (on ? '✓' : '') + '</span><span>' + esc(f.label) + '</span></label>';
      }).join('') + '</div>';
    }).join('');
  }

  // ── 報告書の組み立て ──
  function fmtDate() {
    var d = $('jDate').value, t = $('jTime').value;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
    var ds = m ? m[1] + '年' + Number(m[2]) + '月' + Number(m[3]) + '日' : '　　年　　月　　日';
    var ts = t ? Number(t.split(':')[0]) + '時' + Number(t.split(':')[1]) + '分' : '　　時　　分';
    return { date: ds, time: ts, both: ds + '　' + ts };
  }
  function build() {
    var type = typeById[state.type];
    var when = fmtDate();
    var place = $('jPlace').value;
    var situation = $('jSituation').value;
    var found = $('jFound').value;
    var detail = $('jDetail').value.trim();
    var visit = $('jVisit').value;
    var diag = $('jDiag').value;
    var chosen = allFactors().filter(function (x) { return applicable(x.f) && state.factors.indexOf(x.f.id) !== -1; });

    var what = situation ? type.tpl.replace('{s}', situation) : type.name + 'の事故が発生した。';
    var summary = when.time + '頃、' + place + 'で、' + what + found + '。' + (detail ? '\n' + detail : '');
    var response = '発見した職員がすぐに看護職員（または責任者）に報告し、バイタルサインの測定と、けがの有無・痛みの確認を行った。';
    if (visit === '救急搬送') response += '\n救急車を要請し、医療機関（　　　　）へ搬送した。';
    else if (visit === '受診（外来・往診）') response += '\n医療機関（　　　　）を受診した。';
    else if (visit.indexOf('施設内の医師') === 0) response += '\n配置医の診察を受け、指示に従って処置を行った。';
    var agencies = [];
    $('jAgencies').querySelectorAll('input:checked').forEach(function (c) { agencies.push(J.AGENCIES[Number(c.value)]); });

    var cause = {};
    GROUPS.forEach(function (g) {
      cause[g[0]] = chosen.filter(function (x) { return x.group === g[0]; }).map(function (x) { return '・' + x.f.text; }).join('\n');
    });
    var measures = {};
    KINDS.forEach(function (k) { measures[k[0]] = []; });
    chosen.forEach(function (x) {
      x.f.measures.forEach(function (m) { if (measures[m[0]].indexOf(m[1]) === -1) measures[m[0]].push(m[1]); });
    });
    return {
      level: $('jLevel').value, type: type, place: place, when: when,
      summary: summary, response: response, visit: visit, diag: diag,
      family: $('jFamily').checked ? 'ご家族（続柄：　　）へ、' + when.date + '　　時　　分に電話で報告した。' : '（報告予定）',
      agencies: agencies.join('、') || '（なし）',
      followup: '再発防止策が決まりしだい、ご家族に説明する。',
      cause: cause,
      measures: {
        proc: measures.proc.map(function (s) { return '・' + s; }).join('\n'),
        env: measures.env.map(function (s) { return '・' + s; }).join('\n'),
        other: measures.other.map(function (s) { return '・' + s; }).join('\n'),
      },
      evaluation: '1か月後に事故防止委員会で実施状況と効果を評価し、結果を記録する。',
      chosen: chosen,
    };
  }
  // 入力欄（自動保存とリセットで使う）
  var FIELDS = ['jDate', 'jTime', 'jPlace', 'jSituation', 'jFound', 'jDetail', 'jLevel', 'jVisit', 'jDiag'];
  function has(k) { return Object.prototype.hasOwnProperty.call(state.edits, k); }
  function val(k, v) { return has(k) ? state.edits[k] : v; }
  function cell(k, v, ph) {
    var t = val(k, v);
    return '<div class="ed' + (has(k) ? ' is-edited' : '') + '" contenteditable="true" spellcheck="false" data-key="' + k + '" data-ph="' + esc(ph || '（記入）') + '">' +
      (t ? esc(t) : '<span class="ph">' + esc(ph || '（記入）') + '</span>') + '</div>';
  }
  var BLANK = '（事業所で記入）';
  function sections(p) {
    // [見出し, [[小見出し, キー, 文, プレースホルダ]...]]
    return [
      ['1 事故状況', [['事故状況の程度', 'level', p.level]]],
      ['2 事業所の概要', [['法人名・事業所名・サービス種別・所在地', 'office', '', BLANK]]],
      ['3 対象者', [['氏名・年齢・性別・要介護度など', 'person', '', BLANK]]],
      ['4 事故の概要', [['発生日時', 'when', p.when.both], ['発生場所', 'place', p.place], ['事故の種別', 'type', p.type.std + (p.type.std !== p.type.name ? '（' + p.type.name + '）' : '')], ['発生時状況・事故内容の詳細', 'summary', p.summary]]],
      ['5 事故発生時の対応', [['発生時の対応', 'response', p.response], ['受診方法', 'visit', p.visit], ['受診先・診断名', 'hospital', '', BLANK], ['診断内容', 'diag', p.diag], ['検査・処置等の概要', 'treat', '', BLANK]]],
      ['6 事故発生後の状況', [['利用者の状況', 'after', '', '（受診後の状態・現在の様子を記入）'], ['家族等への報告', 'family', p.family], ['連絡した関係機関', 'agencies', p.agencies], ['本人・家族・関係先等への追加対応予定', 'followup', p.followup]]],
      ['7 事故の原因分析', [['本人要因', 'c-person', p.cause.person, '（左の「四」で選ぶと入ります）'], ['職員要因', 'c-staff', p.cause.staff, '（左の「四」で選ぶと入ります）'], ['環境要因', 'c-env', p.cause.env, '（左の「四」で選ぶと入ります）']]],
      ['8 再発防止策', [['手順の変更', 'm-proc', p.measures.proc, '（要因を選ぶと入ります）'], ['環境の変更', 'm-env', p.measures.env, '（要因を選ぶと入ります）'], ['その他の対応', 'm-other', p.measures.other, '（要因を選ぶと入ります）'], ['評価の時期と結果', 'evaluation', p.evaluation]]],
      ['9 その他特記すべき事項', [['', 'misc', '', '（必要に応じて記入）']]],
    ];
  }
  function renderDoc() {
    var p = build();
    $('jDoc').innerHTML = '<div class="doc-head"><div class="meta"></div><div class="title" style="letter-spacing:.15em">事故報告書</div><div class="meta">第　報<br>報告日：　　年　　月　　日</div></div>' +
      '<table class="form form-main"><colgroup><col style="width:130px"><col style="width:170px"><col></colgroup>' +
      sections(p).map(function (s) {
        return s[1].map(function (r, i) {
          return '<tr>' + (i === 0 ? '<th rowspan="' + s[1].length + '">' + esc(s[0]) + '</th>' : '') +
            (r[0] ? '<th>' + esc(r[0]) + '</th><td>' : '<td colspan="2">') + cell(r[1], r[2], r[3]) + '</td></tr>';
        }).join('');
      }).join('') + '</table>';
    var groups = {};
    p.chosen.forEach(function (x) { groups[x.group] = true; });
    $('jInfo').innerHTML = '<span class="coverage-label">要因</span>' + GROUPS.map(function (g) {
      return '<span class="cov' + (groups[g[0]] ? ' on' : '') + '"><span class="mk"></span>' + g[1] + '</span>';
    }).join('');
    var warn = '';
    if (!p.chosen.length) warn = '原因（要因）を選ぶと、原因分析と再発防止策の文例が入ります。';
    else if (!groups.staff && !groups.env) warn = '原因が本人要因だけになっています。職員の動き方や環境（床・照明・用具・人員配置など）に変えられることがないか、あわせて検討しましょう。';
    $('jWarn').innerHTML = warn ? '<div class="redpen warn"><span class="redpen-label">赤ペン</span><p>' + esc(warn) + '</p></div>' : '';
    persist();
  }

  function toText() {
    var p = build();
    var out = ['事故報告書（第　報）', ''];
    sections(p).forEach(function (s) {
      out.push('【' + s[0] + '】');
      s[1].forEach(function (r) { var v = val(r[1], r[2]); out.push((r[0] ? '＜' + r[0] + '＞\n' : '') + (v || '')); });
      out.push('');
    });
    return out.join('\n');
  }

  // ── 操作 ──
  $('jType').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-type]');
    if (!b) return;
    state.type = b.getAttribute('data-type');
    renderTypes(); renderFactors(); renderDoc();
  });
  $('jFactors').addEventListener('change', function (e) {
    var id = e.target.value;
    var i = state.factors.indexOf(id);
    if (e.target.checked && i === -1) state.factors.push(id);
    if (!e.target.checked && i !== -1) state.factors.splice(i, 1);
    var row = e.target.closest('.issue-row');
    row.classList.toggle('is-on', e.target.checked);
    row.querySelector('.box').textContent = e.target.checked ? '✓' : '';
    ['c-person', 'c-staff', 'c-env', 'm-proc', 'm-env', 'm-other'].forEach(function (k) { delete state.edits[k]; });
    renderDoc();
  });
  FIELDS.concat('jFamily').forEach(function (id) {
    $(id).addEventListener('input', renderDoc);
    $(id).addEventListener('change', renderDoc);
  });
  $('jAgencies').addEventListener('change', renderDoc);
  var doc = $('jDoc');
  doc.addEventListener('focusin', function (e) { var ed = e.target.closest('.ed'); if (ed && ed.querySelector('.ph')) ed.textContent = ''; });
  doc.addEventListener('input', function (e) {
    var ed = e.target.closest('.ed');
    if (!ed) return;
    state.edits[ed.getAttribute('data-key')] = ed.innerText.replace(/\n$/, '');
    ed.classList.add('is-edited');
    persist();
  });
  doc.addEventListener('focusout', function (e) {
    var ed = e.target.closest('.ed');
    if (ed && !ed.textContent) ed.innerHTML = '<span class="ph">' + esc(ed.getAttribute('data-ph')) + '</span>';
  });
  doc.addEventListener('paste', function (e) {
    if (!e.target.closest('.ed')) return;
    e.preventDefault();
    document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text'));
  });
  $('jCopy').addEventListener('click', function () { window.Otasuke.copy(toText(), '文章をコピーしました'); });
  $('jPrint').addEventListener('click', function () { window.print(); });
  $('jShare').addEventListener('click', function () {
    var url = location.origin + location.pathname + '?type=' + state.type + '&f=' + state.factors.join(',');
    window.Otasuke.copy(url, '選んだ種別と要因のリンクをコピーしました（日時や補足の文章は含まれません）');
  });
  $('jAi').addEventListener('click', function () {
    window.Otasuke.copyAiPrompt({
      role: '介護事業所の職員',
      doc: '事故報告書（厚生労働省の標準様式）',
      rules: [
        '5W1Hで、時系列に沿って、事実を客観的に書く。推測と事実を分ける。',
        '専門用語や略語は避け、市町村の担当者やご家族が読んでも分かる言葉にする。',
        '原因分析は本人要因・職員要因・環境要因に分けたまま整え、再発防止策は「見守りを強化する」のような抽象的な表現ではなく、誰が・いつ・何を変えるかが分かる具体的な書き方にする。',
        '（事業所で記入）となっている欄は空欄のまま残す。',
      ],
      draft: toText(),
    });
  });

  // ── 自動保存（この端末の localStorage だけ。7日で消える。common.js の Otasuke.draft） ──
  function today() { return new Date().toISOString().slice(0, 10); }
  function setSelect(el, v) {
    if (typeof v === 'string' && Array.prototype.some.call(el.options, function (o) { return o.value === v; })) el.value = v;
  }
  function restore(d) {
    if (typeById[d.type]) state.type = d.type;
    if (Array.isArray(d.factors)) {
      var ok = {};
      allFactors().forEach(function (x) { ok[x.f.id] = true; });
      state.factors = d.factors.filter(function (id, i, a) { return typeof id === 'string' && ok[id] && a.indexOf(id) === i; });
    }
    if (d.edits && typeof d.edits === 'object') {
      Object.keys(d.edits).forEach(function (k) { if (typeof d.edits[k] === 'string') state.edits[k] = d.edits[k]; });
    }
    renderTypes(); // 「状況」の選択肢は種別で変わるので、先に作り直す
    var v = d.v || {};
    if (typeof v.jDate === 'string' && /^(\d{4}-\d{2}-\d{2})?$/.test(v.jDate)) $('jDate').value = v.jDate;
    if (typeof v.jTime === 'string' && /^(\d{2}:\d{2}(:\d{2})?)?$/.test(v.jTime)) $('jTime').value = v.jTime;
    if (typeof v.jDetail === 'string') $('jDetail').value = v.jDetail;
    ['jPlace', 'jSituation', 'jFound', 'jLevel', 'jVisit', 'jDiag'].forEach(function (id) { setSelect($(id), v[id]); });
    if (typeof d.family === 'boolean') $('jFamily').checked = d.family;
    if (Array.isArray(d.agencies)) {
      $('jAgencies').querySelectorAll('input').forEach(function (c) { c.checked = d.agencies.indexOf(Number(c.value)) !== -1; });
    }
  }
  function snapshot() {
    var v = {};
    FIELDS.forEach(function (id) { v[id] = $(id).value; });
    var ag = [];
    $('jAgencies').querySelectorAll('input:checked').forEach(function (c) { ag.push(Number(c.value)); });
    return { type: state.type, factors: state.factors, edits: state.edits, v: v, family: $('jFamily').checked, agencies: ag };
  }
  // リセット：入力・書き換え・この端末の保存をすべて消して、最初の状態に戻す
  $('jReset').addEventListener('click', function () {
    if (!window.confirm('入力した内容と書き換えた文章を消して、最初の状態に戻します。\nこの端末に保存していた内容も消えます。よろしいですか？')) return;
    state.type = 'tento'; state.factors = []; state.edits = {};
    renderTypes();
    FIELDS.forEach(function (id) {
      var el = $(id);
      if (el.tagName === 'SELECT') el.selectedIndex = 0; else el.value = el.defaultValue;
    });
    $('jDate').value = today();
    $('jFamily').checked = $('jFamily').defaultChecked;
    $('jAgencies').querySelectorAll('input').forEach(function (c) { c.checked = c.defaultChecked; });
    renderFactors();
    renderDoc();
    auto.clear();
    window.Otasuke.toast('入力を消して、最初の状態に戻しました');
  });

  $('jDate').value = today();
  renderTypes();
  auto = window.Otasuke.draft.auto({ id: 'jiko', fromUrl: fromUrl, restore: restore, get: snapshot, note: $('jSave') });
  renderFactors();
  renderDoc();
  auto.announce();
})();
