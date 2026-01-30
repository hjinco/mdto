# mdto.page

[English](../README.md) | [中文](README.zh-CN.md)

라이브 데모: [mdto.page](https://mdto.page)

> 이 프로젝트는 제가 필요해서 만든 거라 요청이 없으면 굳이 기능을 추가할 계획은 없어요. **기능 아이디어가 있으시면 [기능 요청 이슈](https://github.com/hjinco/mdto/issues/new)를 편하게 올려 주세요**—검토해 볼게요.

마크다운 파일을 아름답게 렌더링된 웹 페이지로 즉시 변환하세요. Vite, React, Cloudflare Workers로 구축된 빠르고 서버리스한 Markdown-to-HTML 변환기입니다.

## 주요 기능

- **📝 마크다운 업로드**: `.md`, `.markdown`, `.txt` 파일을 드래그 앤 드롭하거나 탐색하여 업로드
- **🎨 다양한 테마**: 렌더링된 페이지를 위한 다양한 시각적 테마 선택
- **⏰ 만료 기한**: 자동 만료 설정 (1일, 7일, 14일, 30일)
- **👁️ 실시간 미리보기**: 게시하기 전에 마크다운이 어떻게 보일지 미리 확인
- **🔒 봇 방지**: 스팸 방지를 위한 Cloudflare Turnstile 통합
- **⚡ 빠르고 서버리스**: 글로벌 엣지 배포를 위해 Cloudflare Workers 기반으로 구축

## 기술 스택

### 프론트엔드
- **React 19** - UI 프레임워크
- **Vite** - 빌드 도구 및 개발 서버
- **TailwindCSS 4** - 스타일링
- **TypeScript** - 타입 안전성

### 백엔드
- **Cloudflare Workers** - 서버리스 런타임
- **Cloudflare R2** - HTML 컨텐츠용 객체 스토리지
- **Turnstile** - 봇 방지

### 마크다운 처리
- **unified** - 마크다운 처리 파이프라인
- **remark** - 마크다운 파서
- **rehype** - HTML 프로세서
- **highlight.js** - 코드 블록 구문 강조

## 프로젝트 구조

> **참고**: 이 프로젝트는 현재 활발히 개발 중이며, 인증 및 다양한 개선 사항이 추가되고 있습니다. 개발 진행에 따라 프로젝트 구조가 변경될 수 있습니다.

```
mdto/
├── client/              # React 프론트엔드 (TanStack Start)
│   ├── client.tsx      # 클라이언트 진입점
│   ├── router.tsx      # 라우터 설정
│   ├── routes/         # 라우트 컴포넌트
│   ├── components/     # 재사용 가능한 UI 컴포넌트
│   ├── hooks/          # 커스텀 React Hooks
│   ├── lib/            # 클라이언트 라이브러리 (인증 등)
│   └── utils/          # 클라이언트 유틸리티
├── server/             # Cloudflare Workers 백엔드
│   ├── index.ts        # Worker 진입점
│   ├── routes/         # API 라우트
│   ├── db/             # 데이터베이스 스키마 및 클라이언트
│   ├── lib/            # 서버 라이브러리 (인증 등)
│   └── utils/          # 서버 유틸리티
├── shared/             # 클라이언트/서버 공유 코드
│   ├── templates/      # HTML 템플릿 및 테마
│   └── utils/          # 공유 유틸리티 (markdown 처리)
├── public/             # 정적 자산 (빌드 결과물)
└── scripts/            # 빌드 및 배포 스크립트
```

## 시작하기

### 필수 조건

- **Node.js** 24+ 
- **pnpm** 10+ (패키지 매니저)
- **Cloudflare 계정** (배포용)

### 설치

1. 저장소 복제:
```bash
git clone https://github.com/hjinco/mdto.git
cd mdto
```

2. 의존성 설치:
```bash
pnpm install
```

3. 환경 변수 설정: .env.example

### 개발

개발 서버 시작 (클라이언트 및 Workers):

```bash
pnpm dev
```

이 명령은 다음을 실행합니다:
- 프론트엔드(client)용 Vite 개발 서버
- Cloudflare Worker(server)용 Wrangler 개발 서버

타입 에러가 발생하면 Cloudflare Worker 타입을 생성하세요:

```bash
pnpm cf-typegen
```

### 빌드

프로덕션 번들 빌드:

```bash
pnpm build
```

이 명령은 다음을 수행합니다:
1. 캐시 갱신을 위한 템플릿 해시 생성
2. 클라이언트 코드베이스 타입 체크
3. Vite(TanStack Start)로 클라이언트 빌드
4. 정적 HTML 파일 프리렌더링
5. 빌드 결과물을 `.output/` 디렉토리로 복사

빌드 프로세스는 SSR 및 정적 사이트 생성을 위해 TanStack Start를 사용하며, 배포 준비가 된 최적화된 프로덕션 번들을 출력합니다.

### 배포

Cloudflare Workers에 배포:

```bash
wrangler deploy
```

다음 사항을 확인하세요:
- `wrangler.jsonc`에 설정 구성
- `mdto`라는 이름의 R2 버킷 생성
- Cloudflare 대시보드에서 환경 변수 설정

### R2 수명 주기 정책

만료된 파일을 자동으로 삭제하려면 수명 주기 정책을 적용하세요:

```bash
pnpm run lifecycle:apply
```

이는 접두사(만료 시간을 인코딩함)를 기준으로 객체를 삭제하도록 R2를 구성합니다.

## 작동 방식

1. **업로드**: 사용자가 React 프론트엔드를 통해 마크다운 파일 업로드
2. **처리**: unified/remark/rehype를 사용하여 마크다운을 HTML로 변환
3. **저장**: 메타데이터(테마, 만료 기간)와 함께 HTML을 Cloudflare R2에 저장
4. **슬러그 생성**: 고유 슬러그 생성 (예: `1E/abc123`)
   - 접두사는 만료 기간을 나타냄 (`1` = 1일, `7` = 7일, `E`/14 = 14일, `1E`/30 = 30일)
5. **제공**: Cloudflare Worker가 `/{prefix}/{slug}`에서 렌더링된 HTML 제공
6. **만료**: R2 수명 주기 규칙이 만료된 콘텐츠를 자동으로 삭제

## 라이선스

이 프로젝트는 Apache License 2.0에 따라 라이선스가 부여됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 기여하기

기여는 언제나 환영합니다! 자유롭게 Pull Request를 제출해주세요.
