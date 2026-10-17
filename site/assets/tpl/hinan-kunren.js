// 避難訓練・BCP訓練の記録。種類ごとに、根拠・訓練の流れの例・役割の説明を入れ、課題には改善の案を添える。
(function () {
  'use strict';
  var SECTOR = [['kaigo', '介護'], ['shogai', '障害福祉'], ['jido', '児童（子ども）']];
  // id: [名前, 根拠の文（業種ごとに足す）, 訓練の流れの例[], 避難などで時間を測るか]
  var KIND = [
    ['kasai', '火災の避難・消火', true],
    ['jishin', '地震', true],
    ['suigai', '水害・土砂災害', true],
    ['bcp', 'BCPの机上シミュレーション', false],
    ['kansen', '感染症のBCP', false],
  ];
  var FLOW = {
    kasai: ['火元を見つけた人が大声で知らせ、非常ベルを鳴らす', '119番に通報する（訓練のときは「訓練です」と伝える）', '初期消火（消火器・屋内消火栓）を試みる。無理だと判断したら避難を優先する', '決めた順に避難を誘導する（歩行が難しい方・車いすの方の手順を確かめる）', '名簿で人数を確認し、本部に報告する', '消防署への報告と振り返り'],
    jishin: ['揺れがおさまるまで、頭を守って身の安全を確保する', '火の元・出口・けがの有無を確認する', '建物の被害を確かめ、避難が必要かを管理者が判断する', '避難が必要なときは、決めた集合場所へ誘導する', '名簿で安否と人数を確認し、本部に報告する', '家族・関係機関への連絡と、振り返り'],
    suigai: ['気象情報と市町村の避難情報（警戒レベル）を確認する', '避難を始める時刻と、避難先（上の階への移動を含む）を管理者が判断する', '利用者の避難を誘導し、必要な持ち出し品を運ぶ', '人数を確認し、本部に報告する', '家族・市町村など関係先に連絡する', '振り返り'],
    bcp: ['訓練の想定（いつ・何が起きたか）を全員で確認する', '「優先して続ける業務」と、休止・縮小できる業務を確かめる', '出勤できる職員が少ないときの人の割り振りを話し合う', '連絡網・連絡先（家族・関係機関）が使えるか確かめる', '備蓄品の場所と数、非常用電源の使い方を確かめる', '気づいたことを出し合い、BCPの見直す点を決める'],
    kansen: ['感染が疑われる人が出たときの報告の流れを確かめる', '部屋や動線の分け方、防護具の着け方・外し方を確かめる', '家族・保健所・関係機関への連絡を確かめる', '職員が休むときの人の割り振りと、業務の縮小を話し合う', '気づいたことを出し合い、BCPの見直す点を決める'],
  };
  var ROLES = [
    ['tsuho', '通報（119番・関係機関）'], ['shoka', '初期消火'], ['yudo', '避難誘導'], ['anpi', '安否確認・人数確認'],
    ['mochi', '非常用持ち出し品の搬出'], ['honbu', '本部（指揮・記録）'], ['kyugo', '応急手当・救護'], ['renraku', '家族・関係機関への連絡'],
  ];
  var BAND = [['hiru', '昼間'], ['yakan', '夜間'], ['souchou', '早朝'], ['kyujitsu', '休日']];
  var WEATHER = ['指定なし', '晴れ', '雨', '強い風', '大雨・台風', '雪・凍結'];
  // 課題 [id, 名前, 改善の案]
  var KADAI = [
    ['okure', '避難に思ったより時間がかかった', '避難の順番と経路を見直し、次回の訓練で時間をはかり直す。'],
    ['tsuho', '通報・連絡が遅れた、うまくいかなかった', '通報の文面（場所・状況・人数）を書いた紙を電話のそばに置き、全員で言う練習をする。'],
    ['yaku', '自分の役割を知らない職員がいた', '役割分担表を事務室に掲示し、新しい職員や非常勤の職員にも訓練の前に説明する。'],
    ['ugoki', '歩行が難しい方・車いすの方の移動に手間取った', '一人ひとりの避難の方法（誰が・どの経路で・何を使うか）を決めて、個別に練習する。'],
    ['tsuro', '廊下・出口に物があり通りにくかった', '避難経路に物を置かないよう決め、毎日の点検に入れる。'],
    ['mochi', '持ち出し品や備蓄の場所が分からなかった', '持ち出し品の一覧と置き場所を決めて掲示し、定期的に中身を確かめる。'],
    ['hitode', '夜間・少人数だと人手が足りない', '少ない人数で動く手順を決め、近隣や地域の方に協力をお願いすることも考える。'],
    ['anpi', '人数確認・安否確認の方法が分かりにくかった', '名簿の形と、集合場所での人数確認の担当者を決める。'],
    ['bcp', 'BCPの中身を知らない職員がいた', 'BCPの要点をまとめた資料を配り、研修で説明する。'],
  ];

  function minutesBetween(a, b) {
    var x = /^(\d{1,2}):(\d{2})$/.exec(a || ''), y = /^(\d{1,2}):(\d{2})$/.exec(b || '');
    if (!x || !y) return null;
    var d = (Number(y[1]) * 60 + Number(y[2])) - (Number(x[1]) * 60 + Number(x[2]));
    return d > 0 ? d : null;
  }
  var isMove = function (v) { return v.kind === 'kasai' || v.kind === 'jishin' || v.kind === 'suigai'; };
  var isFire = function (v) { return v.kind === 'kasai' || v.kind === 'jishin'; };

  Formdoc.run({
    title: '避難訓練・BCP訓練の記録',
    ai: { role: '福祉事業所の防火管理者・管理者', doc: '避難訓練・BCP訓練の実施記録', rules: ['日時・人数・かかった時間・消防署への通報の有無は変えない。', '課題と改善策は、入力された内容の範囲で書く。事実にないことは足さない。', '職員名・利用者名は空欄か「〇〇さん」のままにする。'] },
    blocks: [
      { title: '訓練の種類', fields: [
        { id: 'sector', type: 'seg', label: '業種', options: SECTOR, profile: 'svc' },
        { id: 'kind', type: 'seg', wide: true, options: KIND.map(function (k) { return [k[0], k[1]]; }) },
        { id: 'band', type: 'seg', label: '想定した時間帯', options: BAND },
      ] },
      { title: '日時', fields: [
        { id: 'date', type: 'date', label: '実施日', today: true },
        { id: 'start', type: 'time', label: '始めた時刻', half: true },
        { id: 'end', type: 'time', label: '終わった時刻', half: true },
        { id: 'mins', type: 'text', label: '避難完了まで（分）', hint: '合図から全員の避難確認まで', ph: '例：6', show: isMove },
      ] },
      { title: '想定', fields: [
        { id: 'where', type: 'text', label: 'きっかけ・場所', ph: '例：1階の厨房から出火／震度6強の地震／大雨で川の水位が上がった' },
        { id: 'weather', type: 'select', label: '天候', options: WEATHER, half: true },
        { id: 'flow', type: 'textarea', label: '想定のつけたし', ph: '例：エレベーターは使えない。夜勤2名だけの時間帯。', rows: 2 },
      ] },
      { title: '参加した人', fields: [
        { id: 'who', type: 'chips', options: [['staff', '職員'], ['user', '利用者・子ども'], ['shobo', '消防署の方'], ['chiiki', '地域の方'], ['family', '家族']], def: ['staff', 'user'] },
        { id: 'nstaff', type: 'text', label: '職員の人数', ph: '例：8', half: true },
        { id: 'nuser', type: 'text', label: '利用者・子どもの人数', ph: '例：20', half: true },
        { id: 'nother', type: 'text', label: 'ほかの参加者', ph: '例：消防署 2名、地域の方 3名' },
      ] },
      { title: '役割分担と実施内容', fields: [
        { id: 'roles', type: 'chips', label: '決めた役割', options: ROLES, def: ['tsuho', 'shoka', 'yudo', 'anpi', 'mochi'] },
        { id: 'memo', type: 'textarea', label: '実施した内容', ph: '例：非常ベルで放送し、通報・初期消火の担当が動いた。全員が中庭に集合し、名簿で人数を確認した。', rows: 3 },
      ] },
      { title: '消防署への通報・立ち会い', fields: [
        { id: 'shobo', type: 'seg', options: [['tachiai', '事前に通報・立ち会いあり'], ['tsuho', '事前に通報（立ち会いなし）'], ['nashi', '通報していない']], show: isFire },
      ] },
      { title: '課題と改善', fields: [
        { id: 'kadai', type: 'chips', label: '気づいた課題', options: KADAI.map(function (k) { return [k[0], k[1]]; }), list: true, def: [] },
        { id: 'kadai2', type: 'textarea', label: 'ほかに気づいたこと', ph: '例：2階の利用者の避難に、想定より1分多くかかった。' },
        { id: 'kaizen', type: 'textarea', label: '改善策（自由に追加）', ph: '例：2階の担当を2名にする。担当：〇〇、期限：来月末' },
      ] },
      { title: '次回の予定', fields: [
        { id: 'nextDate', type: 'date', label: '次回の予定日', half: true },
        { id: 'nextKind', type: 'select', label: '次回の訓練', options: [['same', '今回と同じ種類'], ['yakan', '夜間・人が少ない時間を想定'], ['kasai', '火災の避難・消火'], ['jishin', '地震'], ['suigai', '水害・土砂災害'], ['bcp', 'BCPの机上シミュレーション']], half: true },
      ] },
      { title: '事業所と記入者', small: 'ほかの書類にも入ります', fields: [
        { id: 'office', type: 'text', label: '事業所名', ph: '例：〇〇事業所', half: true, profile: 'office' },
        { id: 'writer', type: 'text', label: '記録者（職種）', ph: '例：管理者 〇〇', half: true, profile: 'writer' },
      ] },
    ],
    build: function (v, H) {
      var kname = H.label(KIND, v.kind);
      var user = v.sector === 'jido' ? '子ども' : '利用者';
      var mins = v.mins && isMove(v) ? Number(String(v.mins).replace(/[^0-9.]/g, '')) : 0;
      var total = minutesBetween(v.start, v.end);
      var when = H.date(v.date) + '　' + (v.start ? H.time(v.start) : '　　時　　分') + '〜' + (v.end ? H.time(v.end) : '　　時　　分') + (total ? '（' + total + '分間）' : '');
      var band = H.label(BAND, v.band);

      // 参加者
      var parts = [];
      var ns = v.nstaff.trim(), nu = v.nuser.trim();
      if (v.who.indexOf('staff') !== -1) parts.push('職員 ' + (ns ? ns + '名' : '　名'));
      if (v.who.indexOf('user') !== -1) parts.push(user + ' ' + (nu ? nu + '名' : '　名'));
      if (v.who.indexOf('shobo') !== -1) parts.push('消防署の方');
      if (v.who.indexOf('chiiki') !== -1) parts.push('地域の方');
      if (v.who.indexOf('family') !== -1) parts.push('家族');
      var who = parts.join('、') + (v.nother.trim() ? '（' + v.nother.trim() + '）' : '') + '　※参加者名簿は別紙';

      // 根拠
      var law;
      var basis = [];
      if (v.kind === 'bcp' || v.kind === 'kansen') {
        basis.push('業務継続計画（BCP）に基づく訓練（シミュレーション）。運営基準の「業務継続計画の策定等」で、職員への周知と、研修・訓練を定期的に行うことが決まっています。');
        if (v.sector === 'kaigo') basis.push('回数の目安：介護サービスでは、入所系は年2回以上、通所・訪問系は年1回以上と、運営基準の解釈通知に示されています（感染症の数え方など、細かい点は指定権者に確認してください）。');
        else basis.push('回数は、サービスの種類や自治体で異なります。指定権者の資料で確認してください。');
      } else {
        basis.push('運営基準の「非常災害対策」で、避難、救出その他必要な訓練を定期的に行うことが決まっています。');
        if (v.kind === 'suigai') basis.push('市町村の地域防災計画に名称と所在地が定められた施設は、避難確保計画に基づく訓練を行い、結果を市町村長に報告します（水防法第15条の3第5項、土砂災害防止法第8条の2第5項）。');
        else basis.push('消防法施行規則で定める福祉施設などの防火対象物では、防火管理者が消火訓練と避難訓練を年2回以上行い、行うときはあらかじめ消防機関へ通報します（第3条第10項・第11項）。建物が対象かどうかは、消防署または消防計画で確認しましょう。');
      }
      law = basis.join('\n');

      // 想定
      var assume = band + 'の想定。' + (v.where.trim() ? v.where.trim() + '。' : '') + (v.weather && v.weather !== '指定なし' ? '天候：' + v.weather + '。' : '') + (v.flow.trim() ? v.flow.trim() : '');
      var flow = FLOW[v.kind].map(function (x, i) { return (i + 1) + '. ' + x; }).join('\n');

      // 役割と結果
      var roleRows = H.pick(ROLES, v.roles).map(function (r) { return [r[1], '', '']; });
      var sections = [
        { h: '実施概要', rows: [
          ['訓練の種類', 'kind', kname + (v.band === 'yakan' ? '（夜間想定）' : '')],
          ['日時', 'when', when],
          ['参加者', 'who', who],
          ['根拠', 'law', law],
        ].concat(isFire(v) ? [['消防署', 'shobo', { tachiai: '事前に消防署へ通報した。消防署の立ち会いあり。', tsuho: '事前に消防署へ通報した。立ち会いなし。', nashi: '通報はしていない。（理由：　　　　　　）' }[v.shobo]]] : []) },
        { h: '想定と流れ', rows: [
          ['想定', 'assume', assume],
          ['訓練の流れ', 'flow', flow, '（実際の流れに合わせて書き換えてください）'],
        ] },
      ];
      if (roleRows.length) sections.push({ key: 'roles', h: '役割と結果', grid: { head: ['役割', '担当者', '結果・気づき'], widths: ['34%', '24%', ''], rowHead: true, rows: roleRows, ph: '（記入）' } });
      var res = [];
      res.push(['実施した内容', 'memo', v.memo.trim(), '（左で入力すると入ります）']);
      if (isMove(v)) res.push(['避難完了まで', 'time', mins ? '合図から全員の避難を確認するまで　' + mins + '分' + (total ? '（訓練全体は ' + total + '分間）' : '') : '合図から全員の避難を確認するまで　　　分', '（左で入力すると入ります）']);
      sections.push({ h: '結果', rows: res });

      // 課題と改善
      var kd = H.pick(KADAI, v.kadai);
      var kText = kd.map(function (k) { return k[1]; });
      if (v.kadai2.trim()) kText.push(v.kadai2.trim());
      var zText = kd.map(function (k) { return k[2]; });
      if (v.kaizen.trim()) zText.push(v.kaizen.trim());
      sections.push({ h: '課題と改善', rows: [
        ['気づいた課題', 'kadai', H.bullets(kText), '（課題がなかった場合も「特になし」と書く）'],
        ['改善策', 'kaizen', H.bullets(zText) + (zText.length ? '\n担当：　　　　　期限：　　月　　日' : ''), '（課題を選ぶと改善の案が入ります）'],
      ] });

      // 次回
      var nk = v.nextKind === 'same' ? kname : v.nextKind === 'yakan' ? '夜間・人が少ない時間を想定した訓練' : H.label(KIND, v.nextKind) || '';
      sections.push({ h: '次回', rows: [
        ['次回の予定', 'next', H.date(v.nextDate) + '　' + nk],
        ['確認', 'check', '課題と改善策を次回の訓練で確かめる。参加者名簿・写真と一緒に保管する。'],
      ] });

      return {
        title: '避難訓練・BCP訓練 実施記録',
        left: H.blank(v.office, '事業所名：'),
        right: '記録者：' + H.blank(v.writer),
        sections: sections,
        foot: '管理者の確認：　　　　　　　　（　　年　　月　　日）',
      };
    },
    warn: function (v) {
      if (!v.kadai.length && !v.kadai2.trim()) return '気づいた課題がまだ空です。訓練では必ず何か見つかります。時間がかかった所、迷った所、役割を知らなかった人がいなかったかを思い出して、課題に入れましょう。特になければ、そのことを記録に残します。';
      return '';
    },
  });
})();
