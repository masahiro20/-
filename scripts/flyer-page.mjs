// 事業所に貼る・配るための紹介チラシ（A4縦・QRコード）。QRは表示しているサイトのURLから作る。
import { SECTORS } from './portal.mjs';

export function flyerPage({ esc, CONFIG }) {
  const body = `
<section class="section flyer-screen">
  <div class="wrap narrow">
    <nav class="breadcrumb"><a href="index.html">トップ</a></nav>
    <h1 style="margin:0 0 8px">職場で紹介するためのチラシ</h1>
    <p class="muted" style="margin:0 0 16px">A4縦で印刷して、事務所や休憩室に貼ったり、会議で配ったりしてください。QRコードからこのサイトが開きます。</p>
    <p><button type="button" class="btn" id="flyerPrint">チラシを印刷する</button></p>
  </div>
</section>
<div class="flyer" id="flyer">
  <div class="flyer-top">
    <p class="flyer-brand"><span class="brand-seal">帳</span>${esc(CONFIG.siteName)}</p>
    <h2 class="flyer-title">計画書・報告書の下書きが、<br><span>無料で、すぐに。</span></h2>
    <p class="flyer-lead">介護・障害福祉・児童支援の書類を、国の様式どおりの項目で下書きできるツール集です。</p>
  </div>
  <div class="flyer-grid">
    ${SECTORS.map((s) => `<div class="flyer-sector flyer-${s.id}"><b>${esc(s.name)}</b><ul>${s.tools.filter((t) => !t.path.includes('checklist') && !t.path.includes('download') && !t.path.includes('bunrei')).map((t) => `<li>${esc(t.name)}</li>`).join('')}</ul></div>`).join('')}
  </div>
  <div class="flyer-bottom">
    <div class="flyer-qr" id="flyerQr" aria-label="サイトのQRコード"></div>
    <div>
      <ul class="flyer-points"><li>無料・登録不要</li><li>入力した内容は送信されません</li><li>スマホでも使えます</li></ul>
      <p class="flyer-url" id="flyerUrl"></p>
      <p class="flyer-note">氏名など個人が特定できる情報は入力せずに使えます。</p>
    </div>
  </div>
</div>`;
  return {
    path: 'flyer.html',
    body,
    title: `紹介チラシ（印刷用）｜${CONFIG.siteName}`,
    description: `${CONFIG.siteName}を職場で紹介するための、QRコードつきA4チラシ。`,
    scripts: [{ src: 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js', integrity: 'sha384-3zSEDfvllQohrq0PHL1fOXJuC/jSOO34H46t6UQfobFOmxE5BpjjaIJY5F2/bMnU' }, 'assets/flyer.js'],
  };
}
