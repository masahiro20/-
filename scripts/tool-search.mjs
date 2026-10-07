// ツール検索（「書類の名前で探す」）と「最近使ったツール」のための、全ツールの一覧。
// 一覧の出どころは scripts/portal.mjs の SECTORS（data/templates/*.mjs のテンプレートも入った後のもの）。
// 検索のしかたは site/assets/common.js（normalize は下と同じ規則にそろえること）。
//
// 検索用の別名（言い換え・ひらがなの読み）は、次の2か所に書けます。
//  1. 新しいテンプレート：data/templates/<id>.mjs に keywords: ['じこ', 'ヒヤリ', …] を足す
//  2. それ以外（古いツールなど）：下の ALIASES に、ページのパスをキーにして足す
// カタカナとひらがな、全角と半角、大文字と小文字は区別しないので、どちらか片方を書けば足ります。

const ALIASES = {
  // 児童支援
  'jido-keikaku.html': ['こべつしえんけいかく', '計画書', 'けいかくしょ', '支援計画', '放デイ', 'ほうでい', '放課後等デイサービス', '児発', 'じはつ', '児童発達支援', '5領域', 'ごりょういき', '児発管', 'じはつかん'],
  'renrakucho.html': ['れんらくちょう', '連絡ノート', '連絡', 'れんらく', '保護者', 'ほごしゃ', '今日の様子', '例文', 'れいぶん', '文例', 'ぶんれい'],
  'program.html': ['しえんぷろぐらむ', 'プログラム', '公表', 'こうひょう', 'ホームページ', '5領域', 'ごりょういき'],
  'bunrei/index.html': ['ぶんれい', '例文', 'れいぶん', '支援目標', 'しえんもくひょう', '目標', 'もくひょう', '支援内容', '個別支援計画', 'こべつしえんけいかく', 'モニタリング'],
  'checklist.html': ['ちぇっくりすと', '運営指導', 'うんえいしどう', '実地指導', 'じっちしどう', '監査', 'かんさ', '点検', 'てんけん', '確認'],
  'download.html': ['エクセル', 'excel', '様式', 'ようしき', '白紙', 'はくし', 'だうんろーど', '書式', 'しょしき', 'ひな形', 'ひながた'],
  // 障害福祉
  'shogai-keikaku.html': ['こべつしえんけいかく', '計画書', 'けいかくしょ', '支援計画', 'サビ管', 'さびかん', 'サービス管理責任者', '就労', 'しゅうろう', '就労継続支援', 'B型', 'A型', '就労移行', '生活介護', 'せいかつかいご', 'グループホーム', 'GH'],
  // 介護・共通
  'jiko.html': ['じこ', '事故報告', 'じこほうこく', '報告書', 'ほうこくしょ', 'アクシデント', '転倒', 'てんとう', '転落', 'てんらく', '誤嚥', 'ごえん', '誤薬', 'ごやく', 'けが', '怪我', '骨折'],
  'hiyari.html': ['ひやりはっと', 'ヒヤリ', 'ハット', 'インシデント', '事故', 'じこ', 'ニアミス', '転倒', 'てんとう', '誤薬', 'ごやく', '報告書', 'ほうこくしょ'],
  'kaigo-kiroku.html': ['かいごきろく', 'ケース記録', 'けーすきろく', '経過記録', 'けいかきろく', '生活記録', '日誌', 'にっし', '介護日誌', '食事', '入浴', 'にゅうよく', '排泄', 'はいせつ', '睡眠'],
  'moushiokuri.html': ['もうしおくり', '申送り', '引き継ぎ', '引継ぎ', 'ひきつぎ', '夜勤', 'やきん', '交代', 'メモ'],
  'kinkyo.html': ['きんきょう', '近況', 'お便り', 'おたより', '便り', 'たより', '手紙', 'てがみ', 'ご家族', '家族', 'かぞく', '様子の報告'],
  'iinkai.html': ['いいんかい', '議事録', 'ぎじろく', '会議録', '身体拘束', 'しんたいこうそく', '虐待防止', 'ぎゃくたい', '感染症', 'かんせんしょう', '感染対策', '事故防止', 'じこぼうし'],
  'kenshu-keikaku.html': ['けんしゅう', '研修計画', '年間計画', 'ねんかんけいかく', '訓練', 'くんれん', 'BCP', '避難訓練', 'ひなんくんれん', '計画表'],
  'kenshu-kiroku.html': ['けんしゅう', '研修記録', '研修報告', '報告書', '受講', 'じゅこう', '実施記録', '内部研修'],
  'shien-kiroku.html': ['しえんきろく', 'ケース記録', 'けーすきろく', '日々の記録', '日誌', 'にっし', '業務日誌', 'サービス提供記録', '経過記録'],
  'monitoring.html': ['もにたりんぐ', '評価', 'ひょうか', '見直し', 'みなおし', '振り返り', 'ふりかえり'],
  'kesseki.html': ['けっせき', '欠席時対応加算', '加算', 'かさん', 'お休み', '休み', 'やすみ', '電話'],
  'kaigi.html': ['かいぎ', '個別支援会議', '担当者会議', 'たんとうしゃかいぎ', 'サービス担当者会議', 'ケース会議', 'けーすかいぎ', 'カンファレンス', '議事録', 'ぎじろく'],
  // 制作中のツール（ページができたら自動で使われる。data/templates/<id>.mjs の keywords があればそちらも足す）
  'otayori.html': ['おたより', 'お便り', '便り', '通信', 'つうしん', '月だより', 'お知らせ', 'おしらせ', '保護者', 'ほごしゃ'],
  'assessment.html': ['あせすめんと', 'アセスメントシート', '聞き取り', 'ききとり', '課題分析', 'かだいぶんせき', 'フェイスシート'],
  'mitori.html': ['みとり', 'ターミナルケア', 'ターミナル', '終末期', 'しゅうまつき', '看取り介護', 'みとりかいご'],
};

