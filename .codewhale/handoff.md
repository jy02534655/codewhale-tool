# Handoff — 统一 core 层通用 Store 成功消息，避免接口返回 message 为空

> 最后更新: 2026-07-10
> 状态: **待校验**

## 目标
修复 `packages/core/src/utils/store.js` 抽取通用方法后，部分方法执行成功但接口返回 `message` 为空的问题。
同时按用户最新决策收敛文案方案：**统一返回“已添加 / 已更新 / 已删除 / 已设为默认”**，不搞大量差异化成功消息，减少维护成本。

## 已落地的方案
### Core 层
- `Store` 基类 `add/update/remove/setDefault` 增加可选 `messageKey` 参数，并设置默认值：
  - `add(..., messageKey = 'added')`
  - `update(..., messageKey = 'updated')`
  - `remove(..., messageKey = 'deleted')`
  - `setDefault(..., messageKey = 'defaultSet')`
- 成功后统一通过 `okMsg(messageKey, data)` 返回带 message 的结果，保留返回数据。
- 子类无需再传 `messageKey`，也无需再用 `okMsg` 包装一层：
  - `packages/core/src/project.js`
  - `packages/core/src/proxy.js`
  - `packages/core/src/token.js`
- `list()` 仍用 `ok(items)` 返回纯数据，不带多余 message。
- 不再重复写 `getServerMessage(...)` 相关代码，直接复用 `result.js` 现成的 `okMsg`。

### 多语言位置
- 成功消息统一由 `packages/core/src/utils/i18n.js` 管理，前端无需额外配置。
- 前端语言包不动。

### 服务端路由
- `project/proxy/token` 路由统一使用 `guard()` 包裹，保持异常返回格式一致。

## 待验证
- `npm run lint` 通过
- 接口成功响应均包含 `message`
- 前端成功提示正常显示
- provider/officialKey 相关消息链路无同类空消息回归

## 备注
- 手动安装 skill 的 `local-*` 删除逻辑已完成，与本任务独立。
- skill 禁用功能已移除，与本任务独立。
- 若再次修改 provider 相关代码，注意保留 `activateProvider/deactivateThirdParty/batchSetActive/replaceAll`，避免破坏 `sync.js` 调用链。
