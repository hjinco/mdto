---
title: API v1 文档
description: mdto.page API v1 页面管理接口参考文档。
---

# API v1 文档

使用 `API v1` 可以通过在仪表盘中创建的 API key 管理账号下的页面。

## Base URL

```text
https://mdto.page/api/v1/pages
```

## 认证

每个请求都需要携带 `x-api-key` 请求头。

```bash
curl https://mdto.page/api/v1/pages \
  -H "x-api-key: YOUR_API_KEY"
```

没有有效 key 时会返回 `401 Unauthorized`。

## 数据模型

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

### 主题

- `default`
- `resume`
- `matrix`

### slug

- 创建时可选。
- 更新时仅在需要修改 slug 时传 `newSlug`。
- 必须满足 `^[a-zA-Z0-9_-]+$`。
- 最大长度为 `64`。
- 同一用户下 slug 冲突会返回 `409 Conflict`。

### `expiresAtMs`

- 永久页面传 `null`。
- 时间戳必须大致落在当前时间之后 `1`、`7`、`14`、`30` 天之一。
- 不满足该规则时返回 `400 Bad Request`。

## 接口

## 获取页面列表

```http
GET /api/v1/pages
```

返回当前 API key 用户拥有的有效页面。

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

## 创建页面

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

说明：

- `markdown` 必填，且不能为空。
- Markdown 超过 `100KB` 时返回 `413 Payload Too Large`。
- 省略 `slug` 时，服务器会自动生成唯一 slug。

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

## 更新页面

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

说明：

- 每次更新都必须传 `markdown`。
- `newSlug`、`theme`、`expiresAtMs` 都是可选字段。
- `expiresAtMs: null` 会移除过期时间。

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

## 删除页面

```http
DELETE /api/v1/pages/:id
```

软删除当前 API key 用户拥有的页面。

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

## 错误

错误响应的 JSON 结构如下：

```json
{
  "message": "Human readable error"
}
```

### 状态码

- `400 Bad Request`: JSON body 非法、markdown 为空、slug 非法、`expiresAtMs` 非法
- `401 Unauthorized`: API key 缺失或无效
- `403 Forbidden`: 页面不属于当前 API key 用户
- `404 Not Found`: 页面不存在
- `409 Conflict`: 请求的 slug 已存在
- `413 Payload Too Large`: markdown 超过 `100KB`
- `429 Too Many Requests`: 账号已达到有效页面数量上限
- `500 Internal Server Error`: 未预期的服务端错误

## 运行说明

- 列表接口只返回有效页面。
- 每个账号最多可拥有 `10` 个有效页面。
- 标题和描述由 Markdown 元数据提取流程生成。