// 名前に含まれる漢字の言葉に、ひらがなの読みを自動で足す（新しいツールも、これだけで「きろく」などで見つかる）
const READINGS = [
  ['記録', 'きろく'], ['計画', 'けいかく'], ['報告', 'ほうこく'], ['議事録', 'ぎじろく'], ['研修', 'けんしゅう'],
  ['事故', 'じこ'], ['支援', 'しえん'], ['会議', 'かいぎ'], ['個別', 'こべつ'], ['介護', 'かいご'], ['連絡', 'れんらく'],
  ['文例', 'ぶんれい'], ['下書き', 'したがき'], ['様式', 'ようしき'], ['委員会', 'いいんかい'], ['家族', 'かぞく'],
  ['欠席', 'けっせき'], ['申し送り', 'もうしおくり'], ['看取り', 'みとり'], ['安全', 'あんぜん'], ['送迎', 'そうげい'],
  ['工賃', 'こうちん'], ['苦情', 'くじょう'], ['虐待', 'ぎゃくたい'], ['身体拘束', 'しんたいこうそく'], ['避難', 'ひなん'],
  ['訓練', 'くんれん'], ['引き継ぎ', 'ひきつぎ'], ['保護者', 'ほごしゃ'], ['お便り', 'おたより'], ['便り', 'たより'],
];

export const SECTOR_NAMES = { jido: '児童支援', shogai: '障害福祉', kaigo: '介護' };
// 同じ名前のツール（児童と障害の「個別支援計画の下書き」など）を見分けるための、業種の小さなバッジ。
// 3業種すべてで使うツールは「共通」1つにまとめる。site/assets/common.js の secTags と同じ規則にする。
export const SECTOR_SHORT = { jido: '児童', shogai: '障害', kaigo: '介護' };
export function secTags(sectors) {
  const list = sectors.length >= 3 ? [['all', '共通']] : sectors.map((x) => [x, SECTOR_SHORT[x]]);
  return `<span class="sec-tags">${list.map(([id, n]) => `<span class="sec-tag sec-tag-${id}">${n}</span>`).join('')}</span>`;
}
// 業種ページごとに名前が違うツールの、一覧・検索・最近使ったツールでの名前（ページの見出しに合わせる）。
// ほかの業種での名前は、検索の別名に自動で入る。
const DISPLAY_NAMES = {
  'jiko.html': '事故報告書の下書き',
};
const SECTOR_WORDS = { jido: '児童支援 じどう 放デイ 児発', shogai: '障害福祉 しょうがい', kaigo: '介護 かいご' };

