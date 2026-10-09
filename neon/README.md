# Neon backend

無料試算の匿名結果を保存するための Neon Function と Postgres スキーマです。ブラウザへ `DATABASE_URL` を渡さず、Sites のフロントエンドから HTTPS API のみを呼び出します。

## 初回セットアップ

1. Neon の SQL Editor で `schema.sql` を実行します。
2. このディレクトリで依存関係をインストールし、対象 Neon プロジェクトへリンクします。
3. `SITE_ORIGIN` を `https://hr-saas-flow-finder.x-anagrams-x.chatgpt.site` に設定します。
4. `npm run deploy` で Function をデプロイします。
5. 発行された公開 HTTPS URL を `dist/index.html` の `<html data-api-base="">` に設定して、Sites を再公開します。

`DATABASE_URL` は Neon Functions の実行環境から注入されます。接続文字列やパスワードをHTML、JavaScript、Gitへ保存しないでください。

## API

- `GET /health`: DB接続確認
- `GET /v1/catalog`: SaaS製品と標準業務プロセス
- `POST /v1/assessments`: 個人情報を含まない無料試算結果の保存

API URLが未設定または一時的に利用できない場合でも、無料試算とExcel/PDF出力はブラウザ内で完結します。
