# codewhale-tool

Kit de Configuração do CodeWhale — um toolkit visual para gerenciar provedores de modelos de IA e skills.

## Funcionalidades

- **Gerenciamento de Provedores**: Configuração em três níveis (provedor → alias da chave API → modelos) com troca dinâmica
- **Gerenciamento de Skills**: Instalação visual, ativar/desativar, remover e busca na comunidade
- **Web UI com Vue 3 e API programática**

## Início Rápido

```bash
# Instalar dependências
pnpm install

# Modo Web UI (terminal 1: backend API, terminal 2: servidor dev frontend)
node packages/server/server.js          # Backend API → localhost:3456
pnpm --filter @codewhale/web dev      # Frontend Vite → localhost:5163
```

## Estrutura do Projeto

```
codewhale-tool/
├── packages/
│   ├── core/          # @codewhale/core — Biblioteca de lógica central
│   │   └── src/
│   │       ├── config.js    # ConfigEngine — Leitura/escrita segura de TOML
│   │       ├── provider.js  # ProviderManager — Gerenciamento em três níveis
│   │       ├── skill.js     # SkillManager — Ciclo de vida das skills
│   │       ├── i18n.js       # Mapeamento i18n (rótulos providers + mensagens servidor)
│   │       ├── result.js     # guard/guardAsync wrapper de erro
│   ├── server/       # @codewhale/server — Serviço Express API
│   │   └── server.js         # Rotas REST API
│   └── web/           # @codewhale/web — Web UI
│       └── src/
│           ├── App.vue               # Componente raiz
│           └── views/
│               ├── ProviderView.vue  # Gerenciamento de provedores
│               └── SkillView.vue     # Gerenciamento de skills
├── config.toml        # Arquivo de configuração de exemplo
├── PROGRESS.md         # Registro de progresso do desenvolvimento
└── README.md           # Este arquivo
```

## Formato de Configuração

Exemplo de `config.toml`:

```toml
[model]
active_provider = "deepseek"
active_api_key = "personal"
active_model = "deepseek-ai/DeepSeek-V4-Pro"

[providers.deepseek]
label = "DeepSeek"

[providers.deepseek.api_keys.personal]
key = "sk-xxxxxxxxxxxxxxxx"
label = "Pessoal"
models = ["deepseek-ai/DeepSeek-V4-Pro", "deepseek-ai/DeepSeek-V4-Flash"]
default_model = "deepseek-ai/DeepSeek-V4-Pro"

[skills]
enabled = true
installed = [
  { id = "pdf", path = "~/.codewhale/skills/pdf", enabled = true, source = "community" },
]
```

## Idiomas

| Idioma | Documento |
|--------|-----------|
| English | [README.en.md](./README.en.md) |
| 日本語 | [README.ja.md](./README.ja.md) |
| 简体中文 | [README.md](./README.md) |
| Português (BR) | Este arquivo |