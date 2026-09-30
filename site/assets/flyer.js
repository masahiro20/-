// 紹介チラシのQRコード。表示しているサイトのトップページのURLから作る。
(function () {
  'use strict';
  var base = location.href.replace(/[^/]*([?#].*)?$/, '');
  document.getElementById('flyerUrl').textContent = base.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (window.QRCode) {
    // eslint-disable-next-line no-new
    new window.QRCode(document.getElementById('flyerQr'), { text: base, width: 150, height: 150, correctLevel: window.QRCode.CorrectLevel.M });
  }
  document.getElementById('flyerPrint').addEventListener('click', function () { window.print(); });
})();
