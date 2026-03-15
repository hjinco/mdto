---
title: API v1 Reference
description: Reference for the mdto.page API v1 page management endpoints.
---

# API v1 Reference

`API v1` lets you manage account-owned pages with an API key created in the dashboard.

## Base URL

```text
https://mdto.page/api/v1/pages
```

## Authentication

Send your key in the `x-api-key` header on every request.

```bash
curl https://mdto.page/api/v1/pages \
  -H "x-api-key: YOUR_API_KEY"
```

Requests without a valid key return `401 Unauthorized`.

## Data Model

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

### Themes

- `default`
- `resume`
- `matrix`

### Slugs

- Optional on create.
- Required for updates only when you want to change the slug with `newSlug`.
- Must match `^[a-zA-Z0-9_-]+$`.
- Maximum length is `64`.
- A duplicate slug for the same user returns `409 Conflict`.

### `expiresAtMs`

- Use `null` for a permanent page.
- A timestamp must be approximately `1`, `7`, `14`, or `30` days from the current time.
- Requests outside that range return `400 Bad Request`.

## Endpoints

## List pages

```http
GET /api/v1/pages
```

Returns the active pages owned by the API key user.

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

## Create a page

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

Notes:

- `markdown` is required and must be non-empty.
- Markdown content larger than `100KB` returns `413 Payload Too Large`.
- If `slug` is omitted, the server generates a unique slug.

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

## Update a page

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

Notes:

- `markdown` is required on every update.
- `newSlug`, `theme`, and `expiresAtMs` are optional.
- `expiresAtMs: null` removes expiration.

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

## Delete a page

```http
DELETE /api/v1/pages/:id
```

Soft-deletes the page owned by the API key user.

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

## Errors

The API returns JSON errors in this shape:

```json
{
  "message": "Human readable error"
}
```

### Status codes

- `400 Bad Request`: invalid JSON body, empty markdown, invalid slug, or invalid `expiresAtMs`
- `401 Unauthorized`: missing or invalid API key
- `403 Forbidden`: the page does not belong to the API key user
- `404 Not Found`: the page does not exist
- `409 Conflict`: the requested slug already exists
- `413 Payload Too Large`: markdown exceeds `100KB`
- `429 Too Many Requests`: account has reached the active page limit
- `500 Internal Server Error`: unexpected server error

## Operational Notes

- The list endpoint only returns active pages.
- Create is limited to `10` active pages per account.
- Titles and descriptions are derived from the Markdown metadata extraction pipeline.
