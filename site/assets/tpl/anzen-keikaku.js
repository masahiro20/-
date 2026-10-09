// 安全計画（送迎・置き去り防止つき）。児童発達支援・放課後等デイサービス向け。
// 根拠：指定通所支援基準 第40条の2（安全計画）・第40条の3（車を使うときの所在の確認）。
// 送迎の手順は「こどものバス送迎・安全徹底マニュアル」の送迎業務モデル例、計画の項目は こども家庭庁 事務連絡（令和5年7月4日）の「事業所安全計画例」に合わせる。
(function () {
  'use strict';
  var SVC = [['jihatsu', '児童発達支援'], ['hodei', '放課後等デイサービス'], ['tagino', '多機能（児発＋放デイ）'], ['center', '児童発達支援センター']];
  var MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
  var MONTH_OPTS = MONTHS.map(function (m) { return [String(m), m + '月']; });

  // 安全点検の場所 [id, 名前（左の欄）, 計画の文, 送迎ありのときだけ（'dev' は安全装置があるときだけ）]
  var TENKEN = [
    ['setsubi', '部屋・設備', '部屋・設備（家具の固定、コンセント、窓・出入口のかぎ、段差など）', false],
    ['yugu', '遊具・おもちゃ', '遊具・おもちゃ（こわれ・とがった所・小さな部品がないか）', false],
    ['bousai', '消火器・避難経路', '消火器・非常口・避難経路（物が置かれていないか）', false],
    ['gaibu', '散歩コース・公園', '散歩コース・よく行く公園・避難先（危ない場所がないか）', false],
    ['car', '送迎の車', '送迎の車（タイヤ・ブレーキ・ライト・ドアのロックなど）', true],
    ['buzzer', '安全装置（ブザー等）', '置き去りを防ぐ安全装置（ブザー等）がきちんと動くか', 'dev'],
  ];
  // マニュアル [id, 名前]
  var MANUAL = [
    ['jiko', 'ふだんの支援での事故防止'], ['sougei', '送迎'], ['gaishutsu', '事業所の外での活動'], ['pool', 'プール・水あそび'],
    ['shokuji', '食事・おやつ（誤えん・アレルギー）'], ['saigai', '災害（地震・火事・大雨など）'], ['fushinsha', '不審者への対応'],
    ['kyukyu', '救急対応・119番通報'], ['kansen', '感染症'],
  ];
  // 子どもへの安全指導 [id, 名前, 計画の文, 送迎ありのときだけ]
  var SHIDO = [
    ['kotsu', '交通安全', '交通安全：道路の歩き方、信号の見方、車の乗り降りのしかたを、外出の前などにくり返し伝える。', false],
    ['hinan', '避難のしかた', '避難のしかた：避難訓練にあわせて、合図を聞いたら職員のそばに集まる、「おさない・はしらない・しゃべらない・もどらない」の約束を確かめる。', false],
    ['fushinsha', '不審者', '不審者：知らない人について行かない、こわいときは大きな声を出して逃げる・近くの大人に知らせる、などの約束を伝える。', false],
    ['car', '車に残されたとき', '車に残されたとき：クラクションを鳴らす、窓をたたくなど、外に助けを求める方法を、子どもの発達に合わせて練習する（送迎の車に乗ることが不安にならないよう気をつける）。', true],
    ['yugu', '遊具・おもちゃの使い方', '遊具・おもちゃ：使い方の約束と、こわれている物に気づいたら職員に知らせることを伝える。', false],
    ['mizu', '水の事故', '水の事故：水あそび・プールの前に、プールのまわりを走らない、職員の合図で入る・出る、などの約束を確かめる。', false],
  ];
  // 保護者への周知 [id, 名前, 計画の文]
  var SHUCHI = [
    ['setsumei', '利用を始めるときの説明', '利用を始めるとき：重要事項の説明と一緒に、安全計画と事業所の安全の取り組みを説明する。'],
    ['otayori', 'おたより', 'おたより：避難訓練や送迎の訓練の予定・ようすを知らせる。'],
    ['keiji', '事業所内の掲示', '掲示：安全計画のあらましを、玄関など保護者の目にふれる場所に掲示する。'],
    ['hp', 'ホームページ', 'ホームページ：安全計画と取り組みの内容を公表する。'],
    ['kesseki', '欠席・お迎えの連絡ルール', '連絡のルール：送迎を使わない日（欠席・早退・家族のお迎えなど）は、利用日の（　）時までに、電話か連絡アプリで知らせてもらう。'],
    ['katei', '家庭での安全教育のお願い', '家庭でのお願い：交通安全や不審者への対応などを、家庭でも子どもと話してもらうようお願いする。'],
  ];
  // 事業所の外での活動 [id, 名前, 計画の文]
  var GAI = [
    ['sanpo', '散歩・公園', '散歩・公園：行き先と道順を前もって確かめ、職員の役割（先頭・最後尾・全体を見る人）を決める。出発するとき・着いたとき・帰ってきたときに人数を確かめる。'],
    ['kokyo', '電車・バスでの外出', '電車・バスでの外出：乗る前と降りたあとに人数を確かめる。はぐれたときの集合場所と連絡のしかたを、前もって職員で決めておく。'],
    ['car', '車での外出', '車での外出：送迎と同じように、乗るとき・降りるときに点呼し、降りたあとは車内を見回る（下の「4. 送迎時の所在確認」の手順で行う）。'],
    ['pool', 'プール・水あそび', 'プール・水あそび：子どもを見守ることだけに専念する職員を決め、その職員はほかの仕事をしない。'],
  ];
  // 研修・訓練 [field id, 列(kenshu|kunren), 表に入れる名前, 左の欄の名前, 初期の月, 送迎ありのときだけ]
  var TRAIN = [
    ['mPlan', 'kenshu', '安全計画・マニュアルの研修', '安全計画・マニュアルの研修（全職員への周知）', ['4'], false],
    ['mKyukyu', 'kenshu', '救急対応の研修（心肺蘇生・AEDなど）', '救急対応の研修（心肺蘇生・AEDなど）', ['6'], false],
    ['mSougei', 'kunren', '送迎の置き去り防止訓練', '送迎の置き去り防止訓練', ['4', '10'], true],
    ['mHinan', 'kunren', '避難訓練（地震・火事など）', '避難訓練（地震・火事など）', ['5', '9', '11', '2'], false],
    ['mFushinsha', 'kunren', '不審者対応・119番通報の訓練', '不審者対応・119番通報の訓練', ['7'], false],
  ];
  var FREQ = [['month', '毎月'], ['quarter', '3か月に1回'], ['term', '年3回（学期ごと）']];
  var FREQ_MONTHS = { month: MONTHS, quarter: [4, 7, 10, 1], term: [4, 9, 1] };

  var hasCar = function (v) { return v.sougei === 'ari'; };
  // 安全装置の点検を入れるか（すべて2列までの車、または「つけていない」ときは入れない）
  var hasDev = function (v) { return hasCar(v) && v.rows !== '2' && v.buzzer !== 'nashi'; };
  var fits = function (x, v) { return x[3] === 'dev' ? hasDev(v) : !x[3] || hasCar(v); };
  var NOW = new Date();
  var FY = NOW.getMonth() + 1 >= 4 ? NOW.getFullYear() : NOW.getFullYear() - 1;

  function carOpts(list) { return function (v) { return list.filter(function (x) { return fits(x, v); }).map(function (x) { return [x[0], x[1]]; }); }; }

  var fields4 = TRAIN.map(function (t) {
    var f = { id: t[0], type: 'chips', label: t[3], options: MONTH_OPTS, def: t[4] };
    if (t[5]) f.show = hasCar;
    return f;
  });

  Formdoc.run({
    title: '安全計画',
    ai: { role: '児童発達支援・放課後等デイサービスの管理者', doc: '事業所の安全計画（送迎時の置き去り防止をふくむ）', rules: ['選んだ月・頻度・台数は変えない。', '送迎時の所在確認の手順（点呼・車内の見回り・ダブルチェック・記録）は省かない。', '新人職員にも分かるやさしい言葉にする。子どもの実名は入れない。'] },
    blocks: [
      { title: '事業所のこと', fields: [
        { id: 'svc', type: 'seg', label: '事業所の種類', options: SVC },
        { id: 'year', type: 'select', label: '計画の年度', options: [[String(FY), FY + '年度'], [String(FY + 1), (FY + 1) + '年度']], half: true },
        { id: 'date', type: 'date', label: '作成日', today: true, half: true },
        { id: 'name', type: 'text', label: '事業所名', ph: '例：〇〇こどもクラブ', half: true },
        { id: 'boss', type: 'text', label: '計画の責任者', hint: '空欄なら記入欄', ph: '例：管理者 〇〇', half: true },
      ] },
      { title: '送迎と車', fields: [
        { id: 'sougei', type: 'seg', label: '車での送迎', options: [['ari', 'している'], ['nashi', 'していない']] },
        { id: 'cars', type: 'select', label: '送迎の車の台数', options: [['1', '1台'], ['2', '2台'], ['3', '3台'], ['4', '4台'], ['5', '5台以上']], show: hasCar, half: true },
        // 'single' は以前の「運転手だけの便がある」。共有リンク・自動保存の互換のため、両方の手順を書く「一部の便だけ」に当てる
        { id: 'staff', type: 'select', label: '同乗職員（運転手のほか）', options: [['dojo', '全便あり'], ['single', '一部の便だけ'], ['nashi', 'なし（運転手のみ）']], show: hasCar, half: true },
        { id: 'rows', type: 'seg', label: '座席の列', options: [['3', '3列以上の車がある'], ['2', 'すべて2列まで']], show: hasCar },
        { id: 'buzzer', type: 'seg', label: '置き去りを防ぐ安全装置（ブザー等）', options: [['ari', 'つけている'], ['yotei', 'これからつける'], ['nashi', 'つけていない']], show: function (v) { return hasCar(v) && v.rows === '3'; } },
        { id: 'gai', type: 'chips', label: '事業所の外での活動', options: GAI.map(function (g) { return [g[0], g[1]]; }), def: ['sanpo'] },
      ] },
      { title: '安全点検', fields: [
        { id: 'tenken', type: 'chips', label: '点検するところ', options: carOpts(TENKEN), def: ['setsubi', 'yugu', 'bousai', 'car', 'buzzer'] },
        { id: 'freq', type: 'seg', label: 'チェックリストでの重点点検', options: FREQ },
        { id: 'manual', type: 'chips', label: 'つくる・見直すマニュアル', options: MANUAL, def: ['jiko', 'sougei', 'gaishutsu', 'saigai', 'fushinsha', 'kyukyu'] },
      ] },
      { title: '研修・訓練の月', note: '行う月を選ぶと、年間の予定表に入ります。', fields: fields4 },
      { title: '子どもへの安全指導・保護者への周知', fields: [
        { id: 'shido', type: 'chips', label: '子どもに伝えること', options: carOpts(SHIDO), def: ['kotsu', 'hinan', 'fushinsha', 'car'] },
        { id: 'shuchi', type: 'chips', label: '保護者への知らせ方', options: SHUCHI.map(function (s) { return [s[0], s[1]]; }), def: ['setsumei', 'otayori', 'kesseki'] },
      ] },
      { title: '再発防止と見直し', fields: [
        { id: 'hiyari', type: 'seg', label: 'ヒヤリ・ハットの共有', options: [['daily', '毎日の終礼で'], ['monthly', '月1回の職員会議で']] },
        { id: 'review', type: 'select', label: '計画を見直す月', options: MONTH_OPTS, def: '2', half: true },
        { id: 'place', type: 'text', label: '計画・マニュアルの置き場所', ph: '例：事務室の棚', half: true },
      ] },
    ],
    build: function (v, H) {
      var car = hasCar(v);
      var y = Number(v.year) || FY;
      var svc = H.label(SVC, v.svc);
      var place = v.place.trim() || '（　　　　）';

      // ── 1. 安全点検 ──
      var ten = H.pick(TENKEN, v.tenken).filter(function (t) { return fits(t, v); });
      var freqText = { month: '毎月1回', quarter: '3か月に1回（4月・7月・10月・1月）', term: '年3回（4月・9月・1月、学期ごと）' }[v.freq];
      var sec1 = [
        ['毎日の点検', 'ten.daily', '支援を始める前に、部屋・おもちゃ・出入口のかぎなどを目で見て確かめる。' +
          (car ? '\n送迎の前に、運転手が車の日常点検（ライト・ランプ・タイヤなど）をし、管理者などが運転手の体調を確かめる。' : '')],
        ['重点点検', 'ten.focus', ten.length ? freqText + '、次の場所をチェックリストで点検し、結果を記録に残す。直すところが見つかったら、すぐ管理者に知らせて直す。\n' + H.bullets(ten.map(function (t) { return t[2]; })) : '', '（点検するところを選ぶと入ります）'],
        ['マニュアル', 'ten.manual', v.manual.length ? '次のマニュアルを作り（または見直し）、非常勤・パートの職員もふくめた全職員で共有する。置き場所：' + place + '\n' + H.bullets(H.pick(MANUAL, v.manual).map(function (m) { return m[1]; })) : '', '（マニュアルを選ぶと入ります）'],
      ];

      // ── 2. 安全指導・保護者への周知 ──
      var shido = H.pick(SHIDO, v.shido).filter(function (s) { return !s[3] || car; });
      var gai = H.pick(GAI, v.gai);
      var sec2 = [
        ['子どもへの安全指導', 'shido', shido.length ? '子どもの発達や理解に合わせて、絵カードや実演などで、くり返し伝える。\n' + H.bullets(shido.map(function (s) { return s[2]; })) : '', '（子どもに伝えることを選ぶと入ります）'],
        ['保護者への周知', 'shuchi', v.shuchi.length ? '子どもの安全について保護者と協力できるよう、安全計画にもとづく取り組みを知らせる。\n' + H.bullets(H.pick(SHUCHI, v.shuchi).map(function (s) { return s[2]; })) : '', '（保護者への知らせ方を選ぶと入ります）'],
      ];
      if (gai.length) sec2.push(['事業所の外での活動', 'gai', H.bullets(gai.map(function (g) { return g[2]; }))]);

      // ── 3. 研修・訓練の年間予定（月×研修・訓練・点検） ──
      var cells = {};
      MONTHS.forEach(function (m) { cells[m] = { kenshu: [], kunren: [], ten: [] }; });
      TRAIN.forEach(function (t) {
        if (t[5] && !car) return;
        (v[t[0]] || []).forEach(function (m) { if (cells[m]) cells[m][t[1]].push(t[2]); });
      });
      // 表には短い名前だけ入れる（点検する場所のくわしい中身は「1. 安全点検」に書く）
      var hasTen = ten.some(function (t) { return t[0] !== 'car' && t[0] !== 'buzzer'; });
      var carTen = ten.filter(function (t) { return t[0] === 'car' || t[0] === 'buzzer'; }).map(function (t) { return t[0] === 'car' ? '車' : 'ブザー'; });
      if (hasTen) FREQ_MONTHS[v.freq].forEach(function (m) { cells[m].ten.push('重点点検'); });
      if (carTen.length) MONTHS.forEach(function (m) { cells[m].ten.push(carTen.join('・') + 'の点検'); });
      if (v.manual.indexOf('pool') !== -1 || v.gai.indexOf('pool') !== -1) cells[6].kenshu.push('プール・水あそびのマニュアルの確認');
      var rv = Number(v.review) || 2;
      cells[rv].ten.push('安全計画・マニュアルの見直し');
      var rows = MONTHS.map(function (m) {
        var c = cells[m];
        return [m + '月', c.kenshu.join('\n'), c.kunren.join('\n'), c.ten.join('\n'), ''];
      });
      var sec3 = [
        ['参加する人', 'tr.who', '常勤・非常勤を問わず、全職員が参加する。' + (car ? '送迎を担当しない職員も、送迎の研修・訓練に参加する（いつもの担当が休んだときに、代わりに乗ることがあるため）。' : '')],
        ['新しく入った職員', 'tr.new', '採用したときに、安全計画とマニュアルを説明し、オンライン研修なども使って学ぶ機会をつくる。'],
        ['記録', 'tr.rec', '研修・訓練をしたら、日時・内容・参加者・気づいたことを記録に残す。参加できなかった職員には、資料を回して後日伝える。'],
      ];

      // ── 4. 送迎時の所在確認 ──
      var sec4;
      if (car) {
        // 同乗職員：全便あり（dojo）／一部の便だけ（single）／なし（nashi）。一部の便だけのときは、両方の手順を書く
        var mixed = v.staff === 'single', solo = v.staff === 'nashi';
        var by = function (withStaff, driverOnly) {
          if (mixed) return '同乗職員がいる便：' + withStaff + '\n運転手だけの便：' + driverOnly;
          return solo ? driverOnly : withStaff;
        };
        var dev;
        if (v.rows === '2') dev = '送迎の車はすべて座席が2列まで（運転席の列と、その1つ後ろの前向きの座席だけ）のため、安全装置（ブザー等）をつける義務の対象外となる場合がある（対象になるかは、指定権者に確かめておく）。安全装置がなくても、上の点呼と車内の見回りは必ず行う。';
        else if (v.buzzer === 'ari') dev = '送迎の車には、置き去りを防ぐ安全装置（ブザー等）をつけている。降りるときの確認では、毎回この装置を使う。装置が動くことを毎日の送迎で確かめ、毎月の点検でも確かめる。';
        else dev = '座席が3列以上ある送迎の車には、置き去りを防ぐ安全装置（ブザー等）をつけ、降りるときの確認に使うことが決まっている。（　　年　　月）までにつける。製品は、国のガイドラインに合うもの（こども家庭庁の一覧にのっているもの）から選ぶ。';
        sec4 = [
          ['使う車', 's.car', '送迎の車：' + (v.cars === '5' ? '5台以上' : v.cars + '台') + '（車ごとに乗車名簿とチェック表を用意する）'],
          ['送迎の前', 's.before', '出欠の責任者（　　　　）が当日の出欠を確かめ、乗車名簿（だれが・どこで乗り降りするか）に反映する。\n' +
            (mixed ? '乗車名簿には、便ごとに同乗職員がいるかどうかも書いておく。\n' : '') +
            by('乗車名簿を、運転手・同乗職員・管理者・事業所に残る職員で共有する。',
              '乗車名簿を、運転手・管理者・事業所に残る職員で共有し、事業所に着いたときに車内を見回る職員（　　　　）を決めておく。') +
            '\n緊急連絡用の携帯電話が車内にあるかを確かめる。'],
          ['乗るとき', 's.on', by('同乗職員が、子どもの顔を見て名前を呼び（点呼）、乗車名簿にチェックする。',
            '運転手が、車を止めた状態で、子どもの顔を見て名前を呼び（点呼）、乗車名簿にチェックする。') +
            '\n乗るはずの子がいない・乗らないはずの子がいるときは、すぐに事業所に連絡し、事業所から保護者に確かめる。\n運転手は、全員が座ってシートベルトをしたことを確かめてから出発する。'],
          ['降りるとき', 's.off', by('同乗職員が、子どもの顔を見て点呼し、降りた人数を乗車名簿と照らし合わせて記録する。',
            '運転手が、車を止めた状態で、子どもの顔を見て点呼し、降りた人数を乗車名簿と照らし合わせて記録する。') +
            '\n家で降りるときは、保護者に引き渡したことを確かめて記録する。\n運転手は、降りた子どもの安全を確かめてから出発する。'],
          ['車内の見回り', 's.check', '全員が降りたら、運転手が車内の前から一番後ろまで歩き、座席の下や物かげもふくめて1列ずつ見回る。\n' +
            by('同乗職員（またはその日の確認を手伝う職員）も同じように見回る（ダブルチェック）。',
              '事業所に着いたら、決めておいた別の職員がもう一度車内を見回る（ダブルチェック）。') +
            '\n車を片づける・清掃する人も、最後に見落としがないか確かめる。'],
          ['事業所での照合', 's.match', '事業所に着いたら、担当の職員が乗車名簿とその日の出欠を照らし合わせ、出欠の責任者に報告する。食いちがいがあれば、すぐに子どもの居場所を確かめ、管理者に報告する。'],
          ['記録', 's.rec', '乗車名簿・チェック表に、便ごとの時刻・人数・確認した2人の名前を残す。チェック表は運転席に置いておく。記録は（　）年保管する。'],
          ['安全装置', 's.device', dev],
        ];
      } else {
        sec4 = [
          ['送迎', 's.none', '車での送迎は行っていない。保護者が送り迎えをするときは、来所したとき・帰るときに、子どもの顔を見て受け取り・引き渡しをし、時刻を記録する。'],
          ['車を使うとき', 's.carUse', '事業所の外での活動などで車を使うときは、乗るとき・降りるときに、子どもの顔を見て点呼し、人数を記録する。全員が降りたら、運転手が車内の前から一番後ろまで歩いて見回り、もう1人の職員も確かめる（ダブルチェック）。'],
        ];
      }

      // ── 5. 再発防止と計画の見直し ──
      var sec5 = [
        ['ヒヤリ・ハット', 'r.hiyari', 'ヒヤリ・ハット（あと少しで事故になるところだったこと）に気づいた職員は、すぐに管理者に報告する。' +
          (v.hiyari === 'daily' ? '毎日の終礼で共有し、' : '月1回の職員会議で共有し、') + '原因を話し合って対策を決める。報告した人を責めず、報告しやすい雰囲気をつくる。'],
        ['事故が起きたとき', 'r.jiko', '原因を分析して再発防止策を決め、点検する場所やマニュアルに反映する。決めたことは全職員に伝え、必要に応じて保護者にも知らせる。'],
        ['計画の見直し', 'r.review', '毎年' + rv + '月に、1年間の取り組みとヒヤリ・ハットをふり返って安全計画とマニュアルを見直し、次の年度が始まる前に新しい計画をつくる。\n事故やヒヤリ・ハットがあったとき、職員が入れかわったとき、' + (car ? '送迎の道順や車が変わったとき、' : '') + '活動の内容が変わったときは、そのつど見直す。'],
        ['職員への周知', 'r.share', '見直した計画は、職員会議などで全職員に説明し、いつでも読めるように置いておく（置き場所：' + place + '）。'],
      ];

      var wareki = '令和' + (y - 2018) + '年度';
      return {
        title: wareki + ' 安全計画',
        left: (v.name.trim() ? v.name.trim() + '\n' : '') + svc,
        right: y + '年4月〜' + (y + 1) + '年3月\n作成：' + H.date(v.date) + '\n責任者：' + (v.boss.trim() || '　　　　　　'),
        sections: [
          { h: '1. 安全点検', rows: sec1 },
          { h: '2. 安全指導・保護者への周知', rows: sec2 },
          { key: 'plan', h: '3. 職員への研修・訓練と安全点検（年間の予定）', grid: { head: ['月', '研修', '訓練', '安全点検・見直し', '担当・メモ'], widths: ['48px', '', '', '', '96px'], rowHead: true, rows: rows, ph: '　' } },
          { h: '3.（つづき）研修・訓練の進め方', rows: sec3 },
          { h: '4. 送迎時の所在確認（置き去り防止）', rows: sec4 },
          { h: '5. 再発防止と計画の見直し', rows: sec5 },
        ],
        foot: 'この計画は、指定通所支援の基準（平成24年厚生労働省令第15号）第40条の2（安全計画の策定等）と第40条の3（自動車を運行する場合の所在の確認）にもとづく下書きです（放課後等デイサービスは第71条で準用。児童発達支援センターは児童福祉施設の設備及び運営に関する基準 第6条の3・第6条の4も）。送迎の手順は「こどものバス送迎・安全徹底マニュアル」（令和4年10月）の送迎業務モデル例をもとにしています。自治体によって様式や回数の決まりがあるため、指定権者の資料もご確認ください。',
      };
    },
    warn: function (v) {
      var car = hasCar(v);
      if (car && v.rows === '3' && v.buzzer !== 'ari') return '座席が3列以上ある送迎用の車には、置き去りを防ぐブザーなどの安全装置をつけ、降りるときの確認に使うことが基準で決まっています（令和6年3月31日までの経過措置は終わっています）。まだの場合は、早めにつけましょう。製品は、こども家庭庁が公表している「安全装置のリスト」で確かめられます。';
      if (car && (v.staff === 'single' || v.staff === 'nashi')) return '国の「こどものバス送迎・安全徹底マニュアル」では、運転手のほかに職員が同乗する体制をつくることが勧められています。運転手だけの便では、事業所に着いたあとに別の職員が車内を見回るなど、必ず2人で確かめるしくみにしましょう。' +
        (v.staff === 'single' ? '同乗職員がいる便といない便があるときは、便ごとにどちらの手順で行うかを乗車名簿に書いておくと、取り違えを防げます。' : '');
      if (v.svc === 'center' && (v.mHinan || []).length < 12) return '児童発達支援センターは、避難と消火の訓練を毎月1回行うことになっています（児童福祉施設の設備及び運営に関する基準 第6条の2）。「避難訓練」の月をすべて選んでおきましょう。';
      if (car && !(v.mSougei || []).length) return '送迎をしている事業所は、送迎の置き去り防止訓練（点呼や車内の見回りの練習）の月を決めておきましょう。';
      if (!(v.mHinan || []).length) return '避難訓練の月を選びましょう。非常災害に備えて、定期的に避難などの訓練を行うことが基準で決まっています。';
      if (!v.name.trim()) return '事業所名を入れると、計画の左上に入ります。作成日と責任者もあわせて確かめてください。';
      return '';
    },
  });
})();
