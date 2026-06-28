# codewhale-tool

Kit de Configuração do CodeWhale — visual, multilíngue, sincronização em tempo real de providers e modelos.

[简体中文](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md)

---

## Funcionalidades

- **Gerenciamento de Chave API Oficial**: Múltiplas chaves DeepSeek com aliases e troca rápida
- **Gerenciamento de Providers**: CRUD de providers terceiros (chave primária = tipo + api_key)
- **Gerenciamento de Modelos**: Múltiplos modelos por provider, ativação com um clique
- **Gerenciamento de Proxy**: Configuração HTTP / SOCKS5 para downloads de Skills
- **Gerenciamento de Tokens**: Tokens GitHub e outros tokens de acesso
- **Gerenciamento de Skills**: Instalar/ativar/desativar/atualizar Skills da comunidade, progresso via SSE
- **Sincronização em Tempo Real**: Alterações salvas automaticamente na config do CodeWhale
- **Multilíngue**: 简体中文, English, 日本語, Português (BR)

---

## Início Rápido

```bash
# Instalar dependências
pnpm install

# Iniciar com um clique (backend :7000 + frontend :7200)
pnpm dev
```

Abra `http://localhost:7200` para a Web UI.

---

## Estrutura do Projeto

```
codewhale-tool/
├── packages/
│   ├── core/               # @codewhale/core — lógica central
│   │   └── src/
│   │       ├── utils/          # infraestrutura
│   │       │   ├── config.js   # ConfigEngine — armazenamento JSON
│   │       │   ├── i18n.js     # i18n (rótulos de providers + mensagens)
│   │       │   ├── logger.js   # logger unificado (arquivo + callbacks SSE)
│   │       │   └── result.js   # ok / okMsg / fail / failMsg
│   │       ├── provider.js     # ProviderManager + OfficialKeyManager
│   │       ├── proxy.js        # ProxyManager
│   │       ├── token.js        # TokenManager
│   │       ├── sync.js         # SyncManager — store.json ↔ config.toml
│   │       ├── download/       # motor de download de Skills do GitHub
│   │       ├── skill/          # SkillManager + ProjectSkillEngine
│   │       └── index.js        # exportações unificadas
│   │
│   ├── server/             # Express API — camada de passagem pura
│   │   ├── index.js            # entrada: inicializa motores, monta rotas, inicia
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
├── store.json              # armazenamento JSON local
├── DESIGN.md               # documento de design
└── README.pt-BR.md         # este arquivo
```

---

## Arquitetura

| Camada | Pacote | Função | Proibido |
|--------|--------|--------|----------|
| **core** | `@codewhale/core` | Lógica de negócio, armazenamento, sincronização | Sem HTTP |
| **server** | app express | Registro de rotas, extração de parâmetros, wrapper guard | Sem lógica de negócio |
| **web** | `@codewhale/web` | Componentes Vue 3, chamadas API | Sem acesso direto ao store |

---

## Idiomas

| Idioma | Código | Documento |
|--------|--------|-----------|
| 简体中文 | `zh-Hans` | [README.md](./README.md) |
| English | `en` | [README.en.md](./README.en.md) |
| 日本語 | `ja` | [README.ja.md](./README.ja.md) |
| Português (BR) | `pt-BR` | Este arquivo |

Alterne o idioma pelo seletor no canto superior direito da Web UI; a preferência persiste no store.json.