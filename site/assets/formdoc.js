// 書類テンプレートの共通エンジン。左で選ぶ → 右に様式どおりの下書き → その場で書き換え → コピー・印刷・AI。
// 各テンプレートは assets/tpl/*.js で Formdoc.run({...}) を呼ぶ。入力内容はブラウザの外に出さない。
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  var KANJI = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  // テンプレートから使う小さな道具
  var H = {
    // 2025-04-01 → 2025年4月1日（空なら空欄つきの形）
    date: function (s) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
      return m ? m[1] + '年' + Number(m[2]) + '月' + Number(m[3]) + '日' : '　　年　　月　　日';
    },
    time: function (s) {
      var m = /^(\d{1,2}):(\d{2})$/.exec(s || '');
      return m ? Number(m[1]) + '時' + (Number(m[2]) ? Number(m[2]) + '分' : '') : '　　時　　分'; // 15:05→15時5分、15:00→15時
    },
    month: function (s) {
      var m = /^(\d{4})-(\d{2})/.exec(s || '');
      return m ? Number(m[2]) : new Date().getMonth() + 1;
    },
    bullets: function (arr) { return (arr || []).filter(Boolean).map(function (t) { return '・' + t; }).join('\n'); },
    pick: function (list, ids) {
      var out = [];
      (list || []).forEach(function (o) { if ((ids || []).indexOf(o[0]) !== -1) out.push(o); });
      return out;
    },
    label: function (list, id) {
      for (var i = 0; i < (list || []).length; i++) if (list[i][0] === id) return list[i][1];
      return '';
    },
    today: function () {
      var d = new Date();
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    },
  };

  function norm(options) {
    return (options || []).map(function (o) { return typeof o === 'string' ? [o, o] : o; });
  }

  function run(T) {
    var state = { v: {}, edits: {} };
    var fields = [];
    T.blocks.forEach(function (b) { b.fields.forEach(function (f) { fields.push(f); }); });
    // 選んだ値で、ほかの欄の選択肢や表示が変わるテンプレートか
    var reactive = fields.some(function (f) { return typeof f.options === 'function' || f.show; });
    function optionsOf(f) { return norm(typeof f.options === 'function' ? f.options(state.v) : f.options); }

    // 初期値 → URLの指定（共有リンク）、または この端末に保存した入力途中の内容
    function setDefaults() {
      state.v = {};
      fields.forEach(function (f) {
        if (f.type === 'chips') state.v[f.id] = (f.def || []).slice();
        else if (f.type === 'date' && f.today) state.v[f.id] = H.today();
        else if (f.type === 'seg' || f.type === 'select') state.v[f.id] = f.def != null ? f.def : (optionsOf(f)[0] || [''])[0];
        else state.v[f.id] = f.def || '';
      });
    }
    setDefaults();
    var SELECTABLE = ['seg', 'select', 'chips'];
    var params = new URLSearchParams(location.search);
    var fromUrl = fields.some(function (f) { return params.has(f.id) && SELECTABLE.indexOf(f.type) !== -1; });
    fields.forEach(function (f) {
      if (!params.has(f.id) || SELECTABLE.indexOf(f.type) === -1) return;
      var raw = params.get(f.id);
      if (f.type === 'chips') state.v[f.id] = raw.split(',').filter(Boolean);
      else state.v[f.id] = raw;
    });

    // ── 自動保存（この端末の localStorage だけ。7日で消える。common.js の Otasuke.draft） ──
    var D = window.Otasuke && window.Otasuke.draft;
    var draftId = T.id || (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '');
    var canSave = !!(D && D.available());
    var saved = canSave ? D.load(draftId) : null;
    var restored = null;
    // 共有リンク（URLの指定）で開いたときは、URLの内容を優先する
    if (saved && !fromUrl && saved.d && saved.d.v) {
      var sv = saved.d.v;
      fields.forEach(function (f) {
        if (!Object.prototype.hasOwnProperty.call(sv, f.id)) return;
        var x = sv[f.id];
        if (f.type === 'chips') { if (Array.isArray(x)) state.v[f.id] = x.filter(function (y) { return typeof y === 'string'; }); }
        else if (typeof x === 'string') state.v[f.id] = x;
      });
      var se = saved.d.e;
      if (se && typeof se === 'object') {
        Object.keys(se).forEach(function (k) {
          var o = se[k];
          if (o && typeof o.base === 'string' && typeof o.text === 'string') state.edits[k] = { base: o.base, text: o.text };
        });
      }
      restored = saved.t;
    }
    var saveTimer = null;
    function saveNow() {
      clearTimeout(saveTimer); saveTimer = null;
      if (canSave) D.save(draftId, { v: state.v, e: state.edits });
      // 共有リンクから入力を始めたら、前の保存は置きかわるので「もどす」の案内を消す
      if (fromUrl && saved) { saved = null; showSaveNote(); }
    }
    function persist() {
      if (!canSave) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveNow, 400);
    }
    function flush() { if (saveTimer) saveNow(); }
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });
    // 選べない値を外す
    function clean() {
      fields.forEach(function (f) {
        if (['seg', 'select', 'chips'].indexOf(f.type) === -1) return;
        var ids = optionsOf(f).map(function (o) { return o[0]; });
        if (f.type === 'chips') state.v[f.id] = state.v[f.id].filter(function (x) { return ids.indexOf(x) !== -1; });
        else if (ids.indexOf(state.v[f.id]) === -1) state.v[f.id] = ids[0] || '';
      });
    }
    clean();

    // ── 左の入力欄 ──
    function fieldHtml(f) {
      var v = state.v[f.id];
      var label = f.label ? esc(f.label) + (f.hint ? '<span class="hint">' + esc(f.hint) + '</span>' : '') : '';
      var opts = optionsOf(f);
      if (f.type === 'seg') {
        return (label ? '<p class="field fd-label">' + label + '</p>' : '') + '<div class="seg' + (f.wide ? ' seg-wide' : '') + '" role="group" data-f="' + f.id + '">' +
          opts.map(function (o) { return '<button type="button" data-v="' + esc(o[0]) + '" aria-pressed="' + (o[0] === v) + '">' + esc(o[1]) + (o[2] ? '<small>' + esc(o[2]) + '</small>' : '') + '</button>'; }).join('') + '</div>';
      }
      if (f.type === 'select') {
        return '<label class="field">' + label + '<select class="input" data-f="' + f.id + '">' +
          opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === v ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
      }
      if (f.type === 'chips') {
        return (label ? '<p class="field fd-label">' + label + '</p>' : '') + '<div class="chips2' + (f.list ? ' chips-list' : '') + '" data-f="' + f.id + '">' +
          opts.map(function (o) { return '<label class="chip2"><input type="checkbox" value="' + esc(o[0]) + '"' + (v.indexOf(o[0]) !== -1 ? ' checked' : '') + '><span>' + esc(o[1]) + '</span></label>'; }).join('') + '</div>';
      }
      if (f.type === 'textarea') {
        return '<label class="field">' + label + '<textarea class="input" rows="' + (f.rows || 2) + '" data-f="' + f.id + '" placeholder="' + esc(f.ph || '') + '">' + esc(v) + '</textarea></label>';
      }
      return '<label class="field">' + label + '<input class="input" type="' + (f.type || 'text') + '" data-f="' + f.id + '" value="' + esc(v) + '" placeholder="' + esc(f.ph || '') + '"></label>';
    }
    function renderPanel() {
      var no = 0;
      $('fdPanel').innerHTML = T.blocks.map(function (b) {
        var visible = b.fields.filter(function (f) { return !f.show || f.show(state.v); });
        if (!visible.length) return '';
        var pairs = [];
        for (var k = 0; k < visible.length; k++) {
          var f = visible[k], g = visible[k + 1];
          if (f.half && g && g.half) { pairs.push('<div class="field-row">' + fieldHtml(f) + fieldHtml(g) + '</div>'); k++; }
          else pairs.push(fieldHtml(f));
        }
        return '<div class="panel-block"><h3 class="panel-title"><span class="no">' + KANJI[no++] + '</span>' + esc(b.title) + (b.small ? '<small>' + esc(b.small) + '</small>' : '') + '</h3>' +
          (b.note ? '<p class="fd-note">' + esc(b.note) + '</p>' : '') + pairs.join('') + '</div>';
      }).join('');
    }

    // ── 右の下書き ──
    function has(k) { return Object.prototype.hasOwnProperty.call(state.edits, k); }
    var current = {};
    function val(k, base) {
      if (has(k) && state.edits[k].base !== base) delete state.edits[k]; // 選び直して元の文が変わったら、書き換えを捨てる
      return has(k) ? state.edits[k].text : base;
    }
    function cell(k, base, ph) {
      current[k] = base;
      var t = val(k, base || '');
      var p = ph || '（記入）';
      return '<div class="ed' + (has(k) ? ' is-edited' : '') + '" contenteditable="true" spellcheck="false" data-key="' + esc(k) + '" data-ph="' + esc(p) + '">' +
        (t ? esc(t) : '<span class="ph">' + esc(p) + '</span>') + '</div>';
    }
    var lastDoc;
    function renderDoc() {
      current = {};
      var d = T.build(state.v, H);
      lastDoc = d;
      var html = '<div class="doc-head"><div class="meta">' + esc(d.left || '').replace(/\n/g, '<br>') + '</div><div class="title">' + esc(d.title || T.title) + '</div><div class="meta">' + esc(d.right || '').replace(/\n/g, '<br>') + '</div></div>';
      d.sections.forEach(function (s, si) {
        if (s.grid) {
          var g = s.grid;
          html += (s.h ? '<p class="fd-grid-h">' + esc(s.h) + '</p>' : '') + '<table class="form form-main fd-grid' + (g.labelCol ? ' fd-labelcol' : '') + '">' +
            (g.widths ? '<colgroup>' + g.widths.map(function (w) { return '<col' + (w ? ' style="width:' + w + '"' : '') + '>'; }).join('') + '</colgroup>' : '') +
            '<thead><tr>' + g.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
            g.rows.map(function (row, ri) {
              return '<tr>' + row.map(function (c, ci) {
                if (ci === 0 && g.rowHead) return '<th>' + esc(c) + '</th>';
                return '<td>' + cell(s.key + '.' + ri + '.' + ci, c, g.ph || '　') + '</td>';
              }).join('') + '</tr>';
            }).join('') + '</tbody></table>';
          return;
        }
        html += '<table class="form form-main fd-table"><colgroup><col style="width:' + (s.w1 || '118px') + '"><col style="width:' + (s.w2 || '150px') + '"><col></colgroup>' +
          s.rows.map(function (r, i) {
            var k = r[1] || ('s' + si + 'r' + i);
            return '<tr>' + (i === 0 ? '<th rowspan="' + s.rows.length + '">' + esc(s.h) + '</th>' : '') +
              (r[0] ? '<th>' + esc(r[0]) + '</th><td>' : '<td colspan="2">') + cell(k, r[2], r[3]) + '</td></tr>';
          }).join('') + '</table>';
      });
      if (d.foot) html += '<p class="fd-foot">' + esc(d.foot) + '</p>';
      $('fdDoc').innerHTML = html;
      var w = T.warn ? T.warn(state.v, H) : '';
      $('fdWarn').innerHTML = w ? '<div class="redpen warn"><span class="redpen-label">赤ペン</span><p>' + esc(w) + '</p></div>' : '';
      if (T.info) $('fdInfo').innerHTML = T.info(state.v, H);
    }
    function textOf(k) { return has(k) ? state.edits[k].text : (current[k] || ''); }
    function toText() {
      var d = lastDoc;
      var out = [d.title || T.title];
      if (d.right) out.push(d.right.replace(/\n/g, '　'));
      out.push('');
      d.sections.forEach(function (s, si) {
        if (s.grid) {
          if (s.h) out.push('【' + s.h + '】');
          out.push(s.grid.head.join('\t'));
          s.grid.rows.forEach(function (row, ri) {
            out.push(row.map(function (c, ci) { return ci === 0 && s.grid.rowHead ? c : textOf(s.key + '.' + ri + '.' + ci).replace(/\n/g, ' '); }).join('\t'));
          });
          out.push('');
          return;
        }
        out.push('【' + s.h + '】');
        s.rows.forEach(function (r, i) {
          var t = textOf(r[1] || ('s' + si + 'r' + i));
          out.push((r[0] ? '＜' + r[0] + '＞\n' : '') + (t || ''));
        });
        out.push('');
      });
      if (d.foot) out.push(d.foot);
      return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
    }

    // ── 操作 ──
    var panel = $('fdPanel');
    function changed(structural) {
      persist();
      if (structural && reactive) {
        // 描き直してもフォーカスの位置を保つ
        var a = document.activeElement, box = a && a.closest ? a.closest('[data-f]') : null;
        var fid = box && box.getAttribute('data-f'), fv = a && a.getAttribute ? (a.getAttribute('data-v') || (a.type === 'checkbox' ? a.value : null)) : null;
        clean();
        renderPanel();
        if (fid) {
          var n = panel.querySelector('[data-f="' + fid + '"]');
          if (n && fv != null) n = n.querySelector('[data-v="' + fv + '"],input[value="' + fv + '"]') || n;
          if (n && n.focus) n.focus();
        }
      }
      renderDoc();
    }
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('.seg button[data-v]');
      if (!b) return;
      var id = b.parentNode.getAttribute('data-f');
      state.v[id] = b.getAttribute('data-v');
      b.parentNode.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      changed(true);
    });
    panel.addEventListener('change', function (e) {
      var box = e.target.closest('[data-f]');
      if (!box) return;
      var id = box.getAttribute('data-f');
      var f = fields.filter(function (x) { return x.id === id; })[0];
      // 文字・日付の欄は input で反映済み。change（フォーカスが外れたとき）で描き直すと入力位置を見失う
      if (f.type !== 'chips' && f.type !== 'select') { state.v[id] = e.target.value; renderDoc(); persist(); return; }
      if (f.type === 'chips') {
        var list = [];
        box.querySelectorAll('input:checked').forEach(function (c) { list.push(c.value); });
        if (f.max && list.length > f.max) { e.target.checked = false; window.Otasuke.toast(f.max + 'つまで選べます'); return; }
        state.v[id] = list;
      } else state.v[id] = e.target.value;
      changed(true);
    });
    panel.addEventListener('input', function (e) {
      var el = e.target.closest('input[data-f]:not([type=checkbox]),textarea[data-f]');
      if (!el) return;
      state.v[el.getAttribute('data-f')] = el.value;
      renderDoc();
      persist();
    });
    var doc = $('fdDoc');
    doc.addEventListener('focusin', function (e) { var ed = e.target.closest('.ed'); if (ed && ed.querySelector('.ph')) ed.textContent = ''; });
    doc.addEventListener('input', function (e) {
      var ed = e.target.closest('.ed');
      if (!ed) return;
      var k = ed.getAttribute('data-key');
      state.edits[k] = { base: current[k] || '', text: ed.innerText.replace(/\n$/, '') };
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
    $('fdCopy').addEventListener('click', function () { window.Otasuke.copy(toText(), '文章をコピーしました'); });
    $('fdPrint').addEventListener('click', function () { window.print(); });
    // リセット：入力・書き換え・この端末の保存をすべて消して、最初の状態に戻す
    $('fdReset').addEventListener('click', function () {
      if (!window.confirm('入力した内容と書き換えた文章を消して、最初の状態に戻します。\nこの端末に保存していた内容も消えます。よろしいですか？')) return;
      clearTimeout(saveTimer); saveTimer = null;
      if (canSave) D.clear(draftId);
      setDefaults();
      clean();
      state.edits = {};
      if (location.search && window.history && history.replaceState) history.replaceState(null, '', location.pathname + location.hash);
      fromUrl = false; restored = null;
      renderPanel();
      renderDoc();
      showSaveNote();
      window.Otasuke.toast('入力を消して、最初の状態に戻しました');
    });
    $('fdShare').addEventListener('click', function () {
      var q = new URLSearchParams();
      fields.forEach(function (f) {
        if (['seg', 'select', 'chips'].indexOf(f.type) === -1) return;
        var v = state.v[f.id];
        if (f.type === 'chips') { if (v.length) q.set(f.id, v.join(',')); } else q.set(f.id, v);
      });
      var url = location.origin + location.pathname + '?' + q.toString();
      window.Otasuke.copy(url, '選んだ項目のリンクをコピーしました（入力した文章は含まれません）');
    });
    $('fdAi').addEventListener('click', function () {
      window.Otasuke.copyAiPrompt({ role: T.ai.role, doc: T.ai.doc || T.title, rules: T.ai.rules, draft: toText() });
    });

    // 保存の案内（保存できない環境では出さない）
    function showSaveNote() {
      var el = $('fdSave');
      if (!el) return;
      if (!canSave) { el.hidden = true; return; }
      var html = '<b>自動保存</b>：この端末にだけ保存しています（' + D.days + '日で自動的に消えます）。共有の端末では「リセット」で消してください。';
      if (fromUrl && saved) html += '<br>共有リンクの内容を表示しています（この端末に保存していた入力より優先）。ここで入力すると、保存していた入力は置きかわります。<a href="' + esc(location.pathname) + '">保存していた入力にもどす</a>';
      el.innerHTML = html;
      el.hidden = false;
    }

    renderPanel();
    renderDoc();
    showSaveNote();
    if (restored) {
      var dt = new Date(restored);
      window.Otasuke.toast('前回の入力（' + (dt.getMonth() + 1) + '月' + dt.getDate() + '日 ' + dt.getHours() + ':' + String(dt.getMinutes()).padStart(2, '0') + '）を復元しました');
    }
  }

  window.Formdoc = { run: run, H: H };
})();