// 検索のための文字のそろえ方。site/assets/common.js の normalize と同じにする
export function normalize(s) {
  return String(s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)) // カタカナ → ひらがな
    .replace(/[\s・、。，．,.「」『』（）()［］[\]【】〈〉/／!?！？~〜\-_:：;；'"]+/g, '')
    .replace(/の/g, '');
}

// SECTORS の tools をパスでまとめて、1ツール1件の一覧にする（業種は複数持てる）
export function allTools(SECTORS, TEMPLATES = []) {
  const byPath = new Map();
  for (const sec of SECTORS) {
    for (const t of sec.tools) {
      const cur = byPath.get(t.path);
      if (cur) {
        if (!cur.sectors.includes(sec.id)) cur.sectors.push(sec.id);
        if (!cur.names.includes(t.name)) cur.names.push(t.name);
        continue;
      }
      byPath.set(t.path, { path: t.path, name: DISPLAY_NAMES[t.path] || t.name, desc: t.desc, tag: t.tag, sectors: [sec.id], names: [t.name] });
    }
  }
  const tplByPath = Object.fromEntries(TEMPLATES.map((t) => [t.path, t]));
  return [...byPath.values()].map(({ names, ...t }) => {
    const tpl = tplByPath[t.path];
    const words = [...names.filter((n) => n !== t.name), ...(ALIASES[t.path] || []), ...((tpl && tpl.keywords) || [])];
    const base = [t.name, ...words].join(' ');
    const readings = READINGS.filter(([k]) => base.includes(k)).map(([, r]) => r);
    const sectorWords = t.sectors.map((s) => SECTOR_WORDS[s]).join(' ');
    return {
      ...t,
      // k：名前・別名・読みを | でつないだもの（強い一致）、kd：説明文と業種（弱い一致。結果では後ろに並べる）
      k: [...new Set([t.name, ...words, ...readings].map(normalize).filter(Boolean))].join('|'),
      kd: normalize(`${t.desc} ${sectorWords}`),
    };
  });
}

// 検索に一致するか（common.js の score と同じ規則）。0：一致しない、3：名前で一致、2：別名で一致、1：説明文で一致
export function matchTool(t, query) {
  const terms = String(query || '').split(/[\s　]+/).map(normalize).filter(Boolean);
  if (!terms.length) return 0;
  const name = t.k.split('|')[0];
  if (terms.every((w) => name.includes(w))) return 3;
  if (terms.every((w) => t.k.includes(w))) return 2;
  if (terms.every((w) => t.k.includes(w) || t.kd.includes(w))) return 1;
  return 0;
}

// ブラウザに渡す一覧（assets/tools-data.js）
export function toolsDataJs(tools) {
  const rows = tools.map((t) => ({ p: t.path, n: t.name, d: t.desc, s: t.sectors, g: t.tag || '', k: t.k, kd: t.kd }));
  return `window.OTASUKE_TOOLS=${JSON.stringify(rows)};\n`;
}

// 検索欄。JSが動くときだけ表示する（hidden を外す）。JSが無いときは、下の一覧がそのまま見える
export function searchBox({ esc, tools, mode, sector = '', hints = [] }) {
  const ok = hints.filter((h) => tools.some((t) => matchTool(t, h)));
  return `<div class="tool-search" data-search="${mode}"${sector ? ` data-sector="${sector}"` : ''} hidden>
  <label class="tool-search-label" for="toolQ">書類の名前で探す</label>
  <div class="tool-search-box">
    <input id="toolQ" class="input" type="search" placeholder="例：事故、れんらくちょう、記録" autocomplete="off" enterkeyhint="search" aria-describedby="toolQCount">
    <button type="button" class="tool-search-clear" aria-label="入力を消す" hidden>×</button>
  </div>
  ${ok.length ? `<p class="tool-search-hints"><span>よく探される書類</span>${ok.map((h) => `<button type="button" data-q="${esc(h)}">${esc(h)}</button>`).join('')}</p>` : ''}
  <p class="tool-search-count" id="toolQCount" role="status" aria-live="polite"></p>
  <div class="tool-search-results"></div>
</div>`;
}
