// 「選ぶだけの下書き」テンプレートの一覧。1ツール＝1ファイル（data/templates/<id>.mjs）に、ページの説明文を書く。
// 下書きの組み立ては site/assets/tpl/<id>.js。新しいファイルを置くだけで、ページ・業種の一覧・サイトマップに入る。
// sectors: そのツールを並べる業種（jido / shogai / kaigo）。先頭の業種がパンくずの親になる。
// order: 業種ページでの並び順（小さいほど上）。
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), 'templates');
const files = readdirSync(DIR).filter((f) => f.endsWith('.mjs')).sort();
const mods = await Promise.all(files.map((f) => import(pathToFileURL(join(DIR, f)).href)));

export const TEMPLATES = mods
  .map((m, i) => {
    const t = m.default;
    if (!t || !t.id || !t.path || !t.sectors) throw new Error(`data/templates/${files[i]}: id・path・sectors が必要です`);
    if (`${t.id}.mjs` !== files[i]) throw new Error(`data/templates/${files[i]}: ファイル名は ${t.id}.mjs にしてください`);
    return t;
  })
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || a.id.localeCompare(b.id));
