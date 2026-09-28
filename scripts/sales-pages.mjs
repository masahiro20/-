// 販売まわりのページ（販売ページ・無料様式・特商法・利用規約・お問い合わせ）を組み立てる。
// build.mjs から呼び出す。
export function salesPages({ CONFIG, ISSUES, esc, yen, TODO, buyButton }) {
  const price = yen(CONFIG.productPrice);
  const contactLine = CONFIG.supportEmail
    ? `<a href="mailto:${esc(CONFIG.supportEmail)}">${esc(CONFIG.supportEmail)}</a>`
    : CONFIG.contactUrl
      ? `<a href="${esc(CONFIG.contactUrl)}" target="_blank" rel="noopener">お問い合わせフォーム</a>`
      : TODO('問い合わせ先（メールアドレスまたはフォームURL）');

  const faq = [
    ['Macでも使えますか？', 'はい。Mac版のExcel（2016以降・Microsoft 365）で使えます。Googleスプレッドシートや、無料のLibreOfficeでも、プルダウンと文例の自動入力が動きます（フォントやセルの高さが少し変わることがあります）。'],
    ['事業所の職員みんなで使ってもいいですか？', 'はい。ご購入いただいた事業所（同じ法人の複数事業所を含みます）の中なら、何人でお使いいただいてもかまいません。'],
    ['うちの自治体の様式と少し違います。', 'Excelなので、列の幅や項目名、事業所名の追加などは自由に変えられます。こども家庭庁の参考様式と同じ項目で作っているので、多くの様式にそのまま書き写せます。'],
    ['自分たちの文例も追加できますか？', 'できます。「文例一覧」シートの一番下の黄色い行に書き足すと、計画書の「課題を選ぶ」プルダウンに自動で出てきます。'],
    ['どうやって届きますか？', '決済が終わると、すぐにダウンロードできます（ZIPファイル）。Excel・PDF・説明書が入っています。'],
    ['領収書はもらえますか？', 'はい。お問い合わせから、注文番号と宛名（事業所名）をお知らせください。PDFの領収書をお送りします。'],
    ['返品はできますか？', 'デジタル商品のため、ご購入後の返品・返金はお受けしていません。ファイルが開けないなどの不具合は、交換で対応します。'],
    ['アップデートはありますか？', '文例の追加や制度改定への対応は、購入された方へ無料でお届けします。'],
    ['お子さまの情報をどこかに送りますか？', 'いいえ。Excelファイルの中だけで動くので、入力した内容が外に送られることはありません。'],
  ];

  const template = `
<section class="lp-hero">
  <div class="wrap lp-hero-grid">
    <div>
      <span class="pill pill-shu">放デイ・児発の児発管さんへ</span>
      <h1>課題を選ぶだけで、<br><span class="hl">文例が入る</span>計画書。</h1>
      <p class="lp-sub">個別支援計画の文例つきExcelセット</p>
      <p class="lead">いつものExcelのまま、プルダウンで課題を選ぶと、支援目標・支援内容（5領域つき）・留意事項・家族支援・移行支援に文例が入ります。あとは、お子さまに合わせて書き直すだけ。モニタリング記録と、印刷できる文例全集（PDF）もセットです。</p>
      <p class="price"><b>${price}</b><small>（税込）・買い切り</small></p>
      <div class="buy-row">${buyButton()}<a class="text-link" href="download.html">まずは無料の白紙様式を試す</a></div>
      <ul class="buy-notes">
        <li>購入後すぐダウンロード</li>
        <li>事業所内なら何人でも</li>
        <li>アップデート無料</li>
      </ul>
    </div>
    <div class="callouts">
      <div class="frame"><div class="frame-bar"><i></i><i></i><i></i><span>計画書（文例入り）.xlsx</span></div>
        <img src="assets/img/excel-plan-zoom.png" width="1334" height="582" alt="Excelの計画書。左の黄色いセルで課題を選ぶと、支援目標と支援内容（5領域つき）に文例が入っている画面">
      </div>
      <span class="callout-tag" style="left:4%;top:78%">① 課題を選ぶと</span>
      <span class="callout-tag" style="left:46%;top:78%">② 文例が入る</span>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><h2>こんなこと、ありませんか？</h2></div>
    <div class="worries">
      <div class="worry"><p>利用児全員分の計画書。毎回<b>白紙から考えて</b>、気づけば夜になっている。</p></div>
      <div class="worry"><p>改定で入った<b>5領域の書き方</b>、これで合っているのか自信がない。</p></div>
      <div class="worry"><p>計画が終わったと思ったら、<b>モニタリングの文章</b>もまた一から。</p></div>
    </div>
    <p class="answer">書き始めの「最初の一文」を、<span class="hl">Excelが用意します。</span></p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><h2>使い方は、3つだけ</h2></div>
    <div class="steps3">
      <div class="step3">
        <div><span class="num">1</span><h3>課題を選ぶ</h3><p>黄色いセルで、お子さまの区分と気になる課題を選びます。課題は${ISSUES.length}種類。上から順に優先順位になります。</p></div>
        <div class="frame"><img src="assets/img/excel-plan.png" width="1052" height="976" alt="課題を選ぶ黄色いセルと、文例が入った計画書"></div>
      </div>
      <div class="step3">
        <div><span class="num">2</span><h3>その子に合わせて書き直す</h3><p>入った文例を、回数・時間・場面・好きなものに合わせて書き直します。セルに上書きすればOK。書き方に迷ったら、架空のお子さまで書いた「記入例」シートが目安になります。</p></div>
        <div class="frame"><img src="assets/img/excel-example.png" width="679" height="884" alt="架空のお子さまで書いた計画書の記入例"></div>
      </div>
      <div class="step3">
        <div><span class="num">3</span><h3>印刷して、半年後はモニタリング</h3><p>A4横に収まるよう設定済み。半年後は「モニタリング記録」シートで評価を選ぶと、評価の理由の文例が入ります。支援目標は計画書から自動で写ります。</p></div>
        <div class="frame"><img src="assets/img/excel-monitoring.png" width="734" height="716" alt="評価を選ぶと理由の文例が入るモニタリング記録"></div>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><h2>セットの中身</h2></div>
    <div class="contents">
      <div class="content-card">
        <span class="pill">Excel</span>
        <h3>文例つき様式セット</h3>
        <ul>
          <li>計画書（文例入り）… 課題を選ぶと文例が入る</li>
          <li>計画書（白紙）… 一から書くとき用</li>
          <li>モニタリング記録 … 評価を選ぶと文例が入る</li>
          <li>記入例 … 架空のお子さまで書いた見本</li>
          <li>文例一覧 … ${ISSUES.length}課題すべて。オリジナル文例も追加できる</li>
        </ul>
      </div>
      <div class="content-card">
        <span class="pill">PDF</span>
        <h3>個別支援計画 文例全集（37ページ）</h3>
        <ul>
          <li>課題ごとに1ページ：アセスメントの視点・支援目標・支援内容・留意事項・家族支援・モニタリング</li>
          <li>書く前に押さえる6つのポイント（国の記載のポイントから）</li>
          <li>年齢別の移行支援・地域支援の文例</li>
          <li>メモ欄つき。印刷して会議や研修にも</li>
        </ul>
      </div>
      <div class="content-card">
        <span class="pill">付録</span>
        <h3>はじめにお読みください</h3>
        <ul>
          <li>3分でわかる使い方</li>
          <li>動作環境（Excel・Googleスプレッドシート・LibreOffice）</li>
          <li>ご利用の範囲とアップデートのご案内</li>
        </ul>
      </div>
    </div>
    <div class="dl-box" style="margin-top:28px">
      <div class="frame"><img src="assets/img/book-issue.png" width="676" height="1015" alt="文例全集のページ。課題ごとに支援目標・支援内容・モニタリングの文例が並ぶ"></div>
      <div class="frame"><img src="assets/img/excel-list.png" width="1149" height="403" alt="文例一覧シート。領域・課題ごとに文例が並ぶ"></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><h2>無料のものとの違い</h2></div>
    <div class="doc-scroll">
    <table class="compare">
      <thead><tr><th></th><th>このサイトの<br>下書きツール（無料）</th><th>白紙の様式<br>（無料）</th><th class="paid">文例つき<br>Excelセット</th></tr></thead>
      <tbody>
        <tr><td>参考様式と同じ項目</td><td class="yes">○</td><td class="yes">○</td><td class="paid yes">○</td></tr>
        <tr><td>課題を選ぶと文例が入る</td><td class="yes">○（ブラウザで）</td><td class="no">―</td><td class="paid yes">○（Excelで）</td></tr>
        <tr><td>Excelで保存・編集・印刷</td><td>コピーして貼る</td><td class="yes">○</td><td class="paid yes">○</td></tr>
        <tr><td>モニタリング記録の文例</td><td>文例ページで閲覧</td><td class="no">―</td><td class="paid yes">○ 評価を選ぶと入る</td></tr>
        <tr><td>記入例</td><td class="no">―</td><td class="no">―</td><td class="paid yes">○</td></tr>
        <tr><td>事業所オリジナルの文例を追加</td><td class="no">―</td><td class="no">―</td><td class="paid yes">○</td></tr>
        <tr><td>印刷用の文例全集（PDF）</td><td class="no">―</td><td class="no">―</td><td class="paid yes">○ 37ページ</td></tr>
        <tr><td>ネットにつながっていなくても使える</td><td class="no">―</td><td class="yes">○</td><td class="paid yes">○</td></tr>
        <tr><td>価格</td><td>無料</td><td>無料</td><td class="paid">${price}（税込）</td></tr>
      </tbody>
    </table>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="buy-box">
      <div>
        <h3>${esc(CONFIG.productName)}</h3>
        <p class="muted" style="margin:0">放課後等デイサービス・児童発達支援／5領域対応（令和6年度報酬改定）</p>
        <ul>
          <li>Excel（計画書・モニタリング記録・記入例・文例一覧）＋ 文例全集PDF（37ページ）</li>
          <li>決済後すぐにダウンロード（ZIP）</li>
          <li>購入された事業所の中なら何人でも利用可</li>
          <li>文例の追加・制度改定への対応は無料アップデート</li>
        </ul>
      </div>
      <div class="buy-side">
        <p class="price"><b>${price}</b><small>（税込）</small></p>
        ${buyButton()}
        <p class="small muted" style="margin:10px 0 0"><a href="tokushoho.html">特定商取引法に基づく表記</a>／<a href="terms.html">利用規約</a></p>
      </div>
    </div>
  </div>
</section>

<section class="section" id="faq">
  <div class="wrap">
    <div class="section-head"><h2>よくある質問</h2></div>
    <dl class="qa" style="max-width:820px">
      ${faq.map(([q, a]) => `<div><dt>${esc(q)}</dt><dd>${esc(a)}</dd></div>`).join('\n')}
    </dl>
    <p class="small muted" style="margin-top:20px">文例は、計画を書き始めるための下書きです。お子さまのアセスメントと本人・家族の意向に合わせて必ず書き直してください。様式や記載方法の細かな求めは自治体によって異なります。</p>
  </div>
</section>`;

  const download = `
<div class="wrap article">
  <nav class="breadcrumb"><a href="index.html">トップ</a></nav>
  <span class="pill">無料・登録不要</span>
  <h1>個別支援計画書・モニタリング記録の様式（Excel）</h1>
  <p class="lead">こども家庭庁の参考様式（令和6年度報酬改定）と同じ項目の、個別支援計画書とモニタリング記録のExcel様式です。A4横に収まるよう印刷設定済み。事業所名の追加など、自由に編集してお使いください。</p>
  <div class="dl-box">
    <div class="frame"><img src="assets/img/free-plan.png" width="620" height="737" alt="白紙の個別支援計画書の様式"></div>
    <div>
      <h2 style="margin-top:0">入っているもの</h2>
      <ul class="plain">
        <li>個別支援計画書（参考様式と同じ項目：意向・方針・長期目標・短期目標・提供時間等・支援目標及び具体的な支援内容等）</li>
        <li>モニタリング記録（評価・理由・今後の方針）</li>
        <li>使い方の説明シート</li>
      </ul>
      <p style="margin:24px 0 8px"><a class="btn btn-lg" href="files/kobetsu-shien-keikaku-yoshiki.xlsx" download>Excel様式をダウンロード</a></p>
      <p class="small muted">ファイル形式：.xlsx（Excel 2016以降・Googleスプレッドシート・LibreOffice）</p>
    </div>
  </div>
  <div class="tool-cta" style="margin-top:40px">
    <p>文章も入れたい方へ。<b>課題を選ぶと文例が入るExcel</b>（${price}）もあります。</p>
    <div class="links"><a class="btn btn-sm btn-shu" href="template.html">Excelセットを見る</a><a class="text-link" href="index.html#tool">ブラウザで下書きをつくる（無料）</a></div>
  </div>
  <h2>書き方に迷ったら</h2>
  <ul class="plain">
    <li><a href="kakikata.html">個別支援計画の書き方（令和6年度改定・5領域対応）</a></li>
    <li><a href="bunrei/index.html">課題別の文例集（${ISSUES.length}課題）</a></li>
    <li><a href="checklist.html">運営指導前チェックリスト</a></li>
  </ul>
</div>`;

  const rows = [
    ['販売事業者', CONFIG.sellerName ? esc(CONFIG.sellerName) : TODO('販売事業者名（個人の場合は氏名）')],
    ['運営統括責任者', CONFIG.sellerName ? esc(CONFIG.sellerName) : TODO('責任者の氏名')],
    ['所在地', esc(CONFIG.sellerAddress)],
    ['電話番号', esc(CONFIG.sellerPhone)],
    ['メールアドレス', CONFIG.supportEmail ? esc(CONFIG.supportEmail) : TODO('メールアドレス')],
    ['販売価格', `${esc(CONFIG.productName)}：${price}（税込）`],
    ['商品代金以外の必要料金', 'インターネット接続料金・通信料金はお客様のご負担となります。'],
    ['お支払い方法', '販売サイトが提供する決済方法（クレジットカードなど）'],
    ['お支払い時期', 'ご購入手続きの際にお支払いいただきます。'],
    ['商品の引渡し時期', '決済完了後、すぐにダウンロードいただけます。'],
    ['返品・キャンセル', 'デジタルコンテンツの性質上、ご購入後の返品・返金・キャンセルはお受けしておりません。ファイルに不具合があった場合は、正常なファイルと交換いたします。'],
    ['動作環境', 'Microsoft Excel 2016以降（Windows／Mac）、Microsoft 365、Googleスプレッドシート、LibreOffice。PDFの閲覧にはPDFビューアが必要です。'],
  ];
  const tokushoho = `
<div class="wrap narrow article">
  <nav class="breadcrumb"><a href="index.html">トップ</a></nav>
  <h1>特定商取引法に基づく表記</h1>
  <table class="law-table">${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${v}</td></tr>`).join('')}</table>
