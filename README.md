# mdto.page

[中文](docs/README.zh-CN.md) | [한국어](docs/README.ko.md)

Live: [mdto.page](https://mdto.page)

> This project was built for my own needs, so I don’t plan to add features unless there’s a request. **Feel free to open a [feature request issue](https://github.com/hjinco/mdto/issues/new)** if you have ideas—I’m happy to consider them.

Transform your Markdown files into beautifully rendered web pages instantly. A fast, serverless Markdown-to-HTML converter built with Vite, React, and Cloudflare Workers.

## Features

- **📝 Markdown Upload**: Drag & drop or browse `.md`, `.markdown`, or `.txt` files
- **🎨 Multiple Themes**: Choose from different visual themes for your rendered pages
- **⏰ Expiration Dates**: Set automatic expiration (1, 7, 14, or 30 days)
- **👁️ Live Preview**: See how your markdown will look before publishing
- **🔒 Bot Protection**: Cloudflare Turnstile integration to prevent spam
- **⚡ Fast & Serverless**: Built on Cloudflare Workers for global edge deployment

## Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS 4** - Styling
- **TypeScript** - Type safety

### Backend
- **Cloudflare Workers** - Serverless runtime
- **Cloudflare R2** - Object storage for HTML content
- **Turnstile** - Bot protection

### Markdown Processing
- **unified** - Markdown processing pipeline
- **remark** - Markdown parser
- **rehype** - HTML processor
- **highlight.js** - Syntax highlighting for code blocks

## Project Structure

> **Note**: This project is actively under development with features like authentication and various enhancements being added. The project structure may change as development progresses.

```
mdto/
├── client/              # React frontend (TanStack Start)
│   ├── router.tsx      # Router configuration
│   ├── routes/         # Route components
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Client-side libraries (auth, etc.)
│   └── utils/          # Client utilities
├── server/             # Cloudflare Workers backend
│   ├── index.ts        # Worker entry point
│   ├── routes/         # API routes
│   ├── db/             # Database schema and client
│   ├── lib/            # Server libraries (auth, etc.)
│   └── utils/          # Server utilities
├── shared/             # Shared code between client/server
│   ├── templates/      # HTML templates and themes
│   └── utils/          # Shared utilities (markdown processing)
├── public/             # Static assets (build output)
└── scripts/            # Build and deployment scripts
```

## Getting Started

### Prerequisites

- **Node.js** 24+ 
- **pnpm** 10+ (package manager)
- **Cloudflare account** (for deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hjinco/mdto.git
cd mdto
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables: .env.example

### Development

Start the development servers (both client and Workers):

```bash
pnpm dev
```

This runs:
- Vite dev server for the frontend (client)
- Wrangler dev server for the Cloudflare Worker (server)

If you encounter type errors, generate Cloudflare Worker types:

```bash
pnpm cf-typegen
```

### Building

Build the production bundle:

```bash
pnpm build
```

This will:
1. Generate template hash for cache busting
2. Type-check the client codebase
3. Build the client with Vite (TanStack Start)
4. Prerender static HTML files
5. Copy build output to the `.output/` directory

The build process uses TanStack Start for SSR and static site generation, outputting optimized production bundles ready for deployment.

### Deployment

Deploy to Cloudflare Workers:

```bash
wrangler deploy
```

Make sure you have:
- Configured `wrangler.jsonc` with your settings
- Created an R2 bucket named `mdto`
- Set up environment variables in Cloudflare dashboard

### R2 Lifecycle Policy

Apply the lifecycle policy to automatically delete expired files:

```bash
pnpm run lifecycle:apply
```

This configures R2 to delete objects based on their prefix (which encodes the expiration time).

## How It Works

1. **Upload**: User uploads a Markdown file via the React frontend
2. **Processing**: Markdown is converted to HTML using unified/remark/rehype
3. **Storage**: HTML is stored in Cloudflare R2 with metadata (theme, expiration)
4. **Slug Generation**: A unique slug is generated (e.g., `1E/abc123`)
   - Prefix indicates expiration (`1` = 1 day, `7` = 7 days, `E`/14 = 14 days, `1E`/30 = 30 days)
5. **Serving**: Cloudflare Worker serves the rendered HTML at `/{prefix}/{slug}`
6. **Expiration**: R2 lifecycle rules automatically delete expired content

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.