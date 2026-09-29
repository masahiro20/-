// 支援プログラム作成ツールのページ（本体のロジックは site/assets/program.js）。
import * as P from '../data/program.mjs';

export function programData() {
  return `window.PROGRAM_DATA=${JSON.stringify(P)};\n`;
}

export function programPage({ esc }) {
  const body = `
<section class="tool-section" style="border-top:0">
  <div class="wrap">
    <nav class="breadcrumb"><a href="index.html">トップ</a></nav>
    <div class="section-head tool-head">
      <div>
        <span class="pill">無料・登録不要</span>
        <h1 class="serif" style="margin:10px 0 4px;font-size:clamp(24px,3.4vw,32px)">支援プログラムの下書きをつくる</h1>
        <p class="section-sub">児童発達支援・放課後等デイサービスで作成・公表が必要な「支援プログラム」を、国の手引きの①〜⑫の項目どおりに作れます。<br>選んだ内容はこの端末のブラウザにだけ保存されます。</p>
      </div>
    </div>
    <div class="tool">
      <div class="panel" id="programForm">
        <div class="panel-block">
          <h3 class="panel-title"><span class="no">一</span>基本情報</h3>
          <label class="field">サービスの種類
            <select id="pService" class="input"><option>放課後等デイサービス</option><option>児童発達支援</option><option>居宅訪問型児童発達支援</option></select>
            <span class="hint">多機能型の場合は、サービスごとに作成します</span></label>
          <label class="field">① 事業所名<input id="pName" class="input" placeholder="例：〇〇こどもサポート"></label>
          <label class="field">② 作成年月日<input id="pDate" class="input" type="date"></label>
          <label class="field">③ 法人（事業所）理念<textarea id="pPhilosophy" class="input" rows="2"></textarea></label>
          <label class="field">④ 支援方針<textarea id="pPolicy" class="input" rows="3"></textarea></label>
          <label class="field">⑤ 営業時間<input id="pHours" class="input" placeholder="例：平日 13:00〜18:00／学校休業日 9:00〜17:00"></label>
          <label class="field">⑥ 送迎<select id="pTransport" class="input"><option>あり</option><option>なし</option><option>あり（一部地域）</option></select></label>
        </div>
        <div class="panel-block" id="pChecks"></div>
        <div class="panel-block">
          <p class="small muted" style="margin:0">選んだ文章は、右の下書きでクリックすると書き換えられます。事業所で実際に行っている取り組みだけを選び、具体的に書き直してください。</p>
          <p style="margin:12px 0 0"><button type="button" class="btn btn-line btn-sm" id="pReset">最初の状態に戻す</button></p>
        </div>
      </div>
      <div class="doc-area">
        <div class="doc-bar">
          <div class="coverage" id="pCoverage"></div>
          <div class="doc-actions">
            <button class="btn btn-sm" id="pCopyHtml" type="button">ホームページ掲載用にコピー</button>
            <button class="btn btn-line btn-sm" id="pCopyText" type="button">文章でコピー</button>
            <button class="btn btn-line btn-sm" id="pPrint" type="button">印刷</button>
          </div>
        </div>
        <p class="edit-hint">下書きの文章は<mark>クリックすると、その場で書き換え</mark>られます。<span class="sp-only">下書きは横にスクロールできます。</span></p>
        <div class="doc-scroll"><div class="doc doc-portrait" id="pDoc"></div></div>
        <div class="tool-cta">
          <p>作ったら、<b>事業所のホームページ等で公表し、公表方法と内容を都道府県に届け出</b>ます。未公表・未届出の場合は減算の対象です。</p>
          <div class="links"><a class="text-link" href="kakikata.html">個別支援計画の書き方</a><a class="text-link" href="checklist.html">運営指導前チェックリスト</a></div>
        </div>
      </div>
    </div>
  </div>
  <p class="toast" id="toast" role="status"></p>
</section>

<section class="section">
  <div class="wrap narrow article" style="padding-top:0">
    <h2>支援プログラムとは</h2>
    <p>令和6年度の報酬改定で、児童発達支援・放課後等デイサービス・居宅訪問型児童発達支援の事業所に、5領域との関連性を明確にした「支援プログラム」の作成と公表が求められるようになりました。事業所がどんな支援をしているのかを、職員の共通理解と、利用を考えるご家族のために「見える化」するものです。</p>
    <h2>書く項目（①〜⑫）</h2>
    <ol class="plain">${P.PROGRAM_ITEMS.map((t) => `<li>${esc(t.replace(/^[①-⑫]\s*/, ''))}</li>`).join('')}</ol>
    <h2>作るときのポイント</h2>
    <ul class="plain">
      <li><b>職員の意見も聴いて作る</b>：管理者や児発管だけでなく、直接支援にあたる職員の意見も聴きながら作ることとされています。</li>
      <li><b>個別支援計画とつなげる</b>：支援プログラムの内容が、一人ひとりの個別支援計画につながっていくように作ります。</li>
      <li><b>5領域との関連づけ方は自由</b>：領域ごとに欄を設ける方法でも、支援内容に領域を書き添える方法でもかまいません。このツールは領域ごとに欄を設ける方法です。</li>
      <li><b>行事は季節の活動でもOK</b>：行事形式でなくても、季節に合わせた活動を書けます。</li>
      <li><b>公表と届出</b>：ホームページ等で公表し、公表方法と内容を都道府県に届け出ます。令和7年4月以降、未公表・未届出の場合は減算の対象です。</li>
    </ul>
    <p class="source">出典：こども家庭庁 支援局障害児支援課「児童発達支援等における支援プログラムの作成及び公表の手引き」をもとに編集部で要約。</p>
  </div>
</section>`;
  return {
    path: 'program.html',
    body,
    title: '支援プログラムの作り方と下書きツール【放デイ・児発／5領域】無料｜個別支援計画 文例帳',
    description: '児童発達支援・放課後等デイサービスの「支援プログラム」を、こども家庭庁の手引きの①〜⑫の項目どおりに無料で作成。5領域ごとの支援内容、家族支援・移行支援・地域支援・職員研修・行事の文例つき。ホームページ掲載用のHTMLもコピーできます。',
    scripts: ['assets/program-data.js', 'assets/program.js'],
  };
}
