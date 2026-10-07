// 看取り（ターミナルケア）の経過記録の文例。状態（事実）→ ご本人・ご家族の言葉 → 行ったケア → 連絡 の順に、時刻を添えて組み立てる。
// 「お亡くなりになった後」は、気づいたときの様子 → 連絡 → 医師による確認 → ご家族への対応 → エンゼルケア の形。
// 医師の確認は「来所して確認」「情報通信機器（ICT）を利用した死亡診断の手順」「来所を待っている」の3通りで書き分ける。
// 死亡の確認・診断は医師が行うため、介護職員の文には医学的な判断の言葉を入れない。
(function () {
  'use strict';
  // 時期。a〜d は、各選択肢がどの時期に出るかの印
  var PHASES = [
    ['nyuu', '看取り期に入った頃', '計画の説明・同意のころ'],
    ['henka', '状態が変わってきた頃', '食事・呼吸などの変化'],
    ['chokuzen', '最期が近づいた頃（数日前〜当日）', '下顎呼吸・尿量の減少など'],
    ['go', 'お亡くなりになった後', '医師の確認・エンゼルケア'],
  ];
  var P = { nyuu: 'a', henka: 'b', chokuzen: 'c', go: 'd' };

  // ご本人の状態 [id, 選択肢, 文, 時期]
  var STATE = [
    ['shokuji', '食事の量が減ってきた', '食事の摂取量が減ってきており、本日は主食　割・副食　割を召し上がった。', 'ab'],
    ['suibun', '水分が少ない', '本日の水分の摂取量は、約　mlだった。', 'ab'],
    ['nemuru', '眠っている時間が長い', '日中も眠っている時間が長く、声をかけると目を開けられる。', 'ab'],
    ['taijuu', '体重の減少', '体重は　kgで、前回（　月）より　kg減っていた。', 'a'],
    ['kokyu', '呼吸の変化', '呼吸が浅く、速くなっている（1分間に　回）。', 'bc'],
    ['kagaku', '下顎呼吸（あごを動かす呼吸）', 'あごを上下に動かして息をする呼吸（下顎呼吸）が見られた。', 'c'],
    ['mukokyu', '呼吸が止まる間がある', '呼吸が　秒ほど止まってから、また始まることがくり返し見られた。', 'c'],
    ['tan', 'のどのゴロゴロという音', 'のどの奥で、たんがからむようなゴロゴロという音が聞こえた。', 'bc'],
    ['nyou', '尿量の減少', '尿量が減っており、パッド交換時の尿は少量で、色が濃かった（最終排尿　時ごろ）。', 'bc'],
    ['reikan', '手足の冷感・チアノーゼ', '手足の先が冷たく、爪や唇の色が紫色がかっていた（チアノーゼ）。', 'bc'],
    ['torenai', '食事・水分がとれない', '口から食事や水分をとることが難しくなっており、口元にスプーンを運んでも、口を開けられないことが多い。', 'bc'],
    ['hannou', '呼びかけへの反応が少ない', '呼びかけに目を開けることが少なくなった。手を握ると、かすかに握り返された。', 'bc'],
    ['netsu', '発熱', '　時の検温で、　℃の発熱があった。', 'bc'],
    ['itami', '痛み・苦しさの表情', '体の向きを変える際に、眉間にしわを寄せる表情が見られた。', 'abc'],
    ['odayaka', '穏やかな表情', '穏やかな表情で、静かに休まれていた。', 'abc'],
    ['kokyunashi', '呼吸の動きが見られない', '巡回で訪室した際に、胸やお腹の呼吸の動きが見られないことに気づいた。', 'd'],
    ['hannounashi', '呼びかけに反応がない', '名前を呼び、肩に触れて声をかけたが、反応はなかった。', 'd'],
    ['kazokusoba', 'ご家族が付き添う中で', 'ご家族が付き添われている中で、呼吸の間隔が少しずつ長くなり、呼吸の動きが見られなくなった。', 'd'],
    ['hyoujou', '穏やかな表情', '穏やかな表情で、ベッドに横になられていた。', 'd'],
  ];

  // 医師の確認のしかた（お亡くなりになった後）
  var DOCTOR = [
    ['raisho', '医師が来所して確認'],
    ['ict', 'オンラインでの死亡診断の手順', '情報通信機器（ICT）・医師が判断'],
    ['machi', '医師の来所を待っている', '連絡済み・来所予定'],
  ];

  // 行ったケア（看取り期）[id, 選択肢, 文]
  var CARE = [
    ['koukuu', '口腔ケア', '口腔ケアを行い、スポンジブラシで口の中を湿らせ、唇に保湿剤を塗った。'],
    ['taii', '体位変換', '体位変換を行い、クッションを使って楽な姿勢に整えた。'],
    ['hoshitsu', '保湿', '手足や背中の皮膚に保湿剤を塗り、乾燥や赤みがないか確認した。'],
    ['seishiki', '清拭・着替え', '全身の清拭を行い、寝衣を交換した。'],
    ['ongaku', '好きな音楽', 'ご本人の好きな音楽（　　）を、小さな音で流した。'],
    ['koekake', '声かけ・手を握る', 'そばで名前を呼び、手を握りながら声をかけた。'],
    ['kazoku', 'ご家族との時間の調整', 'ご家族がゆっくり過ごせるよう、居室に椅子を用意し、ケアの時間を調整した。'],
    ['kankyou', '室温・明るさの調整', '室温・湿度・明るさを調整した（室温　℃）。'],
    ['konomi', '好きなものを少しずつ', 'ご本人の好きなもの（　　）を、ペースに合わせて少しずつ口にしていただいた。'],
    ['junkai', '訪室の回数を増やした', '訪室の回数を増やし、　分ごとに呼吸と表情を確認した。'],
  ];
  // お亡くなりになった後のケア
  var AFTER = [
    ['engel', 'エンゼルケア', '医師による死亡の確認の後、ご家族の了承を得て、看護職員と一緒にエンゼルケア（お体を清潔にし、整えるケア）を行った。'],
    ['kigae', '着替え（ご家族が選んだ服）', 'ご家族が選ばれた服（　　）にお着替えをした。'],
    ['seiyou', '髪・お顔を整える', '髪を整え、ご家族と一緒にお顔を整えた。'],
    ['owakare', 'お別れの時間', 'ご家族だけでお別れをされる時間をつくった。'],
    ['shokuin', '職員のお別れ', '勤務中の職員が居室を訪れ、お別れのあいさつをした。'],
    ['miokuri', 'お見送り', '　時　分、ご家族とともに出発された。職員でお見送りをした。'],
  ];

  // 医師の来所を待つ間の対応（エンゼルケアは、医師が死亡を確認した後に行う）
  var WAIT = [
    ['soba', 'そばで見守る', '医師の来所まで、職員がご本人のそばに付き添った。'],
    ['shiji', '看護職員の指示を確認', '医師の来所までの対応について、看護職員に確認し、指示を受けた。'],
    ['kazokujikan', 'ご家族と過ごす時間', 'ご家族がご本人のそばで過ごせるよう、居室に椅子を用意した。'],
    ['kankyou', '室温・明るさを整える', '居室の室温と明るさを整えた。'],
  ];

  // ご家族 [id, 選択肢, 文, 時期]
  var FAMILY = [
    ['setsumei', '医師の説明・同意', '医師から、ご家族（　　）に現在の状態と今後の見通しの説明があり、看取り介護の計画に同意された（同席：　　）。', 'a'],
    ['ikou', 'ご本人の希望を一緒に確認', 'ご家族と、ご本人が望まれていたこと（過ごし方・会いたい人など）を一緒に確認した。', 'ab'],
    ['menkai', '面会に来られた', 'ご家族（　　）が、　時ごろ面会に来られた。', 'abc'],
    ['touchaku', '到着された', 'ご家族（　　）が、　時　分に到着された。', 'cd'],
    ['tsukisoi', '付き添い・泊まり', 'ご家族から付き添いのご希望があり、居室に簡易ベッドを用意した。', 'bc'],
    ['owakare', 'お別れの言葉をかけられた', 'ご家族がご本人に声をかけ、お別れをされていた。', 'd'],
    ['issho', '一緒にケア', 'ご家族と一緒に、口を湿らせるケアや手足の保湿を行った。', 'bc'],
    ['kimochi', 'お気持ちを聴いた', 'ご家族がお気持ちを話されたため、そばで話を聴いた。', 'abcd'],
    ['enpou', '遠方のため電話で', 'ご家族は遠方のため、電話で現在の様子をお伝えした。', 'abc'],
  ];

  // 連絡 [id, 選択肢, 時刻の欄, {時期: 文}]
  var CONTACT = [
    ['kango', '看護職員', 'tKango', {
      a: '看護職員に状態を報告し、観察する点について指示を受けた。',
      b: '看護職員に状態の変化を報告し、観察する点について指示を受けた。',
      c: '看護職員に状態の変化を報告した。看護職員が訪室し、状態を確認した。',
      d: '夜間・休日の連絡当番（オンコール）の看護職員に、電話で状態を報告した。',
    }],
    ['ishi', '医師', 'tIshi', {
      a: '医師に状態を報告し、今後の対応について指示を受けた（連絡者：　　）。',
      b: '医師に状態を報告し、今後の対応について指示を受けた（連絡者：　　）。',
      c: '医師に状態の変化を報告し、指示を受けた（連絡者：　　）。',
      d: '施設で決めた手順に沿って、医師に連絡した（連絡者：　　）。',
    }],
    ['kazoku', 'ご家族', 'tKazoku', {
      a: 'ご家族（　　）に電話で、最近の様子をお伝えした。',
      b: 'ご家族（　　）に電話で、状態の変化をお伝えした。',
      c: 'ご家族（　　）に電話で状態の変化をお伝えし、来所のご意向を伺った。',
      d: 'ご家族（　　）に電話で、呼吸の動きが見られないこと、医師に連絡したことをお伝えした（連絡者：　　）。',
    }],
    ['soudan', '相談員・ケアマネジャー・管理者', 'tSoudan', {
      a: '生活相談員（ケアマネジャー・管理者）に報告した。',
      b: '生活相談員（ケアマネジャー・管理者）に報告した。',
      c: '生活相談員（ケアマネジャー・管理者）に報告した。',
      d: '生活相談員（ケアマネジャー・管理者）に報告した。',
    }],
  ];

  // 申し送り [id, 選択肢, 文, 時期]
  var NEXT = [
    ['kansatsu', '呼吸・表情の観察を続ける', '引き続き、呼吸の様子・表情・尿量の観察をお願いします。', 'abc'],
    ['kutsuu', '痛み・苦しさのサインに注意', '眉間のしわ・うなり声など、痛みや苦しさのサインがあれば、看護職員への報告をお願いします。', 'abc'],
    ['tejun', '変化があれば手順どおり連絡', '状態に変化があれば、施設で決めた連絡の手順に沿って連絡します。', 'abc'],
    ['kyouyuu', '多職種の話し合いで共有', '多職種の話し合い（カンファレンス）で、状態とケアの内容を共有します。', 'abc'],
    ['raisho', 'ご家族の来所予定', 'ご家族が　日　時ごろ来所される予定です。', 'abc'],
    ['shorui', 'お渡しする物・書類の確認', 'ご家族へお渡しする持ち物・書類の確認をお願いします。', 'd'],
    ['furikaeri', '職員への共有・振り返り', '職員に共有し、後日、看取りの振り返り（カンファレンス）を行います。', 'd'],
    ['aisatsu', 'ご家族へのあいさつの予定', '後日の、ご家族へのごあいさつ・ご連絡の予定を確認します。', 'd'],
  ];

  // 介護職員が書かない、医学的な判断の言葉
  var DIAG = ['死亡した', '死亡しました', '死亡を確認', '死亡確認', '亡くなった', '亡くなられた', '息を引き取', '永眠', '心肺停止', '心停止', '呼吸停止', '死去', '逝去'];
  // 感情や評価に寄った言葉と、言い換えの例
  var FEEL = [
    ['苦しそう', '「眉間にしわを寄せていた」「肩で息をしていた」など、見た様子'],
    ['つらそう', '「顔をしかめていた」「うなり声が聞こえた」など、見た様子・聞こえた音'],
    ['安らか', '「穏やかな表情だった」など、見た様子'],
    ['かわいそう', '見たこと・聞いたこと（職員の気持ちは、看取りのあとの振り返りの場で話しましょう）'],
    ['残念', '見たこと・聞いたこと（職員の気持ちは、看取りのあとの振り返りの場で話しましょう）'],
    ['悲し', '見たこと・聞いたこと（職員の気持ちは、看取りのあとの振り返りの場で話しましょう）'],
    ['天国', '見たこと・聞いたこと（職員の気持ちは、看取りのあとの振り返りの場で話しましょう）'],
    ['冥福', '見たこと・聞いたこと（職員の気持ちは、看取りのあとの振り返りの場で話しましょう）'],
    ['不穏', '「手で布団を何度もさわっていた」「大きな声で〇〇と話した」など、見たままの様子'],
    ['様子観察', '何を・いつまで観察するのか（例：「次の巡回で呼吸の回数を確認する」）'],
    ['特変なし', '確認した項目（呼吸・表情・尿量・皮膚の色など）を具体的に'],
  ];

  var H0 = Formdoc.H;
  function inPhase(v, x) { return x.indexOf(P[v.phase]) !== -1; }
  function phaseOpts(list) {
    return function (v) { return list.filter(function (x) { return inPhase(v, x[3]); }).map(function (x) { return [x[0], x[1]]; }); };
  }
  function texts(list, ids) { return H0.pick(list, ids).map(function (x) { return x[2]; }); }
  function isGo(v) { return v.phase === 'go'; }
  function notGo(v) { return v.phase !== 'go'; }
  function waiting(v) { return isGo(v) && v.doctor === 'machi'; }
  function confirmed(v) { return isGo(v) && v.doctor !== 'machi'; }
  function picked(id) { return function (v) { return v.contact.indexOf(id) !== -1; }; }

  function vitals(v) {
    var parts = [['体温', v.kt, '℃'], ['血圧', v.bp, ''], ['脈拍', v.pl, '回/分'], ['SpO2', v.sp, '％']];
    var out = parts.filter(function (p) { return String(p[1] || '').trim(); }).map(function (p) {
      var val = p[1].trim();
      return p[0] + (p[0] === 'SpO2' ? ' ' : '') + val + (/[℃%％回分]/.test(val) ? '' : p[2]);
    });
    return out.length ? 'バイタル：' + out.join('、') + '。' : '';
  }
  function contacts(v, H) {
    return CONTACT.filter(function (c) { return v.contact.indexOf(c[0]) !== -1; }).map(function (c) {
      return H.time(v[c[2]]) + '、' + c[3][P[v.phase]];
    }).join('\n');
  }

  // 医師による確認の行。介護職員が「死亡」と判断する書き方にはせず、確認した人（医師）と時刻を書く
  function kakunin(v, H) {
    if (v.doctor === 'ict') {
      return ['医師による確認', 'kakunin', '事前の取り決めに沿い、医師の判断で、情報通信機器（ICT）を利用した死亡診断の手順により確認が行われた。看護師（　　）がご本人の状態を確認し、テレビ電話などで医師に報告した。' +
        H.time(v.tKakunin) + '、医師が死亡を確認した。'];
    }
    if (v.doctor === 'machi') {
      return ['医師の来所', 'kakunin', '医師には連絡済みで、' + H.time(v.tYotei) + 'ごろに来所される予定。医師の来所と確認を待っている。\n（医師の確認後に追記）　　時　　分、来所した医師が死亡を確認した。'];
    }
    return ['医師による確認', 'kakunin', H.time(v.tKakunin) + '、来所した医師が死亡を確認した。'];
  }

  Formdoc.run({
    title: '看取り期の経過記録',
    ai: {
      role: '特別養護老人ホーム・グループホーム・有料老人ホームなどの介護職員',
      doc: '看取り期の経過記録',
      rules: [
        '死亡の確認・診断は医師が行う。介護職員の記録として「死亡した」「心肺停止」などの医学的な判断の言葉は書かず、気づいた時刻と見たことを書く。',
        '「かわいそう」「苦しそう」「安らかに」など感情や評価の言葉を使わず、見たこと・聞いたこと・行ったことを書く。',
        'ご本人・ご家族の言葉は「」でそのまま残す。',
        '状態（事実）→ ご本人・ご家族の言葉 → 行ったケア → 連絡 の順番と、時刻を守る。',
        '時刻・数字の空欄は推測で埋めずに残す。',
        '「ご本人」「ご家族」「〜された」など、尊厳を大切にした丁寧な言葉にそろえる。',
      ],
    },
    blocks: [
      { title: 'いつ・どの時期の記録か', fields: [
        { id: 'date', type: 'date', label: '日付', today: true, half: true },
        { id: 'time', type: 'time', label: '時刻', hint: '亡くなった後は、気づいた時刻', half: true },
        { id: 'who', type: 'text', label: '対象の方', hint: '居室番号・イニシャルなど、施設の決まりに沿って', ph: '例：203号室 Aさん' },
        { id: 'phase', type: 'seg', options: PHASES },
        { id: 'doctor', type: 'seg', label: '医師の確認', options: DOCTOR, show: isGo },
      ] },
      { title: 'ご本人の状態', small: '見たこと・測ったこと', fields: [
        { id: 'state', type: 'chips', options: phaseOpts(STATE) },
        { id: 'kt', type: 'text', label: '体温', ph: '例：37.2', half: true, show: notGo },
        { id: 'bp', type: 'text', label: '血圧', ph: '例：96/58', half: true, show: notGo },
        { id: 'pl', type: 'text', label: '脈拍（1分間）', ph: '例：104', half: true, show: notGo },
        { id: 'sp', type: 'text', label: 'SpO2', hint: '血液中の酸素の割合', ph: '例：91', half: true, show: notGo },
        { id: 'extra', type: 'textarea', label: '書き足したいこと', hint: '時刻・回数・量などの数字を入れると伝わります', ph: '例：14時、呼吸の回数は1分間に28回。' },
        { id: 'words', type: 'text', label: 'ご本人の言葉', hint: '「」の中身だけを入力。言い換えずにそのまま', ph: '例：ありがとう', show: notGo },
      ] },
      { title: '行ったケア', fields: [
        { id: 'care', type: 'chips', options: CARE.map(function (x) { return [x[0], x[1]]; }), show: notGo },
        { id: 'after', type: 'chips', label: 'エンゼルケア・お見送り', options: AFTER.map(function (x) { return [x[0], x[1]]; }), show: confirmed },
        { id: 'wait', type: 'chips', label: '医師の来所を待つ間', hint: 'エンゼルケアは、医師が死亡を確認した後に行います', options: WAIT.map(function (x) { return [x[0], x[1]]; }), show: waiting },
      ] },
      { title: 'ご家族', small: '様子・言葉・付き添い', fields: [
        { id: 'family', type: 'chips', options: phaseOpts(FAMILY) },
        { id: 'fwords', type: 'text', label: 'ご家族の言葉', hint: '「」の中身だけを入力', ph: '例：最期までここで過ごせてよかった' },
      ] },
      { title: '連絡', small: '相手を選ぶと時刻の欄が出ます', fields: [
        { id: 'contact', type: 'chips', options: CONTACT.map(function (c) { return [c[0], c[1]]; }) },
        { id: 'tKango', type: 'time', label: '看護職員に連絡した時刻', half: true, show: picked('kango') },
        { id: 'tIshi', type: 'time', label: '医師に連絡した時刻', half: true, show: picked('ishi') },
        { id: 'tKazoku', type: 'time', label: 'ご家族に連絡した時刻', half: true, show: picked('kazoku') },
        { id: 'tSoudan', type: 'time', label: '相談員などに連絡した時刻', half: true, show: picked('soudan') },
        { id: 'tKakunin', type: 'time', label: '医師が死亡を確認した時刻', hint: '医師・看護職員に確認して記入', show: confirmed },
        { id: 'tYotei', type: 'time', label: '医師の来所予定の時刻', hint: '医師から聞いた予定の時刻', show: waiting },
      ] },
      { title: '申し送り', fields: [
        { id: 'next', type: 'chips', options: phaseOpts(NEXT) },
      ] },
    ],
    build: function (v, H) {
      var go = isGo(v);
      var phaseName = H.label(PHASES, v.phase);
      var state = texts(STATE, v.state).join('');
      if (go && state) state = H.time(v.time) + '、' + state;
      var vital = go ? '' : vitals(v);
      var stateText = [state, vital, v.extra.trim()].filter(Boolean).join('\n');
      var words = v.words.trim().replace(/^「|」$/g, '');
      var fwords = v.fwords.trim().replace(/^「|」$/g, '');
      var family = [texts(FAMILY, v.family).join(''), fwords ? 'ご家族は「' + fwords + '」と話された。' : ''].filter(Boolean).join('\n');
      var next = texts(NEXT, v.next).join('');
      var rows;
      if (go) {
        rows = [
          ['日時', 'when', H.date(v.date) + '　' + H.time(v.time)],
          ['時期', 'phase', phaseName],
          ['気づいたときの様子', 'state', stateText, '（左で様子を選ぶと入ります）'],
          ['連絡', 'contact', contacts(v, H), '（左で連絡した相手を選ぶと入ります）'],
          kakunin(v, H),
          ['ご家族への対応', 'family', family, '（ご家族の様子・言葉があれば記入）'],
          waiting(v)
            ? ['医師の来所を待つ間', 'wait', texts(WAIT, v.wait).join('\n'), '（左で、待つ間の対応を選ぶと入ります）']
            : ['エンゼルケア・お見送り', 'after', texts(AFTER, v.after).join('\n'), '（左でケアを選ぶと入ります）'],
          ['申し送り', 'next', next, '（必要に応じて記入）'],
        ];
      } else {
        rows = [
          ['日時', 'when', H.date(v.date) + '　' + H.time(v.time)],
          ['時期', 'phase', phaseName],
          ['状態', 'state', stateText, '（左で状態を選ぶと入ります）'],
          ['ご本人の言葉', 'words', words ? '「' + words + '」と話された。' : '', '（ご本人の言葉があれば記入）'],
          ['ご家族', 'family', family, '（ご家族の様子・言葉があれば記入）'],
          ['行ったケア', 'care', texts(CARE, v.care).join(''), '（左でケアを選ぶと入ります）'],
          ['連絡', 'contact', contacts(v, H), '（連絡した相手があれば記入）'],
          ['申し送り', 'next', next, '（必要に応じて記入）'],
        ];
      }
      return {
        title: '看取り期の経過記録',
        left: '対象：' + (v.who.trim() || '　　　　'),
        right: '記録者：',
        sections: [{ h: '記録', w2: '120px', rows: rows }],
        foot: go
          ? '死亡の確認・死亡診断は医師が行います。介護職員の記録には、気づいた時刻と見たこと、連絡した相手と時刻を書きます。' +
            (waiting(v) ? '医師が来所して確認するまでは「死亡」と書かず、確認の後に、確認した時刻を追記します。' : '')
          : '状態（事実）→ ご本人・ご家族の言葉 → 行ったケア → 連絡 の順に、時刻を添えて書きます。死亡の確認・診断は医師が行います。',
      };
    },
    warn: function (v) {
      var text = v.extra;
      // 「医師が死亡を確認した」は、確認した人と時刻を書く正しい形なので、言いかえの対象にしない
      var text2 = text.replace(/医師が死亡を確認|医師が死亡確認|医師による死亡の?確認/g, '');
      var d = DIAG.filter(function (w) { return text2.indexOf(w) !== -1; })[0];
      if (d) return '「' + d + '」は、医師が判断することです。介護職員の記録では「〇時〇分、呼吸の動きが見られないことに気づいた」のように、見たことと時刻を書きます（医師が確認したあとは「〇時〇分、医師が死亡を確認した」と書きます）。';
      var f = FEEL.filter(function (w) { return text.indexOf(w[0]) !== -1; })[0];
      if (f) return '「' + f[0] + '」は、書いた人の受け止め方が入る言葉です。' + f[1] + 'に書きかえると、ご本人の尊厳を守りながら事実が伝わります。';
      if (isGo(v) && v.state.indexOf('kokyunashi') !== -1 && v.state.indexOf('kazokusoba') !== -1) return '「呼吸の動きが見られない（巡回で気づいた）」と「ご家族が付き添う中で」は、別の場面の文です。実際の場面に合うほうを1つ選んでください。';
      if (!v.state.length && !v.extra.trim()) return '「ご本人の状態」を選ぶか書き足すと、記録の文章ができます。';
      if (waiting(v) && v.contact.indexOf('ishi') === -1) return '医師に連絡した時刻も残しておきましょう。「連絡」で「医師」を選ぶと、時刻の欄が出ます。';
      if (waiting(v) && !v.tYotei) return '医師の来所予定の時刻を入れておくと、次の勤務者にも伝わります。医師が死亡を確認したら、確認した時刻を追記してください。';
      if (confirmed(v) && !v.tKakunin) return '医師が死亡を確認した時刻は、医師や看護職員に確認して記入してください。介護職員が「死亡」と判断して書くことはしません。';
      if (v.phase === 'chokuzen' && v.contact.indexOf('kango') === -1) return '状態が変わったときは、看護職員に報告した時刻も残しておくと、多職種で経過を共有できます。';
      if (!isGo(v) && !v.care.length) return '行ったケア（口腔ケア・体位変換・声かけなど）も書くと、状態の変化に対して何をしたかが伝わります。';
      if (!v.family.length && !v.fwords.trim()) return 'ご家族の様子や言葉も残しておくと、ご家族への支援の記録になります。';
      return '';
    },
  });
})();
