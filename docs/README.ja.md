# mdto.page

[English](../README.md) | [中文](README.zh-CN.md) | [한국어](README.ko.md)

ライブ: [mdto.page](https://mdto.page)

> このプロジェクトは自分の用途のために作ったものなので、要望がなければ積極的に機能を追加する予定はありません。アイデアがあれば、気軽に [feature request issue](https://github.com/hjinco/mdto/issues/new) を作成してください。検討します。

Markdown ファイルを、美しくレンダリングされた Web ページへすぐに変換できます。Vite、React、Cloudflare Workers で構築された高速なサーバーレス Markdown-to-HTML コンバーターです。

## 機能

- **📝 Markdown アップロード**: `.md`、`.markdown`、`.txt` ファイルをドラッグ&ドロップまたはファイル選択でアップロード
- **🎨 複数テーマ**: レンダリングされたページの表示テーマを選択
- **⏰ 有効期限**: 自動期限切れを設定 (1日、7日、14日、30日)
- **👁️ ライブプレビュー**: 公開前に Markdown の表示を確認
- **🔒 Bot 対策**: スパム防止のため Cloudflare Turnstile を統合
- **⚡ 高速 & サーバーレス**: グローバルなエッジ配信のため Cloudflare Workers 上に構築

## ロードマップ

- [x] **Public API**: アップロード、ページ管理、外部連携のための文書化されたプログラム用インターフェースを提供します。
- [x] **Markdown のローカル画像アップロード**: 公開時に Markdown で参照しているローカル画像を添付できるため、画像を別の場所でホストしておく必要がありません。

## 技術スタック

### フロントエンド
- **React 19** - UI フレームワーク
- **Vite** - ビルドツールと開発サーバー
- **TailwindCSS 4** - スタイリング
- **TypeScript** - 型安全性

### バックエンド
- **Cloudflare Workers** - サーバーレスランタイム
- **Cloudflare R2** - HTML コンテンツ用のオブジェクトストレージ
- **Turnstile** - Bot 対策

### Markdown 処理
- **unified** - Markdown 処理パイプライン
- **remark** - Markdown パーサー
- **rehype** - HTML プロセッサ
- **highlight.js** - コードブロックのシンタックスハイライト

## プロジェクト構成

> **Note**: このプロジェクトは現在も開発中で、認証や各種改善を追加しています。開発の進行によりプロジェクト構成が変わる可能性があります。

```
mdto/
├── client/              # React フロントエンド (TanStack Start)
│   ├── router.tsx      # ルーター設定
│   ├── routes/         # ルートコンポーネント
│   ├── components/     # 再利用可能な UI コンポーネント
│   ├── hooks/          # カスタム React Hooks
│   ├── lib/            # クライアント側ライブラリ (auth など)
│   └── utils/          # クライアントユーティリティ
├── server/             # Cloudflare Workers バックエンド
│   ├── index.ts        # Worker エントリーポイント
│   ├── routes/         # API ルート
│   ├── db/             # データベーススキーマとクライアント
│   ├── lib/            # サーバー側ライブラリ (auth など)
│   └── utils/          # サーバーユーティリティ
├── shared/             # クライアント/サーバー共有コード
│   ├── templates/      # HTML テンプレートとテーマ
│   └── utils/          # 共有ユーティリティ (markdown 処理)
├── public/             # 静的アセット (ビルド出力)
└── scripts/            # ビルド/デプロイ補助スクリプト
```

## はじめに

### 前提条件

- **Node.js** 24+
- **pnpm** 10+ (パッケージマネージャー)
- **Cloudflare アカウント** (デプロイ用)

### インストール

1. リポジトリをクローン:
```bash
git clone https://github.com/hjinco/mdto.git
cd mdto
```

2. 依存関係をインストール:
```bash
pnpm install
```

3. 環境変数を設定: .env.example

### 開発

開発サーバーを起動します (client と Workers):

```bash
pnpm dev
```

このコマンドは次を実行します:
- フロントエンド (client) 用の Vite 開発サーバー
- Cloudflare Worker (server) 用の Wrangler 開発サーバー

型エラーが発生した場合は、Cloudflare Worker の型を生成してください:

```bash
pnpm cf-typegen
```

### End-to-End テスト

Playwright が使用する Chromium ブラウザーをインストールします:

```bash
pnpm test:e2e:install
```

Playwright のスモークテストを実行します:

```bash
pnpm test:e2e
```

### ビルド

本番バンドルをビルドします:

```bash
pnpm build
```

この処理では次を行います:
1. キャッシュ更新用のテンプレートハッシュを生成
2. クライアントコードベースを型チェック
3. Vite (TanStack Start) でクライアントをビルド
4. 静的 HTML ファイルをプリレンダー
5. ビルド出力を `.output/` ディレクトリへコピー

ビルドプロセスは SSR と静的サイト生成のために TanStack Start を使用し、デプロイ可能な最適化済み本番バンドルを出力します。

### デプロイ

Cloudflare Workers へデプロイ:

```bash
wrangler deploy
```

次を確認してください:
- `wrangler.jsonc` が設定済みであること
- `mdto` という名前の R2 バケットを作成済みであること
- Cloudflare ダッシュボードで環境変数を設定済みであること

### R2 ライフサイクルポリシー

期限切れファイルを自動削除するため、ライフサイクルポリシーを適用します:

```bash
pnpm run lifecycle:apply
```

これは、有効期限をエンコードしたプレフィックスに基づいてオブジェクトを削除するよう R2 を設定します。

## 仕組み

1. **アップロード**: ユーザーが React フロントエンドから Markdown ファイルをアップロード
2. **処理**: unified/remark/rehype を使って Markdown を HTML に変換
3. **保存**: HTML をメタデータ (テーマ、有効期限) とともに Cloudflare R2 に保存
4. **Slug 生成**: 一意の slug を生成 (例: `1E/abc123`)
   - プレフィックスは有効期限を示します (`1` = 1日、`7` = 7日、`E`/14 = 14日、`1E`/30 = 30日)
5. **配信**: Cloudflare Worker が `/{prefix}/{slug}` でレンダリング済み HTML を配信
6. **期限切れ**: R2 ライフサイクルルールが期限切れコンテンツを自動削除

## ライセンス

このプロジェクトは Apache License 2.0 の下でライセンスされています。詳細は [LICENSE](../LICENSE) を参照してください。

## コントリビューション

コントリビューションを歓迎します。Pull Request を自由に送ってください。
