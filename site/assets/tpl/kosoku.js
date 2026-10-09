// 身体拘束の3要件の検討記録。代わりの方法を先に考え、切迫性・非代替性・一時性をすべて満たすかを組織で確認する。
// 1つでも満たさない（未確認を含む）ときは、結論が「身体拘束は行わない」になる。
(function () {
  'use strict';
  var SECTOR = [['kaigo', '介護'], ['shogai', '障害福祉']];
  var KIND = [
    ['kaishi', '開始の検討', 'はじめて検討する'],
    ['keizoku', '継続の検討', '行っている拘束の見直し'],
    ['kaijo', '解除', '要件に当てはまらなくなった'],
  ];
  var BA = {
    kaigo: ['身体的拘束等適正化検討委員会', 'ケアカンファレンス（後日、委員会に報告）', '緊急のカンファレンス（後日、委員会に報告）'],
    shogai: ['身体拘束等適正化検討委員会', '個別支援会議（後日、委員会に報告）', '緊急の会議（後日、委員会に報告）'],
  };
  var MEMBERS = {
    kaigo: [['kanri', '施設長・管理者'], ['kango', '看護職員'], ['shokuin', '介護職員'], ['soudan', '生活相談員'], ['cm', 'ケアマネジャー（介護支援専門員）'], ['kinou', '機能訓練指導員'], ['ishi', '医師'], ['eiyo', '管理栄養士'], ['honnin', '本人'], ['kazoku', '家族']],
    shogai: [['kanri', '管理者'], ['sabikan', 'サービス管理責任者'], ['boushi', '虐待防止の担当者'], ['kango', '看護職員'], ['shokuin', '生活支援員・世話人'], ['soudanshien', '相談支援専門員'], ['ishi', '医師'], ['honnin', '本人'], ['kazoku', '家族']],
  };
  var EXPLAINER = {
    kaigo: [['kanri', '施設長・管理者'], ['ishi', '医師'], ['kango', '看護職員'], ['soudan', '生活相談員'], ['cm', 'ケアマネジャー']],
    shogai: [['kanri', '管理者'], ['sabikan', 'サービス管理責任者'], ['ishi', '医師'], ['kango', '看護職員'], ['soudanshien', '相談支援専門員']],
  };
  // 検討した行為：[id, 選択肢, 記録の文]（「身体拘束ゼロへの手引き」の例示をもとに）
  var ACTS = [
    ['saku', 'ベッドを柵で囲む（4点柵など）', '自分で降りられないように、ベッドを柵（サイドレール）で囲む'],
    ['belt', '車いすのベルト・テーブル', 'ずり落ちたり立ち上がったりしないように、車いすやいすにY字型のベルト・腰ベルト・テーブルをつける'],
    ['himo', '体や手足をひもなどで縛る', '車いす・いす・ベッドに、体や手足をひもなどで縛る'],
    ['isu', '立ち上がりを妨げるいす', '立ち上がる力のある方の立ち上がりを妨げるようないすを使う'],
    ['mitten', 'ミトン型の手袋', 'チューブを抜いたり皮膚をかきむしったりしないように、手指の動きを制限するミトン型の手袋をつける'],
    ['tsunagi', 'つなぎ服（介護衣）', '服を脱いだりおむつを外したりしないように、介護衣（つなぎ服）を着る'],
    ['sejo', '居室の施錠・隔離', '自分の意思で開けることのできない居室などに隔離する（施錠する）'],
    ['kusuri', '向精神薬の過剰な使用', '行動を落ち着かせるために、向精神薬を過剰に使う'],
  ];
  // 心配されていること：[id, 選択肢, 記録の文, 合う行為（null はどの行為にも合う）]
  // 選んだ行為に合うものだけを候補に出す（例：「居室の施錠」に「転倒・転落のおそれ」は出さない）。
  var REASON = [
    ['tento', '転倒・転落のおそれ', 'ベッド・車いす・いすから一人で降りたり立ち上がったりしようとして、転倒・転落するおそれがある。', ['saku', 'belt', 'himo', 'isu']],
    ['tube', 'チューブ（点滴・経管栄養）を抜くおそれ', '点滴や経管栄養のチューブを自分で抜いてしまい、必要な水分・栄養・薬がとれなくなるおそれがある。', ['himo', 'mitten', 'tsunagi']],
    ['hifu', '皮膚をかきむしる・傷つける', '皮膚をかきむしり、傷が悪化するおそれがある。', ['himo', 'mitten', 'tsunagi']],
    ['omutsu', 'おむつを外す・服を脱ぐ（皮膚のトラブル）', 'おむつを外したり服を脱いだりして、皮膚のかぶれや傷が悪化するおそれがある。', ['tsunagi']],
    ['jisho', '自分を傷つける行動', '頭を強く打ちつけるなど、自分を傷つける行動がある。', ['himo', 'mitten', 'sejo', 'kusuri']],
    ['tagai', 'ほかの方を傷つけるおそれ', 'ほかの方をたたく・押すなど、ほかの方を傷つけるおそれがある。', ['himo', 'sejo', 'kusuri']],
    ['gaishutsu', '一人で外に出て危険にあうおそれ', '一人で外に出て、交通事故などの危険にあうおそれがある。', ['sejo', 'kusuri']],
    ['inochi', '本人の命にかかわる危険', '本人の命にかかわる危険が生じるおそれがある。', null],
    ['other', 'その他（下に記入）', '', null],
  ];
  // 「心配されていること」の候補。行為を1つも選んでいない（「そのほかの行為」だけ）ときは、すべて出す。
  // 先頭は「選んでください」。行為を選び直して、選んでいた理由が候補から外れたときは、
  // エンジン（formdoc.js の clean）が先頭の値に戻すため、ほかの理由に勝手に置きかわらず「未選択」になる。
  function reasonOpts(v) {
    var acts = v.acts || [];
    var list = REASON.filter(function (x) {
      return !acts.length || !x[3] || x[3].some(function (a) { return acts.indexOf(a) !== -1; });
    });
    return [['', '（選んでください）']].concat(list.map(function (x) { return [x[0], x[1]]; }));
  }
  // 代わりの方法：[id, 選択肢, 記録の文]
  var ALT = [
    ['riyu', '行動の理由を探り、先回りして対応した', '行動の理由（トイレ・痛み・不安・のどの渇きなど）を探り、先回りして対応した。'],
    ['toilet', 'トイレ誘導の時間を見直した', '排泄の間隔を記録し、トイレ誘導の時間を見直した。'],
    ['mimamori', '見守りの時間帯・職員の配置を見直した', '見守りが必要な時間帯の職員の配置と分担を見直した。'],
    ['bed', 'ベッドを低くし、衝撃をやわらげるマットを敷いた', 'ベッドを低くし、床に衝撃をやわらげるマットを敷いた。'],
    ['sensor', 'センサーを「見守りのため」に使った', '離床センサーなどを、動きを止めるためではなく、駆けつけて見守るために使った。'],
    ['tube', '点滴・チューブの位置や方法を医師と相談した', '点滴・チューブが目に入らない位置にし、方法や時間を医師・看護職員と相談した。'],
    ['hifu', 'かゆみ・痛みの原因に対応した', '保湿・爪の手入れ・衣類の素材の見直しなど、かゆみや痛みの原因に対応した。'],
    ['kusuri', '薬の種類・量を医師と見直した', '眠気やふらつき、落ち着かなさの原因になっていないか、薬の種類・量を医師と見直した。'],
    ['nikka', '日中の活動・役割をつくった', '日中の活動や役割をつくり、生活のリズムを整えた。'],
    ['kankyo', '落ち着いて過ごせる環境に整えた', '音・光・席の位置など、落ち着いて過ごせる環境に整えた。'],
    ['tsutae', '本人に合った伝え方で気持ちを確かめた', '本人に合った伝え方（短い言葉・絵や写真・身ぶり）で、気持ちや希望を確かめた。'],
    ['kazoku', '家族から、好きなことや落ち着く関わり方を聞いた', '家族から、好きなことや落ち着く関わり方を聞き、ケアに取り入れた。'],
    ['gaibu', '外部の専門家・関係機関に助言を求めた', '外部の専門家・医療職・関係機関に、身体拘束をしない方法について助言を求めた。'],
  ];
  var REQ = [
    ['seppaku', '切迫性', '本人またはほかの方の命や体が、危険にさらされる可能性が著しく高い'],
    ['hidai', '非代替性', '身体拘束のほかに、代わりになる方法がない'],
    ['ichiji', '一時性', '身体拘束が一時的なものである'],
  ];
  var JUDGE = [['ok', '満たす'], ['ng', '満たさない'], ['mada', '未確認']];
  var TO = [['honnin', '本人'], ['kazoku', '家族'], ['dairi', '成年後見人などの代理人']];
  var WATCH = [
    ['teiki', '時間を決めて様子を見て、記録する', '時間を決めて（　時間ごとに）本人の様子を見に行き、記録する。'],
    ['hazusu', '拘束を一時的に外して、本当に必要か確かめる', '身体拘束を一時的に外して本人の状態を観察し、続ける必要が本当にあるかを確かめる。'],
    ['hifu', '皮膚の赤み・傷・むくみを確認する', '皮膚の赤み・傷・むくみ（体が押さえつけられている部分）を確認する。'],
    ['kokoro', '表情・言葉・食欲・睡眠の変化を記録する', '表情・言葉・食欲・睡眠など、心と体の変化を記録する。'],
    ['haisetsu', '水分・排泄の状態を確認する', '水分のとり方と排泄の状態を確認する。'],
    ['alt', '代わりのケアの効果を記録する', '代わりのケアを続けた結果（行動の回数・時間帯など）を記録する。'],
  ];
  var NEXT = [['3', '3日後'], ['7', '1週間後'], ['14', '2週間後'], ['30', '1か月後']];

  function reasonLabel(id) { return (texts(REASON, [id])[0] || ['', ''])[1].replace(/（下に記入）$/, ''); }
  function sec(v) { return v.sector === 'shogai' ? 'shogai' : 'kaigo'; }
  function texts(list, ids) { return list.filter(function (x) { return ids.indexOf(x[0]) !== -1; }); }
  function addDays(s, n) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return '';
    var d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  // 要件の確認の状態
  function judge(v) {
    var ng = [], mada = [];
    REQ.forEach(function (r) { if (v[r[0]] === 'ng') ng.push(r[1]); else if (v[r[0]] !== 'ok') mada.push(r[1]); });
    return { ng: ng, mada: mada, allOk: !ng.length && !mada.length };
  }
  // 身体拘束を行う（続ける）結論か
  function doing(v) { return v.kind !== 'kaijo' && judge(v).allOk; }
  function actNames(v) {
    var a = texts(ACTS, v.acts).map(function (x) { return x[1]; });
    if (v.actOther.trim()) a.push(v.actOther.trim());
    return a;
  }

  Formdoc.run({
    title: '身体拘束の3要件の検討記録',
    ai: {
      role: '介護・障害福祉事業所の管理者',
      doc: '身体拘束（緊急やむを得ない場合）の3要件の検討記録',
      rules: [
        '身体拘束は原則禁止であり、切迫性・非代替性・一時性の3つの要件をすべて満たす場合だけの例外であることが分かるように書く。',
        '結論（行う／行わない／解除する）は変えない。要件を満たさない・未確認の場合に「行う」と書き換えない。',
        '「仕方なく」「人手が足りないため」などの書き方を避け、確認した事実と判断の理由を具体的に書く。',
        '本人の尊厳を大切にした言葉づかいにする（「徘徊」「問題行動」などの言葉は避け、行動の理由が分かるように書く）。',
        '空欄や（　）は推測で埋めずに【要確認】と書く。',
      ],
    },
    blocks: [
      { title: '検討の種類と参加者', fields: [
        { id: 'sector', type: 'seg', label: '業種', options: SECTOR },
        { id: 'kind', type: 'seg', label: '検討の種類', options: KIND },
        { id: 'date', type: 'date', label: '検討日', today: true, half: true },
        { id: 'time', type: 'text', label: '時間', ph: '例：14:00〜14:30', half: true },
        { id: 'ba', type: 'select', label: '検討の場', options: function (v) { return BA[sec(v)]; } },
        { id: 'members', type: 'chips', label: '参加者', hint: '個人ではなく、複数の職種で', options: function (v) { return MEMBERS[sec(v)]; }, def: ['kanri', 'kango', 'shokuin'] },
      ] },
      { title: '検討した行為と理由', fields: [
        { id: 'acts', type: 'chips', label: '検討した行為', options: ACTS.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'actOther', type: 'text', label: 'そのほかの行為', ph: '例：夜間、居室のドアの外にいすを置く' },
        { id: 'reason', type: 'select', label: '心配されていること', hint: '選んだ行為に合うものが出ます', options: reasonOpts },
        { id: 'scene', type: 'textarea', label: 'どんな場面で・どんな様子か', hint: '氏名は書かないでください', rows: 3, ph: '例：夜中の2時ごろ、トイレに行こうとして一人でベッドから降りようとすることが続いている。10月1日には、ベッドの横の床に座り込んでいるところを見つけた（けがなし）。' },
      ] },
      { title: 'まず、代わりの方法を考える', small: '非代替性', note: '身体拘束をしないで済む方法を、先に考えます。試した方法と、その結果を残しましょう。', fields: [
        { id: 'alt', type: 'chips', list: true, label: '試した方法・これから試す方法', options: ALT.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'altResult', type: 'textarea', label: '試した結果', rows: 3, ph: '例：2時にトイレへお誘いしたところ、一人で降りようとする回数は週5回から週2回に減った。' },
        { id: 'hidai', type: 'seg', label: 'ほかに代わる方法がないか（非代替性）', options: [['ok', '満たす', 'ほかに方法がない'], ['ng', '満たさない', 'ほかの方法で対応できる'], ['mada', '未確認', 'まだ試していない']], def: 'mada' },
      ] },
      { title: '切迫性と一時性', note: '3つの要件は「すべて」満たす必要があります。1つでも満たさなければ、身体拘束は行いません。', fields: [
        { id: 'seppaku', type: 'seg', label: '危険が差し迫っているか（切迫性）', options: [['ok', '満たす', '危険が著しく高い'], ['ng', '満たさない', 'そこまでではない'], ['mada', '未確認', 'まだ確かめていない']], def: 'mada' },
        { id: 'seppakuText', type: 'textarea', label: 'どんな危険が・どのくらい差し迫っているか', rows: 3, ph: '例：ふらつきが強く、夜間に一人で立ち上がると転倒して骨折するおそれが高いと、医師・看護職員も判断している。' },
        { id: 'ichiji', type: 'seg', label: '一時的なものか（一時性）', options: [['ok', '満たす', '期間を区切れる'], ['ng', '満たさない', '終わりが見えない'], ['mada', '未確認', 'まだ決めていない']], def: 'mada' },
        { id: 'period', type: 'text', label: '期間', ph: '例：10月7日〜10月20日（2週間）', half: true },
        { id: 'hours', type: 'text', label: '時間帯', ph: '例：夜間 0時〜5時のみ', half: true },
        { id: 'mikomi', type: 'textarea', label: '解除の見込み・条件', ph: '例：トイレのお誘いの効果を確かめ、一人で降りようとすることが週1回以下になれば解除する。' },
      ] },
      { title: '本人・家族への説明', fields: [
        { id: 'sdate', type: 'date', label: '説明した日', half: true },
        { id: 'sby', type: 'select', label: '説明した人', options: function (v) { return EXPLAINER[sec(v)]; }, half: true },
        { id: 'sto', type: 'chips', label: '説明した相手', options: TO, def: ['honnin', 'kazoku'] },
        { id: 'react', type: 'textarea', label: '本人・家族の反応', ph: '例：ご本人は「夜は一人でトイレに行きたい」と話された。ご家族からは「転ぶのは心配だが、できるだけ縛らないでほしい」との意見があった。' },
      ] },
      { title: '観察と再検討', fields: [
        { id: 'watch', type: 'chips', list: true, label: '観察すること', options: function (v) { return WATCH.filter(function (x) { return x[0] !== 'hazusu' || doing(v); }).map(function (x) { return [x[0], x[1]]; }); }, def: ['teiki', 'kokoro', 'alt'] },
        { id: 'next', type: 'seg', label: '次の再検討', options: NEXT, def: '7' },
      ] },
    ],
    build: function (v, H) {
      var s = sec(v), kaigo = s === 'kaigo';
      var j = judge(v), doIt = doing(v), kaijo = v.kind === 'kaijo';
      var names = actNames(v);
      var actName = names.join('、') || '（検討した行為）';
      var actLong = texts(ACTS, v.acts).map(function (x) { return x[2]; });
      if (v.actOther.trim()) actLong.push(v.actOther.trim());
      var alts = texts(ALT, v.alt).map(function (x) { return x[2]; });
      var members = texts(MEMBERS[s], v.members).map(function (x) { return x[1]; });
      var reason = (texts(REASON, [v.reason])[0] || ['', '', ''])[2];
      var reasonText = [reason, v.scene.trim()].filter(Boolean).join('\n');
      var kindLabel = H.label(KIND, v.kind);
      var kindNote = v.kind === 'keizoku' ? '（前回の検討：　　年　　月　　日／開始日：　　年　　月　　日）' : kaijo ? '（開始日：　　年　　月　　日）' : '';
      var nextDate = addDays(v.date, Number(v.next) || 7);

      // 3要件の表
      var reqText = {
        seppaku: v.seppakuText.trim(),
        hidai: alts.length || v.altResult.trim()
          ? (alts.length ? '試した方法：\n' + H.bullets(alts.map(function (t) { return t.replace(/。$/, ''); })) : '') + (v.altResult.trim() ? (alts.length ? '\n' : '') + '結果：' + v.altResult.trim() : '')
          : '',
        ichiji: v.period.trim() || v.hours.trim() || v.mikomi.trim()
          ? '期間：' + (v.period.trim() || '　　') + '\n時間帯：' + (v.hours.trim() || '　　') + (v.mikomi.trim() ? '\n解除の見込み：' + v.mikomi.trim() : '')
          : '',
      };
      var reqRows = REQ.map(function (r) {
        return [r[1], '判断：' + (H.label(JUDGE, v[r[0]]) || '未確認') + '\n確認の観点：' + r[2] + 'か\n' + (reqText[r[0]] || '（確認したこと・判断の理由を記入）')];
      });

      // 結論
      var concl;
      if (kaijo) {
        var why = j.ng.length ? '3つの要件のうち、' + j.ng.join('・') + 'を満たさなくなったため、'
          : j.mada.length ? '3つの要件のうち、' + j.mada.join('・') + 'を満たすことが確認できなくなったため、' : '（解除の理由を記入）ため、';
        concl = why + '身体拘束「' + actName + '」を解除する。解除後も、代わりのケアを続けながら本人の様子を観察する。';
      } else if (j.allOk) {
        concl = '切迫性・非代替性・一時性の3つの要件をすべて満たすことを、参加者全員で確認した。緊急やむを得ない場合として、下の「態様と時間」の範囲に限り、最も制限の少ない方法で' +
          (v.kind === 'keizoku' ? '継続する' : '行う') + '。要件に当てはまらなくなったときは、再検討日を待たずに直ちに解除する。';
      } else {
        concl = '身体拘束は行わない' + (v.kind === 'keizoku' ? '（現在行っている身体拘束は解除する）' : '') + '。' +
          (j.ng.length ? j.ng.join('・') + 'を満たさないため、緊急やむを得ない場合には当たらない。' : '') +
          (j.mada.length ? j.mada.join('・') + 'が' + (j.ng.length ? 'まだ確認できていない。' : 'まだ確認できていないため、緊急やむを得ない場合とは判断できない。') : '') +
          '代わりの方法を続け、本人の様子を観察する。';
      }
      var conclRows = [['結論', 'concl', concl]];
      if (doIt) {
        conclRows.push(['態様と時間', 'taiyo', (actLong.length ? '方法：\n' + H.bullets(actLong) + '\n' : '方法：（検討した行為）\n') + '期間：' + (v.period.trim() || '　　') + '\n時間帯：' + (v.hours.trim() || '　　') + '\n拘束している間も、時間を決めて様子を見て、記録する。']);
        conclRows.push(['やむを得ない理由', 'riyu', reasonText, '（心配されていることを選ぶと入ります）']);
        conclRows.push(['解除の条件', 'kaijo', v.mikomi.trim(), '（解除の見込み・条件を記入）']);
      } else {
        conclRows.push([kaijo ? '解除後のケア' : '続けるケア', 'care', alts.length ? '次の方法に取り組む（試した方法は続け、まだの方法は試してみる）。\n' + H.bullets(alts) : '', '（「三」で代わりの方法を選ぶと入ります）']);
      }
      if (!kaigo) {
        conclRows.push(['個別支援計画', 'plan', doIt
          ? '個別支援計画に、身体拘束の態様・時間・緊急やむを得ない理由と、解消に向けた方針・目標とする時期を書き加える。'
          : kaijo ? '個別支援計画から身体拘束の記載を外し、代わりのケアを支援内容に書き加える。' : '代わりのケアを、個別支援計画の支援内容に反映する。']);
        conclRows.push(['関係機関への相談', 'soudan', doIt
          ? '市町村（障害者虐待防止センターなど）に相談・報告し、身体拘束をふくめた支援について理解を得る。相談支援専門員とも共有する。'
          : '必要に応じて、相談支援専門員・市町村に相談する。']);
      }

      // 説明
      var explain = doIt
        ? '身体拘束の内容「' + actName + '」・目的・理由・時間帯・期間・解除の見込みを、できるだけくわしく説明した。'
        : kaijo ? '身体拘束を解除することと、解除後のケア・見守りの方法を説明した。'
          : '身体拘束は行わないことと、代わりに行うケア（上の「続けるケア」）を説明した。';
      var to = texts(TO, v.sto).map(function (x) { return x[1]; });

      // 観察と再検討
      var watch = texts(WATCH, v.watch).map(function (x) { return x[2]; });
      var nextText = (nextDate ? H.date(nextDate) : '　　年　　月　　日') + '（' + H.label(NEXT, v.next) + '）' +
        (doIt ? '。要件に当てはまらなくなったときは、この日を待たずに解除する。' : '。代わりのケアの効果を確かめる。');
      var keikaRows = [];
      for (var i = 0; i < 5; i++) keikaRows.push(['', '']);

      var foot = doIt
        ? '身体拘束を行う間は、その態様・時間・本人の心身の状況・緊急やむを得ない理由を記録します（運営基準）。' +
          (kaigo ? '家族への説明の確認は同意ではなく、家族の同意は身体拘束を認める根拠にはなりません（介護の手引き）。' : '本人・家族には十分に説明し、了解を得ます（障害福祉の手引き）。')
        : '身体拘束は原則として禁止です。3つの要件（切迫性・非代替性・一時性）をすべて満たすことを組織で確認できない限り、身体拘束は行いません。';
      if (!kaigo && v.acts.indexOf('belt') !== -1) foot += '体幹機能障害などのある方が安定して座れるよう、姿勢を保つ工夫としてベルトで体を支えるのは「やむを得ない身体拘束」にはあたりません（行わないことがかえって虐待にあたる場合もあります）。その場合は目的を記録しておきます。';

      return {
        title: '身体拘束の3要件の検討記録',
        left: H.label(SECTOR, s) + '\n' + kindLabel,
        right: '記録日：' + H.date(v.date) + '\n記録者：',
        sections: [
          { h: '検討の概要', rows: [
            ['対象の方', 'person', '', '（〇〇さん・居室など、事業所の決まりに沿って記入）'],
            ['検討の種類', 'kind', kindLabel + kindNote],
            ['検討日時', 'when', H.date(v.date) + '　' + (v.time || '　　:　　〜　　:　　')],
            ['検討の場', 'ba', v.ba],
            ['参加者', 'members', members.length ? members.join('、') + '（計　名）' : '', '（参加者を選ぶと入ります）'],
            ['検討した行為', 'acts', H.bullets(actLong), '（「二」で検討した行為を選ぶと入ります）'],
            ['心配されていること', 'reason', reasonText, '（どんな場面で・どんな様子かを記入）'],
          ] },
          { key: 'req', h: '緊急やむを得ない場合の3つの要件（すべて満たす必要があります）', grid: { head: ['要件', '判断と、確認したこと・判断の理由'], widths: ['84px', ''], rowHead: true, labelCol: true, rows: reqRows, ph: '（記入）' } },
          { h: kaijo ? '結論（解除）' : '結論', w2: '128px', rows: conclRows },
          { h: '本人・家族への説明', w2: '128px', rows: [
            ['説明した日', 'sdate', H.date(v.sdate)],
            ['説明した人', 'sby', H.label(EXPLAINER[s], v.sby)],
            ['説明した相手', 'sto', to.join('、'), '（説明した相手を選ぶと入ります）'],
            ['説明した内容', 'scontent', explain],
            ['本人・家族の反応', 'react', v.react.trim(), '（本人の言葉・表情、家族の意見を記入）'],
          ] },
          { h: '観察と再検討', w2: '128px', rows: [
            ['観察すること', 'watch', H.bullets(watch), '（観察することを選ぶと入ります）'],
            ['次回の再検討日', 'next', nextText],
            ['再検討の場', 'reba', (kaigo ? '身体的拘束等適正化検討委員会' : '身体拘束等適正化検討委員会') + '（または' + (kaigo ? 'ケアカンファレンス' : '個別支援会議') + '）で、3つの要件をあらためて確認し、この記録に書き加える。'],
          ] },
          { key: 'keika', h: doIt ? '経過観察記録' : '経過の記録（代わりのケアの様子）', grid: { head: ['日時・記録者', doIt ? '本人の心と体の状況・拘束の状況（開始と解除の時刻）' : '本人の様子・代わりのケアの結果'], widths: ['118px', ''], rows: keikaRows, ph: '　' } },
        ],
        foot: foot,
      };
    },
    info: function (v, H) {
      return '<span class="coverage-label">3つの要件</span>' + REQ.map(function (r) {
        return '<span>' + r[1] + '：' + (H.label(JUDGE, v[r[0]]) || '未確認') + '</span>';
      }).join('');
    },
    warn: function (v) {
      var j = judge(v);
      if (!v.acts.length && !v.actOther.trim()) return '「二」で、検討した行為を選んでください。';
      if (!v.reason && !v.scene.trim()) return '「二」で、心配されていること（選んだ行為に合うものが出ます）を選ぶか、どんな場面で・どんな様子かを書いてください。';
      if ((v.reason === 'inochi' || v.reason === 'other') && !v.scene.trim()) return '「' + reasonLabel(v.reason) + '」を選んだときは、どんな場面で・どんな危険があるのかを「どんな場面で・どんな様子か」に具体的に書いてください。';
      if (!v.alt.length) return 'まず「三」で、身体拘束をしないで済む方法（代わりの方法）を選び、試した結果を書きましょう。3つの要件の確認は、そのあとです。';
      var staff = v.members.filter(function (x) { return x !== 'honnin' && x !== 'kazoku'; });
      if (v.members.indexOf('kanri') === -1 || staff.length < 2) return '判断は担当者一人ではせず、組織で行います。管理者を含め、看護職員や現場の職員など複数の職種で検討しましょう。';
      if (sec(v) === 'shogai' && v.members.indexOf('sabikan') === -1) return '障害福祉の手引きでは、管理者・サービス管理責任者・虐待防止の担当者など、支援の方針を決める権限のある職員が出席していることが大切とされています。必要に応じて相談支援専門員の同席も考えましょう。';
      if (v.kind === 'kaijo' && j.allOk) return '「解除」を選んでいますが、3つの要件をすべて「満たす」になっています。どの要件に当てはまらなくなったのかを選んでください。続ける場合は「継続の検討」を選びます。';
      if (v.kind !== 'kaijo' && j.ng.length) return j.ng.join('・') + 'を満たさないため、身体拘束は行えません。書類の結論も「身体拘束は行わない」になっています。代わりの方法を続け、様子を記録しましょう。';
      if (v.kind !== 'kaijo' && j.mada.length) return j.mada.join('・') + 'がまだ確認できていません。3つの要件すべてを組織で確認できるまでは、身体拘束は行いません（書類の結論も「行わない」になっています）。';
      if (j.allOk && v.kind !== 'kaijo' && !v.period.trim()) return '一時性：期間と時間帯を、できるだけ短く具体的に書きましょう（例：何月何日の何時から何時まで）。';
      if (j.allOk && v.kind !== 'kaijo' && !v.sdate) return '本人・家族に説明した日を入れましょう。前もって説明していても、実際に身体拘束を行う時点で、必ず個別に説明します。';
      if (j.allOk && v.kind !== 'kaijo' && sec(v) === 'kaigo') return '家族への説明の確認は、同意ではありません。家族の同意があることは、身体拘束をしてよい理由にはなりません。3つの要件を満たさなくなったら、すぐに解除します。';
      if (j.allOk && v.kind !== 'kaijo') return '個別支援計画に、身体拘束の態様・時間・理由と、解消に向けた方針を書き加えましょう。3つの要件を満たさなくなったら、すぐに解除します。';
      return '';
    },
  });
})();
