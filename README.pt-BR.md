# codewhale-tool

Kit de Configuração do CodeWhale — visual, multilíngue, sincronização em tempo real de providers e modelos.

[简体中文](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md)

---

## Sobre

Este projeto explora os limites do desenvolvimento assistido por IA. **O autor é programador, mas todas as linhas de código foram escritas através do CodeWhale, sem edições manuais.**

Do conceito inicial ao design de arquitetura, da codificação à tradução multilíngue, das correções de bugs à documentação — todo o trabalho foi feito por IA em conversação.

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
npm install

# Iniciar com um clique (backend :7000 + frontend :7200)
npm run dev
```

Abra `http://localhost:7200` para a Web UI.

---

## Estrutura do Projeto

```
codewhale-tool/
├── packages/
│   ├── core/          # @codewhale/core — lógica de negócio, armazenamento, sincronização
│   ├── server/        # Camada de passagem da API Express
│   └── web/           # @codewhale/web — Vue 3 + Element Plus
├── skills/            # Skills de nível de projeto (arquitetura, proxy, padrões UI)
├── scripts/dev.mjs    # Script de inicialização unificado
├── store.json         # Armazenamento JSON local
├── DESIGN.md          # Arquitetura, fluxo de dados, casos limite, histórico de versões
└── PROGRESS.md        # Progresso de desenvolvimento
```

> Árvore de código completa e índice de módulos em [DESIGN.md](./DESIGN.md) → Camadas de Arquitetura.

---

## Arquitetura

Três camadas, dependência unidirecional:

| Camada | Pacote | Função | Proibido |
|--------|--------|--------|----------|
| **core** | `@codewhale/core` | Lógica de negócio, armazenamento, sincronização | Sem HTTP |
| **server** | app express | Registro de rotas, extração de parâmetros, wrapper guard | Sem lógica de negócio |
| **web** | `@codewhale/web` | Componentes Vue 3, chamadas API | Sem acesso direto ao store |

---

## Páginas da Web UI

| Página | Caminho | Principais Funcionalidades |
|------|---------|--------------------------|
| Gerenciador de Providers | `/views/provider/` | CRUD de providers oficiais e terceiros, ativação de modelos |
| Gerenciador de Proxy | `/views/proxy/` | Adicionar, editar, definir proxy HTTP / SOCKS5 padrão |
| Gerenciador de Skills | `/views/skill/` | Instalar/buscar/ativar/desativar, progresso SSE, editor SKILL.md |
| Gerenciador de Tokens | `/views/token/` | CRUD de tokens GitHub, exibição segura com máscara |

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Armazenamento | JSON nativo do Node.js (store.json) + smol-toml |
| Frontend Web | Vue 3 + Element Plus + Vue I18n + Pinia |
| Servidor API | Express |
| Motor de Download | node-fetch + tar + adm-zip + git sparse-checkout |
| Build | Vite |
| Gerenciador de Pacotes | npm workspaces |

---

## Documentos Relacionados

| Documento | Descrição |
|-----------|----------|
| [DESIGN.md](./DESIGN.md) | Arquitetura, design de armazenamento, estratégia de sincronização, normas de erro, casos limite, histórico de versões |
| [PROGRESS.md](./PROGRESS.md) | Progresso de desenvolvimento: módulos concluídos e changelog |
| [skills/architecture/SKILL.md](./skills/architecture/SKILL.md) | Regras de arquitetura de três camadas |
| [skills/proxy-manager/SKILL.md](./skills/proxy-manager/SKILL.md) | Guia do módulo Proxy & Token |
| [skills/skill-manager/SKILL.md](./skills/skill-manager/SKILL.md) | Guia do módulo Skill |
| [skills/ui-patterns/SKILL.md](./skills/ui-patterns/SKILL.md) | Padrões UI (diálogos, formulários, tabelas, i18n) |
| [.codewhale/handoff.md](./.codewhale/handoff.md) | Handoff da última sessão (transitório) |

---

## Idiomas

| Idioma | Código | Documento |
|--------|--------|-----------|
| 简体中文 | `zh-Hans` | [README.md](./README.md) |
| English | `en` | [README.en.md](./README.en.md) |
| 日本語 | `ja` | [README.ja.md](./README.ja.md) |
| Português (BR) | `pt-BR` | Este arquivo |

Alterne o idioma pelo seletor no canto superior direito da Web UI; a preferência persiste no store.json.