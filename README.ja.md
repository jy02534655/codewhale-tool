# codewhale-tool

CodeWhale 構成管理ツールキット — AI モデルプロバイダーとスキルを管理するビジュアルツールキット。

## 機能

- **プロバイダー管理**: プロバイダー → API キーエイリアス → モデルの3階層構成、動的切り替え
- **スキル管理**: インストール、有効/無効、削除、コミュニティ検索をビジュアル操作
- **マルチインターフェース**: CLI、Vue 3 Web UI、プログラム可能な API

## クイックスタート

```bash
# 依存関係のインストール
pnpm install

# CLI モード
node packages/cli/src/index.js provider list

# Web UI モード（ターミナル1：API バックエンド、ターミナル2：フロントエンド dev サーバー）
node packages/web/server.js          # API バックエンド → localhost:3456
pnpm --filter @codewhale/web dev      # Vite フロントエンド → localhost:5173
```

## プロジェクト構造

```
codewhale-tool/
├── packages/
│   ├── core/          # @codewhale/core — コアロジックライブラリ
│   │   └── src/
│   │       ├── config.js    # ConfigEngine — 安全な TOML 読み書き
│   │       ├── provider.js  # ProviderManager — 3階層構成管理
│   │       ├── skill.js     # SkillManager — スキルライフサイクル
│   │       ├── probe.js     # API 接続性チェック
│   │       └── index.js     # 統合エクスポート
│   ├── cli/           # @codewhale/cli — CLI ツール
│   │   └── src/
│   │       └── index.js     # commander CLI エントリ
│   └── web/           # @codewhale/web — Web UI
│       ├── src/
│       │   ├── App.vue               # ルートコンポーネント
│       │   └── views/
│       │       ├── ProviderView.vue  # プロバイダー管理
│       │       └── SkillView.vue     # スキル管理
│       └── server.js       # Express API バックエンド
├── config.toml        # 設定ファイル例
├── PROGRESS.md         # 開発進捗ログ
└── README.md           # このファイル
```

## CLI コマンド

```bash
# プロバイダー
codewhale-tool provider list              # 全プロバイダーを一覧表示
codewhale-tool provider tree              # 3階層ツリーを表示
codewhale-tool provider active            # 現在のアクティブ構成を表示
codewhale-tool provider switch -k work    # 特定の API キーに切り替え
codewhale-tool provider add deepseek -l DeepSeek    # プロバイダーを追加
codewhale-tool provider add-key deepseek personal sk-xxx  # API キーを追加
codewhale-tool provider probe deepseek personal        # 接続テスト

# スキル
codewhale-tool skill list                 # インストール済み一覧
codewhale-tool skill install pdf          # インストール
codewhale-tool skill show pdf             # 詳細を表示
codewhale-tool skill enable pdf           # 有効化
codewhale-tool skill disable pdf          # 無効化
codewhale-tool skill search               # コミュニティ検索
```

## 設定ファイル形式

`config.toml` の例：

```toml
[model]
active_provider = "deepseek"
active_api_key = "personal"
active_model = "deepseek-ai/DeepSeek-V4-Pro"

[providers.deepseek]
label = "DeepSeek"

[providers.deepseek.api_keys.personal]
key = "sk-xxxxxxxxxxxxxxxx"
label = "個人アカウント"
models = ["deepseek-ai/DeepSeek-V4-Pro", "deepseek-ai/DeepSeek-V4-Flash"]
default_model = "deepseek-ai/DeepSeek-V4-Pro"

[skills]
enabled = true
installed = [
  { id = "pdf", path = "~/.codewhale/skills/pdf", enabled = true, source = "community" },
]
```

## 対応言語

| 言語 | ドキュメント |
|------|-------------|
| English | [README.en.md](./README.en.md) |
| 日本語 | このファイル |
| 简体中文 | [README.md](./README.md) |
| Português (BR) | [README.pt-BR.md](./README.pt-BR.md) |