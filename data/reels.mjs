// Instagram リールの台本。動画（products/reels/make.mjs）と、インスタから来た人向けのLP（start.html）の両方がここを使う。
// 動画の中の操作は、本物のサイトを開いて実際にタップして撮る。
//
// 組み立て（どの動画も同じ型）：
//   1秒目：現場の「あるある」で手を止めてもらう（hook）→ 解決の一言 → タップするだけの操作（短く）
//   → 「完成！」のごほうび（badge）→ 保存してね・コメントしてね（最後の案内）
// 声は、隣の席の先輩が教えてくれるような話し言葉。共感の一言は落ち着いた声（style: 'Neutral'）、紹介は明るい声。
//
//  hook：最初の大きな文字（<br>で改行。null なら場面のイラストから始める）。sayHook / hookStyle：その読み上げ
//  steps：{ at: 秒, cap: 上の字幕, say: 読み上げ, style } { at, tap: セレクタ } { at, type: セレクタ, text, dur }
//         { at, scroll: セレクタ, dur, offset } { at, badge: '完成！' } { at, scene: 場面ID, time, title, sub, say }
//  セレクタは、デモするページ（page）の中の要素。チェックボックスは自動で外側の label をタップする
//  story: true の動画は、LPの「リールで紹介したツール」には並べない（同じツールの紹介になるため）
//  lpDemo: true の動画は、画面操作の部分を LP（start.html）にも載せる
export const REELS = [
  {
    id: 'intro', no: 0, sector: 'all', page: 'index.html', tool: 'index.html', toolName: 'ふくしのおたすけ帳（トップ）',
    title: '福祉の書類、選ぶだけで下書きできるの知ってた？',
    hook: '福祉の書類、<br><em>選ぶだけ</em>で<br>下書きできるの<br>知ってた？',
    sayHook: '福祉の書類って、選ぶだけで、下書きできるの、知ってた？',
    length: 15,
    steps: [
      { at: 0, cap: '介護・障害福祉・児童の<br><em>19種類</em>の書類に対応', say: '介護も、障害福祉も、児童も、ぜんぶ使えるよ。' },
      { at: 0.3, scroll: '.hero-jump', dur: 0.8, offset: 120 },
      { at: 2.6, tap: '.jump-kaigo' },
      { at: 3.4, cap: 'たとえば、<br><em>ヒヤリハット報告書</em>', say: 'たとえば、転びそうになったときの報告書なら、' },
      { at: 3.6, scroll: '.tool-grid', dur: 0.6, offset: 30 },
      { at: 4.6, tap: '.tool-grid .tool-card:nth-child(2)' },
      { at: 5.6, cap: '起きそうだったことと<br>要因を<em>タップ</em>', say: '何が起きそうだったか、タップするだけ。' },
      { at: 5.8, scroll: '[data-f="what"]', dur: 0.6, offset: 70 },
      { at: 6.8, tap: 'input[value="tento-a"]' },
      { at: 7.4, scroll: '[data-f="person"]', dur: 0.6, offset: 70 },
      { at: 8.2, tap: 'input[value="kin"]' },
      { at: 8.8, tap: 'input[value="hanare"]' },
      { at: 9.6, cap: '対策まで入った<br><em>報告書の下書き</em>が完成', say: '対策まで入った報告書が、もう完成！' },
      { at: 9.8, scroll: '#fdDoc', dur: 0.8, offset: 10 },
      { at: 10.8, badge: '完成！' },
    ],
    caption: '福祉の書類、選ぶだけで下書きできるサイトを作りました。\n\n✅ 個別支援計画・モニタリング・支援記録\n✅ 介護記録・申し送り・事故報告・ヒヤリハット\n✅ 委員会の議事録・研修の年間計画と記録\n\n介護・障害福祉・児童支援の19種類。登録なし・無料。入力した内容はどこにも送信されません。\n\n📌 保存して、書類のときに開いてね\n💬「この書類もほしい！」はコメントで教えてください\n▶ プロフィールのリンクから使えます',
    tags: ['介護', '障害福祉', '放課後等デイサービス', '福祉の仕事'],
  },
  {
    id: 'kiroku', no: 1, lpDemo: true, sector: 'kaigo', page: 'kaigo-kiroku.html', tool: 'kaigo-kiroku.html', toolName: '介護記録（ケース記録）の文例',
    title: '記録に「不穏」って書いたこと、ある？',
    hook: '記録に<br><em>「不穏」</em>って<br>書いたこと、<br>ある？',
    sayHook: '記録に、不穏って、書いたこと、ある？', hookStyle: 'Neutral',
    length: 13,
    steps: [
      { at: 0, cap: '実はそれ、<br><em>伝わらない記録</em>かも', say: 'じつはそれ、次の人に、伝わらない記録かも。', style: 'Neutral' },
      { at: 0.4, scroll: '[data-f="scene"]', dur: 0.6, offset: 60 },
      { at: 2.6, cap: '場面と様子を<br><em>タップ</em>するだけ', say: 'どんな場面だったか、タップするだけで、' },
      { at: 2.8, tap: '[data-f="scene"] [data-v="kimochi"]' },
      { at: 3.4, scroll: '[data-f="facts"]', dur: 0.5, offset: 70 },
      { at: 4.1, tap: 'input[value="kimochi-kitaku"]' },
      { at: 4.5, type: '[data-f="words"]', text: '家に帰らないと', dur: 0.8 },
      { at: 5.6, scroll: '[data-f="resp"]', dur: 0.5, offset: 70 },
      { at: 6.3, tap: 'input[value="kimochi-keichou"]' },
      { at: 6.8, scroll: '[data-f="result"]', dur: 0.4, offset: 70 },
      { at: 7.4, tap: 'input[value="kimochi-ochitsuita"]' },
      { at: 8.0, cap: '事実・言葉・対応・結果<br>の<em>伝わる記録</em>に', say: '事実、言葉、対応、結果の、伝わる記録に、早変わり！' },
      { at: 8.2, scroll: '#fdDoc', dur: 0.8, offset: 10 },
      { at: 9.2, badge: '完成！' },
    ],
    caption: '「不穏」「落ち着きがない」「徘徊」…記録でつい使いがちな言葉、読む人によって受け取り方がちがいます。\n\n場面と様子をタップするだけで、\n事実 → 本人の言葉 → 対応 → 結果\nの順に並んだ「伝わる記録」の文章ができます。あいまいな言葉には、言い換えのヒントも。\n\n📌 保存して、記録のときに開いてね\n💬 あなたの施設の「記録のルール」もコメントで教えてください\n▶ プロフィールのリンクから無料で使えます',
    tags: ['介護記録', '介護士', '介護職', '介護福祉士'],
  },
  {
    id: 'iinkai', no: 2, sector: 'all', page: 'iinkai.html', tool: 'iinkai.html', toolName: '委員会の議事録の下書き',
    title: '委員会の議事録、毎回ゼロから書いてない？',
    hook: '委員会の議事録、<br>毎回<em>ゼロから</em><br>書いてない？',
    sayHook: '委員会の議事録、毎回、ゼロから書いてない？', hookStyle: 'Neutral',
    length: 13,
    steps: [
      { at: 0, cap: '話し合った議題を<br><em>選ぶだけ</em>', say: '話し合った議題を、選ぶだけ。' },
      { at: 0.3, scroll: '[data-f="agenda"]', dur: 0.8, offset: 60 },
      { at: 1.6, tap: 'input[value="gyakutai-jokyo"]' },
      { at: 2.2, tap: 'input[value="gyakutai-check"]' },
      { at: 2.8, tap: 'input[value="kousoku-youken"]' },
      { at: 3.6, cap: '検討した内容も、決定事項も<br><em>ぜんぶ入る</em>', say: '検討した内容も、決まったことも、ぜんぶ入るよ。' },
      { at: 3.8, scroll: '#fdDoc .fd-table:nth-of-type(2)', dur: 0.9, offset: 10 },
      { at: 5.0, badge: '完成！' },
      { at: 7.4, cap: '次回の開催時期まで<br><em>自動で</em>入る', say: '次の開催時期まで、自動で入るの、うれしい。' },
      { at: 7.6, scroll: '#fdDoc .fd-table:nth-of-type(3)', dur: 0.8, offset: 10 },
    ],
    caption: '義務になっている委員会。開くのと同じくらい「議事録を残すこと」が大変…。\n\n委員会の種類と、話し合った議題をタップするだけで、\n・検討した内容\n・決まったこと\n・職員への周知の方法\n・次回の開催時期\nまで入った議事録の下書きができます。\n\n虐待防止・身体拘束適正化・感染症対策・事故防止・BCP、一体開催にも対応。\n\n📌 次の委員会の前に、保存しておいてね\n▶ プロフィールのリンクから無料で使えます',
    tags: ['虐待防止委員会', '身体拘束適正化', '運営指導', '管理者'],
  },
  {
    id: 'kesseki', no: 3, sector: 'shogai', page: 'kesseki.html', tool: 'kesseki.html', toolName: '欠席時対応の記録',
    title: '欠席の電話、記録は「お大事に」だけ…？',
    hook: '欠席の電話、<br>記録は<br><em>「お大事に」</em><br>だけ…？',
    sayHook: 'お休みの電話、記録は、お大事にで、終わってない？', hookStyle: 'Neutral',
    length: 12,
    steps: [
      { at: 0, cap: 'それだと<br><em>加算の記録</em>として足りないかも', say: 'それだと、加算の記録としては、足りないかも。', style: 'Neutral' },
      { at: 0.3, scroll: '[data-f="reason"]', dur: 0.6, offset: 70 },
      { at: 2.8, cap: '理由と、伝えたことを<br><em>タップ</em>', say: '理由と伝えたことを、タップするだけ。' },
      { at: 3.0, tap: '[data-f="reason"] [data-v="netsu"]' },
      { at: 3.6, scroll: '[data-f="help"]', dur: 0.5, offset: 60 },
      { at: 4.4, tap: 'input[value="yasumu"]' },
      { at: 5.0, tap: 'input[value="jushin"]' },
      { at: 5.8, cap: '加算に必要な項目が<br><em>そろった記録</em>に', say: '加算に必要な項目が、そろった記録になるよ。' },
      { at: 6.0, scroll: '#fdDoc', dur: 0.8, offset: 10 },
      { at: 7.0, badge: '完成！' },
    ],
    caption: '欠席時対応加算、記録が「お大事に」だけだと、相談援助をした記録になりません。\n\n欠席の理由と、伝えたことをタップするだけで、\n・連絡を受けた日時（前々日／前日／当日）\n・連絡者と方法\n・欠席の理由\n・相談援助の内容\nがそろった記録の下書きができます。日付から加算の対象かどうかも自動でチェック。\n\n📌 電話のそばのスマホに保存しておいてね\n▶ プロフィールのリンクから無料で使えます',
    tags: ['欠席時対応加算', '放課後等デイサービス', '就労継続支援B型', '児発管'],
  },
  {
    id: 'renrakucho', no: 4, sector: 'jido', page: 'renrakucho.html', tool: 'renrakucho.html', toolName: '連絡帳の文例メーカー',
    title: '連絡帳、毎日同じ文になってない？',
    hook: '連絡帳、<br>毎日<em>同じ文</em>に<br>なってない？',
    sayHook: '連絡帳、毎日、おなじ文になってない？', hookStyle: 'Neutral',
    length: 13,
    steps: [
      { at: 0, cap: '今日やったこと・できたことを<br><em>タップ</em>', say: '今日やったことと、できたことを、タップするだけ。' },
      { at: 0.3, scroll: '.chips2', dur: 0.6, offset: 90 },
      { at: 1.2, tap: 'input[data-g="act"][value="park"]' },
      { at: 1.7, scroll: 'input[data-g="mood"]', dur: 0.4, offset: 110 },
      { at: 2.3, tap: 'input[data-g="mood"][value="smile"]' },
      { at: 2.8, scroll: 'input[data-g="done"]', dur: 0.4, offset: 110 },
      { at: 3.4, tap: 'input[data-g="done"][value="kashite"]' },
      { at: 4.0, cap: '保護者に伝わる文章が<br><em>すぐ完成</em>', say: '保護者さんに伝わる文章が、すぐ完成！' },
      { at: 4.2, scroll: '.note-card', dur: 0.8, offset: 10 },
      { at: 5.2, badge: '完成！' },
      { at: 7.4, cap: '言い回しも<br><em>ワンタップ</em>で変えられる', say: '言い回しも、ワンタップで、変えられるよ。' },
      { at: 8.0, tap: '#rShuffle' },
      { at: 9.4, tap: '#rShuffle' },
    ],
    caption: '放デイ・児発の連絡帳、毎日同じような文になってしまう…。\n\n今日の活動・様子・できたことをタップするだけで、保護者に伝わる連絡帳の文章ができます。「別の言い回しにする」で、表現も変えられます。\n名前は「〇〇さん」のままでOK。個人情報は入力しません。\n\n📌 保存して、お迎え前に開いてね\n💬 いつも書いている活動をコメントで教えてください（文例を増やします）\n▶ プロフィールのリンクから無料で使えます',
    tags: ['連絡帳', '放課後等デイサービス', '児童発達支援', '療育'],
  },
  {
    id: 'kenshu', no: 5, sector: 'all', page: 'kenshu-keikaku.html', tool: 'kenshu-keikaku.html', toolName: '研修・訓練の年間計画表',
    title: '法定研修、年に何回か、すぐ言える？',
    hook: '法定研修、<br>年に<em>何回</em>か<br>すぐ言える？',
    sayHook: '法定研修、年に何回やるか、すぐ答えられる？', hookStyle: 'Neutral',
    length: 12,
    steps: [
      { at: 0, cap: 'サービスの種類を<br><em>選ぶだけ</em>', say: 'サービスの種類を、選ぶだけで、' },
      { at: 0.3, scroll: '[data-f="svc"]', dur: 0.6, offset: 70 },
      { at: 1.4, tap: '[data-f="svc"] [data-v="k-shisetsu"]' },
      { at: 2.0, cap: '1年分の計画表が<br><em>一瞬で完成</em>', say: '1年分の計画表が、一瞬で完成！' },
      { at: 2.2, scroll: '#fdDoc', dur: 0.8, offset: 10 },
      { at: 3.2, badge: '完成！' },
      { at: 3.6, scroll: '#fdDoc .fd-grid', dur: 2.2, offset: -240 },
      { at: 6.2, cap: '回数の<em>目安</em>つき<br><small>（自治体の資料でも確認してね）</small>', say: '回数の目安も、ついてるよ。' },
      { at: 6.4, scroll: '#fdDoc .fd-grid-h', dur: 0.9, offset: 10 },
    ],
    caption: '虐待防止・身体拘束・感染症・BCP…\n義務の研修と訓練、委員会。サービスの種類で回数がちがうので、年間計画を作るのが毎年ひと苦労。\n\nサービスの種類を選ぶだけで、研修・訓練・委員会を12か月に割り振った年間計画表ができます。回数の目安つき。\n※回数は自治体によって異なるため、必ず指定権者の資料で確認してください。\n\n📌 年度初めの計画づくりに、保存しておいてね\n▶ プロフィールのリンクから無料で使えます',
    tags: ['法定研修', '研修計画', '運営指導', '介護施設'],
  },
  // ── 現場の1日（場面のイラスト＋声で、使っている場面が浮かぶように）──
  {
    id: 'genba-kaigo', no: 6, story: true, sector: 'kaigo', page: 'kaigo-kiroku.html', tool: 'kaigo-kiroku.html', toolName: '介護記録（ケース記録）の文例',
    title: '17:40、帰るまであと20分。記録がまだ3人分…',
    hook: null,
    length: 14,
    steps: [
      { at: 0, scene: 'kaigo-1740', time: '17:40', title: '帰るまで、<br>あと<em>20分</em>。', sub: '記録が、まだ3人分…', say: '5時40分。帰るまで、あと20分なのに、記録がまだ3人分…', style: 'Neutral' },
      { at: 3.6, scene: null, cap: 'そんな日は<br><em>スマホでタップ</em>', say: 'そんな日は、スマホで、タップするだけ。' },
      { at: 3.9, scroll: '[data-f="facts"]', dur: 0.6, offset: 70 },
      { at: 4.8, tap: 'input[value="shokuji-han"]' },
      { at: 5.3, tap: 'input[value="shokuji-muse"]' },
      { at: 5.8, scroll: '[data-f="resp"]', dur: 0.5, offset: 70 },
      { at: 6.5, tap: 'input[value="shokuji-toromi"]' },
      { at: 7.1, cap: '記録の文章が<br><em>そのまま完成</em>', say: '記録の文章が、そのまま完成！' },
      { at: 7.3, scroll: '#fdDoc', dur: 0.8, offset: 10 },
      { at: 8.3, badge: '完成！' },
      { at: 10.2, scene: 'kaigo-1800', time: '18:00', title: '今日は、<br><em>定時で帰れた！</em>', sub: '記録の時間を、利用者さんとの時間に。', say: '今日は、定時で帰れた！' },
    ],
    caption: '夕方5時40分。帰るまであと20分なのに、記録がまだ3人分…。そんな日、ありませんか？\n\nスマホで場面と様子をタップするだけで、事実 → 本人の言葉 → 対応 → 結果 の順に並んだ記録の文章ができます。コピーして記録ソフトに貼るだけ。\n\n📌 保存して、夕方に開いてね\n💬 「わかる…」と思ったら、同じ職場の人にも送ってみて\n▶ プロフィールのリンクから無料で使えます',
    tags: ['介護記録', '介護士', '介護職', '介護あるある'],
  },
  {
    id: 'genba-houday', no: 7, story: true, sector: 'jido', page: 'renrakucho.html', tool: 'renrakucho.html', toolName: '連絡帳の文例メーカー',
    title: '16:50、お迎えまであと10分。連絡帳がまだ5冊…',
    hook: null,
    length: 12,
    steps: [
      { at: 0, scene: 'houday-1650', time: '16:50', title: 'お迎えまで、<br>あと<em>10分</em>。', sub: '連絡帳が、まだ5冊…', say: 'お迎えまで、あと10分。連絡帳が、まだ5冊…', style: 'Neutral' },
      { at: 3.4, scene: null, cap: 'タップするだけで<br><em>連絡帳の文章</em>に', say: 'タップするだけで、連絡帳の文章に。' },
      { at: 3.7, scroll: '.chips2', dur: 0.5, offset: 90 },
      { at: 4.4, tap: 'input[data-g="act"][value="craft"]' },
      { at: 4.9, scroll: 'input[data-g="done"]', dur: 0.5, offset: 110 },
      { at: 5.6, tap: 'input[data-g="done"][value="challenge"]' },
      { at: 6.2, scroll: '.note-card', dur: 0.7, offset: 10 },
      { at: 7.0, badge: '完成！' },
      { at: 8.4, scene: 'houday-omukae', time: 'お迎えの時間', title: '「今日の様子、<br><em>よく分かります</em>」', sub: '保護者さんとの会話も、はずむ。', say: 'お迎えのとき、今日の様子、よく分かりますって、言われた！' },
    ],
    caption: 'お迎えまであと10分。連絡帳がまだ5冊…。放デイ・児発の夕方、こんな時間ありますよね。\n\n今日の活動・様子・できたことをタップするだけで、保護者に伝わる連絡帳の文章ができます。名前は「〇〇さん」のままでOK。\n\n📌 保存して、お迎え前に開いてね\n💬 「わかる…」と思ったら、同じ職場の人にも送ってみて\n▶ プロフィールのリンクから無料で使えます',
    tags: ['放課後等デイサービス', '連絡帳', '児童発達支援', '放デイあるある'],
  },
  {
    id: 'genba-kanri', no: 8, story: true, sector: 'all', page: 'kenshu-keikaku.html', tool: 'kenshu-keikaku.html', toolName: '研修・訓練の年間計画表',
    title: '運営指導の通知が届いた…研修の計画、ある？',
    hook: null,
    length: 12,
    steps: [
      { at: 0, scene: 'kanri-tsuchi', time: '月曜の朝', title: '運営指導の<br><em>通知</em>が届いた…', sub: '研修の計画、委員会の議事録…<br>そろってる？', say: '月曜の朝。運営指導の通知が届いた…研修の計画、ちゃんとある？', style: 'Neutral' },
      { at: 4.0, scene: null, cap: 'サービスを<br><em>選ぶだけ</em>で', say: 'サービスを、選ぶだけで、' },
      { at: 4.3, scroll: '[data-f="svc"]', dur: 0.5, offset: 70 },
      { at: 5.0, tap: '[data-f="svc"] [data-v="k-kyoju"]' },
      { at: 5.6, cap: '研修・訓練・委員会の<br><em>1年分の計画</em>が完成', say: '研修と訓練と委員会の、1年分の計画が完成！' },
      { at: 5.8, scroll: '#fdDoc', dur: 0.8, offset: 10 },
      { at: 6.8, badge: '完成！' },
      { at: 8.6, scene: 'kanri-done', time: 'その日のうちに', title: '準備、<br><em>間に合った！</em>', sub: '議事録・研修の記録の下書きも、無料で。', say: 'これで、準備も、間に合う！' },
    ],
    caption: '運営指導の通知が届いた…。研修の年間計画、委員会の議事録、研修の記録、そろっていますか？\n\nサービスの種類を選ぶだけで、研修・訓練・委員会を12か月に割り振った年間計画表ができます。委員会の議事録・研修の実施記録の下書きも、同じサイトで無料で作れます。\n※回数は自治体によって異なるため、必ず指定権者の資料で確認してください。\n\n📌 保存して、管理者さんにも送ってね\n▶ プロフィールのリンクから無料で使えます',
    tags: ['運営指導', '実地指導', '法定研修', '管理者'],
  },
];

// すべての投稿に足すハッシュタグ
export const COMMON_TAGS = ['ふくしのおたすけ帳'];

// 最後の案内の読み上げ（どの動画も同じ）
export const END_SAY = '無料で、登録もいらないよ。保存して、使ってみてね！';

// 声のクレジット（音声モデルの規約で、公開するときに必ず表記する）
export const VOICE_CREDIT = '音声：Style-Bert-VITS2モデル 小春音アミ／あみたろの声素材工房（https://amitaro.net/）';
