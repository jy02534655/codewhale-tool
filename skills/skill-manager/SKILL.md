---
name: skill-manager
description: Use when installing, enabling, disabling, updating, or discovering codewhale skills. Covers two-level (global/project) skill management and SSE streaming install.
---

# Skill 管理 Skill

管理 CodeWhale 的 Skill（技能）安装、启用、发现和更新。

## 概述

当用户需要安装、管理、配置 Skill 时使用本技能。

- **双层管理**: 全局（`~/.codewhale/skills/`）+ 项目（`.codewhale/skills/`）
- **多种来源**: community、github、zip、local directory
- **SSE 流式安装**: GitHub 安装实时推送进度 + 诊断日志
- **在线编辑**: SKILL.md 的查看/编辑

## Skill 数据模型

```javascript
{
  id: 'pdf',                    // Skill 唯一标识
  name: 'PDF Skill',            // 显示名称
  description: '...',           // 描述
  source: 'community' | 'github' | 'zip' | 'local',
  path: '/path/to/skill',       // 磁盘路径
  enabled: true,                // 是否启用
  level: 'global' | 'project',  // 层级
  alias: '',                    // 用户别名（可选）
  remark: '',                   // 用户备注（可选）
  tags: [],                     // 用户标签（可选）
  repo_url: '...',              // GitHub 仓库 URL（github 来源）
  updated_at: 1234567890        // 时间戳
}
```

## Core 层 API

### 查询方法

```javascript
// 不需要 message，用 ok(data)
skillMgr.listAll()           // → ok([{...}, {...}])
skillMgr.listGlobal()        // → ok([...])
skillMgr.listProject()       // → ok([...])
skillMgr.show('pdf')         // → ok({ entry, readme, level })
skillMgr.getReadme('pdf')    // → ok('content')
skillMgr.searchCommunity(force, q)  // → ok([...])   // q 为可选过滤字符串
skillMgr.getInstallLog()     // → ok('tail 200 lines')
skillMgr.getCurrentProject() // → ok(process.cwd())
```

### 编辑方法

```javascript
// 操作类用 okMsg('key')
skillMgr.updateRemark('pdf', '处理 PDF 文件')  // → okMsg('updated')
skillMgr.updateTags('pdf', ['pdf', 'document'])  // → okMsg('updated')
skillMgr.updateAlias('pdf', 'PDF编辑器')          // → okMsg('updated')
skillMgr.updateMeta('pdf', { alias, remark, tags }, level)  // → okMsg('updated')
skillMgr.saveReadme('pdf', 'new content')        // → okMsg('updated')
```

### 操作方法

```javascript
skillMgr.discover('global')           // 自动发现已安装的 skill
skillMgr.install('pdf', 'global')    // 从社区仓库安装
skillMgr.enable('pdf')               // okMsg('updated')
skillMgr.disable('pdf')              // okMsg('updated')
skillMgr.enableAll('global')         // okMsg('updated')
skillMgr.disableAll('global')        // okMsg('updated')
skillMgr.remove('pdf')               // okMsg('synced')
skillMgr.update('pdf')               // git pull 更新
skillMgr.clearInstallLog()           // okMsg('skillLogCleared')
```

### 流式安装（SSE）

```javascript
// skillMgr 内部调用 downloadSkillFromGitHub
// 返回 Promise<{success, data, message}>
// onProgress: (stage, percent, message) → SSE progress 事件
// onLog: ({level, message}) → SSE log 事件
await skillMgr.installFromGitHub({
  repoUrl,      // GitHub 仓库 URL
  skillPath,    // 可选，指定 skill 子路径
  level,        // 'global' | 'project'
  proxyId,      // 可选，代理 ID
  tokenId,      // 可选，Token ID
  proxyConfig,  // 可选，结构化的代理配置（_parseProxyUrl 解析）
  projectPath,  // 可选，项目路径
}, onProgress, onLog);
```

## Server 层路由

所有路由是纯中转：`从 req 取参数 → 调 SkillManager → guard 包装 → res.json`。

