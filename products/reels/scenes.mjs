// 「現場の1日」リールの場面イラスト（SVGで手描き。写真を使わないので権利の心配がない）。
// 各場面は 360×300 の絵。stage.html の #scene に、時刻・見出しと一緒に表示する。
const C = { ink: '#173f33', forest: '#1f5c4a', apricot: '#f5a25a', apricotSoft: '#ffe2c2', cream: '#fdf6ea', paper: '#ffffff', wood: '#c98b5a', woodDark: '#a8703f', sky: '#2a7fb8', leaf: '#3d8c4b', kaki: '#cf6526', pink: '#f2a7b5', yellow: '#f6cf5a', line: '#d9cdb8' };

function clock(cx, cy, r, h, m) {
  const ha = ((h % 12) + m / 60) * 30 - 90, ma = m * 6 - 90;
  const hand = (a, len, w) => `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos((a * Math.PI) / 180) * len}" y2="${cy + Math.sin((a * Math.PI) / 180) * len}" stroke="${C.ink}" stroke-width="${w}" stroke-linecap="round"/>`;
  let ticks = '';
  for (let i = 0; i < 12; i++) {
    const a = (i * 30 * Math.PI) / 180;
    ticks += `<line x1="${cx + Math.cos(a) * (r - 6)}" y1="${cy + Math.sin(a) * (r - 6)}" x2="${cx + Math.cos(a) * (r - (i % 3 ? 10 : 14))}" y2="${cy + Math.sin(a) * (r - (i % 3 ? 10 : 14))}" stroke="${C.ink}" stroke-width="${i % 3 ? 2 : 3.5}" stroke-linecap="round"/>`;
  }
  return `<circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="${C.forest}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.paper}"/>${ticks}${hand(ha, r * 0.5, 6)}${hand(ma, r * 0.75, 4)}<circle cx="${cx}" cy="${cy}" r="5" fill="${C.kaki}"/>`;
}

function windowSunset(x, y, w, h) {
  return `<defs><linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7b267"/><stop offset=".65" stop-color="#f4845f"/><stop offset="1" stop-color="#f27059"/></linearGradient></defs>
  <rect x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 12}" rx="6" fill="${C.paper}"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#dusk)"/>
  <circle cx="${x + w * 0.62}" cy="${y + h * 0.72}" r="${h * 0.2}" fill="#fff3d6" opacity=".9"/>
  <path d="M${x} ${y + h * 0.82} q ${w * 0.25} -${h * 0.12} ${w * 0.5} 0 t ${w * 0.5} 0 V ${y + h} H ${x} Z" fill="#b5584a" opacity=".55"/>
  <rect x="${x + w / 2 - 3}" y="${y}" width="6" height="${h}" fill="${C.paper}"/><rect x="${x}" y="${y + h / 2 - 3}" width="${w}" height="6" fill="${C.paper}"/>`;
}

function desk(y) {
  return `<rect x="10" y="${y}" width="340" height="16" rx="4" fill="${C.wood}"/><rect x="30" y="${y + 16}" width="12" height="60" fill="${C.woodDark}"/><rect x="318" y="${y + 16}" width="12" height="60" fill="${C.woodDark}"/>`;
}

function paperStack(x, y, n, tilt = 0) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const dx = (i % 2 ? 4 : -3) + tilt * i, dy = -i * 7;
    s += `<g transform="translate(${x + dx} ${y + dy}) rotate(${(i % 3) - 1})"><rect width="92" height="12" rx="2" fill="${C.paper}" stroke="${C.line}" stroke-width="1.5"/></g>`;
  }
  // 一番上の紙に「記録」
  return s + `<g transform="translate(${x + tilt * n} ${y - n * 7 - 50})"><rect width="92" height="62" rx="3" fill="${C.paper}" stroke="${C.line}" stroke-width="1.5"/><text x="10" y="20" font-size="13" font-weight="900" fill="${C.ink}" font-family="Zen Kaku Gothic New">記録</text><line x1="10" y1="32" x2="80" y2="32" stroke="${C.line}" stroke-width="3"/><line x1="10" y1="42" x2="72" y2="42" stroke="${C.line}" stroke-width="3"/><line x1="10" y1="52" x2="60" y2="52" stroke="${C.line}" stroke-width="3"/></g>`;
}

