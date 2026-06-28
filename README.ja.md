# codewhale-tool

CodeWhale 構成管理ツールキット — 多言語、ビジュアル、プロバイダーとモデルのリアルタイム同期。

[简体中文](./README.md) | [English](./README.en.md) | [Português (BR)](./README.pt-BR.md)

---

## 機能

- **公式 API キー管理**: 複数の DeepSeek API キー、エイリアス、ワンクリック切替
- **プロバイダー管理**: サードパーティプロバイダーの CRUD（主キー = プロバイダータイプ + api_key）
- **モデル管理**: プロバイダーごとに複数モデル、ワンクリック有効化
- **プロキシ管理**: HTTP / SOCKS5 プロキシ設定（Skill ダウンロード用）
- **トークン管理**: GitHub トークン等のアクセストークン管理
- **Skill 管理**: コミュニティ Skill のインストール/有効/無効/更新、SSE ストリーミング進捗
- **リアルタイム同期**: すべての変更は自動的に CodeWhale ランタイム設定に反映
- **多言語**: 简体中文、English、日本語、Português (BR)

---

## クイックスタート

```bash
# 依存関係のインストール
pnpm install

# ワンクリック開発起動（バックエンド :7000 + フロントエンド :7200）
pnpm dev
```

`http://localhost:7200` で Web UI を開く。

---

## プロジェクト構造

```
codewhale-tool/
├── packages/
│   ├── core/               # @codewhale/core — コアロジック
│   │   └── src/
│   │       ├── utils/          # インフラ
│   │       │   ├── config.js   # ConfigEngine — JSON ストレージ
│   │       │   ├── i18n.js     # 多言語（プロバイダー名 + サーバーメッセージ）
│   │       │   ├── logger.js   # 統合ロガー（ファイル + SSE コールバック）
│   │       │   └── result.js   # ok / okMsg / fail / failMsg
│   │       ├── provider.js     # ProviderManager + OfficialKeyManager
│   │       ├── proxy.js        # ProxyManager
│   │       ├── token.js        # TokenManager
│   │       ├── sync.js         # SyncManager — store.json ↔ config.toml
│   │       ├── download/       # GitHub Skill ダウンロードエンジン
│   │       ├── skill/          # SkillManager + ProjectSkillEngine
│   │       └── index.js        # 統合エクスポート
│   │
│   ├── server/             # Express API — 純粋な中継層
│   │   ├── index.js            # 起動: エンジン初期化、ルート登録、起動
│   │   └── src/
│   │       ├── utils/guard.js  # guard / guardAsync / withSync / ok
│   │       └── routes/
│   │           ├── lang.js, officialKey.js, provider.js,
│   │           ├── proxy.js, token.js, skill.js, sync.js
│   │
│   └── web/                # @codewhale/web — Vue 3 + Element Plus
│       └── src/
│           ├── App.vue, main.js
│           ├── api/
│           ├── views/{provider,proxy,skill,token}/
│           ├── composition/dialog/
│           ├── stores/, locales/, utils/
├── store.json              # ローカル JSON ストレージ
├── DESIGN.md               # 設計ドキュメント
└── README.ja.md            # このファイル
```

---

## アーキテクチャ

| 層 | パッケージ | 責務 | 禁止事項 |
|----|----------|------|---------|
| **core** | `@codewhale/core` | ビジネスロジック、ストレージ、同期 | HTTP 処理不可 |
| **server** | express アプリ | ルート登録、パラメータ抽出、guard ラップ | ビジネスロジック実装不可 |
| **web** | `@codewhale/web` | Vue 3 コンポーネント、API 呼出 | ストア直接操作不可 |

---

## 対応言語

| 言語 | コード | ドキュメント |
|------|--------|-------------|
| 简体中文 | `zh-Hans` | [README.md](./README.md) |
| English | `en` | [README.en.md](./README.en.md) |
| 日本語 | `ja` | このファイル |
| Português (BR) | `pt-BR` | [README.pt-BR.md](./README.pt-BR.md) |

Web UI 右上のセレクターで言語切替、設定は store.json に永続化されます。