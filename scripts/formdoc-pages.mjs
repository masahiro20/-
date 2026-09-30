// 「選ぶだけの下書き」テンプレートのページ。本体は site/assets/formdoc.js と site/assets/tpl/<id>.js。
import { TEMPLATES } from '../data/templates.mjs';

const SECTOR_NAMES = { jido: '児童支援', shogai: '障害福祉', kaigo: '介護' };

export function formdocPages({ esc, CONFIG }) {
  return TEMPLATES.map((t) => {
    const parent = t.sectors[0];
    const body = `
<section class="tool-section" style="border-top:0">
  <div class="wrap">
    <nav class="breadcrumb"><a href="index.html">トップ</a> ／ <a href="${parent}.html">${SECTOR_NAMES[parent]}</a></nav>
    <div class="section-head tool-head">
      <div>
        <span class="pill">無料・登録不要</span>${t.sectors.map((s) => ` <span class="pill pill-sector pill-${s}">${SECTOR_NAMES[s]}</span>`).join('')}
        <h1 style="margin:10px 0 4px;font-size:clamp(24px,3.4vw,32px)">${esc(t.h1)}</h1>
        <p class="section-sub">${esc(t.lead)}</p>
      </div>
    </div>
    <div class="tool">
      <div class="panel" id="fdPanel"><noscript><p>このツールを使うには、JavaScriptを有効にしてください。</p></noscript></div>
      <div class="doc-area">
        <div class="doc-bar">
          <div class="coverage" id="fdInfo"></div>
          <div class="doc-actions">
            <button class="btn btn-sm" id="fdCopy" type="button">文章でコピー</button>
            <button class="btn btn-line btn-sm" id="fdPrint" type="button">印刷</button>
            <button class="btn btn-line btn-sm ai-btn" id="fdAi" type="button">AIで文章を整える</button>
            <button class="btn btn-line btn-sm" id="fdShare" type="button">リンクで共有</button>
            <button class="btn btn-line btn-sm" id="fdReset" type="button">書き換えを元に戻す</button>
          </div>
        </div>
        <p class="edit-hint">文章は<mark>クリックすると、その場で書き換え</mark>られます。<span class="sp-only">書類は横にスクロールできます。</span></p>
        <div class="doc-scroll"><div class="doc doc-portrait" id="fdDoc"></div></div>
        <div id="fdWarn"></div>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap narrow article" style="padding-top:0">
    ${t.howto.map(([h, p]) => `<h2>${esc(h)}</h2>\n    <p>${p}</p>`).join('\n    ')}
    <p class="source">${esc(t.source)}</p>
    <div class="ask-box">
      <p><b>「この項目もほしい」「この書類も作ってほしい」</b><br>現場の声でツールを増やしています。意見箱からお気軽にどうぞ。</p>
      <a class="btn btn-line btn-sm" href="iken.html?doc=${encodeURIComponent(t.name)}">意見箱に送る</a>
    </div>
  </div>
</section>`;
    return {
      path: t.path,
      sector: parent,
      body,
      title: `${t.name}【無料・${t.sectors.map((s) => SECTOR_NAMES[s]).join('・')}】｜${CONFIG.siteName}`,
      description: `${t.desc} 登録不要・無料。入力した内容は送信されません。`,
      scripts: ['assets/formdoc.js', `assets/tpl/${t.id}.js`],
    };
  });
}
