/* 依存ライブラリなしの簡易 SVG チャート */
(function (root) {
  'use strict';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function niceTicks(min, max, count) {
    if (max === min) { max = min + 1; }
    const span = max - min;
    const step0 = span / Math.max(1, count);
    const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= step0) || 10 * mag;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = lo; v <= hi + step * 1e-6; v += step) ticks.push(+v.toFixed(10));
    return { lo, hi, ticks };
  }

  function legend(items, x, y) {
    let out = '', cx = x;
    for (const it of items) {
      out += `<g transform="translate(${cx},${y})">` +
        (it.type === 'line'
          ? `<line x1="0" y1="6" x2="16" y2="6" stroke="${it.color}" stroke-width="2.5" ${it.dash ? 'stroke-dasharray="4 3"' : ''}/>`
          : `<rect x="0" y="0" width="12" height="12" rx="2" fill="${it.color}" ${it.opacity ? `fill-opacity="${it.opacity}"` : ''}/>`) +
        `<text x="${it.type === 'line' ? 21 : 17}" y="10.5" class="lg">${esc(it.name)}</text></g>`;
      cx += (it.type === 'line' ? 26 : 22) + it.name.length * 11.5 + 14;
    }
    return out;
  }

  /**
   * 折れ線 / 面グラフ（左右2軸、縦線マーカー対応）
   * cfg: { x[], series[{name,values,color,axis,type:'line'|'area',dash}], markers[{x,label,color}], fmtX, fmtY, fmtY2, yLabel, y2Label }
   */
  function line(cfg) {
    const W = cfg.width || 760, H = cfg.height || 300;
    const pad = { l: 62, r: cfg.series.some((s) => s.axis === 'right') ? 62 : 18, t: 34, b: 40 };
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const xs = cfg.x;
    const xmin = cfg.xMin != null ? cfg.xMin : Math.min(...xs), xmax = cfg.xMax != null ? cfg.xMax : Math.max(...xs);
    const X = (v) => pad.l + (xmax === xmin ? iw / 2 : (v - xmin) / (xmax - xmin) * iw);
    const axisRange = (axis) => {
      const vals = cfg.series.filter((s) => (s.axis || 'left') === axis).flatMap((s) => s.values).filter((v) => v != null && isFinite(v));
      if (!vals.length) return null;
      let mn = Math.min(0, ...vals), mx = Math.max(...vals);
      if (axis === 'left' && cfg.yMin != null) mn = cfg.yMin;
      if (axis === 'right' && cfg.y2Max != null) mx = cfg.y2Max;
      return niceTicks(mn, mx, 5);
    };
    const L = axisRange('left'), R = axisRange('right');
    // 右軸の0を左軸の0にそろえる（左軸に負の値がある場合）
    if (L && R && L.lo < 0 && R.lo >= 0) {
      R.lo = L.lo / L.hi * R.hi;
      R.ticks = R.ticks.filter((t) => t >= 0);
    }
    const Y = (v, ax) => { const t = ax === 'right' ? R : L; return pad.t + ih - (v - t.lo) / (t.hi - t.lo) * ih; };
    let g = '';
    // grid
    if (L) for (const t of L.ticks) {
      g += `<line x1="${pad.l}" x2="${pad.l + iw}" y1="${Y(t)}" y2="${Y(t)}" class="${t === 0 ? 'zero' : 'grid'}"/>`;
      g += `<text x="${pad.l - 8}" y="${Y(t) + 4}" class="ax" text-anchor="end">${esc((cfg.fmtY || String)(t))}</text>`;
    }
    if (R) for (const t of R.ticks) g += `<text x="${pad.l + iw + 8}" y="${Y(t, 'right') + 4}" class="ax">${esc((cfg.fmtY2 || String)(t))}</text>`;
    // x ticks
    const xt = cfg.xTicks || niceTicks(xmin, xmax, Math.min(10, Math.max(2, Math.round(iw / 70)))).ticks.filter((v) => v >= xmin && v <= xmax);
    for (const t of xt) g += `<text x="${X(t)}" y="${pad.t + ih + 18}" class="ax" text-anchor="middle">${esc((cfg.fmtX || String)(t))}</text>`;
    if (cfg.xLabel) g += `<text x="${pad.l + iw}" y="${H - 4}" class="ax" text-anchor="end">${esc(cfg.xLabel)}</text>`;
    if (cfg.yLabel) g += `<text x="4" y="${pad.t - 10}" class="ax">${esc(cfg.yLabel)}</text>`;
    if (cfg.y2Label) g += `<text x="${pad.l + iw + 8}" y="${pad.t - 10}" class="ax">${esc(cfg.y2Label)}</text>`;
    // markers
    for (const mk of cfg.markers || []) {
      const x = X(mk.x);
      g += `<line x1="${x}" x2="${x}" y1="${pad.t}" y2="${pad.t + ih}" stroke="${mk.color}" stroke-width="${mk.width || 1.5}" stroke-dasharray="${mk.dash || '5 4'}"/>`;
      const right = x > pad.l + iw * 0.7;
      if (mk.label) g += `<text x="${right ? x - 5 : x + 5}" y="${pad.t + 12 + (mk.row || 0) * 14}" class="mk" fill="${mk.color}" text-anchor="${right ? 'end' : 'start'}">${esc(mk.label)}</text>`;
    }
    // series
    for (const s of cfg.series) {
      const ax = s.axis || 'left';
      const pts = s.values.map((v, i) => (v == null ? null : [X(xs[i]), Y(v, ax)])).filter(Boolean);
      if (!pts.length) continue;
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
      if (s.type === 'area') {
        const base = Y(Math.max(0, (ax === 'right' ? R : L).lo), ax);
        g += `<path d="${d}L${pts[pts.length - 1][0].toFixed(1)} ${base}L${pts[0][0].toFixed(1)} ${base}Z" fill="${s.color}" fill-opacity="${s.opacity || 0.25}" stroke="none"/>`;
        g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="1.5"/>`;
      } else {
        g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width || 2.5}" ${s.dash ? 'stroke-dasharray="5 4"' : ''} stroke-linejoin="round" stroke-linecap="round"/>`;
      }
      if (s.highlight != null) {
        const p = [X(xs[s.highlight]), Y(s.values[s.highlight], ax)];
        g += `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="${s.color}" stroke="#fff" stroke-width="2"/>`;
      }
    }
    const lg = legend(cfg.series.map((s) => ({ name: s.name, color: s.color, type: s.type === 'area' ? 'box' : 'line', dash: s.dash, opacity: s.type === 'area' ? 0.5 : 1 })), pad.l, 6);
    return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">${lg}${g}</svg>`;
  }

  /** 棒グラフ（グループ / 積み上げ） */
  function bars(cfg) {
    const W = cfg.width || 760, H = cfg.height || 280;
    const pad = { l: 62, r: 18, t: 34, b: 36 };
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const cats = cfg.categories, n = cats.length;
    const stacked = !!cfg.stacked;
    const lines = cfg.lines || [];
    let maxV = 0;
    cats.forEach((_, i) => {
      if (stacked) maxV = Math.max(maxV, cfg.series.reduce((s, se) => s + (se.values[i] || 0), 0));
      else cfg.series.forEach((se) => (maxV = Math.max(maxV, se.values[i] || 0)));
      lines.forEach((ln) => (maxV = Math.max(maxV, ln.values[i] || 0)));
    });
    const T = niceTicks(0, maxV, 5);
    const Y = (v) => pad.t + ih - v / T.hi * ih;
    const bw = iw / n;
    let g = '';
    for (const t of T.ticks) {
      g += `<line x1="${pad.l}" x2="${pad.l + iw}" y1="${Y(t)}" y2="${Y(t)}" class="${t === 0 ? 'zero' : 'grid'}"/>`;
      g += `<text x="${pad.l - 8}" y="${Y(t) + 4}" class="ax" text-anchor="end">${esc((cfg.fmtY || String)(t))}</text>`;
    }
    cats.forEach((c, i) => {
      const x0 = pad.l + i * bw;
      g += `<text x="${x0 + bw / 2}" y="${pad.t + ih + 18}" class="ax" text-anchor="middle">${esc(c)}</text>`;
      if (stacked) {
        let acc = 0;
        cfg.series.forEach((se) => {
          const v = se.values[i] || 0;
          g += `<rect x="${x0 + bw * 0.18}" y="${Y(acc + v)}" width="${bw * 0.64}" height="${Math.max(0, Y(acc) - Y(acc + v))}" fill="${se.color}"><title>${esc(se.name)}: ${esc((cfg.fmtTip || cfg.fmtY || String)(v))}</title></rect>`;
          acc += v;
        });
      } else {
        const k = cfg.series.length, gw = bw * 0.72, w = gw / k;
        cfg.series.forEach((se, j) => {
          const v = se.values[i] || 0;
          g += `<rect x="${x0 + (bw - gw) / 2 + j * w + 1}" y="${Y(v)}" width="${Math.max(1, w - 2)}" height="${Y(0) - Y(v)}" rx="2" fill="${se.color}"><title>${esc(se.name)}: ${esc((cfg.fmtTip || cfg.fmtY || String)(v))}</title></rect>`;
        });
      }
    });
    for (const ln of lines) {
      const d = ln.values.map((v, i) => (i ? 'L' : 'M') + (pad.l + (i + 0.5) * bw).toFixed(1) + ' ' + Y(v).toFixed(1)).join('');
      g += `<path d="${d}" fill="none" stroke="${ln.color}" stroke-width="2.5"/>`;
      ln.values.forEach((v, i) => (g += `<circle cx="${pad.l + (i + 0.5) * bw}" cy="${Y(v)}" r="3.5" fill="${ln.color}"/>`));
    }
    const lg = legend(cfg.series.map((s) => ({ name: s.name, color: s.color })).concat(lines.map((l) => ({ name: l.name, color: l.color, type: 'line' }))), pad.l, 6);
    const yl = cfg.yLabel ? `<text x="4" y="${pad.t - 10}" class="ax">${esc(cfg.yLabel)}</text>` : '';
    return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">${lg}${yl}${g}</svg>`;
  }

  /** 横棒（内訳） */
  function hbars(items, fmt) {
    const total = items.reduce((s, i) => s + i.value, 0) || 1;
    const max = Math.max(...items.map((i) => i.value), 1);
    return '<div class="hbars">' + items.map((it) =>
      `<div class="hb-row"><div class="hb-label">${esc(it.label)}</div>` +
      `<div class="hb-track"><div class="hb-fill" style="width:${(it.value / max * 100).toFixed(1)}%;background:${it.color}"></div></div>` +
      `<div class="hb-val">${esc(fmt(it.value))}<span>${(it.value / total * 100).toFixed(0)}%</span></div></div>`).join('') + '</div>';
  }

  root.Charts = { line, bars, hbars, niceTicks };
})(typeof window !== 'undefined' ? window : globalThis);