</div>`;

  const terms = `
<div class="wrap narrow article">
  <nav class="breadcrumb"><a href="index.html">トップ</a></nav>
  <h1>利用規約</h1>
  <p class="lead">この規約は、${esc(CONFIG.siteName)}（以下「当サイト」）が提供するウェブサイト・ツール・有料商品（以下「本サービス」）の利用条件を定めるものです。</p>
  <h2>第1条（有料商品の利用範囲）</h2>
  <ol class="plain">
    <li>有料商品は、購入者が所属する事業所（同一法人が運営する複数の事業所を含みます）の中で、人数の制限なく利用できます。</li>
    <li>有料商品を使って作成した計画書・モニタリング記録などの書類は、印刷・保存・編集し、利用者やご家族、関係機関に渡すことができます。</li>
  </ol>
  <h2>第2条（禁止事項）</h2>
  <ol class="plain">
    <li>有料商品のファイルそのもの（改変したものを含みます）を、第三者に再配布・販売・貸与すること。</li>
    <li>有料商品のファイルや文例を、インターネット上で不特定多数が閲覧・入手できる状態にすること。</li>
    <li>その他、法令または公序良俗に反する行為。</li>
  </ol>
  <h2>第3条（著作権）</h2>
  <p>本サービスに含まれる文章・様式・プログラムの著作権は、当サイトの運営者に帰属します。</p>
  <h2>第4条（免責）</h2>
  <ol class="plain">
    <li>本サービスの文例は、計画を書き始めるための下書きです。実際の計画は、利用者のアセスメントと本人・家族の意向に基づき、利用者の責任で作成してください。</li>
    <li>制度や様式の求めは自治体（指定権者）によって異なり、改定されることがあります。本サービスの内容が、特定の自治体の指導内容に適合することを保証するものではありません。</li>
    <li>本サービスの利用によって生じた損害について、運営者は、故意または重大な過失がある場合を除き、責任を負いません。</li>
  </ol>
  <h2>第5条（返品・返金）</h2>
  <p>有料商品はデジタルコンテンツのため、購入後の返品・返金はお受けしていません。ファイルに不具合がある場合は、交換で対応します。</p>
  <h2>第6条（規約の変更）</h2>
  <p>運営者は、必要に応じて本規約を変更できます。変更後の規約は、当サイトに掲載した時点から効力を持ちます。</p>
  <h2>第7条（準拠法）</h2>
  <p>本規約は日本法に準拠します。</p>
