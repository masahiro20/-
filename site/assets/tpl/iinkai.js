// 委員会の議事録。虐待防止・身体拘束適正化・感染症対策・事故防止・業務継続（BCP）。一体開催にも対応。
(function () {
  'use strict';
  var TYPES = [
    ['gyakutai', '虐待防止'],
    ['kousoku', '身体拘束等の適正化'],
    ['kansen', '感染症対策'],
    ['jiko', '事故防止'],
    ['bcp', '業務継続（BCP）'],
  ];
  var SVC = [
    ['k-shisetsu', '介護：施設（特養・老健・介護医療院）'],
    ['k-kyoju', '介護：グループホーム・特定施設・短期入所・小規模多機能'],
    ['k-kyotaku', '介護：訪問系・通所系（デイサービスなど）'],
    ['s-nitchu', '障害福祉：通所・入所・グループホーム'],
    ['s-houmon', '障害福祉：訪問系・相談支援'],
    ['jido', '児童：放課後等デイ・児童発達支援'],
  ];
  // 開催頻度の目安（月）。0 は義務なし（推奨）
  var FREQ = {
    gyakutai: { 'k-shisetsu': 12, 'k-kyoju': 12, 'k-kyotaku': 12, 's-nitchu': 12, 's-houmon': 12, jido: 12 },
    kousoku: { 'k-shisetsu': 3, 'k-kyoju': 3, 'k-kyotaku': 0, 's-nitchu': 12, 's-houmon': 12, jido: 12 },
    kansen: { 'k-shisetsu': 3, 'k-kyoju': 6, 'k-kyotaku': 6, 's-nitchu': 3, 's-houmon': 6, jido: 3 },
    jiko: { 'k-shisetsu': 12, 'k-kyoju': 0, 'k-kyotaku': 0, 's-nitchu': 0, 's-houmon': 0, jido: 0 },
    bcp: { 'k-shisetsu': 0, 'k-kyoju': 0, 'k-kyotaku': 0, 's-nitchu': 0, 's-houmon': 0, jido: 0 },
  };
  function freqText(n) { return n === 3 ? '3か月に1回以上' : n === 6 ? '6か月に1回以上' : n === 12 ? '年1回以上' : '定期的に（設置の義務はないが推奨）'; }
  // 議題：[id, 選択肢, 検討した内容, 決まったこと]
  var SHISHIN = ['shishin', '指針の見直し', '（委員会）のための指針の内容を読み合わせ、現状に合っているかを確認した。', '指針は現行どおりとする（変更がある場合：　　　を追記する）。'];
  var KENSHU = ['kenshu', '研修の計画と実施状況', '研修の実施状況と、まだ受講していない職員を確認した。', '未受講の職員は、資料の回覧と確認テストで受講し、受講日を記録する。'];
  var AGENDA = {
    gyakutai: [
      ['jokyo', '虐待・不適切なケアの有無', '前回の委員会以降、虐待や不適切なケアが疑われる事例がなかったかを確認した（事例なし／事例あり：概要を記入）。', '気になる言動や場面は、ヒヤリハットと同じように報告してもらうよう、改めて職員に伝える。'],
      ['check', '職員セルフチェックの結果', '職員セルフチェックリストの結果を集計した。「待たせるときに理由を伝えていない」「呼び方がなれなれしい」に当てはまる回答が多かった。', 'フロアごとに言葉づかいと関わり方を振り返る時間を設ける。'],
      ['soudan', '相談・通報の体制', '職員・利用者・家族からの相談窓口と、市町村への通報の流れを確認した。', '通報の流れと相談窓口を、職員の休憩室と玄関に掲示する。'],
      ['stress', '職員の負担・ストレス', '業務の負担が大きい時間帯や、悩みを相談しにくい状況がないかを話し合った。', '管理者との面談の機会を設け、ストレスを抱える職員が早めに相談できるようにする。'],
      SHISHIN, KENSHU,
    ],
    kousoku: [
      ['jokyo', '身体拘束の実施状況', '身体拘束等の実施状況を確認した（実施なし／実施あり：　名）。', '実施している方について、次回の委員会で解除に向けた経過を報告する。'],
      ['youken', '3つの要件の再検討', '身体拘束を行っている方について、切迫性・非代替性・一時性の3つの要件を満たしているか、ほかの方法で対応できないかを検討した。', '（対象者）について、（代わりの方法）を試し、1か月後に解除を検討する。'],
      ['gray', '拘束にあたるおそれのある対応', 'ベッドの4点柵、つなぎ服、車いすのベルト、行動を制限するためのセンサーの使い方など、身体拘束にあたるおそれのある対応がないかを確認した。', 'センサーは「見守りのため」の使い方に限り、使う理由と見直しの時期を記録する。'],
      ['kiroku', '記録と家族への説明', 'やむを得ず身体拘束を行う場合の記録（態様・時間・心身の状況・理由）と、家族への説明と同意の手順を確認した。', '記録の様式を統一し、記入もれがないか委員会で毎回確認する。'],
      SHISHIN, KENSHU,
    ],
    kansen: [
      ['ryuukou', '地域の流行状況', '地域での感染症（インフルエンザ・新型コロナウイルス・感染性胃腸炎など）の流行状況を確認した。', '流行期に入るため、面会時の手指消毒とマスク着用の案内を玄関に掲示する。'],
      ['hassei', '事業所内の発生状況', '前回の委員会以降の、事業所内での感染症の発生状況を確認した（発生なし／発生あり：概要を記入）。', '発生時の報告の流れ（管理者・看護職員・市町村・保健所）を再確認する。'],
      ['hyoujun', '手指衛生・防護具の使い方', '手指衛生と、手袋・マスク・エプロンの使い方が守られているかを確認した。', '手洗いのタイミングを各フロアに掲示し、委員が月1回確認する。'],
      ['bichiku', '衛生用品の備蓄', 'マスク・手袋・ガウン・消毒液などの衛生用品の備蓄量を確認した。', '不足している（　　）を発注する。'],
      ['ouhan', '嘔吐物の処理', '嘔吐物の処理の手順と、処理セットの置き場所・中身を確認した。', '処理セットを点検し、次回の訓練で手順を確認する。'],
      ['sesshu', '予防接種', '利用者・職員の予防接種の予定と、同意書の回収状況を確認した。', '（　月）までに接種を終えられるよう、ご家族に案内する。'],
      ['kunren', '研修・訓練の計画', '感染症の研修と訓練（発生を想定したシミュレーション）の計画と実施状況を確認した。', '（　月）に訓練を行い、結果を次回の委員会で報告する。'],
      SHISHIN,
    ],
    jiko: [
      ['shuukei', 'ヒヤリハット・事故の集計', '前回以降のヒヤリハット（　件）と事故（　件）を、種類・場所・時間帯ごとに集計した。', '件数の多かった（場面）について、各フロアで対策を話し合う。'],
      ['bunseki', '事故の原因分析', '事故（　件）について、本人・職員・環境の要因を分析した。', '原因分析の結果をもとに、再発防止策を事故報告書に追記する。'],
      ['hyouka', '再発防止策の評価', '前回決めた再発防止策が実施されているか、効果があったかを確認した。', '効果が見られなかった対策は、方法を見直して継続する。'],
      ['houkoku', '市町村への報告', '市町村への報告が必要な事故について、報告の状況を確認した。', '報告の期限（第1報は5日以内を目安）を守れるよう、報告の流れを確認する。'],
      SHISHIN, KENSHU,
    ],
    bcp: [
      ['minaoshi', 'BCPの見直し', '業務継続計画（感染症・自然災害）の内容を確認し、連絡先・担当者・取引先に変更がないかを確認した。', '変更点を計画に反映し、職員に周知する。'],
      ['renraku', '連絡網・安否確認', '職員の緊急連絡網と、安否確認の方法を確認した。', '連絡網を更新し、年1回は実際に連絡がとれるか確認する。'],
      ['bichiku', '備蓄品の確認', '食料・飲料水・非常用電源・衛生用品の備蓄量と、使用期限を確認した。', '期限の近いものを入れ替え、備蓄リストを更新する。'],
      ['kunren', '研修・訓練の計画', 'BCPの研修と訓練（机上訓練・参集訓練など）の予定を確認した。', '（　月）に訓練を行い、課題を次回報告する。'],
    ],
  };
  var MEMBERS = ['管理者', '委員長', '生活相談員・サービス管理責任者・児童発達支援管理責任者', '看護職員', '介護職員・支援員', '機能訓練指導員', '管理栄養士・栄養士', 'ケアマネジャー・相談支援専門員', '事務職員', '外部の専門家（第三者委員など）'];
  var SHUCHI = [
    ['kairan', '議事録を回覧し、読んだ職員は確認欄にサインする。'],
    ['meeting', '職員ミーティングで報告する。'],
    ['keiji', '決定事項を職員の休憩室に掲示する。'],
    ['net', '事業所内の連絡ツール（チャット・掲示板）で共有する。'],
  ];

  function agendaOptions(v) {
    var out = [];
    v.types.forEach(function (t) {
      var name = TYPES.filter(function (x) { return x[0] === t; })[0][1];
      AGENDA[t].forEach(function (a) { out.push([t + '-' + a[0], (v.types.length > 1 ? '［' + name + '］' : '') + a[1]]); });
    });
    return out;
  }

  Formdoc.run({
    title: '委員会 議事録',
    ai: { role: '介護・障害福祉事業所の管理者', doc: '委員会の議事録', rules: ['検討した内容と決まったことを分けて書く。', '決まったことは「誰が・いつまでに・何をするか」が分かるように書く。', '（　）や空欄は、推測で埋めずに【要確認】と書く。'] },
    blocks: [
      { title: '委員会の種類', small: '一体で開いた場合は複数選ぶ', fields: [
        { id: 'types', type: 'chips', options: TYPES, def: ['gyakutai', 'kousoku'] },
        { id: 'svc', type: 'select', label: 'サービスの種類（開催頻度の目安に使います）', options: SVC },
      ] },
      { title: '開催の概要', fields: [
        { id: 'date', type: 'date', label: '開催日', today: true, half: true },
        { id: 'time', type: 'text', label: '時間', ph: '例：14:00〜14:45', half: true },
        { id: 'method', type: 'select', label: '方法', options: ['対面', 'オンライン（テレビ電話）', '対面とオンラインの併用'] },
        { id: 'members', type: 'chips', label: '出席者（職種）', options: MEMBERS, def: ['管理者', '介護職員・支援員'] },
      ] },
      { title: '議題', small: '話し合ったもの', fields: [
        { id: 'agenda', type: 'chips', list: true, options: agendaOptions },
        { id: 'extra', type: 'textarea', label: 'そのほかの議題・意見', ph: '例：夜勤帯の見守りの人数について、職員から意見があった。' },
      ] },
      { title: '周知の方法', fields: [
        { id: 'shuchi', type: 'chips', options: SHUCHI.map(function (x) { return [x[0], x[1].replace(/。$/, '')]; }), def: ['kairan'] },
      ] },
    ],
    build: function (v, H) {
      var names = v.types.map(function (t) { return TYPES.filter(function (x) { return x[0] === t; })[0][1]; });
      var chosen = [];
      v.types.forEach(function (t) { AGENDA[t].forEach(function (a) { if (v.agenda.indexOf(t + '-' + a[0]) !== -1) chosen.push([t, a]); }); });
      var multi = v.types.length > 1;
      var tag = function (t) { return multi ? '［' + TYPES.filter(function (x) { return x[0] === t; })[0][1] + '］' : ''; };
      var agendaText = chosen.map(function (c, i) { return (i + 1) + '. ' + tag(c[0]) + c[1][1]; }).join('\n');
      var discuss = chosen.map(function (c, i) { return (i + 1) + '. ' + tag(c[0]) + c[1][1] + '\n' + c[1][2]; }).join('\n');
      var decide = chosen.map(function (c) { return '・' + c[1][3]; }).join('\n');
      if (v.extra.trim()) discuss += (discuss ? '\n' : '') + '・' + v.extra.trim();
      // 次回：選んだ委員会のうち、いちばん短い頻度
      var months = v.types.map(function (t) { return FREQ[t][v.svc]; }).filter(Boolean);
      var min = months.length ? Math.min.apply(null, months) : 0;
      var next = '';
      var m = /^(\d{4})-(\d{2})/.exec(v.date);
      if (min && m) {
        var y = Number(m[1]), mo = Number(m[2]) + min;
        while (mo > 12) { mo -= 12; y++; }
        next = y + '年' + mo + '月ごろまでに開催する。';
      } else next = '（次回の日程を記入）';
      var freq = v.types.map(function (t) { return TYPES.filter(function (x) { return x[0] === t; })[0][1] + '：' + freqText(FREQ[t][v.svc]); }).join('\n');
      return {
        title: (names.join('・') || '　　') + '委員会 議事録',
        right: '記録者：',
        sections: [
          { h: '開催の概要', rows: [
            ['日時', 'when', H.date(v.date) + '　' + (v.time || '　　:　　〜　　:　　')],
            ['方法', 'method', v.method],
            ['出席者', 'members', v.members.join('、') + (v.members.length ? '（計　名）' : ''), '（職種と人数を記入）'],
            ['欠席者', 'absent', '', '（欠席者と、後日の周知方法）'],
          ] },
          { h: '内容', rows: [
            ['議題', 'agenda', agendaText, '（左の「三」で議題を選ぶと入ります）'],
            ['検討した内容', 'discuss', discuss, '（議題を選ぶと入ります）'],
            ['決まったこと', 'decide', decide, '（議題を選ぶと入ります）'],
          ] },
          { h: 'このあと', rows: [
            ['職員への周知', 'shuchi', SHUCHI.filter(function (x) { return v.shuchi.indexOf(x[0]) !== -1; }).map(function (x) { return x[1]; }).join(''), '（周知の方法を記入）'],
            ['次回の開催', 'next', next],
            ['開催頻度の目安', 'freq', freq],
          ] },
        ],
        foot: '開催頻度はサービスの種類・自治体によって異なります。必ず指定権者の資料で確認してください。一体で開催した場合も、それぞれの委員会で検討すべき内容を話し合ったことが分かるように記録します。',
      };
    },
    warn: function (v) {
      if (!v.types.length) return '委員会の種類を選んでください。';
      if (!v.agenda.length) return '「三 議題」から話し合ったものを選ぶと、検討した内容と決まったことの文例が入ります。';
      if (v.types.indexOf('gyakutai') !== -1 && v.members.indexOf('外部の専門家（第三者委員など）') === -1) return '虐待防止委員会は、事業所の外の専門家を委員に入れることが望ましいとされています（必須ではありません）。';
      return '';
    },
  });
})();
