# 5領域プランナー

放課後等デイサービス・児童発達支援の個別支援計画を、5領域に沿って作るための無料ツールと文例サイトです。

- `data/issues.mjs`：文例データ（5領域 × 課題）
- `data/config.mjs`：サイトの設定（ドメイン・販売ページのURLなど）
- `scripts/build.mjs`：`site/` に静的サイトを生成する
- `site/`：公開するファイル一式（`site/assets/app.js`、`style.css`、`checklist.js` は手で書いたファイル。それ以外は生成されたもの）
- `docs/`：戦略・業種選定の資料

## ビルド

```sh
node scripts/build.mjs
```

公開の手順は `docs/industry-selection.md` の「4. 公開までに必要なこと」を参照してください。
