// 放デイ・児発の連絡帳 文例メーカーのページ。本体は site/assets/renrakucho.js。
import * as R from '../data/renrakucho.mjs';

export function renrakuchoData() {
  return `window.RENRAKU_DATA=${JSON.stringify(R)};\n`;
}

export function renrakuchoPage({ esc }) {
  const chips = (group, list) => list.map((x) => `<label class="chip2"><input type="checkbox" data-g="${group}" value="${x.id}"><span>${esc(x.label)}</span></label>`).join('');
  const sel = (id, list) => `<select id="${id}" class="input">${list.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>`;
  const body = `
<section class="tool-section" style="border-top:0">
  <div class="wrap">
    <nav class="breadcrumb"><a href="index.html">トップ</a> ／ <a href="jido.html">児童支援</a></nav>
    <div class="section-head tool-head">
      <div>
        <span class="pill">無料・登録不要・毎日使える</span>
        <h1 style="margin:10px 0 4px">連絡帳の文例メーカー</h1>
        <p class="section-sub">今日の活動と様子を選ぶだけで、保護者に伝わる連絡帳の文章ができます。放課後等デイサービス・児童発達支援向け。</p>
      </div>
    </div>
    <div class="tool tool-narrow">
      <div class="panel">
        <div class="panel-block">
          <h3 class="panel-title"><span class="no">一</span>今日の活動<small>1〜2つ</small></h3>
          <div class="chips2">${chips('act', R.ACTIVITIES)}</div>
        </div>
        <div class="panel-block">
          <h3 class="panel-title"><span class="no">二</span>様子</h3>
          <div class="chips2">${chips('mood', R.MOODS)}</div>
        </div>
        <div class="panel-block">
          <h3 class="panel-title"><span class="no">三</span>できたこと<small>成長が伝わる一言に</small></h3>
          <div class="chips2">${chips('done', R.DONE)}</div>
        </div>
        <div class="panel-block">
          <h3 class="panel-title"><span class="no">四</span>生活のこと・しめくくり</h3>
          <div class="field-row">
            <label class="field">おやつ${sel('rSnack', R.SNACK)}</label>
            <label class="field">トイレ${sel('rToilet', R.TOILET)}</label>
          </div>
          <label class="field">体調${sel('rHealth', R.HEALTH)}</label>
          <label class="field">しめくくり${sel('rClosing', R.CLOSINGS.map(([k, t]) => [k, t || '（書かない）']))}</label>
          <label class="field">書き足したいこと<span class="hint">お子さまの名前は書かず、「〇〇さん」のまま使えます</span><textarea id="rExtra" class="input" rows="2" placeholder="例：帰りに「明日も来たい」と話していました。"></textarea></label>
        </div>
      </div>
      <div class="doc-area">
        <div class="note-card">
          <div class="note-head"><span>連絡帳</span><span id="rCount" class="note-count"></span></div>
          <div class="note-body ed" contenteditable="true" spellcheck="false" id="rOut"></div>
        </div>
        <div class="doc-actions" style="margin-top:14px">
          <button class="btn" id="rCopy" type="button">文章をコピー</button>
          <button class="btn btn-line" id="rShuffle" type="button">別の言い回しにする</button>
          <button class="btn btn-line ai-btn" id="rAi" type="button">AIで文章を整える</button>
          <button class="btn btn-line" id="rReset" type="button" title="選んだ内容と書き換えを消して、最初の状態に戻します（この端末の保存も消えます）">リセット</button>
        </div>
        <p class="small muted" style="margin-top:12px">文章はクリックすると書き換えられます。「〇〇さん」はお子さまの名前に置き換えてお使いください。</p>
        <p class="fd-save" id="rSave" hidden></p>
        <div class="redpen" style="margin-top:16px"><span class="redpen-label">赤ペン：連絡帳のコツ</span>
          <p>・できたことは「何を・どんな場面で」まで書くと、保護者に伝わります。<br>・気になることを書くときは、先にできたことを伝え、最後に「ご家庭での様子も教えてください」と添えると、相談しやすい関係になります。</p>
        </div>
      </div>
    </div>
  </div>
</section>`;
  return {
    path: 'renrakucho.html',
    sector: 'jido',
    body,
    title: '連絡帳の文例メーカー【放デイ・児発】保護者に伝わる書き方・例文｜ふくしのおたすけ帳',
    description: '放課後等デイサービス・児童発達支援の連絡帳を、今日の活動と様子を選ぶだけで作れる無料の文例メーカー。できたことが伝わる例文、体調・おやつ・トイレの書き方も。登録不要。',
    scripts: ['assets/renrakucho-data.js', 'assets/renrakucho.js'],
  };
}
