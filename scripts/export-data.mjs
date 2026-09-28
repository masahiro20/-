// 文例データを JSON に書き出す（Python の商品ビルドスクリプト用）。使い方: node scripts/export-data.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOMAINS, AGES, ISSUES } from '../data/issues.mjs';
import { CONFIG } from '../data/config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(ROOT, 'products', 'build', 'data.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ domains: DOMAINS, ages: AGES, issues: ISSUES, config: CONFIG }, null, 2));
console.log(`wrote ${out}`);
