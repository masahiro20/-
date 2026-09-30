// 欠席時対応の記録（欠席時対応加算）。連絡の日時・連絡者・理由・相談援助の内容をそろえる。
(function () {
  'use strict';
  var REASON = [
    ['netsu', '発熱・かぜ', '発熱（かぜの症状）のため'],
    ['onaka', '腹痛・嘔吐', '腹痛（嘔吐）のため'],
    ['atama', '頭痛・だるさ', '頭痛とだるさのため'],
    ['tsuuin', '通院', '通院のため'],
    ['kibun', '気分がすぐれない・行きたくない', '気分がすぐれず、通所する気持ちになれないため'],
    ['katei', '家庭の事情', '家庭の事情のため'],
    ['gakkou', '学校の行事・下校時刻の変更', '学校の行事（下校時刻の変更）のため'],
    ['tenkou', '天候・交通機関', '天候（交通機関の乱れ）のため'],
  ];
  var CHECK = [
    ['taion', '体温・症状', '体温は（　）℃、症状は（　　）とのこと。'],
    ['shokuji', '食事・水分がとれているか', '食事と水分はとれているとのこと。'],
    ['suimin', '睡眠', '昨夜はよく眠れなかったとのこと。'],
    ['jushin', '受診の予定', '（　）時に受診の予定とのこと。'],
    ['kimochi', '本人の気持ち', '本人は「（　　）」と話しているとのこと。'],
    ['kazoku', '家族の状況', '家族の状況（付き添いの可否など）を確認した。'],
  ];
  var HELP = [
    ['yasumu', '家での過ごし方を助言', '無理をせず、水分をとって家でゆっくり休むよう伝えた。'],
    ['jushin', '受診を勧めた', '症状が続く場合は、医療機関を受診するよう勧めた。'],
    ['kiku', '気持ちを聞き取った', '通所しづらい理由や気持ちを聞き取り、「無理をしなくて大丈夫」と伝えた。'],
    ['jikai', '次回の利用を確認', '次回の利用予定を確認し、体調が戻ってから通所するよう伝えた。'],
    ['katei', '家でできることを提案', '家でできる活動（　　）を提案した。'],
    ['sougei', '送迎・時間を調整', '次回の送迎（通所の時間）の調整について相談した。'],
    ['renraku', '関係機関と共有', '必要に応じて相談支援専門員と情報を共有することを伝えた。'],
  ];
  var WHO = ['本人', '母', '父', '家族', 'グループホームの職員', '相談支援専門員', 'その他'];

  function days(a, b) {
    var x = /^(\d{4})-(\d{2})-(\d{2})$/.exec(a), y = /^(\d{4})-(\d{2})-(\d{2})$/.exec(b);
    if (!x || !y) return null;
    return Math.round((Date.UTC(x[1], x[2] - 1, x[3]) - Date.UTC(y[1], y[2] - 1, y[3])) / 86400000);
  }

  Formdoc.run({
    title: '欠席時対応記録',
    ai: { role: '障害福祉サービス・障害児通所支援の職員', doc: '欠席時対応の記録', rules: ['連絡の日時・連絡者・欠席の理由・相談援助の内容をすべて残す。', '相談援助の内容は、実際に伝えたことが分かるように具体的に書く。'] },
    blocks: [
      { title: '欠席の連絡', fields: [
        { id: 'plan', type: 'date', label: '利用予定日', today: true, half: true },
        { id: 'cdate', type: 'date', label: '連絡を受けた日', today: true, half: true },
        { id: 'ctime', type: 'time', label: '連絡を受けた時刻', half: true },
        { id: 'how', type: 'select', label: '方法', options: ['電話', 'メール・連絡アプリ', '来所・送迎時'], half: true },
        { id: 'who', type: 'select', label: '連絡してきた人', options: WHO },
      ] },
      { title: '欠席の理由と、確認したこと', fields: [
        { id: 'reason', type: 'seg', wide: true, options: REASON.map(function (x) { return [x[0], x[1]]; }) },
        { id: 'check', type: 'chips', label: '確認したこと', options: CHECK.map(function (x) { return [x[0], x[1]]; }), def: ['taion'] },
      ] },
      { title: '相談援助の内容', fields: [
        { id: 'help', type: 'chips', options: HELP.map(function (x) { return [x[0], x[1]]; }), def: ['jikai'] },
        { id: 'next', type: 'date', label: '次回の利用予定日', half: true },
        { id: 'count', type: 'text', label: '今月の算定回数（今回を含む）', ph: '例：2', half: true },
      ] },
    ],
    build: function (v, H) {
      var d = days(v.plan, v.cdate);
      var when = d === 0 ? '当日' : d === 1 ? '前日' : d === 2 ? '前々日' : d > 2 ? d + '日前' : d != null ? '利用予定日より後' : '';
      var r = REASON.filter(function (x) { return x[0] === v.reason; })[0];
      var check = CHECK.filter(function (x) { return v.check.indexOf(x[0]) !== -1; }).map(function (x) { return x[2]; }).join('');
      var help = HELP.filter(function (x) { return v.help.indexOf(x[0]) !== -1; }).map(function (x) { return x[2]; }).join('');
      var ok = d != null && d >= 0 && d <= 2;
      return {
        title: '欠席時対応記録',
        right: '対応者：',
        sections: [
          { h: '連絡', rows: [
            ['利用予定日', 'plan', H.date(v.plan)],
            ['連絡を受けた日時', 'cdate', H.date(v.cdate) + '　' + H.time(v.ctime) + (when ? '（利用予定日の' + when + '）' : '')],
            ['連絡者・方法', 'who', v.who + 'より、' + v.how + 'で連絡を受けた。'],
          ] },
          { h: '内容', rows: [
            ['欠席の理由', 'reason', r[2] + '、欠席するとのこと。'],
            ['確認した状況', 'check', check, '（確認した内容を記入）'],
            ['相談援助の内容', 'help', help, '（伝えたこと・助言したことを記入）'],
            ['次回の利用予定', 'next', v.next ? H.date(v.next) : '', '（次回の予定を記入）'],
          ] },
          { h: '加算', rows: [
            ['欠席時対応加算', 'kasan', ok ? '算定する' + (v.count.trim() ? '（今月' + v.count.trim() + '回目）' : '（今月　回目）') : '算定しない（連絡が利用予定日の前々日より前、または日付を確認）'],
          ] },
        ],
        foot: '欠席時対応加算は、利用予定日の前々日・前日・当日に欠席の連絡を受け、状況を確認して相談援助を行った場合に算定できます（原則、月4回まで）。最新の算定要件は指定権者の資料で確認してください。',
      };
    },
    warn: function (v) {
      var d = days(v.plan, v.cdate);
      if (d != null && d > 2) return '連絡を受けたのが利用予定日の前々日より前のため、欠席時対応加算の対象になりません。';
      if (d != null && d < 0) return '連絡を受けた日が、利用予定日より後になっています。日付を確認してください。';
      if (Number(v.count) > 4) return '欠席時対応加算は、原則として月4回までです（重症心身障害児などの例外あり）。';
      if (!v.help.length) return '「お大事に」だけでは相談援助になりません。伝えたこと・助言したことを記録しましょう。';
      return '';
    },
  });
})();
