/**
 * ふくしのおたすけ帳 — 意見箱の受け口（Google Apps Script）
 *
 * 使い方（くわしくは docs/deploy.md の「意見箱」）
 *  1. Googleスプレッドシートを新しく作り、「拡張機能 → Apps Script」を開く
 *  2. このファイルの中身を貼り付けて保存する
 *  3. 「プロジェクトの設定 → スクリプト プロパティ」に NOTIFY_EMAIL（通知を受け取るメールアドレス）を追加する
 *  4. 「デプロイ → 新しいデプロイ → 種類：ウェブアプリ」
 *     次のユーザーとして実行：自分／アクセスできるユーザー：全員 → デプロイ
 *  5. 表示された「ウェブアプリのURL」を data/config.mjs の feedbackEndpoint に貼り、node scripts/build.mjs を実行する
 */

var SHEET_NAME = '意見箱';
var MAX_PER_10MIN = 30; // いたずら対策：10分間に受け付ける上限（サイト全体）

function doPost(e) {
  try {
    var v = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (v.website) return ok_(); // ロボットよけの欄が埋まっていたら捨てる
    var body = clip_(v.body, 3000);
    if (body.length < 5) return ok_();

    var cache = CacheService.getScriptCache();
    var count = Number(cache.get('count') || 0);
    if (count >= MAX_PER_10MIN) return ok_();
    cache.put('count', String(count + 1), 600);

    var row = [new Date(), clip_(v.kind, 40), clip_(v.sector, 60), clip_(v.role, 60), clip_(v.doc, 100), body, clip_(v.email, 120), clip_(v.page, 200), '未対応'];
    sheet_().appendRow(row);

    var to = PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL');
    if (to) {
      var mail = {
        to: to,
        subject: '【意見箱】' + row[1] + '（' + row[2] + '）',
        body: ['種類：' + row[1], '分野：' + row[2], '職種：' + (row[3] || '—'), '書類・ツール：' + (row[4] || '—'), '', row[5], '', '返信先：' + (row[6] || '不要'), '送信元ページ：' + (row[7] || '—')].join('\n'),
      };
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row[6])) mail.replyTo = row[6];
      MailApp.sendEmail(mail);
    }
  } catch (err) {
    console.error(err);
  }
  return ok_();
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  // 見出し行（A1＝受付日時）がすでにあるシートを使う（シート名が違っていてもよい）
  if (!sh) sh = ss.getSheets().filter(function (s) { return s.getRange('A1').getValue() === '受付日時'; })[0];
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['受付日時', '種類', '分野', '職種', '書類・ツール', '内容', '返信先', '送信元ページ', '対応']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function clip_(s, n) {
  // 数式として実行されないよう、先頭の = + - @ を無効にする
  return String(s == null ? '' : s).slice(0, n).replace(/^[=+\-@]/, "'$&");
}

function ok_() {
  return ContentService.createTextOutput('ok');
}
