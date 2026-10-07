// 障害福祉サービス（就労系・生活介護・GH）の個別支援計画 下書きツールのページ。本体は site/assets/shogai.js。
import { SERVICES, CATEGORIES, ISSUES } from '../data/shogai.mjs';

export function shogaiData() {
  return `window.SHOGAI_DATA=${JSON.stringify({ services: SERVICES, categories: CATEGORIES, issues: ISSUES })};\n`;
}

export function shogaiPage({ esc }) {
  const body = `
<section class="tool-section" style="border-top:0">
  <div class="wrap">
    <nav class="breadcrumb"><a href="index.html">トップ</a> ／ <a href="shogai.html">障害福祉</a></nav>
    <div class="section-head tool-head">
      <div>
        <span class="pill">無料・登録不要</span>
        <h1 class="serif" style="margin:10px 0 4px;font-size:clamp(24px,3.4vw,32px)">個別支援計画の下書きをつくる（障害福祉）</h1>
        <p class="section-sub">就労継続支援B型・A型、就労移行支援、生活介護、グループホームに対応。サービスと課題を選ぶと、目標・支援内容・留意事項まで入った下書きができます。</p>
      </div>
    </div>
    <div class="tool">
      <div class="panel">
        <div class="panel-block">
          <h3 class="panel-title"><span class="no">一</span>サービスの種類</h3>
          <div class="seg seg-wide" id="svcOptions" role="group" aria-label="サービスの種類"></div>
        </div>
        <div class="panel-block">
          <h3 class="panel-title"><span class="no">二</span>課題（ニーズ）を選ぶ<small>3つ前後がおすすめ</small></h3>
          <p class="picked-caption" id="sPickedCaption" hidden>選んだ課題（上から優先順位）</p>
          <ol class="picked" id="sPicked"></ol>
          <label class="visually-hidden" for="sSearch">課題を絞り込む</label>
          <input type="search" id="sSearch" class="input" placeholder="絞り込み（例：通所、服薬、金銭、就職）">
          <div class="issue-list" id="sIssueList"></div>
        </div>
        <div class="panel-block">
          <h3 class="panel-title"><span class="no">三</span>ご本人のこと<small>任意</small></h3>
          <label class="field">ご本人の希望（本人の言葉で）<textarea id="sWishSelf" class="input" rows="2" placeholder="例：もっと作業ができるようになって、工賃を増やしたい。"></textarea></label>
          <label class="field">ご家族の希望<textarea id="sWishFamily" class="input" rows="2" placeholder="例：体調を崩さずに通い続けてほしい。"></textarea></label>
          <label class="field">得意なこと・好きなこと<span class="hint">支援の方針に書き込まれます</span><input id="sStrength" class="input" placeholder="例：細かい作業、音楽、パソコン"></label>
          <p class="small muted" style="margin:14px 0 0">氏名・病名など、個人が特定できる情報は入力しないでください。入力内容は送信されません（続きから使えるよう、この端末にだけ7日間保存します）。</p>
        </div>
      </div>
      <div class="doc-area">
        <div class="doc-bar">
          <div class="coverage" id="sInfo"></div>
          <div class="doc-actions">
            <button class="btn btn-sm" id="sCopyTable" type="button" disabled>Excelに貼る形でコピー</button>
            <button class="btn btn-line btn-sm" id="sCopyText" type="button" disabled>文章でコピー</button>
            <button class="btn btn-line btn-sm" id="sPrint" type="button" disabled>印刷</button>
            <button class="btn btn-line btn-sm ai-btn" id="sAi" type="button" disabled>AIで文章を整える</button>
            <button class="btn btn-line btn-sm" id="sShare" type="button" disabled>リンクで共有</button>
            <button class="btn btn-line btn-sm" id="sReset" type="button" title="入力と書き換えをすべて消して、最初の状態に戻します（この端末の保存も消えます）">リセット</button>
          </div>
        </div>
        <p class="edit-hint">文章は<mark>クリックすると、その場で書き換え</mark>られます。書き換えた箇所は、課題を選び直しても残ります。<span class="sp-only">計画書は横にスクロールできます。</span></p>
        <p class="fd-save" id="sSave" hidden></p>
        <div class="doc-scroll"><div class="doc" id="sDoc"></div></div>
      </div>
    </div>
  </div>
  <div class="mobile-bar" id="sMobileBar"><span id="sMobileCount"></span><a class="btn btn-sm" href="#sDoc">計画書を見る</a></div>
</section>

<section class="section">
  <div class="wrap narrow article" style="padding-top:0">
    <h2>障害福祉サービスの個別支援計画に書くこと</h2>
    <p>個別支援計画には、国の基準で次の内容を記載することとされています。このツールの下書きも、この順に並んでいます。</p>
    <ol class="plain">
      <li>利用者及びその家族の生活に対する意向</li>
      <li>総合的な支援の方針</li>
      <li>生活全般の質を向上させるための課題</li>
      <li>サービスの目標及びその達成時期</li>
      <li>サービスを提供する上での留意事項 など</li>
    </ol>
    <h2>作るときのポイント</h2>
    <ul class="plain">
      <li><b>本人の言葉から始める</b>：課題（ニーズ）は「〜したい」と本人の思いに近い形で書くと、目標とのつながりが伝わります。</li>
      <li><b>本人の役割も書く</b>：支援内容には、職員が行うことに加えて、本人が取り組むことも書いておくと、本人と一緒に進める計画になります。</li>
      <li><b>見直しの時期</b>：就労移行支援・自立訓練は少なくとも3か月に1回、そのほかのサービスは少なくとも6か月に1回、モニタリングと計画の見直しを行います。</li>
      <li><b>本人参加と交付</b>：令和6年度の報酬改定で、計画作成の会議には原則として本人が参加すること、作成した計画を相談支援事業所にも交付することが求められるようになりました。</li>
    </ul>
    <p class="small muted">※ 様式や記載方法の細かな求めは、自治体（指定権者）によって異なります。必ず最新の資料をご確認ください。</p>
  </div>
</section>`;
  return {
    path: 'shogai-keikaku.html',
    body,
    title: '個別支援計画の書き方・文例と下書きツール【就労B・A・移行・生活介護・GH】無料｜ふくしのおたすけ帳',
    description: '就労継続支援B型・A型、就労移行支援、生活介護、グループホームの個別支援計画を無料で下書き。課題（ニーズ）を選ぶと、支援目標・支援内容（本人の役割を含む）・留意事項まで入ります。登録不要・入力内容は送信されません。',
    scripts: ['assets/shogai-data.js', 'assets/shogai.js'],
  };
}
