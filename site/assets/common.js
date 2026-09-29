// 全ページ共通：URLのコピー、通知、AIに頼む文章（プロンプト）のコピー。
(function () {
  'use strict';
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* 何もしない */ }
    document.body.removeChild(ta);
  }
  function copyText(text) {
    return new Promise(function (resolve) {
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(resolve, function () { fallbackCopy(text); resolve(); });
      else { fallbackCopy(text); resolve(); }
    });
  }
  var timer;
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('p');
      el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = msg; el.classList.add('show');
    clearTimeout(timer); timer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  // AIに頼む文章。下書きと、書き方の条件をまとめる
  function buildPrompt(opts) {
    var lines = [
      'あなたは' + opts.role + 'の書類づくりを手伝うアシスタントです。',
      '以下は「' + opts.doc + '」の下書きです。次の条件で文章を整えてください。',
      '',
      '【条件】',
      '・書かれている事実を変えない。書かれていないことを付け足さない。',
      '・情報が足りないところは、推測で埋めずに【要確認：〇〇】と書く。',
    ];
    (opts.rules || []).forEach(function (r) { lines.push('・' + r); });
    lines.push('・個人名・住所など、個人が特定できる情報は書かない。', '・項目の見出しと順番はそのまま残す。', '', '【下書き】', opts.draft);
    return lines.join('\n');
  }

  var dialog;
  function showAiDialog() {
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'ai-dialog';
      dialog.innerHTML =
        '<h3>AIに頼む文章をコピーしました</h3>' +
        '<ol><li>下のどれかのAIを開きます。</li><li>入力欄に貼り付けて送信します。</li><li>整った文章を確認して、事業所の様式に貼り付けます。</li></ol>' +
        '<p class="ai-links"><a href="https://chatgpt.com/" target="_blank" rel="noopener">ChatGPT</a><a href="https://claude.ai/" target="_blank" rel="noopener">Claude</a><a href="https://gemini.google.com/" target="_blank" rel="noopener">Gemini</a></p>' +
        '<p class="ai-warn">貼り付ける前に、<b>氏名・住所・病名など個人が特定できる情報が入っていないか</b>確認してください。AIの文章は必ず人が確認してから使ってください。</p>' +
        '<p style="text-align:right;margin:0"><button type="button" class="btn btn-sm">閉じる</button></p>';
      dialog.querySelector('button').addEventListener('click', function () { dialog.close(); });
      dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
      document.body.appendChild(dialog);
    }
    if (dialog.showModal) dialog.showModal(); else toast('AIに頼む文章をコピーしました');
  }

  window.Otasuke = {
    copy: function (text, msg) { return copyText(text).then(function () { if (msg) toast(msg); }); },
    toast: toast,
    copyAiPrompt: function (opts) { return copyText(buildPrompt(opts)).then(showAiDialog); },
  };

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy-url]');
    if (!b) return;
    copyText(b.getAttribute('data-copy-url')).then(function () { toast('URLをコピーしました。LINEやメールで送れます'); });
  });
})();
