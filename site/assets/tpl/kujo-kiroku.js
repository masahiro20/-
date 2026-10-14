// 苦情受付・対応の記録。受付 → 事実確認 → 対応・改善策 → 回答 → 再発防止の流れで1枚にまとめる。
// 申出の内容（出来事）と申出人の言葉を分けて書く。申出人を責める言葉・言い訳に見える言葉は赤ペンで知らせる。
(function () {
  'use strict';
  var SECTOR = [['kaigo', '介護'], ['shogai', '障害福祉'], ['jido', '児童']];
  function sec(v) { return v.sector === 'shogai' || v.sector === 'jido' ? v.sector : 'kaigo'; }
  var METHOD = [['denwa', '電話'], ['raisho', '来所'], ['mendan', '面談・訪問のとき'], ['shomen', '書面（手紙）'], ['mail', 'メール'], ['ikenbako', '意見箱']];
  var FROM = {
    kaigo: [['honnin', '利用者本人'], ['kazoku', '家族'], ['other', 'その他'], ['tokumei', '匿名']],
    shogai: [['honnin', '利用者本人'], ['kazoku', '家族'], ['other', 'その他'], ['tokumei', '匿名']],
    jido: [['honnin', 'お子さん本人'], ['kazoku', '保護者・家族'], ['other', 'その他'], ['tokumei', '匿名']],
  };
  var PERSON = { kaigo: '利用者', shogai: '利用者', jido: 'お子さん' };
  var PLAN = { kaigo: 'ケアプラン・サービスの計画', shogai: '個別支援計画', jido: '個別支援計画（児童発達支援計画など）' };
  // 苦情の分類：[id, 選択肢, 改善策の文例（null は文例なし）]
  var CATS = [
    ['service', 'サービス内容', function (s) { return 'サービスの内容・手順を見直し、' + PLAN[s] + 'に沿って提供できているかを確認する。'; }],
    ['taiou', '職員の対応・言葉づかい', function () { return '言葉づかいや関わり方を職員会議でふり返り、ていねいな対応（接遇）の研修を行う。'; }],
    ['setsumei', '説明不足', function () { return '説明したことと相手の受け止めを記録に残す手順にする。予定や料金などの大事な変更は、書面でも伝える。'; }],
    ['jiko', '事故・けが', function () { return '事故報告書を作り、原因（本人・職員・環境）を分析して再発防止策を決める。'; }],
    ['sougei', '送迎', function () { return '送迎の時間・順番・乗り降りの手順を見直し、遅れるときの連絡の方法（誰が・いつ連絡するか）を決める。'; }],
    ['hiyou', '費用・請求', function () { return '請求の内容を確認し、誤りがあれば訂正する。料金は書面で説明し、変わるときは前もって知らせる。'; }],
    ['privacy', 'プライバシー', function () { return '個人情報とプライバシーの扱い（話す場所・書類の置き場所・写真の扱い）を職員全員で確認する。'; }],
    ['other', 'その他', null],
  ];
  var GENERAL = [
    ['furikaeri', '担当職員と管理者で場面をふり返り、対応の仕方を一緒に考える。'],
    ['manual', '手順書（マニュアル）を見直し、職員に周知する。'],
    ['kakunin', '管理者が一定期間、現場の対応を確認する。'],
  ];
  function measureOpts(v) {
    var s = sec(v);
    var list = CATS.filter(function (c) { return c[2] && v.cats.indexOf(c[0]) !== -1; }).map(function (c) { return ['m-' + c[0], c[2](s)]; });
    return list.concat(GENERAL);
  }
  var WISH = [
    ['shazai', '謝ってほしい'], ['setsumei', 'くわしく説明してほしい'], ['kaizen', '改善してほしい'],
    ['tantou', '担当の職員を変えてほしい'], ['hiyou', '費用を見直してほしい'], ['kiite', '話を聞いて、記録に残してほしい'],
  ];
  var CHECK = [
    ['tantou', '担当した職員から話を聞いた', '担当した職員から、そのときの様子を聞き取った。'],
    ['hoka', 'ほかの職員から話を聞いた', 'その場にいたほかの職員から話を聞いた。'],
    ['kiroku', '記録（ケース記録・日誌など）を確かめた', 'ケース記録・業務日誌などの記録を確かめた。'],
    ['honnin', '本人から話を聞いた', '本人からも話を聞いた。'],
    ['genba', '現場・設備・用具を確かめた', '現場（設備・用具）を確かめた。'],
    ['shorui', '契約書・請求書などを確かめた', '契約書・重要事項説明書・請求書などを確かめた。'],
  ];
  var TP = [['yes', '報告する'], ['kyohi', '申出人が望まない'], ['none', '第三者委員はいない']];
  var TACHIAI = [['no', '立ち会いは不要'], ['yes', '立ち会いを希望']];
  var STATUS = [['mikaito', '未回答', 'これから回答する'], ['kaito', '回答した']];
  var ANS_HOW = ['電話', '面談（来所・訪問）', '書面', 'メール', '掲示・おたより（匿名の場合）'];
  var REACT = [['ok', '納得された'], ['bubun', '一部納得された'], ['ng', '納得されていない']];
  var SHARE = [
    ['kaigi', '職員会議で共有した', '職員会議で、個人が分からない形で経過と改善策を共有した。'],
    ['moushi', '申し送りで全職員に伝えた', '申し送りで、改善策を全職員に伝えた。'],
    ['manual', '手順書（マニュアル）を見直した', '手順書（マニュアル）を見直した。'],
    ['kenshu', '研修を行う', '関係する内容の研修を行う。'],
    ['iinkai', '委員会（虐待防止・事故防止など）に報告した', '関係する委員会（虐待防止・事故防止など）に報告した。'],
    ['kohyo', '事業報告・広報誌で公表する（個人が分からない形）', '個人が分からない形で、苦情の件数と改善の内容を事業報告・広報誌で公表する。'],
  ];
  var FOLLOW = [['none', 'なし'], ['1', '1か月後'], ['3', '3か月後']];
  var GAIBU = {
    kaigo: '市町村（介護保険の担当窓口）、国民健康保険団体連合会（国保連）、都道府県社会福祉協議会の運営適正化委員会',
    shogai: '市町村（障害福祉の担当窓口）、都道府県、都道府県社会福祉協議会の運営適正化委員会',
    jido: '市町村（障害児支援の担当窓口）、都道府県、都道府県社会福祉協議会の運営適正化委員会',
  };
  var LAW = {
    kaigo: '指定居宅サービス等基準 第36条など',
    shogai: '指定障害福祉サービス等基準（平成18年厚生労働省令第171号）第39条など',
    jido: '指定通所支援基準（平成24年厚生労働省令第15号）第50条など',
  };
  // 申出人を責める・決めつける言葉と、言い訳に見える言葉
  var BLAME = ['クレーマー', 'モンスター', '勘違い', '思い込み', 'わがまま', 'しつこい', '理不尽', '言いがかり', '被害妄想', '神経質'];
  var EXCUSE = ['人手不足', '人手が足りな', '忙しかった', '忙しいため', '忙しく', '仕方がな', '仕方なく', 'しかたな', 'いつものこと', 'よくあること', '新人だから', '新人のため'];
  // 職員が書く欄だけを見る（申出人の言葉・希望・反応は、言われたとおりに書くので見ない）
  var TEXT_IDS = ['fact', 'checkText', 'measureText', 'ansText'];
  function found(v, list) {
    for (var i = 0; i < TEXT_IDS.length; i++) {
      var t = v[TEXT_IDS[i]] || '';
      for (var j = 0; j < list.length; j++) if (t.indexOf(list[j]) !== -1) return list[j];
    }
    return '';
  }
  function texts(list, ids) { return list.filter(function (x) { return ids.indexOf(x[0]) !== -1; }); }
  function addMonths(s, n) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return '';
    var d = new Date(Number(m[1]), Number(m[2]) - 1 + n, Number(m[3]));
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function quote(t) {
    t = t.trim();
    if (!t) return '';
    return /^[「『]/.test(t) ? t : '「' + t + '」';
  }
  function answered(v) { return v.status === 'kaito'; }

  Formdoc.run({
    title: '苦情受付・対応記録',
    ai: {
      role: '介護・障害福祉・児童の事業所の苦情受付担当者',
      doc: '苦情受付・対応記録',
      rules: [
        '申出の内容（出来事）と申出人の言葉は分けたまま書く。申出人の言葉は「」の中を変えない。',
        '申出人を責める言葉（勘違い・クレーマーなど）や、言い訳に見える書き方（人手不足のため仕方なく など）は使わない。',
        '確認できた事実と、確認できなかったことを区別して書く。推測で事実を足さない。',
        '改善策は「気をつける」「徹底する」のようなあいまいな言い方を避け、誰が・いつ・何をするかが分かるように書く。',
        '氏名は書かず、空欄や（　）は推測で埋めずに【要確認】と書く。',
      ],
    },
    blocks: [
      { title: '受付', fields: [
        { id: 'sector', type: 'seg', label: '業種', options: SECTOR, profile: 'svc' },
        { id: 'office', type: 'text', label: '事業所名', ph: '例：〇〇デイサービス', profile: 'office' },
        { id: 'date', type: 'date', label: '受付日', today: true, half: true },
        { id: 'time', type: 'time', label: '時刻', half: true },
        { id: 'method', type: 'seg', label: '受付の方法', options: METHOD },
        { id: 'from', type: 'seg', label: '申出人', options: function (v) { return FROM[sec(v)]; }, def: 'kazoku' },
        { id: 'fromNote', type: 'text', label: '申出人（続柄など）', hint: '氏名は事業所の決まりに沿って', ph: '例：〇〇さんの長女', show: function (v) { return v.from !== 'tokumei'; } },
        { id: 'writer', type: 'text', label: '受付担当者（記入者）', ph: '例：福祉 花子', profile: 'writer', half: true },
        { id: 'boss', type: 'text', label: '苦情解決責任者', ph: '例：管理者 〇〇', profile: 'boss', half: true },
      ] },
      { title: '苦情の内容', note: '申出の内容（出来事）と、申出人の言葉は分けて書きます。感想や推測は入れません。', fields: [
        { id: 'cats', type: 'chips', label: '苦情の分類', options: CATS.map(function (c) { return [c[0], c[1]]; }) },
        { id: 'fact', type: 'textarea', label: '申出の内容（いつ・どこで・何があったと言われたか）', hint: '氏名は書かないでください', rows: 3, ph: '例：10月3日の夕方の送迎で、予定より30分ほど遅れて到着した。遅れるという連絡はなかった、とのこと。' },
        { id: 'words', type: 'textarea', label: '申出人の言葉（言われたとおりに）', rows: 2, ph: '例：連絡もなく30分も外で待たされた。仕事に遅れてしまった。' },
        { id: 'wish', type: 'chips', label: '申出人の希望', options: WISH },
        { id: 'wishText', type: 'text', label: '希望の補足', ph: '例：遅れるときは、必ず電話がほしい' },
      ] },
      { title: '第三者委員への報告', note: '受け付けた苦情は、苦情解決責任者と第三者委員にすべて報告します（申出人がはっきり断った場合を除く）。', fields: [
        { id: 'tp', type: 'seg', label: '第三者委員への報告', options: TP },
        { id: 'tachiai', type: 'seg', label: '話し合いへの第三者委員の立ち会い', options: TACHIAI, show: function (v) { return v.tp === 'yes'; } },
      ] },
      { title: '事実の確認', fields: [
        { id: 'checkHow', type: 'chips', list: true, label: '確かめた方法', options: CHECK.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'checkText', type: 'textarea', label: '確認できたこと・できなかったこと', rows: 3, ph: '例：運行記録では、到着は予定より25分遅れていた。前の利用者の乗車に時間がかかり、遅れの連絡はしていなかった。' },
      ] },
      { title: '対応・改善策', fields: [
        { id: 'measures', type: 'chips', list: true, label: '改善策', hint: '苦情の分類に合う文例が出ます', options: measureOpts },
        { id: 'measureText', type: 'textarea', label: '改善策の補足（誰が・いつ・何をするか）', ph: '例：10月10日から、送迎が10分以上遅れるときは、運転する職員が事務所に連絡し、事務所からご家族に電話する。' },
      ] },
      { title: '申出人への回答', fields: [
        { id: 'status', type: 'seg', label: '回答', options: STATUS },
        { id: 'ansPlan', type: 'date', label: '回答の予定日', show: function (v) { return !answered(v); } },
        { id: 'ansDate', type: 'date', label: '回答した日', half: true, show: answered },
        { id: 'ansHow', type: 'select', label: '回答の方法', options: ANS_HOW, half: true, show: answered },
        { id: 'ansText', type: 'textarea', label: '回答した内容', rows: 2, ph: '例：事実確認の結果と、遅れるときの連絡の方法を決めたことを説明し、お詫びした。', show: answered },
        { id: 'react', type: 'seg', label: '申出人の反応', options: REACT, show: answered },
        { id: 'reactText', type: 'textarea', label: '反応の補足', ph: '例：「次から連絡をもらえるなら安心です」と話された。', show: answered },
      ] },
      { title: '再発防止と完了', fields: [
        { id: 'share', type: 'chips', list: true, label: '職員への共有・再発防止', options: SHARE.map(function (x) { return [x[0], x[1]]; }), def: ['kaigi'] },
        { id: 'follow', type: 'seg', label: '改善状況を申出人・第三者委員に報告', options: FOLLOW, def: '1' },
        { id: 'gaibu', type: 'seg', label: '外部の相談窓口', options: [['yes', '申出人に伝えた'], ['no', 'まだ伝えていない']] },
        { id: 'closeDate', type: 'date', label: '完了日' },
      ] },
    ],
    build: function (v, H) {
      var s = sec(v);
      var tokumei = v.from === 'tokumei';
      var fromLabel = H.label(FROM[s], v.from);
      var cats = texts(CATS, v.cats).map(function (c) { return c[1]; });
      var wish = texts(WISH, v.wish).map(function (x) { return x[1]; });
      if (v.wishText.trim()) wish.push(v.wishText.trim());
      var checks = texts(CHECK, v.checkHow).map(function (x) { return x[2]; });
      var measures = measureOpts(v).filter(function (m) { return v.measures.indexOf(m[0]) !== -1; }).map(function (m) { return m[1]; });
      if (v.measureText.trim()) measures.push(v.measureText.trim());
      var share = texts(SHARE, v.share).map(function (x) { return x[2]; });

      var tpText = v.tp === 'yes'
        ? '報告する（報告日：　　年　　月　　日）。話し合いへの立ち会い：' + (v.tachiai === 'yes' ? '希望あり' : '不要')
        : v.tp === 'kyohi' ? '申出人が第三者委員への報告を望まないため、報告しない。'
          : '第三者委員を置いていない。';
      if (tokumei && v.tp !== 'yes') tpText += '（匿名の苦情も、第三者委員に報告して対応します）';

      var ans;
      if (answered(v)) {
        ans = [
          ['回答日・方法', 'ansWhen', H.date(v.ansDate) + '　' + v.ansHow],
          ['回答した内容', 'ansText', v.ansText.trim() || (tokumei
            ? '匿名のため、受け付けたことと対応・改善策を、掲示（おたより）で知らせた。'
            : 'お申し出いただいたことへのお礼と、ご心配・ご不便をおかけしたことへのお詫びを伝えた。確認した事実と、対応・改善策を説明した。')],
          ['申出人の反応', 'react', H.label(REACT, v.react) + '。' + (v.reactText.trim() ? '\n' + quote(v.reactText) : '')],
        ];
      } else {
        ans = [['回答', 'ansWhen', '未回答（回答の予定日：' + H.date(v.ansPlan) + '）。受け付けたことと、回答の予定を申出人に伝える。']];
      }

      var followDate = v.follow !== 'none' ? addMonths(answered(v) && v.ansDate ? v.ansDate : v.date, Number(v.follow)) : '';
      var followText = v.follow === 'none' ? '改善を約束した事項がないため、報告は行わない。'
        : (followDate ? H.date(followDate) : '　　年　　月　　日') + 'ごろ（' + H.label(FOLLOW, v.follow) + '）に、改善の状況を申出人' + (v.tp === 'yes' ? 'と第三者委員' : '') + 'に報告する。';
      var closeText = v.closeDate ? H.date(v.closeDate)
        : answered(v) && v.react === 'ng' ? '未完了（申出人が納得されていないため、話し合いを続ける）'
          : '';

      return {
        title: '苦情受付・対応記録',
        left: H.label(SECTOR, s) + (v.office.trim() ? '\n' + v.office.trim() : ''),
        right: '受付番号：No.\n記入者：' + v.writer.trim(),
        sections: [
          { h: '受付', rows: [
            ['受付日時', 'when', H.date(v.date) + '　' + H.time(v.time)],
            ['受付の方法', 'method', H.label(METHOD, v.method)],
            ['申出人', 'from', tokumei ? '匿名' : fromLabel + (v.fromNote.trim() ? '（' + v.fromNote.trim() + '）' : '')],
            ['対象の' + PERSON[s], 'person', '', '（〇〇さんなど、事業所の決まりに沿って記入）'],
            ['受付担当者', 'writer', v.writer.trim()],
            ['苦情解決責任者', 'boss', v.boss.trim()],
            ['第三者委員', 'tp', tpText],
          ] },
          { h: '苦情の内容', rows: [
            ['分類', 'cats', cats.join('、'), '（苦情の分類を選ぶと入ります）'],
            ['申出の内容', 'fact', v.fact.trim(), '（いつ・どこで・何があったと言われたかを記入）'],
            ['申出人の言葉', 'words', quote(v.words), '（申出人の言葉を、言われたとおりに記入）'],
            ['申出人の希望', 'wish', H.bullets(wish), '（申出人の希望を選ぶと入ります）'],
          ] },
          { h: '事実確認', rows: [
            ['確かめた方法', 'checkHow', checks.join(''), '（確かめた方法を選ぶと入ります）'],
            ['確認できたこと', 'checkText', v.checkText.trim(), '（確認できたこと・できなかったことを記入）'],
          ] },
          { h: '対応・改善策', rows: [
            ['改善策', 'measures', H.bullets(measures), '（改善策を選ぶと入ります）'],
          ] },
          { h: '申出人への回答', rows: ans },
          { h: '再発防止・完了', rows: [
            ['職員への共有', 'share', H.bullets(share), '（共有の方法を選ぶと入ります）'],
            ['改善状況の報告', 'follow', followText],
            ['外部の相談窓口', 'gaibu', (v.gaibu === 'yes' ? '申出人に伝えた：' : '（まだ伝えていない）') + GAIBU[s]],
            ['完了日', 'close', closeText, '　　年　　月　　日'],
            ['確認', 'check', '', '（苦情解決責任者の確認欄）'],
          ] },
        ],
        foot: '苦情を受け付けたときは、その内容などを記録することが運営基準で決められています（' + LAW[s] + '）。この記録は、個人が分からない形にして、職員の共有と再発防止に使います。',
      };
    },
    info: function (v) {
      var steps = [
        ['受付', v.cats.length > 0 || !!v.fact.trim()],
        ['事実確認', v.checkHow.length > 0 || !!v.checkText.trim()],
        ['対応', v.measures.length > 0 || !!v.measureText.trim()],
        ['回答', answered(v)],
        ['再発防止', v.share.length > 0],
        ['完了', !!v.closeDate],
      ];
      return '<span class="coverage-label">対応の流れ</span>' + steps.map(function (x) { return '<span>' + x[0] + '：' + (x[1] ? '済' : 'まだ') + '</span>'; }).join('');
    },
    warn: function (v) {
      var b = found(v, BLAME);
      if (b) return '「' + b + '」のように、申出人を責めたり決めつけたりする言葉が入っています。記録は、申出人や第三者委員、市町村が読むこともあります。「〇〇と話された」「〇〇を確かめた」のように、言葉と事実をそのまま書きましょう。';
      var e = found(v, EXCUSE);
      if (e) return '「' + e + '」のような書き方は、言い訳に読まれやすくなります。理由を書くときは、事実（その時間の職員の人数・何があったか）と、事業所として何を変えるかを一緒に書きましょう。';
      if (!answered(v)) return '申出人への回答が「未回答」のままです。すぐに答えられないときも、まず「受け付けたこと」と「いつまでに・誰が回答するか」を伝え、回答の予定日を入れましょう。回答するまで、この苦情は完了になりません。';
      if (!v.cats.length) return '「二」で、苦情の分類を選んでください。分類ごとに改善策の文例が出ます。';
      if (!v.fact.trim() && !v.words.trim()) return '「二」に、申出の内容（出来事）と申出人の言葉を分けて書きましょう。';
      if (v.tp === 'none') return '国の指針では、苦情解決に客観性を持たせるため、第三者委員を置くこととされています（社会福祉事業を行う事業者が対象。ほかの事業者も参考にすることが望まれています）。置いていない場合は、法人で検討しましょう。';
      if (v.from === 'tokumei' && v.tp !== 'yes') return '匿名の苦情（意見箱など）も、第三者委員に報告して対応します。';
      if (!v.checkHow.length && !v.checkText.trim()) return '「四」で、事実をどうやって確かめたかを選びましょう。申出人の話だけで結論を出さず、記録や職員の話も確かめます。';
      if (v.react === 'ng') return '申出人が納得されていません。話し合いを続け、必要に応じて第三者委員の助言や立ち会いを求めましょう。事業所のほかに相談できる窓口（市町村・運営適正化委員会など）があることも伝えます。';
      if (v.gaibu !== 'yes') return '申出人には、事業所のほかに相談できる窓口（市町村' + (sec(v) === 'kaigo' ? '・国保連' : '') + '・運営適正化委員会）があることも伝えましょう。';
      if (!v.share.length) return '再発防止のため、職員への共有の方法を選びましょう。';
      if (!v.closeDate) return '対応が終わったら、完了日を入れましょう。改善を約束したことは、しばらくたってから申出人と第三者委員に結果を報告します。';
      return '';
    },
  });
})();