function mug(x, y) {
  return `<path d="M${x} ${y} h32 v26 a10 10 0 0 1 -10 10 h-12 a10 10 0 0 1 -10 -10 Z" fill="${C.sky}"/><path d="M${x + 32} ${y + 6} a8 8 0 0 1 0 16" fill="none" stroke="${C.sky}" stroke-width="5"/>
  <path d="M${x + 10} ${y - 8} q -5 -8 0 -16 M${x + 21} ${y - 8} q -5 -8 0 -16" fill="none" stroke="#c9bfae" stroke-width="3" stroke-linecap="round"/>`;
}

function phone(x, y, glow) {
  return `<rect x="${x}" y="${y}" width="58" height="104" rx="10" fill="${C.ink}"/><rect x="${x + 5}" y="${y + 8}" width="48" height="86" rx="5" fill="${glow ? '#fff7ea' : '#2c4f45'}"/>
  ${glow ? `<rect x="${x + 11}" y="${y + 18}" width="36" height="6" rx="3" fill="${C.forest}"/><rect x="${x + 11}" y="${y + 30}" width="22" height="9" rx="4.5" fill="${C.apricot}"/><rect x="${x + 11}" y="${y + 44}" width="30" height="9" rx="4.5" fill="${C.apricotSoft}"/><rect x="${x + 11}" y="${y + 58}" width="36" height="3" fill="${C.line}"/><rect x="${x + 11}" y="${y + 66}" width="30" height="3" fill="${C.line}"/>` : ''}`;
}

function notebooks(x, y) {
  const cols = [C.sky, C.leaf, C.apricot, C.pink, C.yellow];
  return cols.map((c, i) => `<g transform="translate(${x + (i % 2 ? 6 : -4)} ${y - i * 20}) rotate(${(i % 3) * 2 - 2})"><rect width="128" height="22" rx="4" fill="${c}"/><rect x="0" y="0" width="12" height="22" rx="3" fill="${C.ink}" opacity=".25"/><rect x="30" y="6" width="56" height="10" rx="2" fill="${C.paper}" opacity=".9"/></g>`).join('')
    + `<text x="${x + 34}" y="${y - 82}" font-size="10" font-weight="900" fill="${C.ink}" font-family="Zen Kaku Gothic New">れんらくちょう</text>`;
}

function blocks(x, y) {
  return `<rect x="${x}" y="${y}" width="26" height="26" rx="3" fill="${C.kaki}"/><rect x="${x + 28}" y="${y}" width="26" height="26" rx="3" fill="${C.sky}"/><rect x="${x + 14}" y="${y - 26}" width="26" height="26" rx="3" fill="${C.yellow}"/><text x="${x + 21}" y="${y - 7}" font-size="15" font-weight="900" fill="${C.ink}" font-family="Zen Kaku Gothic New">あ</text>`;
}

function bubble(x, y, w, text) {
  return `<rect x="${x}" y="${y}" width="${w}" height="58" rx="16" fill="${C.paper}" stroke="${C.forest}" stroke-width="3"/><path d="M${x + 40} ${y + 56} l -10 22 l 26 -22 Z" fill="${C.paper}" stroke="${C.forest}" stroke-width="3" stroke-linejoin="round"/><rect x="${x + 30}" y="${y + 52}" width="30" height="6" fill="${C.paper}"/>
  <text x="${x + w / 2}" y="${y + 36}" text-anchor="middle" font-size="17" font-weight="900" fill="${C.ink}" font-family="Zen Kaku Gothic New">${text}</text>`;
}

function envelope(x, y) {
  return `<rect x="${x}" y="${y}" width="170" height="108" rx="6" fill="${C.paper}" stroke="${C.line}" stroke-width="2"/><path d="M${x} ${y + 4} L${x + 85} ${y + 62} L${x + 170} ${y + 4}" fill="none" stroke="${C.line}" stroke-width="3"/>
  <circle cx="${x + 138}" cy="${y + 78}" r="20" fill="none" stroke="#c2412b" stroke-width="3"/><text x="${x + 138}" y="${y + 84}" text-anchor="middle" font-size="14" font-weight="900" fill="#c2412b" font-family="Zen Kaku Gothic New">通知</text>
  <text x="${x + 16}" y="${y + 92}" font-size="12" font-weight="700" fill="${C.ink}" font-family="Zen Kaku Gothic New">運営指導について</text>`;
}

