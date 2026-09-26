// 運営指導前チェックリスト。チェック状態はこの端末の localStorage にだけ保存する。
(function () {
  'use strict';
  var KEY = 'goryouiki-checklist-v1';
  var boxes = Array.prototype.slice.call(document.querySelectorAll('.check input'));
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { saved = {}; }

  function save() {
    var data = {};
    boxes.forEach(function (b) { if (b.checked) data[b.dataset.key] = true; });
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* 保存できなくても表示は続ける */ }
  }
  function update() {
    var done = boxes.filter(function (b) { return b.checked; }).length;
    document.getElementById('progressBar').style.width = (done / boxes.length) * 100 + '%';
    document.getElementById('progressText').textContent = boxes.length + '項目中 ' + done + '項目を確認済み';
  }

  boxes.forEach(function (b) {
    b.checked = !!saved[b.dataset.key];
    b.addEventListener('change', function () { save(); update(); });
  });
  document.getElementById('resetChecks').addEventListener('click', function () {
    boxes.forEach(function (b) { b.checked = false; });
    save();
    update();
  });
  update();
})();
