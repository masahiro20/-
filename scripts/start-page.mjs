// インスタ（SNS）のプロフィールのリンク先にするLP。リールで紹介したツールにすぐ行けるようにする。
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { REELS } from '../data/reels.mjs';
import { SECTORS, shareBlock } from './portal.mjs';

export function startPage({ esc, CONFIG, OUT }) {
  const plain = (html) => html.replace(/<br>/g, '').replace(/<[^>]+>/g, '');
  const hasVideo = existsSync(join(OUT, 'assets/video/demo.mp4'));
  const video = hasVideo
    ? `<div class="lp-phone"><video src="assets/video/demo.mp4" poster="assets/video/demo.jpg" autoplay muted loop playsinline preload="metadata" aria-label="介護記録の文例を、タップして作っている画面"></video></div>`
    : '';
  const body = `
<section class="portal-hero lp-hero">
  <div class="wrap lp-hero-grid">
    <div>
      <span class="pill">介護・障害福祉・児童支援で働く方へ</span>
      <h1>福祉の書類、<br><span class="hl">選ぶだけで下書き。</span></h1>
      <p class="lead">個別支援計画・記録・報告書・会議・研修まで19種類。<b>無料・登録なし</b>で、スマホからすぐ使えます。入力した内容はどこにも送信されません。</p>
      <p class="lp-choose">あなたの分野をタップ</p>
      <div class="hero-jump lp-jump">
        ${SECTORS.map((s) => `<a class="jump jump-${s.id}" href="${s.path}"><b>${esc(s.name)}</b><span>${esc(s.sub)}</span></a>`).join('')}
      </div>
    </div>
    ${video}
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><h2>リールで紹介したツール</h2></div>
    <div class="lp-reels">
      ${REELS.filter((r) => r.no > 0 && !r.story).map((r) => `<a class="lp-reel" href="${esc(r.tool)}">
        <span class="lp-no">#${r.no}</span>
        <b>${esc(plain(r.hook))}</b>
        <span>${esc(r.toolName)}</span>
        <em>使ってみる →</em>
      </a>`).join('')}
    </div>
  </div>
</section>

<section class="section section-band">
  <div class="wrap">
    <div class="lp-promise">
      <div><b>無料・登録なし</b><span>メールアドレスもいりません。運営費はサイト内の広告（PR）でまかなっています。</span></div>
      <div><b>入力は送信しない</b><span>下書きはスマホやパソコンの中だけで作ります。氏名などは入力せずに使えます。</span></div>
      <div><b>国の様式どおりの項目</b><span>計画書や報告書は、国や自治体の様式の項目に沿って並べています。</span></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap narrow">
    <div class="section-head"><h2>ホーム画面に置いておくと、すぐ開けます</h2></div>
    <div class="lp-a2hs">
      <div><b>iPhone</b><ol><li>Safariでこのページを開く</li><li>下の共有ボタン（□に↑）をタップ</li><li>「ホーム画面に追加」</li></ol></div>
      <div><b>Android</b><ol><li>Chromeでこのページを開く</li><li>右上の「︙」をタップ</li><li>「ホーム画面に追加」</li></ol></div>
    </div>
    <p class="small muted">インスタの中で開いている場合は、右上の「︙」や「…」から「ブラウザで開く」を選んでから追加してください。</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="home-ask">
      <div>
        <h2>「この書類もほしい」を教えてください</h2>
        <p>ツールは、現場の声をもとに増やしています。${CONFIG.instagramUrl ? 'インスタのDMや、' : ''}意見箱からお気軽にどうぞ。</p>
      </div>
      <div class="lp-ask-btns">
        <a class="btn btn-warm" href="iken.html">意見箱をひらく</a>
        ${CONFIG.instagramUrl ? `<a class="btn btn-line" href="${esc(CONFIG.instagramUrl)}" target="_blank" rel="noopener">インスタをフォロー</a>` : ''}
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap narrow">
    ${shareBlock({ esc, url: `${CONFIG.siteUrl}/start.html`, title: `${CONFIG.siteName}｜福祉の書類を無料でかんたんに` })}
  </div>
</section>`;
  return {
    path: 'start.html',
    body,
    title: `はじめての方へ｜${CONFIG.siteName}（介護・障害福祉・児童支援の書類を無料で）`,
    description: '介護・障害福祉・児童支援の書類を、選ぶだけで下書きできる無料ツール集。リールで紹介したツールの一覧と、使い方の案内です。',
  };
}