function folders(x, y) {
  return [C.forest, C.apricot, C.sky].map((c, i) => `<g transform="translate(${x + i * 14} ${y - i * 12})"><path d="M0 10 h30 l8 -10 h52 v80 h-90 Z" fill="${c}"/><rect x="10" y="26" width="60" height="12" rx="2" fill="${C.paper}" opacity=".9"/></g>`).join('')
    + `<text x="${x + 38}" y="${y - 2}" font-size="9" font-weight="900" fill="${C.ink}" font-family="Zen Kaku Gothic New">議事録</text>`;
}

function calendar(x, y, checks) {
  let cells = '';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    const i = r * 6 + c, cx = x + 12 + c * 34, cy = y + 44 + r * 30;
    cells += `<rect x="${cx}" y="${cy}" width="28" height="24" rx="4" fill="${checks.includes(i) ? C.apricotSoft : '#f4efe4'}"/>`;
    if (checks.includes(i)) cells += `<path d="M${cx + 7} ${cy + 12} l5 5 l10 -11" fill="none" stroke="${C.forest}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return `<rect x="${x}" y="${y}" width="${12 * 2 + 34 * 6 - 6}" height="168" rx="10" fill="${C.paper}" stroke="${C.line}" stroke-width="2"/><rect x="${x}" y="${y}" width="${12 * 2 + 34 * 6 - 6}" height="32" rx="10" fill="${C.forest}"/><rect x="${x}" y="${y + 20}" width="${12 * 2 + 34 * 6 - 6}" height="12" fill="${C.forest}"/>
  <text x="${x + 14}" y="${y + 22}" font-size="14" font-weight="900" fill="#fff" font-family="Zen Kaku Gothic New">研修・訓練・委員会 年間計画</text>${cells}`;
}

function door(x, y) {
  return `<rect x="${x}" y="${y}" width="96" height="190" rx="4" fill="${C.wood}"/><rect x="${x + 10}" y="${y + 12}" width="76" height="70" rx="3" fill="${C.woodDark}" opacity=".5"/><rect x="${x + 10}" y="${y + 96}" width="76" height="80" rx="3" fill="${C.woodDark}" opacity=".5"/><circle cx="${x + 80}" cy="${y + 100}" r="6" fill="${C.yellow}"/>
`;
}

function bag(x, y) {
  return `<path d="M${x + 14} ${y} a18 18 0 0 1 36 0" fill="none" stroke="${C.ink}" stroke-width="5"/><rect x="${x}" y="${y}" width="64" height="54" rx="10" fill="${C.apricot}"/><rect x="${x + 24}" y="${y + 18}" width="16" height="8" rx="3" fill="${C.ink}" opacity=".35"/>`;
}

const svg = (inner, bg) => `<svg viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg" role="img">${bg ? `<rect width="360" height="300" rx="18" fill="${bg}"/>` : ''}${inner}</svg>`;

export const SCENES = {
  // 介護：夕方、記録が終わらない
  'kaigo-1740': { bg: '#fbe9d8', art: svg(windowSunset(214, 22, 120, 104) + clock(84, 74, 50, 17, 40) + desk(214) + paperStack(70, 204, 6) + paperStack(176, 204, 4, 1) + mug(282, 180), '') },
  'kaigo-1800': { bg: '#fbe9d8', art: svg(windowSunset(26, 30, 130, 112) + clock(296, 56, 36, 18, 0) + door(180, 104) + bag(70, 234), '') },
  // 放デイ：お迎え前の連絡帳
  'houday-1650': { bg: '#e7f1f7', art: svg(clock(280, 70, 46, 16, 50) + desk(222) + notebooks(40, 200) + blocks(260, 196), '') },
  'houday-omukae': { bg: '#e7f1f7', art: svg(bubble(30, 30, 300, '今日の様子、よく分かります') + notebooks(118, 250) + phone(40, 150, true), '') },
  // 管理者：運営指導の通知
  'kanri-tsuchi': { bg: '#eef1ea', art: svg(envelope(20, 40) + folders(222, 150) + desk(250) + mug(40, 214), '') },
  'kanri-done': { bg: '#eef1ea', art: svg(calendar(52, 34, [1, 3, 4, 8, 9, 12, 14, 17, 19, 22]) + phone(268, 150, true), '') },
};
