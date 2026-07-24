# codewhale-tool

CodeWhale Configuration Toolkit — visual, multi-language, real-time provider & model sync.

[简体中文](./README.md) | [日本語](./README.ja.md) | [Português (BR)](./README.pt-BR.md)

---

## About

This project explores the boundaries of AI-assisted development. **The author is a programmer, but the project was developed entirely through CodeWhale with only minor adjustments. Models are primarily from DeepSeek and StepFun, whichever is cheaper.**

From initial concept to architecture design, from code to multilingual translation, from bug fixes to documentation — all done by AI in conversation.

---

## Features

- **Official API Key Management**: Multiple DeepSeek API keys with aliases and one-click switching
- **Provider Management**: Third-party provider CRUD, primary key = provider type + api_key
- **Model Management**: Multiple models per provider, one-click activation
- **Proxy Management**: HTTP / SOCKS5 proxy config for Skill downloads
- **Token Management**: GitHub tokens and other access tokens
- **Skill Management**: Community Skill install/enable/disable/update, SSE streaming progress
- **Real-time Sync**: All changes auto-written to CodeWhale runtime config
- **General Settings**: Schema-driven general config read/write, manages CodeWhale config.toml
- **Multi-language**: 简体中文, English, 日本語, Português (BR)

---

## Quick Start

```bash
# Install dependencies
npm install

# One-click dev (backend :7000 + frontend :7200)
npm run dev
```

Open `http://localhost:7200` for Web UI.

---

## Project Structure

```
codewhale-tool/
├── packages/
│   ├── core/          # @codewhale/core — business logic, storage, sync
│   ├── server/        # Express API passthrough layer
│   └── web/           # @codewhale/web — Vue 3 + Element Plus
├── skills/            # Project-level Skills (architecture, proxy, UI patterns)
├── scripts/dev.mjs    # Unified dev startup script
├── store.json         # Local JSON storage
├── DESIGN.md          # Architecture, data flow, edge cases, version history
└── PROGRESS.md        # Development progress
```

> Full source tree and module index in [DESIGN.md](./DESIGN.md) → Architecture Layers.

---

## Architecture

Three layers, one-way dependency:

| Layer | Package | Role | Forbidden |
|-------|---------|------|-----------|
| **core** | `@codewhale/core` | Business logic, storage, sync | No HTTP |
| **server** | express app | Route registration, param extraction, guard wrapping | No business logic |
| **web** | `@codewhale/web` | Vue 3 components, API calls | No direct store access |

---

## Web UI Pages

| Page | Path | Key Features |
|------|------|-------------|
| Provider Manager | `/views/provider/` | Official & third-party provider CRUD, model activation |
| Proxy Manager | `/views/proxy/` | HTTP / SOCKS5 proxy add, edit, set default |
| Skill Manager | `/views/skill/` | Install/search/enable/disable, SSE progress, SKILL.md editor |
| Token Manager | `/views/token/` | GitHub token CRUD, safe masked display |
| Settings Manager | `/settings` | CodeWhale config.toml general config read/write, restore defaults |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Storage | Node.js native JSON (store.json) + smol-toml |
| Web Frontend | Vue 3 + Element Plus + Vue I18n + Pinia |
| API Server | Express |
| Download Engine | node-fetch + tar + adm-zip + git sparse-checkout |
| Build | Vite |
| Package Manager | npm workspaces |

---

## Related Docs

| Document | Description |
|----------|------------|
| [DESIGN.md](./DESIGN.md) | Architecture, storage design, sync strategy, error norms, edge cases, version history |
| [PROGRESS.md](./PROGRESS.md) | Development progress: completed modules and changelog |
| [skills/architecture/SKILL.md](./skills/architecture/SKILL.md) | Three-layer architecture rules |
| [skills/proxy-manager/SKILL.md](./skills/proxy-manager/SKILL.md) | Proxy & Token module guide |
| [skills/skill-manager/SKILL.md](./skills/skill-manager/SKILL.md) | Skill module guide |
| [skills/ui-patterns/SKILL.md](./skills/ui-patterns/SKILL.md) | UI patterns (dialogs, forms, tables, i18n) |
| [.codewhale/handoff.md](./.codewhale/handoff.md) | Latest session handoff (transient) |

---

## Languages

| Language | Code | Document |
|----------|------|----------|
| 简体中文 | `zh-Hans` | [README.md](./README.md) |
| English | `en` | This file |
| 日本語 | `ja` | [README.ja.md](./README.ja.md) |
| Português (BR) | `pt-BR` | [README.pt-BR.md](./README.pt-BR.md) |

Switch language via top-right selector in the Web UI; preference persists to store.json.