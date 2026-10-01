/*
 * 依存ライブラリなしの SVG チャート
 * 方針：1軸のみ／2px の線・10%の面／4px 角丸の棒（24px以下）／ヘアラインの罫線／
 *       凡例は2系列以上で必ず表示／ホバーで数値（data-tip）
 */
(function (root) {
  'use strict';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let uid = 0;

  function niceTicks(min, max, count) {
    if (max === min) max = min + 1;
    const step0 = (max - min) / Math.max(1, count);
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= step0) || 10 * mag;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = lo; v <= hi + step * 1e-6; v += step) ticks.push(+v.toFixed(10));
    return { lo, hi, ticks };
  }

  function legendHtml(items) {
    if (items.length < 2) return '';
    return '<div class="cv-legend">' + items.map((it) =>
      `<span class="cv-key"><i class="${it.kind || 'sw'}" style="--c:${it.color}"></i>${esc(it.name)}</span>`).join('') + '</div>';
  }

  /**
   * 折れ線／面（1軸）
   * cfg: { x[], series[{name,values,color,area,dash,end}], markers[{x,label,strong}], fmtX, fmtY, fmtTip, yUnit, height, width, yMin, yMax }
   */
  function line(cfg) {
    const W = cfg.width || 720, H = cfg.height || 260;
    const pad = { l: 46, r: 16, t: cfg.markers && cfg.markers.length ? 26 : 12, b: 26 };
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const xs = cfg.x;
    const xmin = cfg.xMin != null ? cfg.xMin : Math.min(...xs), xmax = cfg.xMax != null ? cfg.xMax : Math.max(...xs);
    const X = (v) => pad.l + (xmax === xmin ? iw / 2 : (v - xmin) / (xmax - xmin) * iw);
    const vals = cfg.series.flatMap((s) => s.values).filter((v) => v != null && isFinite(v));
    const T = niceTicks(cfg.yMin != null ? cfg.yMin : Math.min(0, ...vals), cfg.yMax != null ? cfg.yMax : Math.max(...vals), cfg.yTicks || 4);
    const Y = (v) => pad.t + ih - (v - T.lo) / (T.hi - T.lo) * ih;
    const fmtY = cfg.fmtY || String, fmtX = cfg.fmtX || String;
    const id = 'cv' + (++uid);
    let g = '';
    for (const t of T.ticks) {
      g += `<line x1="${pad.l}" x2="${pad.l + iw}" y1="${Y(t)}" y2="${Y(t)}" class="${t === 0 ? 'cv-base' : 'cv-grid'}"/>`;
      g += `<text x="${pad.l - 8}" y="${Y(t) + 3.5}" class="cv-tick" text-anchor="end">${esc(fmtY(t))}</text>`;
    }
    if (cfg.yUnit) g += `<text x="${pad.l - 8}" y="${pad.t - (cfg.markers && cfg.markers.length ? 14 : 2)}" class="cv-unit" text-anchor="end">${esc(cfg.yUnit)}</text>`;
    const xt = cfg.xTicks || niceTicks(xmin, xmax, Math.max(2, Math.round(iw / 80))).ticks.filter((v) => v >= xmin && v <= xmax);
    for (const t of xt) g += `<text x="${X(t)}" y="${H - 8}" class="cv-tick" text-anchor="middle">${esc(fmtX(t))}</text>`;
    // 基準線（縦）
    (cfg.markers || []).forEach((mk) => {
      const x = X(mk.x);
      g += `<line x1="${x}" x2="${x}" y1="${pad.t - 4}" y2="${pad.t + ih}" class="${mk.strong ? 'cv-mark-strong' : 'cv-mark'}"/>`;
      if (mk.label) {
        const right = x > pad.l + iw * 0.78, left = x < pad.l + iw * 0.12;
        g += `<text x="${right ? x - 4 : left ? x + 4 : x}" y="${pad.t - 10 - (mk.row || 0) * 0}" class="${mk.strong ? 'cv-mlabel-strong' : 'cv-mlabel'}" text-anchor="${right ? 'end' : left ? 'start' : 'middle'}">${esc(mk.label)}</text>`;
      }
    });
    // 系列
    const defs = [];
    cfg.series.forEach((s, si) => {
      const pts = s.values.map((v, i) => (v == null ? null : [X(xs[i]), Y(v)])).filter(Boolean);
      if (!pts.length) return;
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
      if (s.area) {
        const gid = `${id}g${si}`;
        defs.push(`<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity="${s.areaOpacity || 0.18}"/><stop offset="1" stop-color="${s.color}" stop-opacity="0.02"/></linearGradient>`);
        const base = Y(Math.max(T.lo, 0));
        g += `<path d="${d}L${pts[pts.length - 1][0].toFixed(1)} ${base}L${pts[0][0].toFixed(1)} ${base}Z" fill="url(#${gid})"/>`;
      }
      g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width || 2}" ${s.dash ? 'stroke-dasharray="4 4"' : ''} stroke-linejoin="round" stroke-linecap="round"/>`;
      if (s.dot != null && s.values[s.dot] != null) {
        g += `<circle cx="${X(xs[s.dot])}" cy="${Y(s.values[s.dot])}" r="5" fill="${s.color}" class="cv-dot"/>`;
      }
    });
    // ホバー帯
    if (cfg.fmtTip !== false) {
      const step = xs.length > 1 ? iw / (xs.length - 1) : iw;
      xs.forEach((xv, i) => {
        const tip = (cfg.fmtTip ? cfg.fmtTip(i) : `<b>${esc(fmtX(xv))}</b>` + cfg.series.map((s) => `<span><i style="--c:${s.color}"></i>${esc(s.name)}<em>${esc(fmtY(s.values[i]))}</em></span>`).join(''));
        g += `<rect class="cv-hit" x="${(X(xv) - step / 2).toFixed(1)}" y="${pad.t}" width="${step.toFixed(1)}" height="${ih}" data-tip="${esc(tip)}"/>`;
      });
    }
    const svg = `<svg viewBox="0 0 ${W} ${H}" class="cv-svg" role="img" aria-label="${esc(cfg.title || '')}"><defs>${defs.join('')}</defs>${g}</svg>`;
    return `<figure class="cv">${legendHtml(cfg.series.map((s) => ({ name: s.name, color: s.color, kind: s.area && !s.lineLegend ? 'sw' : 'ln' })))}${svg}</figure>`;
  }

  function barPath(x, y, w, h, r) {
    if (h <= 0) return '';
    r = Math.min(r, h, w / 2);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  }

  /** 縦棒（グループ）。cfg: { categories, series[{name,values,color}], fmtY, yUnit, width, height } */
  function columns(cfg) {
    const W = cfg.width || 720, H = cfg.height || 240;
    const pad = { l: 46, r: 10, t: 12, b: 26 };
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const n = cfg.categories.length, k = cfg.series.length;
    const maxV = Math.max(...cfg.series.flatMap((s) => s.values), 1);
    const T = niceTicks(0, maxV, cfg.yTicks || 4);
    const Y = (v) => pad.t + ih - v / T.hi * ih;
    const band = iw / n;
    const bw = Math.min(cfg.barMax || 14, (band * 0.7 - (k - 1) * 2) / k);
    const fmtY = cfg.fmtY || String;
    let g = '';
    for (const t of T.ticks) {
      g += `<line x1="${pad.l}" x2="${pad.l + iw}" y1="${Y(t)}" y2="${Y(t)}" class="${t === 0 ? 'cv-base' : 'cv-grid'}"/>`;
      g += `<text x="${pad.l - 8}" y="${Y(t) + 3.5}" class="cv-tick" text-anchor="end">${esc(fmtY(t))}</text>`;
    }
    if (cfg.yUnit) g += `<text x="${pad.l - 8}" y="${pad.t - 2}" class="cv-unit" text-anchor="end">${esc(cfg.yUnit)}</text>`;
    cfg.categories.forEach((c, i) => {
      const gx = pad.l + i * band + (band - (k * bw + (k - 1) * 2)) / 2;
      cfg.series.forEach((s, j) => {
        const v = s.values[i] || 0;
        g += `<path d="${barPath(gx + j * (bw + 2), Y(v), bw, Y(0) - Y(v), 3)}" fill="${s.color}"/>`;
      });
      g += `<text x="${pad.l + (i + 0.5) * band}" y="${H - 8}" class="cv-tick" text-anchor="middle">${esc(c)}</text>`;
      const tip = `<b>${esc(c)}</b>` + cfg.series.map((s) => `<span><i style="--c:${s.color}"></i>${esc(s.name)}<em>${esc((cfg.fmtTip || fmtY)(s.values[i]))}</em></span>`).join('') + (cfg.extraTip ? cfg.extraTip(i) : '');
      g += `<rect class="cv-hit" x="${pad.l + i * band}" y="${pad.t}" width="${band}" height="${ih}" data-tip="${esc(tip)}"/>`;
    });
    return `<figure class="cv">${legendHtml(cfg.series.map((s) => ({ name: s.name, color: s.color })))}<svg viewBox="0 0 ${W} ${H}" class="cv-svg" role="img">${g}</svg></figure>`;
  }

  /** 横棒リスト（内訳）。items[{label, value, note}] */
  function hbars(items, fmt, color) {
    const total = items.reduce((s, i) => s + i.value, 0) || 1;
    const max = Math.max(...items.map((i) => i.value), 1);
    return '<div class="hb">' + items.map((it) =>
      `<div class="hb-row" data-tip="${esc(`<b>${esc(it.label)}</b><span>${esc(fmt(it.value))}<em>${(it.value / total * 100).toFixed(0)}%</em></span>`)}">` +
      `<div class="hb-label">${esc(it.label)}${it.note ? `<small>${esc(it.note)}</small>` : ''}</div>` +
      `<div class="hb-track"><div class="hb-fill" style="width:${Math.max(1.5, it.value / max * 100).toFixed(1)}%;background:${it.color || color}"></div></div>` +
      `<div class="hb-val">${esc(fmt(it.value))}<span>${(it.value / total * 100).toFixed(0)}%</span></div></div>`).join('') + '</div>';
  }

  /** 100%積み上げの横帯（内訳2〜3要素）。parts[{name, value, color}] */
  function split(parts, fmt) {
    const total = parts.reduce((s, p) => s + p.value, 0) || 1;
    return `<div class="split"><div class="split-bar">${parts.map((p) =>
      `<span style="flex:${Math.max(0.0001, p.value / total)};background:${p.color}" data-tip="${esc(`<b>${esc(p.name)}</b><span>${esc(fmt(p.value))}<em>${Math.round(p.value / total * 100)}%</em></span>`)}"></span>`).join('')}</div>
      <div class="split-keys">${parts.map((p) => `<span class="cv-key"><i class="sw" style="--c:${p.color}"></i>${esc(p.name)}<b>${Math.round(p.value / total * 100)}%</b><em>${esc(fmt(p.value))}</em></span>`).join('')}</div></div>`;
  }

  /** スパークライン（単系列・強調点つき） */
  function spark(values, idx, color, w, h) {
    w = w || 240; h = h || 56;
    const mn = Math.min(...values, 0), mx = Math.max(...values, 1e-9);
    const X = (i) => 4 + i / Math.max(1, values.length - 1) * (w - 8);
    const Y = (v) => 6 + (h - 12) - (v - mn) / (mx - mn || 1) * (h - 12);
    const d = values.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join('');
    const z = Y(0);
    return `<svg viewBox="0 0 ${w} ${h}" class="spark"><line x1="4" x2="${w - 4}" y1="${z}" y2="${z}" class="cv-grid"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${idx != null ? `<circle cx="${X(idx)}" cy="${Y(values[idx])}" r="4.5" fill="${color}" class="cv-dot"/>` : ''}</svg>`;
  }

  // ---- ツールチップ（data-tip を持つ要素にホバー） ----
  if (typeof document !== 'undefined') {
    let tipEl = null;
    const ensure = () => { if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'cv-tip'; document.body.appendChild(tipEl); } return tipEl; };
    document.addEventListener('mousemove', (e) => {
      const t = e.target.closest && e.target.closest('[data-tip]');
      const el = ensure();
      if (!t) { if (el.classList.contains('on')) { el.classList.remove('on'); el.style.transform = 'translate(-9999px, -9999px)'; } return; }
      el.innerHTML = t.getAttribute('data-tip');
      el.classList.add('on');
      const r = el.getBoundingClientRect();
      let x = e.clientX + 14, y = e.clientY + 14;
      if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14;
      if (y + r.height > innerHeight - 8) y = e.clientY - r.height - 14;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  root.Charts = { line, columns, hbars, split, spark, niceTicks };
})(typeof window !== 'undefined' ? window : globalThis);
