// 意見箱。現場の声（ほしい書類・項目・不具合）を集める。送信先は data/config.mjs の feedbackEndpoint / feedbackEmail。
export function ikenPage({ esc, CONFIG }) {
  const mode = CONFIG.feedbackEndpoint ? 'endpoint' : CONFIG.feedbackEmail ? 'mail' : 'none';
  const body = `
<section class="portal-hero portal-hero-sm">
  <div class="wrap">
    <nav class="breadcrumb"><a href="index.html">トップ</a></nav>
    <span class="pill">現場の声で、ツールを増やしています</span>
    <h1>意見箱</h1>
    <p class="lead" style="max-width:44em">「この書類も作ってほしい」「この項目がほしい」「ここが使いにくい」。どんなことでもお寄せください。いただいた声をもとに、ツールやテンプレートを増やしていきます。</p>
  </div>
</section>
<section class="section">
  <div class="wrap narrow">
    <form class="iken" id="iken" data-mode="${mode}" data-endpoint="${esc(CONFIG.feedbackEndpoint || '')}" data-email="${esc(CONFIG.feedbackEmail || '')}" novalidate>
      <fieldset class="iken-kind">
        <legend class="field">ご意見の種類</legend>
        <div class="chips2">
          ${['追加してほしい書類', '今あるツールへの要望', '不具合の報告', 'その他'].map((k, i) => `<label class="chip2"><input type="radio" name="kind" value="${esc(k)}"${i === 0 ? ' checked' : ''}><span>${esc(k)}</span></label>`).join('')}
        </div>
      </fieldset>
      <div class="field-row">
        <label class="field">お仕事の分野<select class="input" name="sector"><option>児童支援（放デイ・児発）</option><option>障害福祉（就労・生活介護・GHなど）</option><option>介護</option><option>そのほか</option></select></label>
        <label class="field">職種（任意）<input class="input" name="role" type="text" placeholder="例：サービス管理責任者"></label>
      </div>
      <label class="field">関係する書類・ツール（任意）<input class="input" name="doc" id="ikenDoc" type="text" placeholder="例：モニタリング記録、アセスメントシート"></label>
      <label class="field">内容<span class="hint">利用者さんの氏名など、個人が特定できる情報は書かないでください</span><textarea class="input" name="body" rows="6" required placeholder="例：就労Bの工賃向上計画を作るツールがほしいです。毎年、書き方に悩みます。"></textarea></label>
      <label class="field">返信がほしい場合のメールアドレス（任意）<input class="input" name="email" type="email" autocomplete="email" placeholder="example@example.com"></label>
      <label class="iken-hp" aria-hidden="true">この欄は空のままにしてください<input name="website" type="text" tabindex="-1" autocomplete="off"></label>
      <p class="small muted" style="margin:14px 0 0">送っていただいた内容は、ツールの改善のためだけに使います。お名前は不要です。すべてのご意見に返信できるとは限りませんが、必ず読んでいます。</p>
      <p style="margin:18px 0 0"><button class="btn btn-warm" type="submit" id="ikenSend">${mode === 'mail' ? 'メールソフトで送る' : '意見を送る'}</button></p>
      <div id="ikenMsg" role="status" aria-live="polite"></div>
    </form>
  </div>
</section>`;
  return {
    path: 'iken.html',
    body,
    title: `意見箱（ほしい書類・ご要望）｜${CONFIG.siteName}`,
    description: `${CONFIG.siteName}への意見箱。「この書類も作ってほしい」「この項目がほしい」など、現場の声をお寄せください。`,
    scripts: ['assets/iken.js'],
  };
}
