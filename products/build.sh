#!/usr/bin/env bash
# 販売用の商品一式と、サイトの無料様式を作り直す。
# 必要なもの: Node.js、Python3 + openpyxl、Playwright（Chromium）
set -euo pipefail
cd "$(dirname "$0")/.."
node scripts/export-data.mjs
python3 products/build_xlsx.py
node products/build_book.mjs
node products/render.cjs pdf products/build/book.html "products/dist/個別支援計画 文例全集.pdf"
python3 products/package.py
