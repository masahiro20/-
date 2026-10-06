// 全ページ共通：URLのコピー、通知、AIに頼む文章（プロンプト）のコピー。
(function () {
  'use strict';
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* 何もしない */ }
    document.body.removeChild(ta);
  }
  function copyText(text) {
    return new Promise(function (resolve) {
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(resolve, function () { fallbackCopy(text); resolve(); });
      else { fallbackCopy(text); resolve(); }
    });
  }
  var timer;
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('p');
      el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg; el.classList.add('show');
    clearTimeout(timer); timer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  // AIに頼む文章。下書きと、書き方の条件をまとめる
  function buildPrompt(opts) {
    var lines = [
      'あなたは' + opts.role + 'の書類づくりを手伝うアシスタントです。',
      '以下は「' + opts.doc + '」の下書きです。次の条件で文章を整えてください。',
      '',
      '【条件】',
      '・書かれている事実を変えない。書かれていないことを付け足さない。',
      '・情報が足りないところは、推測で埋めずに【要確認：〇〇】と書く。',
    ];
    (opts.rules || []).forEach(function (r) { lines.push('・' + r); });
    lines.push('・個人名・住所など、個人が特定できる情報は書かない。', '・項目の見出しと順番はそのまま残す。', '', '【下書き】', opts.draft);
    return lines.join('\n');
  }

  var dialog;
  function showAiDialog() {
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'ai-dialog';
      dialog.innerHTML =
        '<h3>AIに頼む文章をコピーしました</h3>' +
        '<ol><li>下のどれかのAIを開きます。</li><li>入力欄に貼り付けて送信します。</li><li>整った文章を確認して、事業所の様式に貼り付けます。</li></ol>' +
        '<p class="ai-links"><a href="https://chatgpt.com/" target="_blank" rel="noopener">ChatGPT</a><a href="https://claude.ai/" target="_blank" rel="noopener">Claude</a><a href="https://gemini.google.com/" target="_blank" rel="noopener">Gemini</a></p>' +
        '<p class="ai-warn">貼り付ける前に、<b>氏名・住所・病名など個人が特定できる情報が入っていないか</b>確認してください。AIの文章は必ず人が確認してから使ってください。</p>' +
        '<p style="text-align:right;margin:0"><button type="button" class="btn btn-sm">閉じる</button></p>';
      dialog.querySelector('button').addEventListener('click', function () { dialog.close(); });
      dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
      document.body.appendChild(dialog);
    }
    if (dialog.showModal) dialog.showModal(); else toast('AIに頼む文章をコピーしました');
  }

  // ── 端末の中だけの保存（localStorage）。サーバーには送らない ──
  // プライベートモードなどで使えないときは、保存しないだけで、ほかの動きは変えない。
  var store = {
    get: function (k) { try { var s = window.localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { window.localStorage.removeItem(k); } catch (e) { /* 何もしない */ } },
    ok: function () {
      try { var k = 'otasuke:test'; window.localStorage.setItem(k, '1'); window.localStorage.removeItem(k); return true; } catch (e) { return false; }
    },
  };

  // 入力途中の下書き。キーは otasuke:draft:<ツール>、中身は { t: 保存した時刻, d: 入力内容 }。
  // 個人名が入ることがあるので、最後の保存から7日たったものは自動的に消す（どのページを開いたときも掃除する）。
  var DRAFT_PREFIX = 'otasuke:draft:';
  var DRAFT_DAYS = 7;
  var DRAFT_MS = DRAFT_DAYS * 24 * 60 * 60 * 1000;
  function draftExpired(o) { return !o || typeof o.t !== 'number' || Date.now() - o.t > DRAFT_MS || o.t > Date.now() + 60000; }
  var draft = {
    days: DRAFT_DAYS,
    load: function (id) {
      var o = store.get(DRAFT_PREFIX + id);
      if (!o) return null;
      if (draftExpired(o)) { store.del(DRAFT_PREFIX + id); return null; }
      return o;
    },
    save: function (id, data) { return store.set(DRAFT_PREFIX + id, { t: Date.now(), d: data }); },
    clear: function (id) { store.del(DRAFT_PREFIX + id); },
    available: store.ok,
  };
  (function sweep() {
    try {
      var ls = window.localStorage, old = [];
      for (var i = 0; i < ls.length; i++) {
        var k = ls.key(i);
        if (k && k.indexOf(DRAFT_PREFIX) === 0) {
          var o = null;
          try { o = JSON.parse(ls.getItem(k)); } catch (e) { o = null; }
          if (draftExpired(o)) old.push(k);
        }
      }
      old.forEach(function (k) { ls.removeItem(k); });
    } catch (e) { /* 使えない環境では何もしない */ }
  })();

  window.Otasuke = {
    copy: function (text, msg) { return copyText(text).then(function () { if (msg) toast(msg); }); },
    toast: toast,
    copyAiPrompt: function (opts) { return copyText(buildPrompt(opts)).then(showAiDialog); },
    store: store,
    draft: draft,
  };

  // ── 最近使ったツール（キー otasuke:recent。[{ p: パス, n: 名前, t: 時刻 }]、新しい順に最大6件） ──
  var RECENT_KEY = 'otasuke:recent';
  var RECENT_MAX = 6;
  function recentList() {
    var a = store.get(RECENT_KEY);
    return Array.isArray(a) ? a.filter(function (x) { return x && typeof x.p === 'string' && typeof x.n === 'string' && /^[a-z0-9\-\/]+\.html$/.test(x.p); }) : [];
  }
  var toolHere = document.body && document.body.getAttribute('data-tool');
  if (toolHere) {
    var list = recentList().filter(function (x) { return x.p !== toolHere; });
    list.unshift({ p: toolHere, n: document.body.getAttribute('data-tool-name') || toolHere, t: Date.now() });
    store.set(RECENT_KEY, list.slice(0, RECENT_MAX));
  }

  // 共有ボタンは、表示しているページのURLとタイトルで作り直す（設定のドメインが未確定でも、仮のURLでも正しく共有できる）
  if (/^https?:$/.test(location.protocol)) {
    var here = location.origin + location.pathname.replace(/index\.html$/, '');
    var u = encodeURIComponent(here), t = encodeURIComponent(document.title);
    document.querySelectorAll('.share-line').forEach(function (a) { a.href = 'https://social-plugins.line.me/lineit/share?url=' + u; });
    document.querySelectorAll('.share-x').forEach(function (a) { a.href = 'https://twitter.com/intent/tweet?url=' + u + '&text=' + t; });
    document.querySelectorAll('.share [data-copy-url]').forEach(function (b) { b.setAttribute('data-copy-url', here); });
  }

  var escHtml = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  var SECTOR_NAMES = { jido: '児童支援', shogai: '障害福祉', kaigo: '介護' };

  // トップの「最近使ったツール」。記録がなければ何も出さない
  function initRecent(tools) {
    var box = document.getElementById('recentTools');
    if (!box) return;
    var byP = {};
    (tools || []).forEach(function (t) { byP[t.p] = t; });
    // なくなったツールは出さない。名前は今の一覧のものを使う
    var items = recentList().filter(function (x) { return !tools || byP[x.p]; });
    if (!items.length) { box.hidden = true; return; }
    box.querySelector('.recent-list').innerHTML = items.map(function (x) {
      return '<li><a href="' + escHtml(x.p) + '">' + escHtml(byP[x.p] ? byP[x.p].n : x.n) + '</a></li>';
    }).join('');
    box.hidden = false;
    box.querySelector('.recent-clear').onclick = function () {
      store.del(RECENT_KEY);
      box.hidden = true;
      toast('最近使ったツールの履歴を消しました');
    };
  }

  // ── ツール検索（書類の名前で探す）。一覧は assets/tools-data.js（build 時に作る） ──
  // 文字のそろえ方は scripts/tool-search.mjs の normalize と同じにする
  function normalize(s) {
    s = String(s || '');
    if (s.normalize) s = s.normalize('NFKC');
    return s.toLowerCase()
      .replace(/[\u30a1-\u30f6]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0x60); })
      .replace(/[\s・、。，．,.「」『』（）()［］[\]【】〈〉/／!?！？~〜\-_:：;；'"]+/g, '')
      .replace(/の/g, '');
  }
  function termsOf(q) { return String(q || '').split(/[\s\u3000]+/).map(normalize).filter(Boolean); }
  // 2：名前・別名で一致、1：説明文で一致、0：一致しない
  function score(t, terms) {
    if (!terms.length) return 0;
    if (terms.every(function (w) { return t.k.indexOf(w) !== -1; })) return 2;
    if (terms.every(function (w) { return t.k.indexOf(w) !== -1 || t.kd.indexOf(w) !== -1; })) return 1;
    return 0;
  }
  function itemHtml(t) {
    return '<a class="ts-item" href="' + escHtml(t.p) + '"><b>' + escHtml(t.n) + '</b><span class="ts-desc">' + escHtml(t.d) + '</span>' +
      '<span class="ts-sec">' + t.s.map(function (x) { return '<span class="pill pill-sector pill-' + x + '">' + SECTOR_NAMES[x] + '</span>'; }).join('') + '</span></a>';
  }
  function noneHtml(q) {
    return '<div class="ts-none"><p><b>「' + escHtml(q) + '」に合うツールは、まだありません。</b></p>' +
      '<p>短い言葉（例：「記録」「計画」「報告」）や、ひらがなでも探せます。ほしい書類は、意見箱で教えてください。現場の声で、ツールを増やしています。</p>' +
      '<a class="btn btn-warm btn-sm" href="iken.html?doc=' + encodeURIComponent(q.slice(0, 60)) + '">意見箱でリクエストする</a></div>';
  }
  function initSearch(tools) {
    var root = document.querySelector('.tool-search');
    if (!root || !tools || !tools.length) return;
    var hub = root.getAttribute('data-search') === 'hub';
    var input = root.querySelector('input');
    var clearBtn = root.querySelector('.tool-search-clear');
    var count = root.querySelector('.tool-search-count');
    var results = root.querySelector('.tool-search-results');
    var byP = {};
    tools.forEach(function (t) { byP[t.p] = t; });
    var cards = hub ? Array.prototype.slice.call(document.querySelectorAll('.tool-grid .tool-card')) : [];
    var inGrid = {};
    cards.forEach(function (c) { inGrid[c.getAttribute('href')] = true; });
    // 業種ページでは、ほかの業種の結果・0件の案内を、カードの一覧の下に出す
    var grid = hub && document.querySelector('.tool-grid');
    if (grid) { results.classList.add('ts-after-grid'); grid.parentNode.insertBefore(results, grid.nextSibling); }
    root.hidden = false;

    function ranked(list, terms) {
      return list.map(function (t, i) { return { t: t, s: score(t, terms), i: i }; })
        .filter(function (x) { return x.s; })
        .sort(function (a, b) { return b.s - a.s || a.i - b.i; })
        .map(function (x) { return x.t; });
    }
    function run() {
      var q = input.value.trim();
      var terms = termsOf(q);
      clearBtn.hidden = !input.value;
      if (!terms.length) {
        cards.forEach(function (c) { c.hidden = false; c.style.order = ''; });
        count.textContent = '';
        results.innerHTML = '';
        return;
      }
      if (hub) {
        var n = 0;
        cards.forEach(function (c) {
          var t = byP[c.getAttribute('href')];
          var sc = t ? score(t, terms) : (terms.every(function (w) { return normalize(c.textContent).indexOf(w) !== -1; }) ? 1 : 0);
          c.hidden = !sc;
          c.style.order = sc === 2 ? '0' : '1'; // 名前で一致したものを先に
          if (sc) n++;
        });
        var others = ranked(tools.filter(function (t) { return !inGrid[t.p]; }), terms);
        count.textContent = n ? n + '件見つかりました' : (others.length ? 'この業種のツールには見つかりませんでした' : '見つかりませんでした');
        results.innerHTML = (others.length ? '<p class="ts-sub">ほかの業種のツール</p><div class="ts-list">' + others.map(itemHtml).join('') + '</div>' : '') +
          (!n && !others.length ? noneHtml(q) : '');
        return;
      }
      var hits = ranked(tools, terms);
      count.textContent = hits.length ? hits.length + '件見つかりました' : '見つかりませんでした';
      results.innerHTML = hits.length ? '<div class="ts-list">' + hits.map(itemHtml).join('') + '</div>' : noneHtml(q);
    }
    input.addEventListener('input', run);
    input.addEventListener('keydown', function (e) {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); } // スマホのキーボードを閉じて、結果を見やすくする
      if (e.key === 'Escape') { input.value = ''; run(); }
    });
    clearBtn.addEventListener('click', function () { input.value = ''; run(); input.focus(); });
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-q]');
      if (!b) return;
      input.value = b.getAttribute('data-q');
      run();
    });
    // ?q=事故 で開いたとき・戻るボタンで入力が残っているとき
    var q0 = new URLSearchParams(location.search).get('q');
    if (q0) input.value = q0.slice(0, 60);
    if (input.value) run();
    window.addEventListener('pageshow', function () { if (input.value) run(); });
  }

  function initPortal() {
    var tools = window.OTASUKE_TOOLS;
    initRecent(tools);
    initSearch(tools);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPortal);
  else initPortal();

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy-url]');
    if (!b) return;
    copyText(b.getAttribute('data-copy-url')).then(function () { toast('URLをコピーしました。LINEやメールで送れます'); });
  });
})();
