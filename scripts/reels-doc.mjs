// Instagram リールの台本シート（docs/sns/instagram-reels.md）を data/reels.mjs から作る。
// 使い方：node scripts/reels-doc.mjs
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REELS, COMMON_TAGS, VOICE_CREDIT } from '../data/reels.mjs';
import { CONFIG } from '../data/config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HOOK = 2.6; // products/reels/make.mjs と同じ値
const END = 3.4;
const plain = (h) => (h || '').replace(/<br>/g, ' ').replace(/<small>.*?<\/small>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const sec = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const DAYS = ['月', '水', '金'];
// 実際の長さ（ナレーションに合わせてのびた長さ）。動画を作ったあとなら timeline.json から読む
const tlTotal = (r) => { try { return JSON.parse(readFileSync(join(ROOT, 'products/reels/dist', `${r.no}-${r.id}.timeline.json`), 'utf8')).total; } catch (e) { return 0; } };

const lines = [];
lines.push('# Instagram リール 台本シート', '');
lines.push(`動画は \`products/reels/make.mjs\` で、本物のサイト（${CONFIG.siteUrl}）を実際にタップして撮っています。文字は動画に焼き込み済み、音は入っていません。`, '');
lines.push('## アカウントの準備', '');
lines.push('| 項目 | 入れる内容 |', '|---|---|');
lines.push(`| 名前 | ふくしのおたすけ帳｜福祉の書類を無料で |`);
lines.push(`| ユーザーネーム（例） | fukushi_otasuke |`);
lines.push(`| 自己紹介 | 介護・障害福祉・児童支援の書類を「選ぶだけで下書き」✍️<br>個別支援計画・記録・事故報告・委員会・研修まで19種類<br>無料・登録なし／入力は送信されません<br>▼ツールはこちら |`);
lines.push(`| リンク | ${CONFIG.siteUrl}/start.html （リールで紹介したツールの一覧ページ） |`);
lines.push(`| アカウントの種類 | プロアカウント（クリエイター）にすると、見られた数・保存数が分かる |`, '');
lines.push('アカウントを作ったら、URLを `data/config.mjs` の `instagramUrl` に入れると、LPにフォローボタンが出ます。', '');
lines.push('## 投稿の進め方', '');
lines.push('1. 動画は2種類あります。`dist/final/`（声・効果音・BGM入り。そのまま投稿）と、`dist/final-voice/`（声と効果音だけ。インスタで流行りの音源を小さめに足して使う。音源を使うには、アカウントをクリエイターにしておく）。');
lines.push('   声は Style-Bert-VITS2 の「小春音アミ」モデル（あみたろの声素材工房の声を元にしたモデル）。**キャプションの最後のクレジットは必ず残してください**（規約で表記が必要です）。');
lines.push('2. **表紙**は、動画の最初（大きな文字の画面）を選ぶ。プロフィールの一覧で、シリーズとして並びます。');
lines.push('3. キャプションとハッシュタグは、下の文をそのまま貼り付ける。ハッシュタグは内容に合ったもの5個に絞っています。');
lines.push('4. 投稿したら、**#0（自己紹介）をプロフィールに固定**する。');
lines.push('5. 時間帯は、昼休み（12:00〜13:00）か、仕事終わり（19:00〜21:00）がおすすめ。週3本（' + DAYS.join('・') + '）のペースで。');
lines.push('6. コメントやDMで「この書類もほしい」と来たら、意見箱と同じように扱い、ツールを増やしたら「リクエストにお応えしました」リールにする。', '');
lines.push('| 順番 | 動画ファイル | 内容 | 長さ |', '|---|---|---|---|');
REELS.forEach((r, i) => {
  const total = HOOK + r.length + END;
  lines.push(`| ${i + 1}本目 | \`${r.no}-${r.id}.mp4\` | ${r.hook ? plain(r.hook) : r.title} | ${Math.round(tlTotal(r) || total)}秒 |`);
});
lines.push('');

for (const r of REELS) {
  const total = tlTotal(r) || HOOK + r.length + END;
  lines.push(`## #${r.no}　${r.title}`, '');
  lines.push(`- 動画：\`products/reels/dist/${r.no}-${r.id}.mp4\`（1080×1920・${Math.round(total)}秒）`);
  lines.push(`- 紹介するツール：${r.toolName}（${CONFIG.siteUrl}/${r.tool}）`, '');
  lines.push('| 時間 | 画面 | 文字（字幕） |', '|---|---|---|');
  if (r.hook) lines.push(`| 0:00 | 大きな文字（つかみ） | ${plain(r.hook)} |`);
  let prev = null;
  for (const s of r.steps) {
    if (s.scene) { lines.push(`| ${sec((r.hook ? HOOK : 0) + s.at)} | 場面のイラスト（${s.time || ''}） | ${plain(s.title)}　${plain(s.sub)}${s.say ? `<br>ナレーション：${s.say}` : ''} |`); continue; }
    if (s.cap == null) continue;
    const t = (r.hook ? HOOK : 0) + s.at;
    const acts = r.steps.filter((x) => x.at >= s.at && (!prev || true) && x.cap == null && x.at < (r.steps.find((y) => y.cap != null && y.at > s.at)?.at ?? Infinity));
    const what = acts.map((a) => (a.tap ? 'タップ' : a.type ? `入力「${a.text}」` : a.scroll ? 'スクロール' : '')).filter(Boolean);
    lines.push(`| ${sec(t)} | ${[...new Set(what)].join('・') || '画面を見せる'} | ${plain(s.cap)}${s.say ? `<br>ナレーション：${s.say}` : ''} |`);
    prev = s;
  }
  lines.push(`| ${sec(total - END)} | 最後の案内 | 無料・登録なし／ふくしのおたすけ帳／プロフィールのリンクから。保存して、職場の人にも。 |`, '');
  const tags = [...r.tags.slice(0, 4), COMMON_TAGS[0]].map((t) => '#' + t).join(' ');
  const credit = `🎤 ${VOICE_CREDIT}`;
  lines.push('**キャプション**', '', '```', r.caption, '', tags, '', credit, '```', '');
}

lines.push('## 動画の作り直し・追加', '');
lines.push('```sh');
lines.push('node scripts/build.mjs && (cd site && python3 -m http.server 8765 &)');
lines.push('FONT_VIA_CURL=1 node products/reels/make.mjs          # すべて（プロキシのない環境では FONT_VIA_CURL は不要）');
lines.push('FONT_VIA_CURL=1 node products/reels/make.mjs kiroku   # 1本だけ');
lines.push('node scripts/reels-doc.mjs                             # この台本シートを作り直す');
lines.push('```', '');
lines.push('新しいリールは `data/reels.mjs` に1件足す（つかみの文字・字幕・タップする場所・キャプション）。LP（start.html）の一覧にも自動で入ります。');

const out = join(ROOT, 'docs/sns/instagram-reels.md');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, lines.join('\n') + '\n');
console.log('wrote ' + out);
