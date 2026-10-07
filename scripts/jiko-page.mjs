// 事故報告書（厚生労働省の標準様式）の下書きツールのページ。本体は site/assets/jiko.js。
import * as J from '../data/jiko.mjs';

export function jikoData() {
  return `window.JIKO_DATA=${JSON.stringify(J)};\n`;
}

export function jikoPage({ esc }) {
  const opts = (list) => list.map((v) => `<option>${esc(v)}</option>`).join('');
  const body = `
<section class="tool-section" style="border-top:0">
  <div class="wrap">
    <nav class="breadcrumb"><a href="index.html">トップ</a> ／ <a href="kaigo.html">介護</a></nav>
    <div class="section-head tool-head">
      <div>
        <span class="pill">無料・登録不要</span>
        <h1 class="serif" style="margin:10px 0 4px;font-size:clamp(24px,3.4vw,32px)">事故報告書の下書きをつくる</h1>
        <p class="section-sub">厚生労働省の標準様式（令和3年）の項目どおりに下書きできます。原因は「本人・職員・環境」から選ぶと、それに合った再発防止策の文例が入ります。</p>
      </div>
    </div>
    <div class="tool">
      <div class="panel">
        <div class="panel-block">
          <h3 class="panel-title"><span class="no">一</span>事故の種別</h3>
          <div class="seg seg-wide" id="jType" role="group" aria-label="事故の種別"></div>
        </div>
        <div class="panel-block">
          <h3 class="panel-title"><span class="no">二</span>いつ・どこで・どんな状況で</h3>
          <div class="field-row">
            <label class="field">発生日<input id="jDate" class="input" type="date"></label>
            <label class="field">時刻<input id="jTime" class="input" type="time"></label>
          </div>
          <label class="field">発生場所<select id="jPlace" class="input">${opts(J.PLACES)}</select></label>
          <label class="field">状況<select id="jSituation" class="input"></select></label>
          <label class="field">発見の状況<select id="jFound" class="input">${opts(J.FOUND)}</select></label>
          <label class="field">補足（どんな様子だったか）<span class="hint">氏名は書かないでください</span><textarea id="jDetail" class="input" rows="2" placeholder="例：右側を下にして床に座り込んでいた。本人は「トイレに行こうと思った」と話した。"></textarea></label>
        </div>
        <div class="panel-block">
          <h3 class="panel-title"><span class="no">三</span>程度と対応</h3>
          <label class="field">事故状況の程度<select id="jLevel" class="input">${opts(J.LEVELS)}</select></label>
          <label class="field">受診方法<select id="jVisit" class="input">${opts(J.VISITS)}</select></label>
          <label class="field">診断内容<select id="jDiag" class="input">${opts(J.DIAGNOSES)}</select></label>
          <label class="check" style="border:0;padding:8px 0"><input type="checkbox" id="jFamily" checked><span>ご家族に報告した</span></label>
          <p class="field" style="margin:6px 0 4px">連絡した関係機関</p>
          <div id="jAgencies">${J.AGENCIES.map((a, i) => `<label class="check" style="border:0;padding:4px 0"><input type="checkbox" value="${i}"${i < 2 ? ' checked' : ''}><span>${esc(a)}</span></label>`).join('')}</div>
        </div>
        <div class="panel-block">
          <h3 class="panel-title"><span class="no">四</span>原因（要因）を選ぶ<small>当てはまるものすべて</small></h3>
          <div class="issue-list" style="max-height:none" id="jFactors"></div>
        </div>
      </div>
      <div class="doc-area">
        <div class="doc-bar">
          <div class="coverage" id="jInfo"></div>
          <div class="doc-actions">
            <button class="btn btn-sm" id="jCopy" type="button">文章でコピー</button>
            <button class="btn btn-line btn-sm" id="jPrint" type="button">印刷</button>
            <button class="btn btn-line btn-sm ai-btn" id="jAi" type="button">AIで文章を整える</button>
            <button class="btn btn-line btn-sm" id="jShare" type="button">リンクで共有</button>
            <button class="btn btn-line btn-sm" id="jReset" type="button" title="入力と書き換えをすべて消して、最初の状態に戻します（この端末の保存も消えます）">リセット</button>
          </div>
        </div>
        <p class="edit-hint">文章は<mark>クリックすると、その場で書き換え</mark>られます。<span class="sp-only">報告書は横にスクロールできます。</span></p>
        <p class="fd-save" id="jSave" hidden></p>
        <div class="doc-scroll"><div class="doc doc-portrait" id="jDoc"></div></div>
        <div id="jWarn"></div>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap narrow article" style="padding-top:0">
    <h2>事故報告のきほん</h2>
    <ul class="plain">
      <li><b>報告の対象</b>：死亡に至った事故と、医師（配置医を含む）の診断を受けて投薬・処置など何らかの治療が必要になった事故は、原則としてすべて市町村に報告します。そのほかの事故は、自治体の取り扱いによります。</li>
      <li><b>報告の期限</b>：第1報は、少なくとも標準様式の1〜6の項目を記載し、事故発生後すみやかに、遅くとも5日以内を目安に提出します。原因分析や再発防止策は、作成しだい追加で報告します。</li>
      <li><b>対象のサービス</b>：標準様式は介護保険施設向けに作られていますが、グループホーム・特定施設・有料老人ホーム・サービス付き高齢者向け住宅などや、その他の居宅サービスでも活用が求められています。</li>
    </ul>
    <h2>「見守りを強化する」で終わらせないために</h2>
    <p>再発防止策が「見守りの強化」「注意する」だけでは、何を変えるのかが伝わりません。標準様式でも、原因は<b>本人要因・職員要因・環境要因</b>に分けて分析し、再発防止策は<b>手順の変更・環境の変更・その他の対応</b>に分け、<b>評価の時期と結果</b>まで書くことになっています。このツールでは、選んだ要因に合わせた具体的な対策の文例が入ります。</p>
    <p class="source">出典：厚生労働省老健局「介護保険施設等における事故の報告様式等について」（令和3年3月19日、介護保険最新情報Vol.943）。提出先の市町村によって様式や報告の範囲が異なるため、必ず市町村の案内をご確認ください。</p>
  </div>
</section>`;
  return {
    path: 'jiko.html',
    sector: 'kaigo',
    body,
    title: '介護の事故報告書の書き方・例文と下書きツール【厚労省の標準様式】無料｜ふくしのおたすけ帳',
    description: '介護の事故報告書を、厚生労働省の標準様式の項目どおりに無料で下書き。転倒・転落・誤嚥・誤薬・異食など種別ごとに、本人・職員・環境の要因分析と再発防止策の例文が入ります。登録不要・入力内容は送信されません。',
    scripts: ['assets/jiko-data.js', 'assets/jiko.js'],
  };
}