</div>`;

  const contact = `
<div class="wrap narrow article">
  <nav class="breadcrumb"><a href="index.html">トップ</a></nav>
  <h1>お問い合わせ</h1>
  <p class="lead">いただいたお問い合わせには、2営業日以内を目安にお返事します。</p>
  <div class="note-box">
    <p style="margin:0 0 8px"><b>よくあるご質問は、先にこちらをご覧ください</b></p>
    <ul class="plain" style="margin:0">
      <li><a href="template.html#faq">Excelセット（動作環境・利用範囲・領収書・返品など）</a></li>
      <li><a href="index.html">下書きツール・文例について</a></li>
    </ul>
  </div>
  <h2>お問い合わせ先</h2>
  <p>${contactLine}</p>
  <h2>お答えできないこと</h2>
  <p>個別の計画内容が運営指導で認められるかどうかなど、個別のご相談にはお答えしておりません。制度の解釈については、指定権者（自治体）にご確認ください。</p>
</div>`;

  return [
    { path: 'template.html', body: template, title: `課題を選ぶと文例が入る 個別支援計画のExcel【5領域対応】｜${CONFIG.siteName}`,
      description: `放デイ・児発の個別支援計画をExcelで。課題を選ぶだけで、支援目標・支援内容（5領域つき）・家族支援・移行支援に文例が入ります。モニタリング記録・記入例・文例全集PDFつき。${price}（税込）・買い切り。`,
      faq },
    { path: 'download.html', body: download, title: `個別支援計画書の様式ダウンロード（Excel・無料）【令和6年度・5領域対応】｜${CONFIG.siteName}`,
      description: 'こども家庭庁の参考様式と同じ項目の、個別支援計画書とモニタリング記録のExcel様式を無料でダウンロードできます。放課後等デイサービス・児童発達支援向け。登録不要。' },
    { path: 'tokushoho.html', body: tokushoho, title: `特定商取引法に基づく表記｜${CONFIG.siteName}`, description: `${CONFIG.siteName}の特定商取引法に基づく表記。` },
    { path: 'terms.html', body: terms, title: `利用規約｜${CONFIG.siteName}`, description: `${CONFIG.siteName}の利用規約。` },
    { path: 'contact.html', body: contact, title: `お問い合わせ｜${CONFIG.siteName}`, description: `${CONFIG.siteName}へのお問い合わせ。` },
  ];
}
