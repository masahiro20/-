// 意見箱の送信。送り先は data-mode で切り替える：
//  endpoint … Google Apps Script のウェブアプリに送る（スプレッドシートに記録＋メール通知）
//  mail     … 利用者のメールソフトを開く
//  none     … 準備中。文章をコピーできるようにする
(function () {
  'use strict';
  var form = document.getElementById('iken');
  if (!form) return;
  var msg = document.getElementById('ikenMsg');
  var btn = document.getElementById('ikenSend');
  var mode = form.getAttribute('data-mode');
  var params = new URLSearchParams(location.search);
  if (params.get('doc')) document.getElementById('ikenDoc').value = params.get('doc').slice(0, 100);

  function values() {
    var fd = new FormData(form);
    return {
      kind: fd.get('kind') || '', sector: fd.get('sector') || '', role: (fd.get('role') || '').trim(),
      doc: (fd.get('doc') || '').trim(), body: (fd.get('body') || '').trim(), email: (fd.get('email') || '').trim(),
      website: fd.get('website') || '', page: document.referrer ? document.referrer.slice(0, 200) : '',
    };
  }
  function asText(v) {
    return ['【種類】' + v.kind, '【分野】' + v.sector, '【職種】' + (v.role || '—'), '【書類・ツール】' + (v.doc || '—'), '【内容】', v.body, '', '【返信先】' + (v.email || '不要')].join('\n');
  }
  function show(html, cls) { msg.className = 'iken-msg ' + (cls || ''); msg.innerHTML = html; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = values();
    if (v.website) return; // ロボットよけ（人には見えない欄）
    if (v.body.length < 5) { show('内容を入力してください。', 'ng'); form.body.focus(); return; }
    if (v.body.length > 3000) { show('内容は3000字以内でお願いします。', 'ng'); return; }
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) { show('メールアドレスの形を確認してください。', 'ng'); form.email.focus(); return; }

    if (mode === 'endpoint') {
      btn.disabled = true; btn.textContent = '送信しています…';
      // Apps Script はプリフライトに対応しないため、text/plain の単純なリクエストで送る
      fetch(form.getAttribute('data-endpoint'), { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(v) })
        .then(function () {
          form.reset();
          show('<b>ありがとうございました。</b>いただいた声は、必ず読んでいます。ツールの追加や改善に役立てます。', 'ok');
        })
        .catch(function () {
          show('送信できませんでした。通信の状態を確認して、もう一度お試しください。', 'ng');
        })
        .then(function () { btn.disabled = false; btn.textContent = '意見を送る'; });
      return;
    }
    if (mode === 'mail') {
      var to = form.getAttribute('data-email');
      location.href = 'mailto:' + to + '?subject=' + encodeURIComponent('【意見箱】' + v.kind) + '&body=' + encodeURIComponent(asText(v));
      show('メールソフトが開きます。開かない場合は、' + to + ' あてに送ってください。', 'ok');
      return;
    }
    window.Otasuke.copy(asText(v), '内容をコピーしました');
    show('ただいま送信の準備中です。入力した内容をコピーしました。お手数ですが、もう少しお待ちください。', 'ng');
  });
})();
