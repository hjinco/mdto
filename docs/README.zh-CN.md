# mdto.page

在线演示: [mdto.page](https://mdto.page)

瞬间将您的 Markdown 文件转换为精美渲染的网页。这是一个基于 Vite、React 和 Cloudflare Workers 构建的快速、无服务器的 Markdown 到 HTML 转换器。

## 功能特性

- **📝 Markdown 上传**: 拖放或浏览 `.md`、`.markdown` 或 `.txt` 文件
- **🎨 多种主题**: 为您的渲染页面选择不同的视觉主题
- **⏰ 过期时间**: 设置自动过期（1、7、14 或 30 天）
- **👁️ 实时预览**: 在发布前查看 Markdown 的外观
- **🔒 机器人防护**: 集成 Cloudflare Turnstile 以防止垃圾信息
- **⚡ 快速 & 无服务器**: 基于 Cloudflare Workers 构建，实现全球边缘部署

## 技术栈

### 前端
- **React 19** - UI 框架
- **Vite** - 构建工具和开发服务器
- **TailwindCSS 4** - 样式
- **TypeScript** - 类型安全

### 后端
- **Cloudflare Workers** - 无服务器运行时
- **Cloudflare R2** - HTML 内容对象存储
- **Turnstile** - 机器人验证

### Markdown 处理
- **unified** - Markdown 处理流程
- **remark** - Markdown 解析器
- **rehype** - HTML 处理器
- **highlight.js** - 代码块语法高亮

## 项目结构

> **注意**: 本项目正在积极开发中，正在添加身份验证和各种增强功能。随着开发的进行，项目结构可能会发生变化。

```
mdto/
├── client/              # React 前端 (TanStack Start)
│   ├── client.tsx      # 客户端入口文件
│   ├── router.tsx      # 路由配置
│   ├── routes/         # 路由组件
│   ├── components/     # 可复用 UI 组件
│   ├── hooks/          # 自定义 React Hooks
│   ├── lib/            # 客户端库 (认证等)
│   └── utils/          # 客户端工具函数
├── server/             # Cloudflare Workers 后端
│   ├── index.ts        # Worker 入口文件
│   ├── routes/         # API 路由
│   ├── db/             # 数据库架构和客户端
│   ├── lib/            # 服务端库 (认证等)
│   └── utils/          # 服务端工具函数
├── shared/             # 客户端/服务端共享代码
│   ├── templates/      # HTML 模板和主题
│   └── utils/          # 共享工具函数 (markdown 处理)
├── public/             # 静态资源 (构建输出)
└── scripts/            # 构建和部署脚本
```

## 快速开始

### 前提条件

- **Node.js** 24+ 
- **pnpm** 10+ (包管理器)
- **Cloudflare 账号** (用于部署)

### 安装

1. 克隆仓库:
```bash
git clone https://github.com/hjinco/mdto.git
cd mdto
```

2. 安装依赖:
```bash
pnpm install
```

3. 设置环境变量: .env.example

### 开发

启动开发服务器 (包括客户端和 Workers):

```bash
pnpm dev
```

这将运行:
- 前端 (client) 的 Vite 开发服务器
- Cloudflare Worker (server) 的 Wrangler 开发服务器

如果遇到类型错误，请生成 Cloudflare Worker 类型:

```bash
pnpm cf-typegen
```

### 构建

构建生产包:

```bash
pnpm build
```

这将:
1. 生成用于缓存清除的模板哈希
2. 对客户端代码库进行类型检查
3. 使用 Vite (TanStack Start) 构建客户端
4. 预渲染静态 HTML 文件
5. 将构建输出复制到 `.output/` 目录

构建过程使用 TanStack Start 进行 SSR 和静态站点生成，输出准备好部署的优化生产包。

### 部署

部署到 Cloudflare Workers:

```bash
wrangler deploy
```

确保您已经:
- 配置了 `wrangler.jsonc`
- 创建了名为 `mdto` 的 R2 存储桶
- 在 Cloudflare 仪表板中设置了环境变量

### R2 生命周期策略

应用生命周期策略以自动删除过期文件:

```bash
pnpm run lifecycle:apply
```

这将配置 R2 根据前缀（编码了过期时间）删除对象。

## 工作原理

1. **上传**: 用户通过 React 前端上传 Markdown 文件
2. **处理**: 使用 unified/remark/rehype 将 Markdown 转换为 HTML
3. **存储**: 将 HTML 与元数据（主题、过期时间）一起存储在 Cloudflare R2 中
4. **Slug 生成**: 生成唯一的 slug（例如，`1E/abc123`）
   - 前缀表示过期时间（`1` = 1 天，`7` = 7 天，`E`/14 = 14 天，`1E`/30 = 30 天）
5. **服务**: Cloudflare Worker 在 `/{prefix}/{slug}` 处提供渲染后的 HTML
6. **过期**: R2 生命周期规则自动删除过期内容

## 许可证

本项目采用 Apache License 2.0 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

## 贡献

欢迎贡献！请随时提交 Pull Request。
