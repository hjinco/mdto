---
title: API v1 문서
description: mdto.page API v1 페이지 관리 엔드포인트 문서입니다.
---

# API v1 문서

`API v1`를 사용하면 대시보드에서 발급한 API 키로 계정 소유 페이지를 관리할 수 있습니다.

## Base URL

```text
https://mdto.page/api/v1/pages
```

## 인증

모든 요청에 `x-api-key` 헤더를 포함하세요.

```bash
curl https://mdto.page/api/v1/pages \
  -H "x-api-key: YOUR_API_KEY"
```

유효한 키가 없으면 `401 Unauthorized`를 반환합니다.

## 데이터 모델

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

### 테마

- `default`
- `resume`
- `matrix`

### 슬러그

- 생성 시 선택 사항입니다.
- 수정 시에는 `newSlug`로 슬러그를 바꿀 때만 필요합니다.
- `^[a-zA-Z0-9_-]+$` 패턴을 만족해야 합니다.
- 최대 길이는 `64`입니다.
- 같은 사용자 안에서 중복되면 `409 Conflict`를 반환합니다.

### `expiresAtMs`

- 영구 페이지는 `null`을 사용합니다.
- 타임스탬프는 현재 시각 기준으로 대략 `1`, `7`, `14`, `30`일 뒤여야 합니다.
- 범위를 벗어나면 `400 Bad Request`를 반환합니다.

## 엔드포인트

## 페이지 목록 조회

```http
GET /api/v1/pages
```

API 키 소유자의 활성 페이지 목록을 반환합니다.

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

## 페이지 생성

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

메모:

- `markdown`는 필수이며 비어 있으면 안 됩니다.
- Markdown 크기가 `100KB`를 넘으면 `413 Payload Too Large`를 반환합니다.
- `slug`를 생략하면 서버가 고유한 슬러그를 생성합니다.

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

## 페이지 수정

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

메모:

- 수정 시에도 `markdown`는 항상 필요합니다.
- `newSlug`, `theme`, `expiresAtMs`는 선택 사항입니다.
- `expiresAtMs: null`은 만료를 제거합니다.

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

## 페이지 삭제

```http
DELETE /api/v1/pages/:id
```

API 키 소유자의 페이지를 soft delete 합니다.

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

## 오류

오류 응답은 아래 JSON 형태를 사용합니다.

```json
{
  "message": "Human readable error"
}
```

### 상태 코드

- `400 Bad Request`: 잘못된 JSON body, 빈 markdown, 잘못된 slug, 잘못된 `expiresAtMs`
- `401 Unauthorized`: API 키가 없거나 유효하지 않음
- `403 Forbidden`: 페이지가 해당 API 키 사용자 소유가 아님
- `404 Not Found`: 페이지가 존재하지 않음
- `409 Conflict`: 요청한 slug가 이미 존재함
- `413 Payload Too Large`: markdown가 `100KB`를 초과함
- `429 Too Many Requests`: 계정의 활성 페이지 한도 초과
- `500 Internal Server Error`: 예상하지 못한 서버 오류

## 운영 참고사항

- 목록 조회는 활성 페이지만 반환합니다.
- 계정당 활성 페이지는 최대 `10`개까지 생성할 수 있습니다.
- 제목과 설명은 Markdown 메타데이터 추출 파이프라인에서 계산됩니다.
