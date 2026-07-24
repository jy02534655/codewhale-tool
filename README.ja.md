# codewhale-tool

CodeWhale 構成管理ツールキット — 多言語、ビジュアル、プロバイダーとモデルのリアルタイム同期。

[简体中文](./README.md) | [English](./README.en.md) | [Português (BR)](./README.pt-BR.md)

---

## このプロジェクトについて

このプロジェクトは、AI 支援開発の限界に挑戦しています。**作者はプログラマですが、プロジェクト全体を CodeWhale を通じて開発し、わずかな調整のみ加えました。モデルは主に DeepSeek と StepFun（阶跃星辰）を使用し、安い方を選んでいます。**

初期コンセプトからアーキテクチャ設計、コード作成から多言語翻訳、バグ修正からドキュメント作成まで — すべての作業が AI との対話で完了しています。

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
npm install

# ワンクリック開発起動（バックエンド :7000 + フロントエンド :7200）
npm run dev
```

`http://localhost:7200` で Web UI を開く。

---

## プロジェクト構造

```
codewhale-tool/
├── packages/
│   ├── core/          # @codewhale/core — ビジネスロジック、ストレージ、同期
│   ├── server/        # Express API 中継層
│   └── web/           # @codewhale/web — Vue 3 + Element Plus
├── skills/            # プロジェクトレベルの Skill（アーキテクチャ、プロキシ、UI パターン）
├── scripts/dev.mjs    # 統合開発起動スクリプト
├── store.json         # ローカル JSON ストレージ
├── DESIGN.md          # アーキテクチャ、データフロー、エッジケース、バージョン履歴
└── PROGRESS.md        # 開発進捗
```

> 完全なソースツリーとモジュールインデックスは [DESIGN.md](./DESIGN.md) → アーキテクチャ層 を参照。

---

## アーキテクチャ

三層構造、一方向の依存関係：

| 層 | パッケージ | 責務 | 禁止事項 |
|----|----------|------|---------|
| **core** | `@codewhale/core` | ビジネスロジック、ストレージ、同期 | HTTP 処理不可 |
| **server** | express アプリ | ルート登録、パラメータ抽出、guard ラップ | ビジネスロジック実装不可 |
| **web** | `@codewhale/web` | Vue 3 コンポーネント、API 呼出 | ストア直接操作不可 |

---

## Web UI ページ

| ページ | パス | 主要機能 |
|------|------|---------|
| プロバイダー管理 | `/views/provider/` | 公式 & サードパーティプロバイダー CRUD、モデル有効化切替 |
| プロキシ管理 | `/views/proxy/` | HTTP / SOCKS5 プロキシ追加、編集、デフォルト設定 |
| Skill 管理 | `/views/skill/` | インストール/検索/有効/無効、SSE 進捗、SKILL.md 編集 |
| Token 管理 | `/views/token/` | GitHub Token CRUD、安全なマスク表示 |

---

## 技術スタック

| 層 | 技術 |
|----|------|
| ストレージ | Node.js ネイティブ JSON（store.json）+ smol-toml |
| Web フロントエンド | Vue 3 + Element Plus + Vue I18n + Pinia |
| API サーバー | Express |
| ダウンロードエンジン | node-fetch + tar + adm-zip + git sparse-checkout |
| ビルド | Vite |
| パッケージ管理 | npm workspaces |

---

## 関連ドキュメント

| ドキュメント | 説明 |
|------------|------|
| [DESIGN.md](./DESIGN.md) | アーキテクチャ、ストレージ設計、同期戦略、エラー規範、エッジケース、バージョン履歴 |
| [PROGRESS.md](./PROGRESS.md) | 開発進捗：完了したモジュールと変更履歴 |
| [skills/architecture/SKILL.md](./skills/architecture/SKILL.md) | 三層アーキテクチャ開発ルール |
| [skills/proxy-manager/SKILL.md](./skills/proxy-manager/SKILL.md) | プロキシ & Token モジュールガイド |
| [skills/skill-manager/SKILL.md](./skills/skill-manager/SKILL.md) | Skill モジュールガイド |
| [skills/ui-patterns/SKILL.md](./skills/ui-patterns/SKILL.md) | UI パターン（ダイアログ、フォーム、テーブル、i18n） |
| [.codewhale/handoff.md](./.codewhale/handoff.md) | 最新セッションのハンドオフ（一時的） |

---

## 対応言語

| 言語 | コード | ドキュメント |
|------|--------|-------------|
| 简体中文 | `zh-Hans` | [README.md](./README.md) |
| English | `en` | [README.en.md](./README.en.md) |
| 日本語 | `ja` | このファイル |
| Português (BR) | `pt-BR` | [README.pt-BR.md](./README.pt-BR.md) |

Web UI 右上のセレクターで言語切替、設定は store.json に永続化されます。