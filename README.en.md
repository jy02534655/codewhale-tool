# codewhale-tool

CodeWhale Configuration Toolkit — visual, multi-language, real-time provider & model sync.

[简体中文](./README.md) | [日本語](./README.ja.md) | [Português (BR)](./README.pt-BR.md)

---

## Features

- **Official API Key Management**: Multiple DeepSeek API keys with aliases and one-click switching
- **Provider Management**: Third-party provider CRUD, primary key = provider type + api_key
- **Model Management**: Multiple models per provider, one-click activation
- **Proxy Management**: HTTP / SOCKS5 proxy config for Skill downloads
- **Token Management**: GitHub tokens and other access tokens
- **Skill Management**: Community Skill install/enable/disable/update, SSE streaming progress
- **Real-time Sync**: All changes auto-written to CodeWhale runtime config
- **Multi-language**: 简体中文, English, 日本語, Português (BR)

---

## Quick Start

```bash
# Install dependencies
pnpm install

# One-click dev (backend :7000 + frontend :7200)
pnpm dev
```

Open `http://localhost:7200` for Web UI.

---

## Project Structure

```
codewhale-tool/
├── packages/
│   ├── core/               # @codewhale/core — core logic
│   │   └── src/
│   │       ├── utils/          # infrastructure
│   │       │   ├── config.js   # ConfigEngine — JSON storage engine
│   │       │   ├── i18n.js     # i18n (provider labels + server messages)
│   │       │   ├── logger.js   # unified logger (file + SSE callbacks)
│   │       │   └── result.js   # ok / okMsg / fail / failMsg
│   │       ├── provider.js     # ProviderManager + OfficialKeyManager
│   │       ├── proxy.js        # ProxyManager
│   │       ├── token.js        # TokenManager
│   │       ├── sync.js         # SyncManager — store.json ↔ config.toml
│   │       ├── download/       # GitHub Skill download engine
│   │       ├── skill/          # SkillManager + ProjectSkillEngine
│   │       └── index.js        # unified exports
│   │
│   ├── server/             # Express API — pure passthrough layer
│   │   ├── index.js            # entry: init engines, mount routes, start
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
├── store.json              # local JSON storage
├── DESIGN.md               # design doc
└── README.en.md            # this file
```

---

## Architecture

| Layer | Package | Role | Forbidden |
|-------|---------|------|-----------|
| **core** | `@codewhale/core` | Business logic, storage, sync | No HTTP |
| **server** | express app | Route registration, param extraction, guard wrapping | No business logic |
| **web** | `@codewhale/web` | Vue 3 components, API calls | No direct store access |

---

## Languages

| Language | Code | Document |
|----------|------|----------|
| 简体中文 | `zh-Hans` | [README.md](./README.md) |
| English | `en` | This file |
| 日本語 | `ja` | [README.ja.md](./README.ja.md) |
| Português (BR) | `pt-BR` | [README.pt-BR.md](./README.pt-BR.md) |

Switch language via top-right selector in the Web UI; preference persists to store.json.