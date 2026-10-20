// ツール一覧ページ（tools.html）。JavaScript なしで読める静的HTML。検索で「福祉 書類 テンプレート」などから来た人の入口。
import { SECTORS, TOOLS, toolCard } from './portal.mjs';

const GROUPS = [
  ...SECTORS.map((s) => ({ id: s.id, name: `${s.name}（${s.sub}）`, short: s.name, pick: (t) => t.sectors.length < 3 && t.sectors[0] === s.id })),
  { id: 'all', name: '共通（介護・障害福祉・児童支援のどれでも）', short: '共通', pick: (t) => t.sectors.length >= 3 },
];

export function toolsPage({ esc, CONFIG }) {
  const groups = GROUPS.map((g) => ({ ...g, tools: TOOLS.filter(g.pick) })).filter((g) => g.tools.length);
  const body = `
<section class="portal-hero portal-hero-sm">
  <div class="wrap">
    <nav class="breadcrumb"><a href="index.html">トップ</a></nav>
    <span class="pill">無料・登録不要</span>
    <h1>福祉の書類テンプレート一覧</h1>
    <p class="lead" style="max-width:44em">福祉の書類を選ぶだけで下書きに。個別支援計画、連絡帳、介護記録、事故報告・ヒヤリハット、モニタリング、議事録など${TOOLS.length}のツールを、業種ごとに並べました。すべて無料・登録なしで使え、入力した内容は送信されません。</p>
    <p class="lead" style="max-width:44em">${groups.map((g) => `<a href="#sec-${g.id}">${esc(g.short)}</a>`).join(' ／ ')}</p>
  </div>
</section>
${groups.map((g) => `<section class="section" id="sec-${g.id}">
  <div class="wrap">
    <div class="section-head"><h2>${esc(g.name)}（${g.tools.length}）</h2></div>
    <div class="tool-grid">${g.tools.map((t) => toolCard(t, esc)).join('')}</div>
  </div>
</section>`).join('\n')}
<section class="section">
  <div class="wrap narrow">
    <div class="ask-box"><p><b>「この書類もほしい」を教えてください</b><br>ツールは現場の声をもとに増やしています。意見箱からお気軽にどうぞ。</p><a class="btn btn-line btn-sm" href="iken.html">意見箱に送る</a></div>
  </div>
</section>`;
  return {
    path: 'tools.html',
    title: `福祉の書類テンプレート一覧｜${CONFIG.siteName}`,
    description: `介護・障害福祉・児童支援の書類を、選ぶだけで下書きにできる無料ツール${TOOLS.length}件の一覧。個別支援計画、連絡帳、介護記録、ヒヤリハット、議事録など。登録不要です。`,
    body,
  };
}
