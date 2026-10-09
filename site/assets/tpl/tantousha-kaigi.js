// サービス担当者会議の要点（居宅サービス計画書 第4表）。居宅介護支援のケアマネジャー向け。
// 項目は老企第29号の第4表と記載要領（利用者名・作成者・開催日/場所/時間/回数・出席者・検討した項目・検討内容・結論・残された課題）。
(function () {
  'use strict';
  // 第4表は横長の様式なので、この書類だけ印刷をA4横にする（style.css の @page の既定値）
  var docEl = document.getElementById('fdDoc');
  if (docEl) docEl.classList.remove('doc-portrait');

  // [id, 選択肢, 開催の理由（書類に入る文）]
  var REASONS = [
    ['new', '新規（初めてケアプランを作る）', '新しく居宅サービス計画（ケアプラン）を作るため、原案について担当者から意見を聞いた。'],
    ['koushin', '要介護認定の更新', '要介護認定の更新（要介護　）を受けたため、居宅サービス計画を変える必要があるかを検討した。'],
    ['kubun', '区分変更', '要介護状態区分の変更の認定（要介護　 → 要介護　）を受けたため、居宅サービス計画を変える必要があるかを検討した。'],
    ['taiin', '退院・退所', '病院（施設）からの退院（退所）にあたり、家での生活に向けて居宅サービス計画を見直すため。'],
    ['henka', '状態の変化', '心身の状態の変化（　　）があり、居宅サービス計画の見直しが必要になったため。'],
    ['tsuika', 'サービスの追加・変更', 'サービスの追加・変更（　　）について、居宅サービス計画の原案を検討するため。'],
  ];
  var PLACES = [
    ['home', '自宅', '利用者の自宅'],
    ['office', '居宅介護支援事業所', '居宅介護支援事業所（　　）の相談室'],
    ['svc', 'サービス事業所', 'サービス事業所（　　）'],
    ['hosp', '病院・施設（退院前など）', '病院（施設）（　　）の面談室'],
    ['online', 'オンライン（テレビ電話装置など）', 'オンライン（テレビ電話装置等を使用）'],
    ['mix', '自宅＋オンラインの併用', '利用者の自宅（一部の担当者はテレビ電話装置等で参加）'],
  ];
  var CONSENT = [
    ['agree', '本人・家族の同意を得た'],
    ['none', '本人・家族はオンラインで参加していない'],
    ['yet', 'まだ同意を確認していない'],
  ];
  // 出席者：[選択肢, 所属（職種）, サービスの種類（サービス内容の調整で使う）]
  var PEOPLE = [
    ['本人', '', ''],
    ['家族', '', ''],
    ['ケアマネジャー', '居宅介護支援事業所（介護支援専門員）', ''],
    ['訪問介護', '訪問介護事業所（サービス提供責任者）', '訪問介護'],
    ['通所介護', '通所介護事業所（生活相談員）', '通所介護（デイサービス）'],
    ['通所リハビリ', '通所リハビリテーション事業所（理学療法士など）', '通所リハビリテーション'],
    ['福祉用具', '福祉用具貸与事業所（福祉用具専門相談員）', '福祉用具貸与'],
    ['訪問看護', '訪問看護事業所（看護師）', '訪問看護'],
    ['訪問リハビリ', '訪問リハビリテーション事業所（理学療法士など）', '訪問リハビリテーション'],
    ['短期入所', '短期入所事業所（生活相談員）', '短期入所（ショートステイ）'],
    ['主治医', '主治医（　　医院）', ''],
    ['病院の退院支援の担当', '病院（医療ソーシャルワーカー・退院支援の看護師）', ''],
    ['地域包括支援センター', '地域包括支援センター（主任介護支援専門員）', ''],
  ];
  var SHOUKAI = [
    ['doc', '文書（照会の用紙）で意見をもらった', '文書で照会した'],
    ['tel', '電話で意見を聞いた', '電話で照会した'],
    ['fax', 'FAX・メールで意見をもらった', 'FAX（メール）で照会した'],
    ['visit', '会議の前に会って意見を聞いた', '会議の前に面談して意見を聞いた'],
  ];
  // 検討した項目：[id, 選択肢, 検討内容の文例, 結論の文例]（{HV}{FV}{SVC} は入力した内容に置きかえる）
  var TOPICS = [
    ['kibou', '本人・家族の希望（生活に対する意向）', '{HV}{FV}意向をふまえ、ケアプラン原案の「利用者及び家族の生活に対する意向」と「総合的な援助の方針」を全員で確認した。', '本人・家族の意向を、原案のとおりケアプランに位置づける。'],
    ['kadai', '生活の課題（ニーズ）と目標', 'アセスメントの結果から、生活の課題（　　）と、長期目標・短期目標の内容と期間が本人の状態に合っているかを、各担当者の専門的な見地から検討した。', '課題と目標は原案のとおりとする（変更する場合：　　）。'],
    ['service', 'サービス内容の調整（種類・回数・時間・担当）', '原案に位置づけたサービスについて、内容・提供の方法・気をつけること・回数・時間・担当の事業所を確認した。{SVC}', '各サービスを原案のとおり（　年　月　日）から開始（継続）する。各事業所は、サービスの計画（個別の計画）を作り、ケアマネジャーに提出する。'],
    ['tentou', 'リスク：転倒', '（場所・時間帯：　　）でふらつきがあり、転倒のおそれがある。移動の方法、手すりや福祉用具の使い方、見守りが必要な場面を検討した。', '（場面）では、（担当）が見守り・声かけをする。転倒した、またはしそうになったときは、ケアマネジャーに連絡し、情報を共有する。'],
    ['fukuyaku', 'リスク：服薬', '薬の飲み忘れ（飲み間違い）があることを共有し、服薬の管理の方法（お薬カレンダー・一包化・声かけなど）を検討した。', '（担当）が訪問時に服薬を確認する。飲み忘れが続くときは、ケアマネジャーから主治医・薬局に相談する。'],
    ['eiyou', 'リスク：栄養・水分・口の健康', '食事の量や体重の変化、水分のとり方、むせ込み、口の中の状態について情報を共有し、対応を検討した。', '（担当）が食事・水分の量を確認し、体重を月1回はかる。むせ込みが増えたときは、主治医に相談する。'],
    ['kazoku', '家族の負担（介護する人の休息）', '主な介護者である家族（　）の体調と負担の状況を確認し、休息がとれる方法を検討した。', '家族の休息のため、（短期入所・通所の回数を増やすなど）を検討する。家族が困ったときの相談先をケアマネジャーが伝える。'],
    ['kinkyu', '緊急時の対応・連絡先', '体調が急に変わったときや、災害のときの対応と、連絡の順番（家族・主治医・各事業所・ケアマネジャー）を確認した。', '緊急時の連絡先の一覧をケアマネジャーが作り、自宅と各事業所で共有する。'],
    ['fukushi', '福祉用具の必要性（貸与を続けるかの確認）', '福祉用具（　　）の使用状況と、今の心身の状態で引き続き必要かどうかを検討した。', '福祉用具（　　）は、（理由）のため引き続き必要と判断し、貸与を継続する。'],
    ['iryou', '医療との連携（主治医の意見）', '主治医の意見（病状・医療上の注意点・サービスを使うときの留意事項）を共有し、各サービスで気をつけることを確認した。', '主治医の留意事項をふまえてサービスを提供する。体調の変化は、（担当）から主治医・ケアマネジャーに伝える。'],
    ['taiin', '退院後の生活の準備', '退院後の生活に向けて、病院から聞いた状態（ADL＝食事・トイレ・移動などの日常の動作、医療的な処置）と、家の環境・介護の体制を確認した。', '退院日（　月　日）に合わせてサービスを開始する。退院後1週間をめどに、ケアマネジャーが自宅を訪問して様子を確認する。'],
  ];
  var NOKORI = [
    ['shigen', '地域に足りないサービスがある', '（　　）の利用が必要と考えられるが、地域に（　　）が足りないため、現時点では使えていない。ケアマネジャーが引き続き情報を集める。'],
    ['kibou', '本人の希望で使わなかったサービス', '（　　）の利用を提案したが、本人の希望により今回は使わないこととした。状態を見て、改めて提案する。'],
    ['kansatsu', '新しいサービスの様子を見る', '新しく始めたサービスの回数・内容が合っているかを、開始から1か月ほどで確認する。'],
    ['shoukai', '照会の回答を待っている', '（　　）への照会の回答が届いたら、内容を担当者に共有する。'],
  ];
  var NEXT = [
    ['3', '3か月後ごろ'],
    ['6', '6か月後ごろ'],
    ['koushin', '要介護認定の更新のとき'],
    ['henka', '状態が変わったとき'],
  ];

  function hasOnline(v) { return v.place === 'online' || v.place === 'mix'; }
  function q(s) { return String(s || '').trim().replace(/^「|」$/g, ''); }

  Formdoc.run({
    title: 'サービス担当者会議の要点',
    ai: {
      role: '居宅介護支援事業所のケアマネジャー（介護支援専門員）',
      doc: '居宅サービス計画書 第4表「サービス担当者会議の要点」',
      rules: [
        '本人・家族の言葉は「」で、そのまま残す。',
        '主語（誰が・誰に・何をするか）をはっきり書き、第三者が読んでも分かるようにする。',
        '検討内容と結論を分けて書く。結論は「〜とする」と決まったことを書く。',
        '（　）の空欄は推測で埋めず、【要確認】と書く。共通でない略語や専門用語は使わない。',
      ],
    },
    blocks: [
      { title: '会議の概要', fields: [
        { id: 'reason', type: 'select', label: '開催の理由', options: REASONS.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'user', type: 'text', label: '利用者名', ph: '例：〇〇　〇〇', half: true },
        { id: 'cm', type: 'text', label: '計画作成者（ケアマネジャー）', ph: '例：〇〇　〇〇', half: true },
        { id: 'date', type: 'date', label: '開催日', today: true, half: true },
        { id: 'time', type: 'text', label: '時間', ph: '例：14:00〜14:40', half: true },
        { id: 'place', type: 'select', label: '開催場所', options: PLACES.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'consent', type: 'select', label: 'オンラインで参加する本人・家族の同意', options: CONSENT, def: 'yet', show: hasOnline },
        { id: 'kai', type: 'text', label: '開催回数', ph: '例：3', half: true },
      ] },
      { title: '出席者', small: '会議に出た人', fields: [
        { id: 'members', type: 'chips', options: PEOPLE.map(function (x) { return [x[0], x[0]]; }), def: ['本人', '家族', 'ケアマネジャー', '訪問介護', '通所介護', '福祉用具'] },
        { id: 'rel', type: 'text', label: '家族の続柄', ph: '例：長女', show: function (v) { return v.members.indexOf('家族') !== -1; } },
      ] },
      { title: '欠席者と照会', small: '出られなかった担当者', fields: [
        { id: 'absent', type: 'chips', options: PEOPLE.filter(function (x) { return x[1] && x[0] !== 'ケアマネジャー'; }).map(function (x) { return [x[0], x[0]]; }), def: ['主治医'] },
        { id: 'why', type: 'text', label: '出られなかった理由', ph: '例：診療の時間と重なったため', show: function (v) { return v.absent.length > 0; } },
        { id: 'how', type: 'select', label: '照会の方法', options: SHOUKAI.map(function (x) { return [x[0], x[1]]; }), show: function (v) { return v.absent.length > 0; } },
        { id: 'qdate', type: 'date', label: '照会した日', half: true, show: function (v) { return v.absent.length > 0; } },
        { id: 'ans', type: 'textarea', label: '照会の回答（言葉のまま）', ph: '例：歩行は安定している。転倒に気をつけて、今のサービスを続けてよい。', show: function (v) { return v.absent.length > 0; } },
      ] },
      { title: '検討した項目', small: '話し合ったもの', note: '選んだ項目ごとに、右の表に「検討内容」と「結論」の文例が入ります。文例は右の書類をクリックして書き換えられます。', fields: [
        { id: 'topics', type: 'chips', list: true, options: TOPICS.map(function (x) { return [x[0], x[1]]; }), def: ['kibou', 'service', 'kinkyu'] },
        { id: 'xTopic', type: 'text', label: 'そのほかの検討した項目', ph: '例：入浴の方法' },
        { id: 'xNaiyou', type: 'textarea', label: 'その項目の検討内容', ph: '例：自宅の浴槽をまたぐのが難しくなっているため、通所介護での入浴を検討した。', show: function (v) { return !!v.xTopic.trim(); } },
        { id: 'xKetsu', type: 'textarea', label: 'その項目の結論', ph: '例：通所介護の利用日（週2回）に入浴する。', show: function (v) { return !!v.xTopic.trim(); } },
      ] },
      { title: '本人・家族の言葉', small: '「」でそのまま残す', fields: [
        { id: 'hv', type: 'text', label: '本人の言葉', ph: '例：できるだけ、この家で暮らしたい' },
        { id: 'fv', type: 'text', label: '家族の言葉', ph: '例：夜のトイレが心配。仕事は続けたい' },
      ] },
      { title: '残された課題と次回', fields: [
        { id: 'nokori', type: 'chips', label: '残された課題', options: NOKORI.map(function (x) { return [x[0], x[1]]; }), def: ['kansatsu'] },
        { id: 'nokoriX', type: 'textarea', label: 'そのほかの課題', ph: '例：住宅改修（玄関の手すり）は、見積もりがそろってから家族と相談する。' },
        { id: 'next', type: 'seg', label: '次回の開催時期', options: NEXT, def: 'koushin' },
      ] },
    ],
    build: function (v, H) {
      var reason = REASONS.filter(function (x) { return x[0] === v.reason; })[0] || REASONS[0];
      var place = PLACES.filter(function (x) { return x[0] === v.place; })[0] || PLACES[0];
      var online = hasOnline(v);
      var placeText = place[2];
      if (online) {
        if (v.consent === 'agree') placeText += '。オンラインでの参加について、本人・家族の同意を得た。';
        else if (v.consent === 'yet') placeText += '。（本人・家族がオンラインで参加する場合は、その方法への同意を記入）';
      }
      var kai = String(v.kai || '').trim();
      var kaiText = /^\d+$/.test(kai) ? '第' + kai + '回' : kai;
      var hasHonnin = v.members.indexOf('本人') !== -1;
      var hasKazoku = v.members.indexOf('家族') !== -1;
      var rel = String(v.rel || '').trim();

      // 出席者の表（所属（職種）・氏名 を2組ずつ）
      var staff = PEOPLE.filter(function (x) { return x[1] && v.members.indexOf(x[0]) !== -1; });
      var mrows = [];
      for (var i = 0; i < staff.length; i += 2) {
        var a = staff[i], b = staff[i + 1];
        mrows.push([a[1], '', b ? b[1] : '', '']);
      }
      if (!mrows.length) mrows.push(['', '', '', '']);

      // 欠席者と照会
      var absent = PEOPLE.filter(function (x) { return x[1] && v.absent.indexOf(x[0]) !== -1; });
      var why = String(v.why || '').trim().replace(/。$/, '');
      var absentText = absent.length
        ? absent.map(function (x) { return x[1] + '　氏名：'; }).join('\n') + '\n出られなかった理由：' + (why ? why + '。' : '（理由を記入）')
        : '';
      var hv = q(v.hv), fv = q(v.fv), ans = q(v.ans);

      // 検討した項目 → 検討内容・結論
      var svcLines = PEOPLE.filter(function (x) { return x[2] && (v.members.indexOf(x[0]) !== -1 || v.absent.indexOf(x[0]) !== -1); })
        .map(function (x) { return '\n・' + x[2] + (x[0] === '福祉用具' ? '：（品目：　　／使う場面：　　）' : x[0] === '短期入所' ? '：（月　日程度）' : '：（内容：　　／週　回・　分）'); }).join('');
      var rows = [];
      if (absent.length) {
        var sh = SHOUKAI.filter(function (x) { return x[0] === v.how; })[0] || SHOUKAI[0];
        rows.push([
          '欠席者への照会',
          absent.map(function (x) { return x[0]; }).join('・') + 'に、' + (v.qdate ? H.date(v.qdate) : '（　年　月　日）') + '、' + sh[2] + '。\n照会した内容：ケアプラン原案と、サービスを提供するうえでの留意事項について。\n回答：' + (ans ? '「' + ans + '」' : '（回答を記入）'),
          '回答の内容をふまえて、ケアプランとサービスの提供に反映する。',
        ]);
      }
      TOPICS.forEach(function (t) {
        if (v.topics.indexOf(t[0]) === -1) return;
        var naiyou = t[2]
          .replace('{HV}', '本人から' + (hv ? '「' + hv + '」' : '「　　」') + 'との意向があった。')
          .replace('{FV}', hasKazoku || fv ? '家族' + (rel ? '（' + rel + '）' : '') + 'から' + (fv ? '「' + fv + '」' : '「　　」') + 'との意向があった。' : '')
          .replace('{SVC}', svcLines);
        rows.push([t[1], naiyou, t[3]]);
      });
      var xt = String(v.xTopic || '').trim();
      if (xt) rows.push([xt, String(v.xNaiyou || '').trim(), String(v.xKetsu || '').trim()]);
      if (!rows.length) rows.push(['', '', '']);

      // 残された課題・次回
      var nokori = NOKORI.filter(function (x) { return v.nokori.indexOf(x[0]) !== -1; }).map(function (x) { return '・' + x[2]; });
      if (String(v.nokoriX || '').trim()) nokori.push('・' + String(v.nokoriX).trim());
      var next = '';
      var m = /^(\d{4})-(\d{2})/.exec(v.date);
      if ((v.next === '3' || v.next === '6') && m) {
        var y = Number(m[1]), mo = Number(m[2]) + Number(v.next);
        while (mo > 12) { mo -= 12; y++; }
        next = y + '年' + mo + '月ごろに開催する。状態が変わったときは、その時点で開催する。';
      } else if (v.next === 'koushin') next = '要介護認定の更新のとき（有効期間の終わり：　年　月）に開催する。状態が変わったときは、その時点で開催する。';
      else if (v.next === 'henka') next = '心身の状態やサービスの利用状況が変わったときに開催する。変化はモニタリング（毎月の訪問）で確認する。';

      return {
        title: 'サービス担当者会議の要点',
        left: '第4表',
        right: '作成年月日：　　年　　月　　日',
        sections: [
          { h: '概要', w2: '170px', rows: [
            ['利用者名', 'user', String(v.user || '').trim() ? String(v.user).trim() + '　殿' : '', '（〇〇　〇〇　殿）'],
            ['生年月日・住所', 'birth', '', '（第1表から転記）'],
            ['居宅サービス計画作成者（担当者）氏名', 'cm', String(v.cm || '').trim(), '（ケアマネジャーの氏名）'],
            ['開催日・時間', 'when', H.date(v.date) + '　' + (String(v.time || '').trim() || '　　:　　〜　　:　　')],
            ['開催場所', 'place', placeText],
            ['開催回数', 'kai', kaiText, '（第　回）'],
            ['開催の理由', 'reason', reason[2]],
          ] },
          { h: '会議出席者', w2: '170px', rows: [
            ['利用者・家族の出席', 'attend', '本人：【' + (hasHonnin ? '出席' : '欠席') + '】　家族：【' + (hasKazoku ? '出席' : '欠席') + '】（続柄：' + (hasKazoku ? (rel || '　　') : '　　') + '）' + (hasHonnin ? '' : '\n※本人が欠席した理由と、事前に意向を聞いた方法：')],
            ['欠席した担当者', 'absent', absentText, '（なし）'],
          ] },
          { key: 'mem', h: '会議出席者（所属・職種と氏名）', grid: { head: ['所属（職種）', '氏名', '所属（職種）', '氏名'], rows: mrows, ph: '　' } },
          { key: 'topics', h: '検討した項目・検討内容・結論', grid: { head: ['検討した項目', '検討内容', '結論'], widths: ['150px', '', '32%'], labelCol: true, rows: rows, ph: '（記入）' } },
          { h: '残された課題', w2: '170px', rows: [
            ['残された課題', 'nokori', nokori.join('\n'), '（なし／あれば記入）'],
            ['次回の開催時期', 'next', next],
          ] },
        ],
        foot: '第三者が読んでも内容が分かるように書きます（第4表の記載要領）。欠席した担当者の所属・氏名・理由や照会の内容は、ほかの書類で確認できる場合は、この表への記載を省略できます。会議のあと、ケアプランの原案を本人・家族に説明して文書で同意を得て、本人と各担当者に交付します。',
      };
    },
    warn: function (v) {
      if (hasOnline(v) && v.consent === 'yet') return 'オンライン（テレビ電話装置など）で開くとき、本人や家族が参加するなら、その方法に前もって同意をもらいます。同意を得たら「同意を得た」を選びましょう。';
      if (v.members.indexOf('本人') === -1 && v.members.indexOf('家族') === -1) return 'サービス担当者会議は、本人と家族の参加が基本です。参加できなかったときは、事前に意向を聞き取り、その方法と内容を書いておきましょう。';
      var both = v.absent.filter(function (x) { return v.members.indexOf(x) !== -1; });
      if (both.length) return '「' + both.join('・') + '」が、出席者と欠席者の両方に入っています。どちらかを外してください。';
      if (v.absent.length && !String(v.ans || '').trim()) return '欠席した担当者には照会で意見を聞き、照会した日・内容・回答を記録します。回答を「照会の回答」に入れてください。';
      if (!v.topics.length && !String(v.xTopic || '').trim()) return '「検討した項目」から話し合ったものを選ぶと、項目ごとに検討内容と結論の文例が入ります。';
      if (v.topics.indexOf('kibou') !== -1 && !String(v.hv || '').trim()) return '本人の言葉を「」でそのまま残すと、ケアプランの「生活に対する意向」の根拠になります。';
      return '';
    },
  });
})();
