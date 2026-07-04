---
name: proxy-manager
description: Use when managing proxy (HTTP/SOCKS5) and token (GitHub token) configurations. Only the proxy-manager skill covers proxy+token CRUD and safe display.
---

# 代理与 Token 管理 Skill

管理 CodeWhale 工具中的代理（HTTP/SOCKS5）和访问令牌（GitHub Token 等）配置。

## 概述

当用户需要管理代理服务器或访问令牌时，使用本技能。

- **代理管理**: HTTP / SOCKS5 代理配置，供 Skill 下载等场景使用
- **Token 管理**: GitHub Token 等访问令牌，供 GitHub API 认证使用
- **仅本地存储**: 代理和 Token 数据只存在 `data/store.json`，不与 CodeWhale `config.toml` 同步

## 数据模型

### Proxy（代理）

```javascript
{
  id: 'proxy:127.0.0.1:1080',  // 主键
  type: 'http' | 'socks5',       // 协议类型
  host: '127.0.0.1',             // 主机地址
  port: 1080,                     // 端口号
  label: '本地代理',              // 别名
  username: '',                   // 认证用户名（可选）
  password: ''                    // 认证密码（可选）
}
```

### Token（令牌）

```javascript
{
  id: 'token:github_pat',       // 主键
  name: 'GitHub Personal Token', // 显示名称
  token: 'ghp_xxxxxxxxxxxx',     // Token 值
  label: '个人令牌'              // 别名
}
```

## Core 层 API

### ProxyManager

```javascript
const proxyMgr = new ProxyManager(engine);

proxyMgr.list()     // → { success: true, data: Proxy[] }
proxyMgr.add({ type, host, port, label, username, password })  // → { success: true, message: '已添加' }
proxyMgr.update({ id, ... })  // → { success: true, message: '已更新' }
proxyMgr.remove(id)           // → { success: true, message: '已删除' }
proxyMgr.getById(id)          // → { success: true, data: Proxy }
```

### TokenManager

```javascript
const tokenMgr = new TokenManager(engine);

tokenMgr.list()     // → { success: true, data: Token[] }
tokenMgr.add({ name, token, label })  // → { success: true, message: '已添加' }
tokenMgr.update({ id, ... })          // → { success: true, message: '已更新' }
tokenMgr.remove(id)                   // → { success: true, message: '已删除' }
tokenMgr.getById(id)                  // → { success: true, data: Token }
```

## Server 层路由

### /api/proxy/*

```
GET    /api/proxy/list     → proxyMgr.list()
POST   /api/proxy/add      → proxyMgr.add(req.body)
PUT    /api/proxy/:id      → proxyMgr.update({ id, ...req.body })
DELETE /api/proxy/:id      → proxyMgr.remove(req.params.id)
```

**注意**: 代理不涉及 CodeWhale 同步，路由中不使用 `withSync`。

### /api/token/*

```
GET    /api/token/list     → tokenMgr.list()
POST   /api/token/add      → tokenMgr.add(req.body)
PUT    /api/token/:id      → tokenMgr.update({ id, ...req.body })
DELETE /api/token/:id      → tokenMgr.remove(req.params.id)
```

**注意**: Token 不涉及 CodeWhale 同步，路由中不使用 `withSync`。

### 路由模板

```javascript
import { Router } from 'express';
import { guard } from '../utils/guard.js';

export function createProxyRouter(proxyMgr) {
  const router = Router();

  router.get('/list', (_req, res) => {
    res.json(guard(() => proxyMgr.list()));
  });

  router.post('/add', (req, res) => {
    res.json(guard(() => proxyMgr.add(req.body)));
  });

  return router;
}
```

## Web 层

### API 请求层

- `packages/web/src/api/proxy.js`: `getProxyList()`, `addProxy()`, `editProxy()`, `deleteProxy()`
- `packages/web/src/api/token.js`: `getTokenList()`, `addToken()`, `editToken()`, `deleteToken()`

### 视图页面

- `packages/web/src/views/proxy/`: 代理列表页 + 新增/编辑弹窗
- `packages/web/src/views/token/`: Token 列表页 + 新增/编辑弹窗

### 安全显示

Token 值在列表中显示为掩码（如 `ghp_****abcd`），使用 `Masking.js` 工具：

```javascript
import { masking } from '@/utils/Masking'
// masking(text) → 'ghp_****abcd'
```

## 使用场景

### Skill 下载中使用代理和 Token

```javascript
// SSE 安装接口
GET /api/skill/install-github-stream
  ?repoUrl=https://github.com/owner/repo
  &proxyId=proxy:127.0.0.1:1080
  &tokenId=token:github_pat
```

### 通过 API 配置

```bash
# 添加 HTTP 代理
curl -X POST http://localhost:7000/api/proxy/add \
  -H 'Content-Type: application/json' \
  -d '{"type":"http","host":"127.0.0.1","port":7890,"label":"Clash"}'

# 添加 GitHub Token
curl -X POST http://localhost:7000/api/token/add \
  -H 'Content-Type: application/json' \
  -d '{"name":"GitHub Token","token":"ghp_xxxx","label":"个人"}'
```

---

**版本**: 1.0  
**最后更新**: 2026-06-28  
**基于项目**: codewhale-tool v0.3.0