```javascript
import { guard, guardAsync } from '../utils/guard.js';

// 查询
router.get('/list', (_req, res) => {
  res.json(guard(() => skillMgr.listAll()));
});

// 异步（community search）
router.get('/search', async (req, res) => {
  res.json(await guardAsync(async () => {
    const force = req.query.force === '1' || req.query.force === 'true';
    return await skillMgr.searchCommunity(force, req.query.q);
  }));
});

// 日志管理（已下沉到 SkillManager）
router.get('/install-log', (_req, res) => {
  res.json(guard(() => skillMgr.getInstallLog()));
});
router.delete('/install-log', (_req, res) => {
  res.json(guard(() => skillMgr.clearInstallLog()));
});
```

### SSE 安装路由

```javascript
router.get('/install-github-stream', async (req, res) => {
  // SSE 响应头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const { repoUrl, skillPath, level, proxyId, tokenId, proxyUrl, projectPath } = req.query;

  // proxyUrl → proxyConfig（在 core 层有 _parseProxyUrl 辅助函数）
  let proxyConfig;
  if (proxyUrl && !proxyId) {
    proxyConfig = _parseProxyUrlFromCore(proxyUrl);
  }

  const onProgress = (p) => sendSSE('progress', p);
  const onLog = (entry) => sendSSE('log', { level: entry.level, message: entry.message });

  try {
    const result = await skillMgr.installFromGitHub({
      repoUrl, skillPath, level, proxyId, tokenId, proxyConfig, projectPath,
    }, onProgress, onLog);

    if (result.success) sendSSE('complete', { success: true, data: result.data });
    else sendSSE('error', { success: false, message: result.message });
  } catch (err) {
    sendSSE('error', { success: false, message: err.message });
  } finally {
    res.end();
  }
});
```

**注意**:
- SSE 响应头设置（`writeHead`）和 `res.end()` 必须在 server 路由层——这是 HTTP 协议专属逻辑
- `onProgress`/`onLog` 只是将 core 层回调映射到 `sendSSE` 函数
- `proxyConfig` 解析在 core 层有 `_parseProxyUrl` 辅助函数

## Web 层

### 页面视图

| 页面 | 路径 | 功能 |
|------|------|------|
| Skill 列表 | `views/skill/index.vue` | 全局 + 项目 skill 列表，启用/禁用/删除 |
| 安装弹窗 | `views/skill/edit/install.vue` | GitHub URL 安装 + 进度跟踪 |
| 社区搜索 | `views/skill/edit/install.vue` | 搜索社区 skill 并安装 |
| 编辑弹窗 | `views/skill/edit/meta.vue` | 编辑别名/备注/标签 |

### SSE 进度处理

```javascript
const eventSource = new EventSource(url);
eventSource.addEventListener('progress', (e) => updateProgress(JSON.parse(e.data)));
eventSource.addEventListener('log', (e) => appendLog(JSON.parse(e.data)));
eventSource.addEventListener('complete', (e) => onComplete(JSON.parse(e.data)));
eventSource.addEventListener('error', (e) => onError(JSON.parse(e.data)));
```

## 内部机制

### 发现 (discover)

遍历 `~/.codewhale/skills/` 和 `.codewhale/skills/`（项目），检测每个子目录下的 `SKILL.md`：

```javascript
discover('global')  // 扫描 ~/.codewhale/skills/*/
discover('project') // 扫描 .codewhale/skills/*/
```

### 社区仓库结构

`deepseek-ai/codewhale-skills` 中每个 skill 是一个子目录：
```
skills/pdf/SKILL.md
skills/spreadsheets/SKILL.md
```

### 缓存策略

社区搜索结果缓存 24 小时（`CACHE_TTL = 24 * 60 * 60 * 1000`），`cached_at` 记录在 `store.json` → `skills.community_cache`。

---

**版本**: 1.0  
**最后更新**: 2026-06-28  
**基于项目**: codewhale-tool v0.3.0