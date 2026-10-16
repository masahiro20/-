// 退所・利用終了時の引き継ぎ書（障害福祉・障害児通所・介護）。基本情報 → 同意の確認 → 支援の経過（強み）→ 配慮してほしいこと → 医療・家族 → 残された課題。
(function () {
  'use strict';
  var SEC = [['shogai', '障害福祉サービス'], ['jido', '障害児通所支援（児童発達支援・放課後等デイ など）'], ['kaigo', '介護サービス']];
  var isJido = function (v) { return v.sec === 'jido'; };
  var isKaigo = function (v) { return v.sec === 'kaigo'; };

  var REASON = [['shingaku', '進学・進級'], ['tenkyo', '転居'], ['ikou', '他の事業所への移行'], ['shuro', '就職・一般就労'], ['nyuin', '入院・入所'], ['kazoku', '家庭の事情'], ['honnin', '本人の希望'], ['sonota', 'その他']];
  var DEST = [['jigyosho', '事業所'], ['gakko', '学校・園'], ['shisetsu', '施設'], ['iryo', '医療機関'], ['soudan', '相談支援事業所（ケアマネジャーの事業所）']];
  var WAY = [['shomen', '同意書に署名をもらった'], ['koto', '口頭で確認し、記録に残した'], ['mail', 'メール・連絡アプリで確認した']];
  var SCOPE = [['keika', '支援の経過'], ['haisho', '配慮してほしいこと'], ['iryo', '医療・服薬の情報'], ['kazoku', '家族の状況・連絡先'], ['kadai', '残された課題']];
  var HOW = [['shomen', '書面（この引き継ぎ書）'], ['mendan', '面談'], ['tel', '電話'], ['online', 'オンライン']];
  var CONTACT = [['tel', '電話'], ['mail', 'メール'], ['app', '連絡アプリ・連絡帳'], ['ouchi', '決まった曜日・時間に電話']];

  var PROG = {
    shogai: [['kantan', '決まった時間に通えるようになった'], ['sagyo', '作業を続けられる時間が延びた'], ['hanashi', '困ったことを自分から伝えられるようになった'], ['seikatsu', '身の回りのことが自分でできるようになった'], ['tomo', '仲間と関われるようになった'], ['taicho', '体調の波に気づき、対処できるようになった'], ['jishin', '自信がつき、前向きに話すようになった']],
    jido: [['kotoba', '言葉や身ぶりで気持ちを伝えられるようになった'], ['mijimawari', '身の回りのことが自分でできるようになった'], ['tomo', '友だちと遊べるようになった'], ['kirikae', '活動の切り替えがスムーズになった'], ['anshin', '安心して過ごせる時間が増えた'], ['shudan', '集団の活動に参加できるようになった'], ['jishin', '「できた」という経験が増え、自信がついた']],
    kaigo: [['kantan', '休まず通えるようになった'], ['katsudo', '活動に自分から参加するようになった'], ['hanashi', '気持ちを話してくれるようになった'], ['adl', '身の回りのことの自立度が保たれている'], ['kouryu', '他の利用者さんと交流が増えた'], ['taicho', '体調が安定した'], ['egao', '笑顔が増え、落ち着いて過ごせるようになった']],
  };
  var WORKED = [['yotei', '予定を絵や写真で見せる'], ['mae', '前もって予定の変更を知らせる'], ['seki', '静かな席・場所を用意する'], ['tejun', '手順書・見本を用意する'], ['mijikai', '短い言葉で、1つずつ伝える'], ['yaku', '役割や仕事を任せる'], ['home', 'ほめて、できたことを伝える'], ['yasumu', '休憩できる場所・方法を決めておく'], ['timer', 'タイマーで時間を見えるようにする'], ['renraku', '家庭と連絡帳などでこまめに共有する']];

  var CARE = [
    { id: 'comm', label: 'コミュニケーション', opts: [['tan', '短い言葉で、1つずつ伝えると分かりやすい'], ['e', '絵・写真・文字を添えると伝わる'], ['yukkuri', 'ゆっくり待つと自分で答えられる'], ['sentaku', '選択肢を見せると選びやすい'], ['kimochi', '気持ちを言葉にするのを手伝うと落ち着く']] },
    { id: 'mitoshi', label: '見通し・予定', opts: [['mae', '予定は前もって知らせるとよい'], ['henko', '予定が変わるときは早めに伝える'], ['owari', '終わりの時間や量をはっきり示す'], ['junbi', '新しい場所は、事前に見学すると安心'], ['routine', '決まった流れがあると落ち着く']] },
    { id: 'kankaku', label: '感覚・環境', opts: [['oto', '大きな音が苦手'], ['hikari', 'まぶしい光が苦手'], ['hito', '人が多い場所が苦手'], ['sawaru', '触られることが苦手'], ['nioi', 'においに敏感'], ['kyukei', '疲れたら静かな場所で休むとよい']] },
    { id: 'taicho', label: '体調・生活', opts: [['yasumi', '疲れやすく、休憩が必要'], ['suimin', '睡眠不足の日は不安定になりやすい'], ['shokuji', '食事に配慮がある（量・かたさ・好き嫌い）'], ['haisetsu', 'トイレに声かけ・介助が必要'], ['ido', '移動に見守り・介助が必要'], ['kisetsu', '暑さ・寒さで体調を崩しやすい']] },
    { id: 'kinkyu', label: '緊急時・不安定なとき', opts: [['hanare', 'まず静かな場所に移ると落ち着く'], ['koe', '大きな声を出さず、短く声をかける'], ['matsu', '無理に止めず、落ち着くまで見守る'], ['renraku', '家族（保護者）にすぐ連絡してほしい'], ['byoin', '緊急時の受診先が決まっている'], ['maigo', '一人で外へ出ていくことがある']] },
  ];
  var MED = [['tsuin', '定期的に通院している'], ['fukuyaku', '毎日飲んでいる薬がある'], ['arerugi', 'アレルギーがある'], ['jibyo', '発作・持病がある'], ['nashi', '特に配慮は必要ない']];
  var FAM = {
    shogai: [['keyp', '連絡は主に家族（特定の人）にとる'], ['kazoku', '家族の支援が得られている'], ['hitori', '一人暮らし・支える家族が少ない'], ['soudan', '相談支援専門員がついている'], ['kyoryoku', '家族は支援に協力的']],
    jido: [['keyp', '連絡は主に保護者（特定の人）にとる'], ['hogo', '保護者は支援に協力的'], ['kyodai', 'きょうだいへの配慮がある'], ['soudan', '相談支援専門員がついている'], ['kosodate', '子育ての悩みを聞いている']],
    kaigo: [['keyp', '連絡は主にキーパーソン（中心になる家族）にとる'], ['kazoku', '家族の協力が得られている'], ['hitori', '一人暮らし・支える家族が少ない'], ['cm', 'ケアマネジャーがついている'], ['kaigoFutan', '家族の介護の負担が大きい']],
  };
  var KADAI = [['jikan', '決まった時間に起きて通うこと'], ['tsutaeru', '困ったときに自分から伝えること'], ['tomo', '集団や人間関係に慣れること'], ['mijimawari', '身の回りのことを自分でやること'], ['taicho', '体調や薬の管理'], ['tejun', '新しい場所・作業に慣れること'], ['okane', 'お金や持ち物の管理'], ['kazoku', '家族への支援（相談先・休める時間）'], ['sonota', '特になし']];

  var pick = function (list, ids) { return list.filter(function (x) { return (ids || []).indexOf(x[0]) !== -1; }); };
  var texts = function (list, ids) { return pick(list, ids).map(function (x) { return x[1]; }); };
  var bullets = function (arr) { return arr.filter(Boolean).map(function (t) { return '・' + t; }).join('\n'); };
  var join = function () { return Array.prototype.filter.call(arguments, Boolean).join('\n'); };
  var withNote = function (list, note) { var n = (note || '').trim(); return n ? list.concat([n]) : list; };

  var careFields = CARE.map(function (c) {
    return { id: 'c_' + c.id, type: 'chips', label: c.label, options: c.opts };
  });

  Formdoc.run({
    title: '退所・利用終了時の引き継ぎ書',
    ai: { role: '障害福祉・障害児通所・介護の事業所の職員', doc: '退所・利用終了時の引き継ぎ書（次の事業所・学校・施設・医療機関に渡す、支援の経過のまとめ）', rules: ['本人（保護者）の同意を得たことを前提に書く。同意の範囲を超えて書かない。', '氏名は「〇〇さん」のまま。ほかの利用者の名前や様子は書かない。', 'できるようになったこと・うまくいった支援（強み）を必ず書き、課題だけの書類にしない。', '配慮してほしいことは「こうすると落ち着く」の形で書き、本人を責める言い方や診断のような断定をしない。', '事実と推測を分け、聞いていないことは【要確認】と書く。'] },
    blocks: [
      { title: '基本情報', fields: [
        { id: 'sec', type: 'seg', label: '業種', options: SEC.map(function (x) { return [x[0], x[1].replace(/（.*）/, '')]; }) },
        { id: 'end', type: 'date', label: '利用終了日（予定日）', half: true },
        { id: 'start', type: 'date', label: '利用を始めた日', half: true },
        { id: 'freq', type: 'text', label: '利用の頻度', ph: '例：週3日（月・水・金）', half: true },
        { id: 'reason', type: 'chips', label: '終了の理由', options: REASON },
        { id: 'dest', type: 'chips', label: '引き継ぎ先（種類）', options: DEST, hint: '名前は書類に直接書きます' },
        { id: 'office', type: 'text', label: '事業所名', ph: '例：〇〇事業所', half: true, profile: 'office' },
        { id: 'writer', type: 'text', label: '記入者（職種）', ph: '例：サービス管理責任者 〇〇', half: true, profile: 'writer' },
        { id: 'wdate', type: 'date', label: '作成日', today: true, half: true },
      ] },
      { title: '同意の確認（渡す前に）', note: '個人情報を他の事業所・学校などに渡すには、本人（お子さんの場合は保護者）の同意が必要です。同意がないまま渡さないでください。', fields: [
        { id: 'consent', type: 'seg', label: '同意の確認', options: [['ok', '確認した'], ['ng', 'まだ確認していない']], def: 'ng' },
        { id: 'cwho', type: 'seg', label: '同意した人', options: [['honnin', '本人'], ['hogo', '保護者・家族など']], def: 'honnin', show: function (v) { return v.consent === 'ok'; } },
        { id: 'cdate', type: 'date', label: '同意を得た日', half: true, show: function (v) { return v.consent === 'ok'; } },
        { id: 'cway', type: 'select', label: '確認の方法', options: WAY, half: true, show: function (v) { return v.consent === 'ok'; } },
        { id: 'cscope', type: 'chips', label: '渡してよいと同意された内容', options: SCOPE, def: ['keika', 'haisho', 'kadai'], show: function (v) { return v.consent === 'ok'; } },
      ] },
      { title: '支援の経過（強み）', note: '「できるようになったこと」を必ず入れましょう。次の場所が、本人の良いところから関われます。', fields: [
        { id: 'prog', type: 'chips', label: 'できるようになったこと・成長', options: function (v) { return PROG[v.sec] || PROG.shogai; } },
        { id: 'progNote', type: 'textarea', label: '補足（具体的な場面）', ph: '例：入所当初は朝の準備に1時間かかったが、チェック表を使って自分でできるようになった' },
        { id: 'worked', type: 'chips', label: 'うまくいった支援・環境調整', options: WORKED },
        { id: 'workedNote', type: 'textarea', label: '補足', ph: '例：作業の前に「今日はここまで」と見せると取りかかりやすい' },
      ] },
      { title: '配慮してほしいこと', note: '「してはいけない」ではなく「こうすると落ち着く」の形で。', fields: careFields.concat([
        { id: 'careNote', type: 'textarea', label: '補足', ph: '例：不安なときは耳をふさぐ。そのときは静かな場所へ' },
      ]) },
      { title: '医療・服薬', note: '病気や薬の情報は、同意された範囲だけ書きます。診断名は、家族や医療機関から伝えてよいと確認できたものだけにします。', fields: [
        { id: 'med', type: 'chips', label: '医療・服薬', options: MED },
        { id: 'medNote', type: 'textarea', label: '補足', ph: '例：朝食後に服薬。主治医は〇〇クリニック（連絡先は家族に確認）' },
      ] },
      { title: '家族の状況・連絡方法', fields: [
        { id: 'fam', type: 'chips', label: '家族（保護者）の状況', options: function (v) { return FAM[v.sec] || FAM.shogai; } },
        { id: 'contact', type: 'chips', label: '連絡の方法', options: CONTACT },
        { id: 'famNote', type: 'textarea', label: '補足', ph: '例：連絡は平日の夕方がつながりやすい' },
      ] },
      { title: '残された課題・引き継ぎ方法', fields: [
        { id: 'kadai', type: 'chips', label: '残された課題（引き続き支援してほしいこと）', options: KADAI },
        { id: 'kadaiNote', type: 'textarea', label: '補足', ph: '例：新しい環境に慣れるまで1か月ほどかかる。最初は短い時間から' },
        { id: 'how', type: 'chips', label: '引き継ぎ方法', options: HOW, def: ['shomen'] },
        { id: 'hdate', type: 'date', label: '説明する日（予定）', half: true },
      ] },
    ],
    build: function (v, H) {
      var jido = isJido(v), kaigo = isKaigo(v);
      var fam = jido ? '保護者' : '家族';
      var who = v.cwho === 'hogo' ? (jido ? '保護者' : '家族など') : '本人';
      var end = v.end ? H.date(v.end) : '　　年　　月　　日';
      var period = (v.start ? H.date(v.start) : '　　年　　月　　日') + ' 〜 ' + end + (v.freq.trim() ? '\n利用の頻度：' + v.freq.trim() : '');
      var reasons = texts(REASON, v.reason).join('、');
      var dests = texts(DEST, v.dest).join('、');
      var consentText = v.consent === 'ok'
        ? [who + 'の同意を得ています。', '同意を得た日：' + H.date(v.cdate), '確認の方法：' + H.label(WAY, v.cway)].join('\n')
        : '【まだ同意を確認していません。確認できるまで、この書類は渡さないでください】';
      var scope = v.consent === 'ok' ? texts(SCOPE, v.cscope).join('、') : '';

      var prog = withNote(texts(PROG[v.sec] || PROG.shogai, v.prog), '');
      var progText = join(bullets(prog), (v.progNote || '').trim());
      var workedText = join(bullets(texts(WORKED, v.worked)), (v.workedNote || '').trim());

      var careRows = CARE.map(function (c) {
        return [c.label, 'care_' + c.id, bullets(texts(c.opts, v['c_' + c.id])), '（選ぶと入ります）'];
      });
      careRows.push(['その他の補足', 'careNote', (v.careNote || '').trim(), '（例：不安なときの様子と、効果のあった対応）']);

      var med = texts(MED, v.med);
      var medText = join(bullets(med), (v.medNote || '').trim());
      var famText = join(bullets(texts(FAM[v.sec] || FAM.shogai, v.fam)), (v.famNote || '').trim());
      var contact = texts(CONTACT, v.contact).join('、');
      var kadai = join(bullets(texts(KADAI, v.kadai)), (v.kadaiNote || '').trim());
      var how = texts(HOW, v.how).join('、');
      var hand = how + (v.hdate ? '\n説明する日：' + H.date(v.hdate) + '（予定）' : '');

      return {
        title: '退所・利用終了時の引き継ぎ書',
        left: (dests ? '〇〇（' + dests + '）' : '〇〇') + ' 御中',
        right: '作成日：' + H.date(v.wdate) + '\n' + H.blank(v.office, '事業所名：') + '\n記入者：' + (v.writer.trim() || '　　　　'),
        sections: [
          { h: '基本情報', rows: [
            ['氏名', 'name', '', '（〇〇さん・年齢）'],
            ['サービス', 'svc', H.label(SEC, v.sec), ''],
            ['利用期間', 'period', period],
            ['終了の理由', 'reason', reasons, '（終了の理由を選ぶと入ります）'],
            ['引き継ぎ先', 'dest', dests ? '〇〇（' + dests + '）' : '', '（引き継ぎ先の名前）'],
          ] },
          { h: '同意の確認', rows: [
            ['同意の状況', 'consent', consentText],
            ['渡す内容', 'scope', scope, '（同意された内容）'],
          ] },
          { h: '支援の経過', rows: [
            ['できるようになったこと（強み）', 'prog', progText, '（成長したことを選ぶと入ります）'],
            ['うまくいった支援・環境調整', 'worked', workedText, '（うまくいった関わり方を選ぶと入ります）'],
          ] },
          { h: '配慮してほしいこと', rows: careRows },
          { h: '医療・服薬', rows: [['医療・服薬の情報', 'med', medText, '（同意された範囲で記入）']] },
          { h: '家族の状況・連絡', rows: [
            [fam + 'の状況', 'fam', famText, '（家族の状況を選ぶと入ります）'],
            ['連絡の方法', 'contact', contact, '（連絡のとりやすい方法）'],
          ] },
          { h: '残された課題・引き継ぎ', rows: [
            ['残された課題', 'kadai', kadai, '（引き続き支援してほしいこと）'],
            ['引き継ぎ方法', 'how', hand, '（書面・面談・電話・オンライン）'],
          ] },
        ],
        foot: 'この書類には個人情報が含まれます。' + who + 'の同意の範囲を超えて使わず、渡した相手と日付を記録に残してください。書類の写しは事業所で保管します（保存期間は、' + (kaigo ? '国の基準では完結の日から2年間。自治体の条例で長い場合があります' : '国の基準ではサービスを提供した日から5年間') + '）。',
      };
    },
    warn: function (v) {
      if (v.consent !== 'ok') return '本人（お子さんの場合は保護者）の同意を、まだ確認していません。個人情報を他の事業所・学校・施設などに渡すには、あらかじめ本人の同意が必要です。何を・どこに渡すかを説明して同意を得るまで、この書類は渡さないでください。';
      if (!v.cdate) return '同意を得た日を入れましょう。あとから「いつ、誰が同意したか」を確かめられるようにしておきます。';
      var strengths = (v.prog || []).length || (v.progNote || '').trim() || (v.worked || []).length;
      if (!strengths) return '「できるようになったこと」と「うまくいった支援」が、まだ書かれていません。課題だけでなく、強みと効果のあった関わり方を書くと、次の場所がすぐに生かせます。';
      var all = [v.progNote, v.workedNote, v.careNote, v.medNote, v.famNote, v.kadaiNote].join('\n');
      if (/(くん|ちゃん|君)/.test(all)) return '「〇〇くん」「〇〇ちゃん」など、名前が入っていないか確かめましょう。本人は「〇〇さん」、ほかの利用者は名前を出さずに書きます。';
      if ((v.cscope || []).indexOf('iryo') === -1 && ((v.med || []).length && (v.med || []).indexOf('nashi') === -1 || (v.medNote || '').trim())) return '医療・服薬の情報が入っていますが、「渡してよいと同意された内容」に医療・服薬が入っていません。同意の範囲を確かめましょう。';
      if (!v.reason.length) return '終了の理由を選びましょう。次の場所が、経緯を理解する手がかりになります。';
      return '渡す前に、同意の範囲を超えた内容や、ほかの利用者の名前が入っていないか確かめましょう。文章でも、電話や面談でも一度説明できると安心です。';
    },
  });
})();
