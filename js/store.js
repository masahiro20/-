/*
 * 保存と書き出しの切り替え
 *  - claude.ai のアーティファクトとして開いたとき：お客様データはアーティファクトのデータベース（所有者のみ読み書き）
 *    PDF はページを画像化して組み立て、downloads で保存
 *  - ローカルで index.html を開いたとき：ブラウザ内（localStorage）、PDF はブラウザの印刷機能
 */
(function (root) {
  'use strict';
  const LS_CUST = 'hikari-customers', LS_SET = 'hikari-settings';
  const lsGet = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 保存できない環境 */ } };
  const clone = (v) => JSON.parse(JSON.stringify(v));

  const S = {
    mode: 'local', customers: {}, settings: { company: '', staff: '', phone: '', email: '' },
    db: null, downloads: null, onError: null,
  };

  async function useCap(name) {
    if (!root.claude || typeof root.claude.use !== 'function') return null;
    try { return await Promise.race([root.claude.use(name), new Promise((r) => setTimeout(() => r(null), 12000))]); } catch (e) { return null; }
  }

  S.ready = (async () => {
    if (!root.claude) {
      S.customers = lsGet(LS_CUST, {});
      Object.assign(S.settings, lsGet(LS_SET, {}));
      return S;
    }
    const [db, dl] = await Promise.all([useCap('db'), useCap('downloads')]);
    S.downloads = dl;
    if (db) {
      try {
        const [cs, st] = await Promise.all([db.collection('customers').get(), db.doc('settings/main').get()]);
        cs.docs.forEach((d) => { const v = d.data(); if (v && v.state) S.customers[d.id] = clone(v); });
        if (st.exists) Object.assign(S.settings, clone(st.data()));
        S.db = db; S.mode = 'db';
        return S;
      } catch (e) { console.warn('データベースに接続できませんでした', e); }
    }
    // データベースが使えない表示（サインアウト中など）はこのブラウザ内に保存
    S.customers = lsGet(LS_CUST, {});
    Object.assign(S.settings, lsGet(LS_SET, {}));
    return S;
  })();

  // ---- 書き込み（1件ずつ・入力が落ち着いてから） ----
  const timers = {}, inflight = {}, dirty = {};
  async function flush(id) {
    if (inflight[id]) { dirty[id] = true; return; }
    inflight[id] = true;
    try {
      const ref = S.db.collection('customers').doc(id);
      const rec = S.customers[id];
      if (rec) await ref.set(clone(rec)); else await ref.delete();
    } catch (e) {
      if (S.onError) S.onError(e);
    }
    inflight[id] = false;
    if (dirty[id]) { dirty[id] = false; flush(id); }
  }
  S.save = (id, rec) => {
    S.customers[id] = rec;
    if (S.mode === 'db') { clearTimeout(timers[id]); timers[id] = setTimeout(() => flush(id), 900); }
    else lsSet(LS_CUST, S.customers);
  };
  S.saveNow = (id) => { if (S.mode === 'db') { clearTimeout(timers[id]); return flush(id); } return Promise.resolve(); };
  S.remove = (id) => {
    delete S.customers[id];
    if (S.mode === 'db') { clearTimeout(timers[id]); flush(id); } else lsSet(LS_CUST, S.customers);
  };
  S.saveSettings = async (v) => {
    S.settings = v;
    if (S.mode === 'db') { try { await S.db.doc('settings/main').set(clone(v)); } catch (e) { if (S.onError) S.onError(e); } }
    else lsSet(LS_SET, v);
  };

  // ---- ファイル書き出し ----
  /** テキスト（JSON）を保存。成功 true／ローカルでは通常のダウンロード */
  S.saveText = async (filename, text) => {
    if (S.downloads) {
      try { await S.downloads.save({ filename, data: text }); return 'saved'; } catch (e) { return e && e.code === 'declined' ? 'declined' : 'error'; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return 'saved';
  };

  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[src="${src}"]`)) return res();
      const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('ライブラリを読み込めませんでした'));
      document.head.appendChild(s);
    });
  }

  // SVG を画像化する際は外部CSSが効かないため、計算済みスタイルを一時的に属性へ写す
  const SVG_PROPS = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'font-family', 'font-size', 'font-weight', 'letter-spacing', 'opacity', 'fill-opacity', 'stroke-opacity'];
  function inlineSvg(rootEl) {
    const undo = [];
    rootEl.querySelectorAll('svg').forEach((svg) => {
      const r = svg.getBoundingClientRect();
      undo.push([svg, svg.getAttribute('width'), svg.getAttribute('height'), svg.getAttribute('style')]);
      svg.setAttribute('width', r.width); svg.setAttribute('height', r.height);
      svg.querySelectorAll('[class]').forEach((el) => {
        const cs = getComputedStyle(el);
        undo.push([el, null, null, el.getAttribute('style')]);
        el.setAttribute('style', (el.getAttribute('style') || '') + ';' + SVG_PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';'));
      });
    });
    return () => undo.forEach(([el, w, h, st]) => {
      if (w !== null || h !== null || el.tagName.toLowerCase() === 'svg') {
        if (w == null) el.removeAttribute('width'); else el.setAttribute('width', w);
        if (h == null) el.removeAttribute('height'); else el.setAttribute('height', h);
      }
      if (st == null) el.removeAttribute('style'); else el.setAttribute('style', st);
    });
  }

  /** 提案書を PDF にして保存（アーティファクト内）。返り値: 'saved' | 'declined' | 'print'（印刷機能を使う） */
  S.savePdf = async (pagesEl, filename, onProgress) => {
    if (!S.downloads) return 'print';
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    if (document.fonts) await document.fonts.ready;
    pagesEl.classList.add('capturing');
    const undo = inlineSvg(pagesEl);
    try {
      const pages = Array.from(pagesEl.querySelectorAll('.page'));
      const pdf = new root.jspdf.jsPDF({ unit: 'mm', format: 'a4', compress: true });
      for (let i = 0; i < pages.length; i++) {
        if (onProgress) onProgress(i + 1, pages.length);
        const canvas = await root.html2canvas(pages[i], { scale: 2, useCORS: true, logging: false, backgroundColor: null, windowWidth: 1200 });
        if (i) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }
      const blob = pdf.output('blob');
      await S.downloads.save({ filename, data: blob });
      return 'saved';
    } catch (e) {
      if (e && e.code === 'declined') return 'declined';
      throw e;
    } finally {
      undo();
      pagesEl.classList.remove('capturing');
    }
  };

  root.HikariStore = S;
})(typeof window !== 'undefined' ? window : globalThis);
