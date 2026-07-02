# Handoff — download 重构完成

> 最后更新: 2026-07-02
> 状态: **已完成**

## 已完成重构

### 新增文件
- `packages/core/src/download/shared.js` — 收口 writeSkillLog 等共享基础设施
- `packages/core/src/download/orchestrator.js` — 编排层：策略路由、Tar/API 回退、最终验证

### 修改文件
- `packages/core/src/download/index.js` — 292行→22行，纯 facade 重导出
- `packages/core/src/skill/index.js` — 下载完成后补 REGISTERING 进度（职责回归）

### 未修改文件
- `packages/core/src/download/utils.js` — 保持不变（已足够清晰）
- `packages/core/src/download/http.js` — 保持不变（Tar/API 策略层）
- `packages/core/src/download/git.js` — 保持不变
- `packages/core/src/download/zip.js` — 保持不变
- `packages/server/src/routes/skill.js` — 无需改动（SSE 桥接已统一）
- `packages/web/src/views/skill/edit/progress.vue` — 无需改动（STAGE_MAP 已覆盖）

### 外部接口面（完全不变）
```javascript
import { downloadSkillFromGitHub, downloadAndExtractZip, writeSkillLog /* 等 */ } from '../download/index.js';
// → 所有调用点无需修改
```

## 关键变更说明

| 变更 | 原因 |
|------|------|
| 巨石函数 → orchestrator + 4个小函数 | 消除两层回退重复代码，职责拆分 |
| 移除 index.js 中 REGISTERING 进度 | REGISTERING 是 skill 层职责（注册到 store），非 download 层职责 |
| 统一探测阶段用 emitProgress | 消除所有手写 speed:0/speedFormatted:'' 冗余 |
| writeSkillLog → shared.js | download + skill 层共用，消除两份维护 |
| _safeRm(dir) 封装 | 消除文件中 6 处 try-catch 重复 |