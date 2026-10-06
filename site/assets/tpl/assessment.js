// アセスメントシート（障害福祉サービス・障害児通所支援）。基本情報 → 本人・家族の希望 → 領域ごとの強みと支援が必要なこと → 計画に向けた課題の整理（ニーズ）。
(function () {
  'use strict';
  // [id, サービス名, 業種]
  var SVC = [
    ['b', '就労継続支援B型', 'shogai'], ['a', '就労継続支援A型', 'shogai'], ['iko', '就労移行支援', 'shogai'], ['jiritsu', '自立訓練（生活訓練・機能訓練）', 'shogai'],
    ['seikatsu', '生活介護', 'shogai'], ['gh', '共同生活援助（グループホーム）', 'shogai'],
    ['jihatsu', '児童発達支援', 'jido'], ['houday', '放課後等デイサービス', 'jido'],
  ];
  function sector(v) { var s = SVC.filter(function (x) { return x[0] === v.svc; })[0]; return s ? s[2] : 'shogai'; }
  function isJido(v) { return sector(v) === 'jido'; }

  var KIND = [['shokai', '初回'], ['minaoshi', '見直し', '再アセスメント']];
  var PLACE = ['事業所（面談室）', '自宅（家庭訪問）', '学校・園', '相談支援事業所', 'オンライン'];
  var ATTEND = {
    shogai: [['honnin', '本人'], ['kazoku', '家族'], ['soudan', '相談支援専門員'], ['gh', 'グループホームの職員'], ['iryo', '医療関係者'], ['jigyosho', '他の事業所の職員']],
    jido: [['honnin', '本人（お子さん）'], ['kazoku', '保護者'], ['soudan', '相談支援専門員'], ['gakko', '学校・園の先生'], ['iryo', '医療関係者'], ['jigyosho', '他の事業所の職員']],
  };
  var INFO = {
    shogai: [['jukyu', '受給者証'], ['keikaku', 'サービス等利用計画'], ['mae', '前回の個別支援計画・モニタリング'], ['iryo', '主治医・医療機関の情報'], ['mae2', '前の事業所・学校の情報'], ['techo', '障害者手帳・診断書']],
    jido: [['jukyu', '受給者証'], ['keikaku', '障害児支援利用計画'], ['mae', '前回の個別支援計画・モニタリング'], ['iryo', '主治医・医療機関の情報'], ['mae2', '学校・園・前の事業所の情報'], ['hattatsu', '発達検査などの結果']],
  };
  var HOPE = {
    shogai: [['hataraku', '働きたい・働き続けたい'], ['kochin', '工賃・給料を増やしたい'], ['ippan', '一般企業で働きたい'], ['hitori', '一人暮らしをしたい'], ['tomodachi', '友だちをつくりたい'], ['shumi', '趣味を楽しみたい'], ['kenko', '体調を安定させたい'], ['ima', '今の生活を続けたい']],
    jido: [['asobu', '好きな遊びをしたい'], ['tomodachi', '友だちと遊びたい'], ['dekiru', 'できることを増やしたい'], ['gakko', '学校（園）を楽しく過ごしたい'], ['undo', '体を動かしたい'], ['anshin', '安心して過ごしたい']],
  };
  var FHOPE = {
    shogai: [['anshin', '安心して通い続けてほしい'], ['jiritsu', '身の回りのことができるようになってほしい'], ['shuro', '働けるようになってほしい'], ['shorai', '将来の暮らしの場が心配'], ['futan', '家族の負担を減らしたい'], ['kenko', '体調を安定させてほしい']],
    jido: [['kotoba', '言葉を増やしてほしい'], ['tomodachi', '友だちと関われるようになってほしい'], ['mijimawari', '身の回りのことができるようになってほしい'], ['shugaku', '就学・進学に向けて準備したい'], ['kakawari', '家での関わり方を知りたい'], ['kyusoku', '保護者が休める時間がほしい']],
  };

  // 領域。[id, 名前, 対象（業種かサービスの一覧）, 強み[[id, 選択肢]], 支援が必要なこと[[id, 選択肢, 課題（ニーズ）の文]]]
  var DOMAINS = [
    { id: 'kenko', name: '健康・生活', small: '体調・服薬・睡眠・食事', for: ['b', 'a', 'iko', 'jiritsu', 'seikatsu', 'gh'],
      s: [['tsuin', '決まった日に通院できている'], ['fukuyaku', '薬を自分で飲めている'], ['rhythm', '生活リズムが整っている'], ['shokuji', '食事を3食とれている'], ['taicho', '体調の変化を伝えられる'], ['tsusho', '休まず通えている']],
      n: [['taicho', '体調の変化に気づきにくい', '体調の変化に気づき、職員や家族に伝えられるようになる'], ['fukuyaku', '薬の飲み忘れがある', '薬を決まった時間に飲めるようになる'], ['rhythm', '生活リズムが乱れやすい', '睡眠や起きる時間を整え、生活リズムを安定させる'], ['shokuji', '食事のかたより・体重の変化', '食事のバランスを整え、体重（体調）を保つ'], ['tsuin', '通院・薬の管理に支援が必要', '通院の予定や薬の管理を、支援を受けながら続ける'], ['kibun', '気分の波がある', '気分が落ち込んだときやイライラしたときに、落ち着く方法を身につける']] },
    { id: 'adl', name: '日常生活動作', small: '身の回りのこと・移動', for: ['b', 'a', 'iko', 'jiritsu', 'seikatsu', 'gh'],
      s: [['mijitaku', '身だしなみを整えられる'], ['haisetsu', 'トイレが自立している'], ['nyuyoku', '入浴が自立している'], ['shokuji', '食事が自立している'], ['ido', '一人で移動できる'], ['kotsu', '電車・バスを使える']],
      n: [['mijitaku', '身だしなみに声かけが必要', '季節や場面に合った身だしなみを、自分で整えられるようになる'], ['haisetsu', 'トイレに支援が必要', 'トイレの動作を、支援を受けながら安全に行う'], ['nyuyoku', '入浴に支援が必要', '入浴を、支援を受けながら安全に行う'], ['ido', '移動に見守り・介助が必要', '見守りや介助を受けて、安全に移動する'], ['kotsu', '初めての道・乗り物が不安', '通う道順を覚え、一人で通えるようになる'], ['junbi', '持ち物の準備を忘れやすい', '持ち物や予定を、チェック表などを使って自分で確かめられるようになる']] },
    { id: 'comm', name: 'コミュニケーション', small: '伝える・理解する', for: ['b', 'a', 'iko', 'jiritsu', 'seikatsu', 'gh'],
      s: [['aisatsu', 'あいさつができる'], ['tsutaeru', '気持ちを言葉で伝えられる'], ['shitsumon', '分からないときに質問できる'], ['shikaku', '絵や文字で示すと理解しやすい'], ['kiku', '人の話を最後まで聞ける'], ['kaiwa', '会話を楽しめる']],
      n: [['tsutaeru', '困ったことを伝えにくい', '困ったときに「手伝ってください」と伝えられるようになる'], ['shiji', '口で伝えるだけでは理解しにくい', '手順書や絵カードなど、分かりやすい方法で指示を受け取れるようにする'], ['kotowaru', '断ること・意見を言うことが苦手', '嫌なことや自分の意見を、相手に伝えられるようになる'], ['hanashi', '一方的に話してしまう', '相手の話を聞き、やりとりのある会話ができるようになる'], ['renraku', '休むときの連絡が難しい', '欠席や遅刻の連絡を、自分でできるようになる']] },
    { id: 'taijin', name: '対人関係・社会性', small: '人との関わり・決まり', for: ['b', 'a', 'iko', 'jiritsu', 'seikatsu', 'gh'],
      s: [['nakama', '仲間と協力できる'], ['rule', '決まりを守れる'], ['soudan', '職員に相談できる'], ['tetsudau', '人を手伝うことができる'], ['shudan', '集団の中で過ごせる']],
      n: [['torabu', '人との行き違い・トラブルがある', '相手の気持ちを考えた関わり方を身につけ、トラブルを減らす'], ['kincho', '人が多い場面で緊張しやすい', '人が多い場面でも、休む場所や方法を使って落ち着いて過ごせる'], ['kyori', '人との距離感がつかみにくい', '場面に合った人との距離のとり方を身につける'], ['koritsu', '一人で過ごすことが多い', '安心して話せる人や居場所を増やす'], ['henka', '予定の変更が苦手', '予定が変わるときは前もって知らせてもらい、落ち着いて対応できる']] },
    { id: 'shuro', name: '作業・就労', small: '作業の様子・働くこと', for: ['b', 'a', 'iko'],
      s: [['tejun', '手順を覚えると正確にできる'], ['jizoku', '決まった時間、作業を続けられる'], ['teinei', '丁寧に作業できる'], ['iyoku', '働くことへの意欲がある'], ['tokui', '得意な作業がある'], ['jikan', '時間を守れる']],
      n: [['shuchu', '集中が続きにくい', '休憩をはさみながら、決まった時間作業に取り組めるようになる'], ['hokoku', '報告・連絡・相談が苦手', '作業の終わりや困ったときに、報告・相談ができるようになる'], ['sokudo', '作業の量・速さにばらつきがある', '作業の量（速さ）を安定させる'], ['atarashii', '新しい作業に慣れるまで時間がかかる', '新しい作業を、手順書や見本を使って少しずつ覚える'], ['ippan', '一般就労に向けた準備が必要', '一般就労に向けて、実習や職場見学などを経験する'], ['tsukare', '疲れやすく休みがち', '自分の体調に合った働き方（時間・日数）を見つける']] },
    { id: 'nicchu', name: '日中活動', small: '創作・作業・体を動かすこと', for: ['seikatsu'],
      s: [['sosaku', '創作活動を楽しめる'], ['ongaku', '音楽・体操が好き'], ['sagyo', '軽作業に取り組める'], ['sanka', '活動に参加できる'], ['erabu', '好きな活動を選べる']],
      n: [['sanka', '活動への参加に声かけが必要', '好きな活動を見つけ、自分から参加できるようになる'], ['kino', '体の機能を保つ支援が必要', '体を動かす活動で、今の体の機能を保つ'], ['shuchu', '集中が続きにくい', '短い時間から、活動に集中して取り組めるようになる'], ['erabu', '自分で選ぶ機会が少ない', '活動や過ごし方を、自分で選ぶ機会を増やす']] },
    { id: 'kaji', name: '家事・お金の管理', small: '掃除・洗濯・料理・買い物', for: ['jiritsu', 'gh'],
      s: [['soji', '掃除・片付けができる'], ['sentaku', '洗濯ができる'], ['ryori', '簡単な料理ができる'], ['kaimono', '一人で買い物ができる'], ['okane', 'お金の使い方を考えられる']],
      n: [['okane', 'お金の管理に支援が必要', '1週間（1か月）の予算を決めて、お金を管理できるようになる'], ['soji', '掃除・片付けに声かけが必要', '自分の部屋の掃除や片付けを、決まった日にできるようになる'], ['ryori', '食事の準備に支援が必要', '簡単な食事を準備できるようになる'], ['tetsuzuki', '郵便物・手続きの管理が難しい', '郵便物や手続きを、支援を受けながら管理する'], ['gomi', 'ごみの出し方が分かりにくい', 'ごみの分け方と出す日を覚える']] },
    { id: 'yoka', name: '余暇・社会参加', small: '休日・趣味・地域', for: ['b', 'a', 'iko', 'jiritsu', 'seikatsu', 'gh'],
      s: [['shumi', '趣味がある'], ['gaishutsu', '休日に外出を楽しめる'], ['ibasho', '地域に居場所がある'], ['sumaho', 'スマホ・パソコンを使える']],
      n: [['sugoshikata', '休日の過ごし方が決まっていない', '休日に楽しめる活動や過ごし方を見つける'], ['gaishutsu', '外出の機会が少ない', '地域の行事や施設を利用して、外出の機会を増やす'], ['sumaho', 'スマホ・ネットの使い方に心配', 'スマホやインターネットを、トラブルなく使えるようになる'], ['tsukaisugi', '余暇にお金を使いすぎる', '余暇に使うお金の範囲を決めて楽しむ']] },
    { id: 'kankyo', name: '家族・環境', small: '家族・住まい・支える人・制度', for: ['b', 'a', 'iko', 'jiritsu', 'seikatsu', 'gh'],
      s: [['kazoku', '家族の理解・協力がある'], ['soudan', '相談できる人がいる'], ['kikan', '関係機関とつながっている'], ['sumai', '住まいが安定している']],
      n: [['futan', '家族の介護の負担が大きい', '家族の負担を減らすため、サービスの利用や相談先を整える'], ['koreika', '家族が高齢になっている', '家族が支えられなくなったときに備え、暮らしの場や支える人を考える'], ['sumai', '将来の住まいに不安がある', '将来の住まい（グループホーム・一人暮らしなど）について考える'], ['seido', '制度の手続きが必要', '年金・手帳などの手続きを、相談支援専門員と進める'], ['kikan', '関係機関との連携が必要', '相談支援専門員や医療機関などと情報を共有し、支援の方向をそろえる']] },
    // 児童：ガイドラインの5領域（＋家族・地域）
    { id: 'j1', name: '健康・生活', small: '5領域', for: ['jihatsu', 'houday'],
      s: [['rhythm', '生活リズムが整っている'], ['shokuji', '食事を楽しめる'], ['haisetsu', 'トイレで排せつできる'], ['kigae', '着替えが自分でできる'], ['taicho', '体調の変化を伝えられる']],
      n: [['suimin', '睡眠・生活リズムが乱れやすい', '睡眠や生活リズムを整える'], ['henshoku', '偏食がある', 'いろいろな食べ物に、少しずつ慣れる'], ['haisetsu', '排せつの自立に支援が必要', 'トイレに行きたいことを知らせたり、自分で行けたりするようになる'], ['mijimawari', '身の回りのことに支援が必要', '着替えや手洗いなど、身の回りのことを自分でできるようになる'], ['kenko', '体調の管理に配慮が必要', '体調の変化に周りの大人が気づき、安心して過ごせるようにする']] },
    { id: 'j2', name: '運動・感覚', small: '5領域', for: ['jihatsu', 'houday'],
      s: [['undo', '体を動かすのが好き'], ['tesaki', '手先を使う遊びが得意'], ['hashiru', '走る・跳ぶなどの動きができる'], ['kankaku', '好きな感覚あそびがある']],
      n: [['shisei', '姿勢を保つのが難しい', '姿勢を保ったり、体のバランスをとったりする力を育てる'], ['tesaki', '手先の細かい動きが苦手', 'はさみ・ボタンなど、手先を使う動きを身につける'], ['kabin', '音・光・触られることに敏感', '苦手な感覚をやわらげる方法（イヤーマフなど）を使って、安心して過ごせる'], ['gikochinai', '動きがぎこちない', '体全体を使う遊びを通して、体の動かし方を身につける']] },
    { id: 'j3', name: '認知・行動', small: '5領域', for: ['jihatsu', 'houday'],
      s: [['kyomi', '興味のあることに集中できる'], ['kioku', '覚えることが得意'], ['mitoshi', '予定が分かると落ち着ける'], ['kazu', '数・文字に興味がある']],
      n: [['kirikae', '活動の切り替えが難しい', '予定表やタイマーを使って、活動を切り替えられるようになる'], ['shuchu', '集中が続きにくい', '短い時間から、一つの活動に取り組めるようになる'], ['panic', 'かんしゃく・パニックがある', '気持ちが高ぶったときに、落ち着く方法を身につける'], ['kiken', '危ないことが分かりにくい', '危ない場所や行動を知り、安全に過ごせる'], ['gainen', '色・形・数の理解に支援が必要', '色・形・数などの理解を、遊びの中で広げる']] },
    { id: 'j4', name: '言語・コミュニケーション', small: '5領域', for: ['jihatsu', 'houday'],
      s: [['kotoba', '言葉で要求を伝えられる'], ['hyojo', '表情や身ぶりで気持ちを表せる'], ['rikai', '簡単な指示が分かる'], ['aisatsu', 'あいさつができる']],
      n: [['yokyu', '要求を伝える手段が少ない', '絵カードや身ぶりも使って、してほしいことを伝えられるようになる'], ['rikai', '言葉の指示が伝わりにくい', '絵や写真を添えた指示で、することが分かるようになる'], ['yaritori', 'やりとりが続きにくい', '大人や友だちとのやりとりを、少しずつ続けられるようになる'], ['hatsuon', '発音が聞き取りにくい', '口や舌を使う遊びを通して、話す力を育てる']] },
    { id: 'j5', name: '人間関係・社会性', small: '5領域', for: ['jihatsu', 'houday'],
      s: [['tomodachi', '友だちに関心がある'], ['otona', '大人と安心して関われる'], ['rule', '簡単なルールのある遊びができる'], ['junban', '順番を待てる']],
      n: [['shudan', '集団の活動に入りにくい', '少人数から、集団の活動に参加できるようになる'], ['junban', '順番・ルールを守るのが難しい', '順番を待ったり、ルールを守って遊んだりできるようになる'], ['torabu', '友だちとのトラブルがある', '思いを言葉で伝え、友だちと一緒に遊べるようになる'], ['kimochi', '相手の気持ちに気づきにくい', '相手の表情や気持ちに気づく経験を重ねる']] },
    { id: 'j6', name: '家族・地域', small: '家族支援・移行支援', for: ['jihatsu', 'houday'],
      s: [['kyoryoku', '保護者が支援に協力的'], ['kyodai', 'きょうだいとの関わりがある'], ['gakko', '学校・園と連携できている'], ['chiiki', '地域の活動に参加している']],
      n: [['kosodate', '保護者が子育てに悩んでいる', '保護者の子育ての悩みを聞き、家での関わり方を一緒に考える（家族支援）'], ['kyodai', 'きょうだいへの配慮が必要', 'きょうだいも含めた家族全体を支える（家族支援）'], ['ikou', '就学・進学に不安がある', '就学・進学に向けて、学校などと情報を共有する（移行支援）'], ['renkei', '学校・園との連携が必要', '学校・園と、支援の方法や様子を共有する'], ['chiiki', '地域の子どもと関わる機会が少ない', '地域の活動や、ほかの子どもと関わる機会を増やす']] },
  ];
  function domainsOf(v) { return DOMAINS.filter(function (d) { return d.for.indexOf(v.svc) !== -1; }); }
  function domainBlock(d) {
    var on = function (v) { return d.for.indexOf(v.svc) !== -1; };
    return {
      title: d.name, small: d.small, fields: [
        { id: d.id + '_s', type: 'chips', label: 'できていること（強み）', options: d.s, show: on },
        { id: d.id + '_n', type: 'chips', label: '支援が必要なこと', options: d.n.map(function (x) { return [x[0], x[1]]; }), show: on },
        { id: d.id + '_m', type: 'text', label: '補足（聞き取った様子）', ph: d.id === 'kenko' ? '例：月1回、精神科に通院。朝は起きにくいと話す' : d.id === 'j4' ? '例：二語文で話す。「やって」と大人の手を引く' : '', show: on },
      ],
    };
  }
  var pick = function (list, ids) { return list.filter(function (x) { return (ids || []).indexOf(x[0]) !== -1; }); };
  var bullets = function (arr) { return arr.map(function (t) { return '・' + t; }).join('\n'); };

  Formdoc.run({
    title: 'アセスメントシート',
    ai: { role: '障害福祉サービス・障害児通所支援のサービス管理責任者（児童発達支援管理責任者）', doc: 'アセスメントシート（個別支援計画を作る前の聞き取りの整理）', rules: ['本人・家族の言葉は「」でそのまま残す。', '「できていること（強み）」を必ず書き、課題だけの記録にしない。', '聞き取っていないことは推測で書き足さず、【要確認】と書く。', '課題（ニーズ）は「〜できるようになる」の形で、本人の希望とつながるように書く。'] },
    blocks: [
      { title: '基本情報', fields: [
        { id: 'svc', type: 'select', label: 'サービスの種類', options: SVC.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'kind', type: 'seg', label: 'アセスメントの種類', options: KIND },
        { id: 'date', type: 'date', label: '実施日', today: true, half: true },
        { id: 'place', type: 'select', label: '面談の場所', options: PLACE, half: true },
        { id: 'attend', type: 'chips', label: '面談に同席した人', options: function (v) { return ATTEND[sector(v)]; }, def: ['honnin', 'kazoku'] },
        { id: 'info', type: 'chips', label: '参考にした情報', options: function (v) { return INFO[sector(v)]; }, def: ['jukyu', 'keikaku'] },
      ] },
      { title: '本人・家族の希望', note: '聞き取りのヒント：「どんな毎日を送りたいですか」「得意なこと・好きなことは？」「いま困っていることは？」と、本人に先に聞きます。言葉で話すのが難しい人は、表情や好きな活動の様子から読み取り、そのことも書いておきます。', fields: [
        { id: 'hope', type: 'chips', label: '本人の希望', options: function (v) { return HOPE[sector(v)]; } },
        { id: 'hvoice', type: 'textarea', label: '本人の言葉', hint: '「」の中身をそのまま', ph: '例：お給料をためて、旅行に行きたい' },
        { id: 'fhope', type: 'chips', label: '家族（保護者）の希望', options: function (v) { return FHOPE[sector(v)]; } },
        { id: 'fvoice', type: 'textarea', label: '家族（保護者）の言葉', ph: '例：家でも自分のことは自分でできるようになってほしい' },
      ] },
    ].concat(DOMAINS.map(domainBlock)),
    build: function (v, H) {
      var jido = isJido(v);
      var svcName = H.label(SVC, v.svc);
      var fam = jido ? '保護者' : '家族';
      var doms = domainsOf(v);
      var quote = function (s) { s = (s || '').trim().replace(/^「|」$/g, ''); return s ? '「' + s + '」' : ''; };

      var attend = pick(ATTEND[sector(v)], v.attend).map(function (x) { return x[1]; });
      var info = pick(INFO[sector(v)], v.info).map(function (x) { return x[1]; });
      // 面接した相手は「同席者」に合わせる（基準では、児童は保護者と本人の両方、障害福祉は本人への面接が必要）
      var met = (v.attend || []);
      var who = jido
        ? [met.indexOf('kazoku') !== -1 ? '保護者' : '', met.indexOf('honnin') !== -1 ? 'お子さん本人' : ''].filter(Boolean).join('と')
        : [met.indexOf('honnin') !== -1 ? '本人' : '', met.indexOf('kazoku') !== -1 ? '家族' : ''].filter(Boolean).join('と');
      who = who || '（面接した相手）';
      var setsumei = jido
        ? '児童発達支援管理責任者が、' + who + 'に面接した。面接の目的（個別支援計画を作るために、お子さんの様子や希望を聞くこと）を' + who + 'に説明し、理解を得たうえで行った。'
        : 'サービス管理責任者が' + who + 'に面接した。面接の目的（個別支援計画を作るために、希望や生活の様子を聞くこと）を' + who + 'に説明し、理解を得たうえで行った。';

      var hope = pick(HOPE[sector(v)], v.hope).map(function (x) { return x[1]; });
      var hv = quote(v.hvoice);
      var hopeText = [bullets(hope), hv ? '本人の言葉：' + hv : ''].filter(Boolean).join('\n');
      var fhope = pick(FHOPE[sector(v)], v.fhope).map(function (x) { return x[1]; });
      var fv = quote(v.fvoice);
      var fhopeText = [bullets(fhope), fv ? fam + 'の言葉：' + fv : ''].filter(Boolean).join('\n');

      var rows = [], strengths = [], strongs = [], needs = [];
      doms.forEach(function (d) {
        var s = pick(d.s, v[d.id + '_s']), n = pick(d.n, v[d.id + '_n']);
        rows.push([d.name, bullets(s.map(function (x) { return x[1]; })), bullets(n.map(function (x) { return x[1]; })), (v[d.id + '_m'] || '').trim()]);
        if (s.length) strengths.push(d.name + '：' + s.map(function (x) { return x[1]; }).join('、'));
        s.forEach(function (x) { strongs.push(x[1]); });
        n.forEach(function (x) { needs.push('【' + d.name + '】' + x[2]); });
      });

      var strengthText = strengths.length ? bullets(strengths) : '';
      var needsText = needs.map(function (t, i) { return (i + 1) + '. ' + t; }).join('\n');
      var wish = hv || (hope.length ? '「' + hope[0] + '」' : '');
      var houkou = '';
      if (strengths.length || needs.length) {
        houkou = (strengths.length ? '本人の強み（' + strongs.slice(0, 3).join('、') + (strongs.length > 3 ? 'など' : '') + '）を生かしながら、' : '') +
          (wish ? '本人の希望' + wish + 'の実現に向けて、' : '') +
          (needs.length ? '上の課題に取り組む。' : wish ? '必要な支援を本人と一緒に考える。' : '今の生活を続けられるよう支援する。') +
          '優先する課題は、本人' + (jido ? '・保護者' : '（家族）') + 'と相談して決め、個別支援計画の目標にする。';
      }
      var pending = jido
        ? '（例：学校・園での様子、発達検査の結果、主治医の意見など）'
        : '（例：主治医の意見、日中の様子の観察、家族からの追加の聞き取りなど）';

      return {
        title: 'アセスメントシート',
        left: svcName + '\n' + (v.kind === 'shokai' ? '初回アセスメント' : '見直し（再アセスメント）'),
        right: '実施日：' + H.date(v.date) + '\n実施者：' + (jido ? '児童発達支援管理責任者' : 'サービス管理責任者') + '　　　　',
        sections: [
          { h: '基本情報', rows: [
            ['氏名', 'name', '', jido ? '（〇〇さん・年齢・学年）' : '（〇〇さん・年齢）'],
            ['アセスメントの種類', 'kind', v.kind === 'shokai' ? '初回（利用を始めるとき）' : '見直し（モニタリングの結果をふまえた再アセスメント）'],
            ['面談の場所', 'place', v.place],
            ['同席者', 'attend', attend.join('、'), '（同席した人を選ぶと入ります）'],
            ['面接の説明', 'setsumei', setsumei],
            ['参考にした情報', 'info', info.join('、'), '（参考にした書類など）'],
          ] },
          { h: '希望', rows: [
            ['本人の希望', 'hope', hopeText, '（本人から聞き取った希望）'],
            [fam + 'の希望', 'fhope', fhopeText, '（' + fam + 'から聞き取った希望）'],
          ] },
          { key: 'dom', h: jido ? '領域ごとの状況（5領域＋家族・地域）' : '領域ごとの状況', grid: { head: ['領域', 'できていること（強み）', '支援が必要なこと', '補足（聞き取った様子）'], widths: [jido ? '158px' : '128px', '', '', ''], rowHead: true, labelCol: true, rows: rows, ph: '（記入）' } },
          { h: '個別支援計画に向けた課題の整理', w2: '140px', rows: [
            ['本人の強み（ストレングス）', 'strength', strengthText, '（各領域の「できていること」を選ぶと入ります）'],
            ['課題（ニーズ）', 'needs', needsText, '（各領域の「支援が必要なこと」を選ぶと入ります）'],
            ['支援の方向', 'houkou', houkou, '（強みと課題を選ぶと入ります）'],
            ['これから確認すること', 'kakunin', '', pending],
          ] },
        ],
        foot: '個別支援計画に向けた課題の整理（ニーズ）です。このシートをもとに計画の原案を作り、個別支援会議で話し合ったうえで、' + (jido
          ? '保護者とお子さん本人に説明して文書で同意を得て、保護者と相談支援専門員（障害児相談支援）に交付します。ガイドラインでは、児童の計画には、本人支援（5領域との関連性）に加えて、家族支援・移行支援の内容も書くこととされています（地域支援・地域連携は必要に応じて）。'
          : '本人（家族）に説明して文書で本人の同意を得て、本人と相談支援専門員（計画相談支援）に交付します。'),
      };
    },
    warn: function (v) {
      if ((v.attend || []).indexOf('honnin') === -1) return isJido(v) ? 'アセスメントは、保護者とお子さん本人の両方に会って（面接して）行うことが基準で決められています。保護者だけでなく、お子さん本人の様子も直接見て、聞き取りましょう。' : 'アセスメントは、本人に会って（面接して）行うことが基準で決められています。家族だけの面談になった場合は、本人とも別に面接しましょう。';
      if (isJido(v) && (v.attend || []).indexOf('kazoku') === -1) return 'アセスメントは、お子さん本人だけでなく保護者にも会って（面接して）行うことが基準で決められています。保護者からも、家での様子や希望を聞き取りましょう。';
      var doms = domainsOf(v);
      var hasS = doms.some(function (d) { return (v[d.id + '_s'] || []).length; });
      if (!hasS) return '「できていること（強み）」が、まだ1つも選ばれていません。課題だけでなく強みも書くと、本人に合った目標や支援の方法が見つけやすくなります。';
      if (!v.hope.length && !v.hvoice.trim()) return '本人の希望を聞き取って書きましょう。計画の目標は、本人の希望から考えます。言葉で話すのが難しい場合は、表情や好きな活動から読み取ったことを書きます。';
      return '';
    },
  });
})();
