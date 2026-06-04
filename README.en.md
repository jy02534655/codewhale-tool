# codewhale-tool

CodeWhale Configuration Toolkit — a visual toolkit for managing AI model providers and skills.

## Features

- **Provider Management**: Three-tier configuration (provider → API key alias → models) with dynamic switching
- **Skill Management**: Visual install, enable/disable, remove, and community search
- **Multi-interface**: CLI, Vue 3 Web UI, and programmable API

## Quick Start

```bash
# Install dependencies
pnpm install

# CLI mode
node packages/cli/src/index.js provider list

# Web UI mode (terminal 1: API backend, terminal 2: frontend dev server)
node packages/web/server.js          # API backend → localhost:3456
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
│   ├── cli/           # @codewhale/cli — CLI tool
│   │   └── src/
│   │       └── index.js     # commander CLI entry
│   └── web/           # @codewhale/web — Web UI
│       ├── src/
│       │   ├── App.vue               # Root component
│       │   └── views/
│       │       ├── ProviderView.vue  # Provider management
│       │       └── SkillView.vue     # Skill management
│       └── server.js       # Express API backend
├── config.toml        # Example config file
├── PROGRESS.md         # Development progress log
└── README.md           # This file
```

## CLI Commands

```bash
# Provider
codewhale-tool provider list              # List all providers
codewhale-tool provider tree              # Show three-tier tree
codewhale-tool provider active            # Show current active config
codewhale-tool provider switch -k work    # Switch to a specific API key
codewhale-tool provider add deepseek -l DeepSeek    # Add a provider
codewhale-tool provider add-key deepseek personal sk-xxx  # Add an API key
codewhale-tool provider probe deepseek personal        # Test connectivity

# Skill
codewhale-tool skill list                 # List installed skills
codewhale-tool skill install pdf          # Install a skill
codewhale-tool skill show pdf             # Show skill details
codewhale-tool skill enable pdf           # Enable a skill
codewhale-tool skill disable pdf          # Disable a skill
codewhale-tool skill search               # Search community skills
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