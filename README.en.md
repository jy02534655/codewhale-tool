# codewhale-tool

CodeWhale Configuration Toolkit — a visual toolkit for managing AI model providers and skills.

## Features

- **Provider Management**: Three-tier configuration (provider → API key alias → models) with dynamic switching
- **Skill Management**: Visual install, enable/disable, remove, and community search
- **Vue 3 Web UI and programmable API**

## Quick Start

```bash
# Install dependencies
pnpm install



# Web UI mode (terminal 1: API backend, terminal 2: frontend dev server)
node packages/server/server.js          # API backend → localhost:3456
pnpm --filter @codewhale/web dev      # Vite frontend → localhost:5173
```

## Project Structure

```
codewhale-tool/
├── packages/
│   ├── core/          # @codewhale/core — Core logic library
│   │   └── src/
│   │       ├── config.js    # ConfigEngine — Safe TOML read/write
│   │       ├── provider.js  # ProviderManager — Three-tier config management
│   │       ├── skill.js     # SkillManager — Skill lifecycle
│   │       ├── probe.js     # API connectivity probe
│   │       └── index.js     # Unified exports

│   ├── server/       # @codewhale/server — Express API service
│   │   └── server.js         # REST API routes
│   └── web/           # @codewhale/web — Web UI
│       └── src/
│           ├── App.vue               # Root component
│           └── views/
│               ├── ProviderView.vue  # Provider management
│               └── SkillView.vue     # Skill management
├── config.toml        # Example config file
├── PROGRESS.md         # Development progress log
└── README.md           # This file
```

## Configuration Format

Example `config.toml`:

```toml
[model]
active_provider = "deepseek"
active_api_key = "personal"
active_model = "deepseek-ai/DeepSeek-V4-Pro"

[providers.deepseek]
label = "DeepSeek"

[providers.deepseek.api_keys.personal]
key = "sk-xxxxxxxxxxxxxxxx"
label = "Personal"
models = ["deepseek-ai/DeepSeek-V4-Pro", "deepseek-ai/DeepSeek-V4-Flash"]
default_model = "deepseek-ai/DeepSeek-V4-Pro"

[skills]
enabled = true
installed = [
  { id = "pdf", path = "~/.codewhale/skills/pdf", enabled = true, source = "community" },
]
```

## Languages

| Language | Document |
|----------|----------|
| English | This file |
| 日本語 | [README.ja.md](./README.ja.md) |
| 简体中文 | [README.md](./README.md) |
| Português (BR) | [README.pt-BR.md](./README.pt-BR.md) |