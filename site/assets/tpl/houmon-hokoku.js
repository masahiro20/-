// 保育所等訪問支援の報告書（訪問支援の記録）。訪問の概要 → 子どもの様子 → 子どもへの支援（直接支援）→ 訪問先への支援（助言）→ 訪問先の声 → 次回に向けて。
// 「報告先」で保護者向け／訪問先向けの言い回しを切り替える。子どもの名前は「〇〇さん」のまま。ほかの子どもの名前や様子は書かない。
(function () {
  'use strict';

  // 訪問先 [id, 名前, 種類]。種類で、見る場面の選択肢と「先生／職員」の呼び方が変わる
  var PLACE = [
    ['hoikusho', '保育所', 'en'], ['youchien', '幼稚園', 'en'], ['kodomoen', '認定こども園', 'en'],
    ['sho', '小学校', 'gakko'], ['chu', '中学校', 'gakko'], ['koko', '高等学校', 'gakko'], ['tokushi', '特別支援学校', 'gakko'],
    ['club', '放課後児童クラブ（学童保育）', 'club'], ['jidokan', '児童館', 'club'],
    ['nyujiin', '乳児院', 'shisetsu'], ['yougo', '児童養護施設', 'shisetsu'], ['sonota', 'その他（市町村が認めた施設）', 'shisetsu'],
  ];
  // 種類ごとの呼び方 [施設の呼び方, 職員, 職員（ていねい・複数）, 「〜からは」]
  var KIND = {
    en: { noun: '園', t: '先生', ts: '先生方', from: '先生からは', group: '（〇〇組）' },
    gakko: { noun: '学校', t: '先生', ts: '先生方', from: '先生からは', group: '（〇年〇組）' },
    club: { noun: 'クラブ', t: '職員', ts: '職員の方', from: '職員の方からは', group: '' },
    shisetsu: { noun: '施設', t: '職員', ts: '職員の方', from: '職員の方からは', group: '' },
  };
  // 見た場面（訪問先の種類ごと）
  var SCENE = {
    en: [['toko', '登園・朝の支度'], ['asakai', '朝の会'], ['jiyu', '自由遊び'], ['shudan', '集団活動（設定保育）'], ['kyushoku', '給食'], ['gosui', '午睡（お昼寝）'], ['kaeri', '降園の支度'], ['gyoji', '行事の練習']],
    gakko: [['toko', '登校・朝の支度'], ['asakai', '朝の会'], ['jugyo', '授業（教室）'], ['idou', '移動教室・体育'], ['yasumi', '休み時間'], ['kyushoku', '給食'], ['souji', '掃除'], ['kaeri', '帰りの会']],
    club: [['toko', '来所・宿題の時間'], ['jiyu', '自由遊び'], ['oyatsu', 'おやつ'], ['shudan', '集団遊び・行事'], ['kaeri', '帰りの支度']],
    shisetsu: [['asa', '朝の支度'], ['jiyu', '自由時間・遊び'], ['shudan', '集団での活動'], ['shokuji', '食事'], ['kaeri', '片付け・就寝前の支度']],
  };
  var KAI = [['1', '初回']];
  for (var k = 2; k <= 12; k++) KAI.push([String(k), k + '回目']);
  KAI.push(['13', '13回目以降']);
  var WITH = [['jikan', '児童発達支援管理責任者が同行'], ['tashoku', 'ほかの職種（作業療法士など）が同行'], ['hogo', '保護者が同席']];

  // 子どもの様子 [id, ボタン, 文]。{t} は「先生／職員」
  var GOOD = [
    ['jibun', '自分から活動に参加できた', '自分から活動に参加する姿が見られました。'],
    ['kirikae', '声かけで気持ちを切り替えられた', '{t}の声かけで、次の活動に気持ちを切り替えることができました。'],
    ['tomo', '友だちと関われた', '友だちと一緒に遊んだり、やりとりをしたりする場面がありました。'],
    ['mitoshi', '見通しがあると落ち着いて動けた', '次に何をするかが分かると、落ち着いて動くことができていました。'],
    ['saigo', '最後まで取り組めた', '活動に最後まで取り組むことができました。'],
    ['tasuke', '困ったときに伝えられた', '困ったときに、{t}に自分から伝えることができました。'],
    ['tokui', '得意なことで力を発揮した', '得意なこと（　　）で、力を発揮していました。'],
    ['mimawari', '身の回りのことを自分で進めた', '身の回りのこと（着替え・片付けなど）を、自分で進めていました。'],
  ];
  var HARD = [
    ['kirikae', '活動の切り替えに時間がかかった', '好きな活動から次の活動への切り替えに、時間がかかりました。'],
    ['shiji', '全体への指示が伝わりにくかった', '全体への指示だけでは、何をするのか分かりにくい様子でした。'],
    ['oto', '音や人の多さで落ち着かなかった', '音や人の多さが気になり、落ち着かない様子が見られました。'],
    ['matsu', '待つことが難しかった', '順番や活動の始まりを待つことが、難しい場面がありました。'],
    ['seki', '席や活動の場を離れた', '活動の途中で、席（活動の場）を離れることがありました。'],
    ['tomo', '友だちとのやりとりでぶつかりそうになった', '友だちとのやりとりで、気持ちがぶつかりそうになる場面がありました。'],
    ['kotoba', '気持ちを言葉で伝えにくかった', '自分の気持ちを言葉で伝えることが、難しい場面がありました。'],
    ['mimawari', '身の回りのことに時間がかかった', '身の回りのこと（着替え・片付けなど）に、時間がかかりました。'],
  ];
  // 子どもへの支援（直接支援）
  var DIRECT = [
    ['soba', 'そばで短く声をかけ、参加を手伝った', 'そばで短く声をかけ、活動に参加できるよう手伝いました。'],
    ['card', '絵や写真のカードで予定を伝えた', '絵や写真のカードで、次の予定を伝えました。'],
    ['kugiru', 'やることを区切って伝え、できたら認めた', 'やることを一つずつ区切って伝え、できたらすぐに認めました。'],
    ['kimochi', '気持ちを言葉にするのを手伝った', '気持ちを言葉にするのを手伝いました（例：「いやだった」「もう一回したい」）。'],
    ['nakadachi', '友だちとのやりとりの間に入った', '友だちとのやりとりの間に入り、関わり方を一緒に考えました。'],
    ['cool', '落ち着ける場所で休み、戻る時を一緒に決めた', '落ち着ける場所で少し休み、活動に戻るタイミングを一緒に決めました。'],
    ['mimawari', '身の回りのことを一緒に練習した', '身の回りのこと（　　）のやり方を、一緒に練習しました。'],
    ['mimamori', '自分でできるところは見守った', '自分でできるところは手を出さずに見守り、必要なときだけ手伝いました。'],
  ];
  // 訪問先の職員への助言（間接支援）
  var ADVICE = [
    ['koe', '声かけの工夫', '声かけの工夫：全体に伝えたあと、〇〇さんの近くで、短く具体的に伝え直す（「〇〇しない」より「〇〇しよう」と、することを伝える）。'],
    ['mitoshi', '見通しの持たせ方', '見通しの持たせ方：1日の流れや次の活動を、絵・写真・文字で見える形にして示す。終わりの時間や合図も前もって伝える。'],
    ['kankyo', '環境調整（掲示物・音・物の置き場所）', '環境の調整：気が散りやすい掲示物や物を減らし、物の置き場所を決めて、見て分かるようにする。'],
    ['seki', '席の位置', '席の位置：{t}の話が届きやすく、気が散りにくい位置にする（前のほう、出入り口や窓から離れた場所など）。'],
    ['cool', 'クールダウンの場所', 'クールダウンの場所：気持ちが高ぶったときに落ち着ける場所を決めておき、「休みたい」と伝える方法も一緒に決める。'],
    ['homeru', 'ほめ方・認め方', 'ほめ方・認め方：できたときにすぐ、何がよかったかを具体的に伝える（「最後まで座って聞けたね」など）。'],
    ['tomo', '友だちとの関わりの橋渡し', '友だちとの関わり：遊びの中で{t}が間に入り、「かして」「いれて」などのやりとりの仕方を伝える。'],
    ['gyoji', '行事への参加の仕方', '行事への参加：練習の流れを前もって伝え、参加の仕方（場所・時間・役割）を〇〇さんと一緒に考える。'],
  ];
  // 訪問後の振り返り（カンファレンス）[id, ボタン, 文, 保護者向けの文（あれば）]。{who} は保護者向けのときだけ「先生方と」
  var CONF = [
    ['tojitsu', '当日、対面で', '訪問のあと、{who}対面で振り返りの話し合いを行いました（約　　分）。'],
    ['tojitsu-ol', '当日、オンラインで', '訪問のあと、{who}オンラインで振り返りの話し合いを行いました（約　　分）。'],
    ['gojitsu-ol', '後日、オンラインで', '振り返りの話し合いは、後日（　月　日）、{who}オンラインで行います。'],
    ['gojitsu-tel', '後日、電話で', '振り返りの話し合いは、後日（　月　日）、{who}電話で行います。'],
    ['nashi', 'できなかった', '今回は、振り返りの時間をとることができませんでした。内容は、この報告書でお伝えします。', '今回は、{who}振り返りの時間をとることができませんでした。今日の内容は、報告書などで訪問先にお伝えします。'],
  ];
  // 訪問先の職員の声 [id, ボタン, 保護者向け, 訪問先向け]（保護者向けは、まとめて「先生からは、次のような…」の下に並べる）
  var VOICE = [
    ['tameshi', '助言を試してみたい', 'お伝えした関わり方を、試してみたいとのことでした。', 'ご提案した関わり方を、試してみたいとのお話をいただきました。'],
    ['onaji', 'ふだんどおりの様子だった', '今日の様子は、ふだんとあまり変わらないとのことでした。', '本日の様子は、ふだんとあまり変わらないとのことでした。'],
    ['chigau', 'ふだんと違う様子だった', '今日は、ふだんと少し違う様子だった（　　）とのことでした。', '本日は、ふだんと少し違う様子だった（　　）とのことでした。'],
    ['seicho', '成長を感じている', '（　　）ができるようになってきた、とのことでした。', '（　　）ができるようになってきた、とのお話をいただきました。'],
    ['komaru', '関わり方に悩む場面がある', '（　　）の場面での関わり方に悩んでいる、とのことでした。', '（　　）の場面での関わり方に悩んでいる、とのお話をいただきました。'],
    ['katei', '家での様子を知りたい', 'ご家庭での様子も知りたい、とのことでした。差し支えなければ、次回までにお聞かせください。', 'ご家庭での様子も知りたい、とのことでした。保護者の了解を得たうえで、お伝えします。'],
    ['tsugi', '次回見てほしい場面がある', '次回は（　　）の場面を見てほしい、とのご希望がありました。', '次回は（　　）の場面を見てほしい、とのご希望をいただきました。'],
  ];
  // 保護者への報告の方法 [id, ボタン, 保護者向け, 訪問先向け]（保育所等訪問支援ガイドラインの例から）
  var REPORT = [
    ['sho', '報告書（紙・ノート）を渡す', '今回は、この報告書でご報告します。', '保護者には、報告書（書面）でお伝えします。'],
    ['mendan', '対面で面談', '面談で、この報告書をもとにご報告します。', '保護者には、面談でお伝えします。'],
    ['online', 'オンラインで面談', 'オンラインの面談で、この報告書をもとにご報告します。', '保護者には、オンラインの面談でお伝えします。'],
    ['tel', '電話', 'お電話でお伝えしたうえで、この報告書をお渡しします。', '保護者には、電話でお伝えします。'],
    ['mail', 'メール・連絡アプリ', 'メール（連絡アプリ）で、この報告書をお送りします。', '保護者には、メール（連絡アプリ）でお伝えします。'],
    ['doseki', '訪問に同席してもらった', '訪問に同席していただき、その場でもご説明しました。', '保護者には、訪問に同席していただき、その場でお伝えしました。'],
  ];
  var TO = [['hogo', '保護者', 'ていねいな報告'], ['houmon', '訪問先', '先生・職員向け']];

  function placeOf(v) { return PLACE.filter(function (x) { return x[0] === v.place; })[0] || PLACE[0]; }
  function kindOf(v) { return KIND[placeOf(v)[2]]; }
  function fill(s, kd, extra) {
    return s.replace(/\{t\}/g, kd.t).replace(/\{from\}/g, kd.from).replace(/\{who\}/g, extra || '');
  }
  function minutes(a, b) {
    var x = /^(\d{1,2}):(\d{2})$/.exec(a || ''), y = /^(\d{1,2}):(\d{2})$/.exec(b || '');
    if (!x || !y) return null;
    return (Number(y[1]) * 60 + Number(y[2])) - (Number(x[1]) * 60 + Number(x[2]));
  }
  function quote(s) {
    var t = (s || '').trim().replace(/^「|」$/g, '');
    return t ? '「' + t + '」' : '';
  }
  // 選んだ文を「・」つきの行に。補足があれば最後の行に足す
  function lines(H, list, ids, kd, note) {
    var out = H.pick(list, ids).map(function (x) { return fill(x[2], kd); });
    var n = (note || '').trim();
    if (n) out.push(/[。！？）」]$/.test(n) ? n : n + '。');
    return H.bullets(out);
  }

  Formdoc.run({
    title: '保育所等訪問支援の報告書',
    ai: {
      role: '保育所等訪問支援事業所の訪問支援員',
      doc: '保育所等訪問支援の報告書（訪問支援の記録）',
      rules: [
        '報告先（保護者／訪問先）に合った敬語とやさしい言い回しにする。',
        '子どもの名前は「〇〇さん」のまま書く。ほかの子どもの名前や様子、家庭の事情は書かない。',
        '見たこと（事実）と、訪問支援員が考えたこと（見立て）を分けて書く。',
        '訪問先の職員を指導する書き方ではなく、一緒に考える書き方にする。',
        '（　）の空欄は推測で埋めず、【要確認】と書く。',
      ],
    },
    blocks: [
      { title: '報告先と訪問の概要', fields: [
        { id: 'to', type: 'seg', label: '報告先', options: TO, def: 'hogo' },
        { id: 'office', type: 'text', label: '事業所名', ph: '例：〇〇保育所等訪問支援事業所', half: true },
        { id: 'staff', type: 'text', label: '訪問支援員（名前）', ph: '例：福祉 花子', profile: 'writer', half: true },
        { id: 'place', type: 'select', label: '訪問先の種類', options: PLACE.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'date', type: 'date', label: '訪問日', today: true, half: true },
        { id: 'kai', type: 'select', label: '訪問の回数', options: KAI, def: '2', half: true },
        { id: 'start', type: 'time', label: '始まり', def: '10:00', half: true },
        { id: 'end', type: 'time', label: '終わり', def: '11:30', half: true },
        { id: 'with', type: 'chips', label: '同行・同席', options: WITH },
      ] },
      { title: '見た場面と子どもの様子', note: '子どもの名前は書かず「〇〇さん」のままにします。ほかの子どもの名前や様子は書きません。', fields: [
        { id: 'scene', type: 'chips', label: '見た場面', options: function (v) { return SCENE[placeOf(v)[2]]; } },
        { id: 'good', type: 'chips', label: 'よかったこと・できたこと', options: GOOD.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'goodNote', type: 'text', label: '補足（よかったこと）', ph: '例：朝の会で、名前を呼ばれて手をあげて返事ができた' },
        { id: 'hard', type: 'chips', label: '困っていたこと・難しかったこと', options: HARD.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'hardNote', type: 'text', label: '補足（困っていたこと）', ph: '例：片付けの合図のあと、5分ほどブロックを続けていた' },
      ] },
      { title: '子どもへの支援（直接支援）', fields: [
        { id: 'direct', type: 'chips', label: '支援したこと', list: true, options: DIRECT.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'directNote', type: 'text', label: '補足（支援したこと）', ph: '例：給食の準備で、手順を3つのカードにして渡した' },
        { id: 'result', type: 'textarea', label: '支援のあとの様子', ph: '例：カードを見ながら、最後まで自分で準備ができた' },
      ] },
      { title: '訪問先の職員への支援（助言）', small: '間接支援', fields: [
        { id: 'advice', type: 'chips', label: '伝えたこと・提案したこと', list: true, options: ADVICE.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'adviceNote', type: 'textarea', label: '補足（具体的に）', ph: '例：絵カードの見本を1セットお渡しした' },
        { id: 'conf', type: 'select', label: '訪問後の振り返り（カンファレンス）', options: CONF.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'partner', type: 'text', label: '話し合った相手（役割）', ph: '例：担任の先生、主任の先生' },
      ] },
      { title: '訪問先の職員の声', fields: [
        { id: 'voice', type: 'chips', label: '職員から聞いたこと', options: VOICE.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'voiceNote', type: 'text', label: '職員の言葉', ph: '例：カードがあると全体の指示も伝わりやすそうです' },
      ] },
      { title: '次回に向けて', fields: [
        { id: 'goal', type: 'textarea', label: '次回までの目標', ph: '例：片付けの合図で、自分から遊びを終えられる' },
        { id: 'home', type: 'textarea', label: 'ご家庭でできること（保護者向け）', ph: '例：出かける前に、行き先と帰る時間を言葉と絵で伝える', show: function (v) { return v.to === 'hogo'; } },
        { id: 'ask', type: 'textarea', label: '訪問先にお願いしたいこと（訪問先向け）', ph: '例：片付けの5分前に、〇〇さんにだけ個別に声をかける', show: function (v) { return v.to === 'houmon'; } },
        { id: 'nextDate', type: 'date', label: '次回の訪問予定日', half: true },
        { id: 'nextScene', type: 'text', label: '次回見る場面', ph: '例：給食の準備', half: true },
        { id: 'report', type: 'select', label: '保護者への報告の方法', options: REPORT.map(function (x) { return [x[0], x[1]]; }) },
      ] },
    ],
    build: function (v, H) {
      var hogo = v.to === 'hogo';
      var pl = placeOf(v), kd = KIND[pl[2]];
      var plName = pl[0] === 'sonota' ? '施設' : pl[1].replace(/（.*）$/, '');
      var mins = minutes(v.start, v.end);
      var when = H.date(v.date) + '　' + H.time(v.start) + '〜' + H.time(v.end) + (mins > 0 ? '（' + mins + '分）' : '');
      var n = Number(v.kai);
      var kai = n === 1 ? '初回（はじめての訪問）' : n >= 13 ? '13回目以降（　回目）' : n + '回目';
      var who = '訪問支援員：' + (v.staff.trim() || '　　　　');
      if (v['with'].indexOf('jikan') !== -1) who += '\n児童発達支援管理責任者：　　　　（同行）';
      if (v['with'].indexOf('tashoku') !== -1) who += '\n同行した職員：　　　　（職種：　　　　）';
      if (v['with'].indexOf('hogo') !== -1) who += hogo ? '\n保護者の方にも、同席していただきました。' : '\n保護者が同席しました。';
      var scenes = H.pick(SCENE[pl[2]], v.scene).map(function (x) { return x[1]; }).join('、');
      var greet = hogo
        ? 'いつもお世話になっております。' + H.date(v.date) + 'に' + plName + 'を訪問したときの、〇〇さんの様子をご報告します。'
        : H.date(v.date) + 'は、お忙しいなか訪問を受け入れていただき、ありがとうございました。訪問の内容をご報告します。';

      var good = lines(H, GOOD, v.good, kd, v.goodNote);
      var hard = lines(H, HARD, v.hard, kd, v.hardNote);
      var direct = lines(H, DIRECT, v.direct, kd, v.directNote);
      var adv = H.pick(ADVICE, v.advice).map(function (x) { return fill(x[2], kd); });
      var an = v.adviceNote.trim();
      if (an) adv.push(/[。！？）」]$/.test(an) ? an : an + '。');
      var advText = adv.length
        ? (hogo ? kd.ts + 'と〇〇さんの様子を振り返り、次のような関わり方をお伝えしました。' : '本日の様子から、次のような関わり方をご提案します。' + kd.noun + 'で取り組みやすいものから、お試しください。') + '\n' + H.bullets(adv)
        : '';
      var cf = CONF.filter(function (x) { return x[0] === v.conf; })[0] || CONF[0];
      var partner = v.partner.trim();
      var confText = fill(hogo && cf[3] ? cf[3] : cf[2], kd, hogo ? (partner || kd.ts) + 'と' : (partner ? partner + 'と' : ''));
      var ns = v.nextScene.trim().replace(/^「|」$/g, '');
      var voice = H.pick(VOICE, v.voice).map(function (x) {
        var t = fill(hogo ? x[2] : x[3], kd);
        return x[0] === 'tsugi' && ns ? t.replace('（　　）', '「' + ns + '」') : t;
      });
      var vq = quote(v.voiceNote);
      if (vq) voice.push(vq + (hogo ? 'とのお話もありました。' : 'とのお話をいただきました。'));
      var voiceText = voice.length ? (hogo ? kd.from + '、次のようなお話がありました。\n' : '') + H.bullets(voice) : '';
      var nextText = H.date(v.nextDate) + 'ごろ（予定）';
      if (ns) nextText += '\n次回は「' + ns + '」の場面を中心に、様子を見せていただく予定です。';
      var rp = REPORT.filter(function (x) { return x[0] === v.report; })[0] || REPORT[0];

      var sections = [
        { h: '訪問の概要', rows: [
          ['', 'greet', greet],
          ['訪問日時', 'when', when],
          ['訪問先', 'where', '〇〇' + plName + kd.group],
          ['訪問の回数', 'kai', kai],
          ['訪問した職員', 'who', who],
          ['見た場面', 'scene', scenes, '（見た場面を選ぶと入ります）'],
        ] },
        { h: hogo ? '〇〇さんの様子' : '子どもの様子', rows: [
          [hogo ? 'よかったこと' : 'よかったこと・できたこと', 'good', good, '（よかったことを選ぶと入ります）'],
          [hogo ? '難しそうだったこと' : '困っていた場面', 'hard', hard, '（困っていたことを選ぶと入ります）'],
        ] },
        { h: hogo ? '〇〇さんへの支援（直接支援）' : '子どもへの支援（直接支援）', rows: [
          ['支援したこと', 'direct', direct, '（支援したことを選ぶと入ります）'],
          ['支援のあとの様子', 'result', v.result.trim(), '（支援のあと、〇〇さんがどうだったか）'],
        ] },
        { h: hogo ? kd.ts + 'への支援（助言）' : '訪問先への支援（助言）', rows: [
          [hogo ? 'お伝えしたこと' : 'ご提案', 'advice', advText, '（伝えたこと・提案したことを選ぶと入ります）'],
          ['振り返り', 'conf', confText],
        ] },
        { h: hogo ? kd.ts + 'のお話' : '訪問先の声', rows: [
          ['', 'voice', voiceText, '（職員から聞いたことを選ぶと入ります）'],
        ] },
      ];
      var next = [['次回までの目標', 'goal', v.goal.trim(), '（次回までに目指すこと）']];
      if (hogo) next.push(['ご家庭で', 'home', v.home.trim(), '（ご家庭でも生かせること。例：次の予定を、言葉と絵で前もって伝える）']);
      else next.push(['お願いしたいこと', 'ask', v.ask.trim(), '（次回までに' + kd.noun + 'で試していただきたいこと）']);
      next.push(['次回の訪問', 'next', nextText]);
      next.push([hogo ? 'ご報告の方法' : '保護者への報告', 'report', hogo ? rp[2] : rp[3]]);
      sections.push({ h: '次回に向けて', rows: next });

      return {
        title: hogo ? '保育所等訪問支援のご報告' : '保育所等訪問支援　訪問報告書',
        left: hogo ? '〇〇さんの保護者様' : '〇〇' + plName + '\n' + (pl[2] === 'en' || pl[2] === 'gakko' ? '〇〇先生' : 'ご担当者様'),
        right: '報告日：' + H.date(v.date) + '\n' + (v.office.trim() || '事業所：') + '\n訪問支援員：' + (v.staff.trim() || '　　　　'),
        sections: sections,
        foot: hogo
          ? 'ご不明な点や、ご家庭で気になることがあれば、いつでも事業所（訪問支援員・児童発達支援管理責任者）にご相談ください。'
          : 'この報告書には、お子さんの個人情報が含まれます。取り扱いにご注意ください。ご不明な点は、事業所（訪問支援員・児童発達支援管理責任者）までご連絡ください。',
      };
    },
    warn: function (v) {
      var notes = [v.goodNote, v.hardNote, v.directNote, v.result, v.adviceNote, v.partner, v.voiceNote, v.goal, v.home, v.ask, v.nextScene].join('\n');
      if (/(くん|ちゃん|君)/.test(notes)) return '「〇〇くん」「〇〇ちゃん」など、子どもの名前が入っていないか確かめましょう。本人は「〇〇さん」、ほかの子どもは「友だち」「まわりの子」と書き、ほかの子どもの名前や様子、家庭のことは書きません。';
      var m = minutes(v.start, v.end);
      if (m !== null && m <= 0) return '終わりの時刻が、始まりの時刻より前になっています。訪問の時間を確かめましょう。';
      if (m !== null && m < 30) return '訪問の時間が30分未満です。令和6年度から、訪問支援の時間は計画に定め、30分以上とすることになりました（周りの環境に慣れるためなどで、市町村が認めて短く設定した場合を除く）。実際の時間が30分未満になったときは、子どもや訪問先の事情による場合を除き、基本報酬は算定しないのが基本です。事情で短くなったときは、その理由を記録に残しましょう。';
      if (!v.good.length && !v.goodNote.trim()) return 'よかったこと・できたことも必ず書きましょう。その子の強みが伝わると、保護者も訪問先も安心でき、関わり方のヒントにもなります。';
      if (!v.advice.length && !v.adviceNote.trim()) return '訪問先の職員への支援（助言）も書きましょう。保育所等訪問支援は、子どもへの支援と、訪問先の職員への支援の両方を行うサービスです。';
      if (v.conf === 'nashi') return '振り返りができなかったときは、後日オンラインや電話で、訪問先と今日の内容を共有しましょう（なるべく早いうちに）。';
      if (v.hard.indexOf('tomo') !== -1 || v.good.indexOf('tomo') !== -1 || v.direct.indexOf('nakadachi') !== -1) return '友だちとのやりとりを書くときは、ほかの子どもの名前や、その子の様子・家庭のことは書かず、〇〇さんの様子と支援だけを書きましょう。';
      return '書き終わったら、子どもの名前（「〇〇さん」のまま）や、ほかの子どもの名前・様子が入っていないか確かめましょう。写真を残すときは、保護者の承諾を得てからにします。';
    },
  });
})();
