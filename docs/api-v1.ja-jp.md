---
title: API v1 リファレンス
description: mdto.page API v1 のページ管理エンドポイントに関するリファレンスです。
---

# API v1 リファレンス

`API v1` を使うと、ダッシュボードで作成した API キーでアカウント所有ページを管理できます。

## Base URL

```text
https://mdto.page/api/v1/pages
```

## 認証

すべてのリクエストで `x-api-key` ヘッダーを送信してください。

```bash
curl https://mdto.page/api/v1/pages \
  -H "x-api-key: YOUR_API_KEY"
```

有効なキーがない場合は `401 Unauthorized` を返します。

## データモデル

### Page summary

```json
{
  "id": "5b5f2713-6631-4d76-b59d-e97fd8d48ca2",
  "slug": "intro",
  "path": "/demo/intro",
  "title": "Intro",
  "description": "Short summary",
  "theme": "default",
  "expiresAt": null,
  "createdAt": "2026-03-15T11:00:00.000Z",
  "updatedAt": "2026-03-15T11:00:00.000Z"
}
```

### テーマ

- `default`
- `resume`
- `matrix`

### スラッグ

- 作成時は任意です。
- 更新時は、`newSlug` でスラッグを変更したい場合のみ必要です。
- `^[a-zA-Z0-9_-]+$` に一致する必要があります。
- 最大長は `64` です。
- 同一ユーザー内で重複した場合は `409 Conflict` を返します。

### `expiresAtMs`

- 永続ページには `null` を使います。
- タイムスタンプは、現在時刻からおおよそ `1`、`7`、`14`、`30` 日後のいずれかである必要があります。
- 範囲外の値は `400 Bad Request` を返します。

## エンドポイント

## ページ一覧を取得

```http
GET /api/v1/pages
```

API キーの所有者が持つ有効なページ一覧を返します。

```bash
curl https://mdto.page/api/v1/pages \
  -H "x-api-key: YOUR_API_KEY"
```

Response:

```json
[
  {
    "id": "5b5f2713-6631-4d76-b59d-e97fd8d48ca2",
    "slug": "intro",
    "path": "/demo/intro",
    "title": "Intro",
    "description": "Short summary",
    "theme": "default",
    "expiresAt": null,
    "createdAt": "2026-03-15T11:00:00.000Z",
    "updatedAt": "2026-03-15T11:00:00.000Z"
  }
]
```

## ページを作成

```http
POST /api/v1/pages
```

Request body:

```json
{
  "markdown": "# Hello\n\nCreated from the API.",
  "slug": "hello-api",
  "theme": "default",
  "expiresAtMs": null
}
```

メモ:

- `markdown` は必須で、空にできません。
- Markdown が `100KB` を超えると `413 Payload Too Large` を返します。
- `slug` を省略すると、サーバーが一意のスラッグを生成します。

```bash
curl https://mdto.page/api/v1/pages \
  -X POST \
  -H "content-type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "markdown": "# Hello\n\nCreated from the API.",
    "slug": "hello-api",
    "theme": "default",
    "expiresAtMs": null
  }'
```

Response `201 Created`:

```json
{
  "id": "5b5f2713-6631-4d76-b59d-e97fd8d48ca2",
  "slug": "hello-api",
  "path": "/demo/hello-api",
  "title": "Hello",
  "description": "",
  "theme": "default",
  "expiresAt": null,
  "createdAt": "2026-03-15T11:00:00.000Z",
  "updatedAt": "2026-03-15T11:00:00.000Z"
}
```

## ページを更新

```http
PUT /api/v1/pages/:id
```

Request body:

```json
{
  "markdown": "# Hello again\n\nUpdated content.",
  "newSlug": "hello-api-v2",
  "theme": "resume",
  "expiresAtMs": 1770000000000
}
```

メモ:

- 更新時も `markdown` は毎回必須です。
- `newSlug`、`theme`、`expiresAtMs` は任意です。
- `expiresAtMs: null` は有効期限を解除します。

```bash
curl https://mdto.page/api/v1/pages/PAGE_ID \
  -X PUT \
  -H "content-type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "markdown": "# Hello again\n\nUpdated content.",
    "newSlug": "hello-api-v2",
    "theme": "resume",
    "expiresAtMs": 1770000000000
  }'
```

Response `200 OK`:

```json
{
  "id": "5b5f2713-6631-4d76-b59d-e97fd8d48ca2",
  "slug": "hello-api-v2",
  "path": "/demo/hello-api-v2",
  "title": "Hello again",
  "description": "",
  "theme": "resume",
  "expiresAt": "2026-02-01T00:00:00.000Z",
  "createdAt": "2026-03-15T11:00:00.000Z",
  "updatedAt": "2026-03-15T11:05:00.000Z"
}
```

## ページを削除

```http
DELETE /api/v1/pages/:id
```

API キー所有者のページをソフトデリートします。

```bash
curl https://mdto.page/api/v1/pages/PAGE_ID \
  -X DELETE \
  -H "x-api-key: YOUR_API_KEY"
```

Response `200 OK`:

```json
{
  "ok": true,
  "slug": "hello-api-v2"
}
```

## エラー

エラー応答は次の JSON 形式です:

```json
{
  "message": "Human readable error"
}
```

### ステータスコード

- `400 Bad Request`: JSON body が不正、markdown が空、slug が不正、`expiresAtMs` が不正
- `401 Unauthorized`: API キーがない、または無効
- `403 Forbidden`: ページが API キー所有者のものではない
- `404 Not Found`: ページが存在しない
- `409 Conflict`: 指定した slug がすでに存在する
- `413 Payload Too Large`: markdown が `100KB` を超えている
- `429 Too Many Requests`: アカウントの有効ページ数上限に達している
- `500 Internal Server Error`: 予期しないサーバーエラー

## 運用メモ

- 一覧取得エンドポイントは有効なページのみを返します。
- 作成できる有効ページ数はアカウントごとに最大 `10` 件です。
- タイトルと説明は Markdown メタデータ抽出パイプラインから生成されます。
