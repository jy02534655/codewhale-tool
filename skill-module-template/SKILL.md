# 模块开发规范与模板 Skill

为 `codewhale-tool` 项目提供模块开发编码规范、架构模板和最佳实践指南。

## 概述

本 skill 旨在帮助开发者遵循统一的编码规范和架构模式，快速、一致地为项目添加新功能模块。基于现有供应商管理、技能管理等核心模块的分析，提炼出一套可复用的开发模式。

**适用场景**：
- 新增一个独立的功能领域（如用户管理、计费模块、插件系统等）
- 扩展现有功能（如为供应商增加计费信息字段）
- 重构或优化现有模块结构

## 代码规范

### 1. 文件与目录结构

#### 目录布局
```
packages/
├── core/               # 核心逻辑（无 UI 依赖）
│   ├── src/
│   │   ├── config.js          # ConfigEngine（JSON 存储）– 已存在
│   │   ├── sync.js            # SyncManager（双向同步）– 已存在
│   │   ├── i18n.js            # 多语言映射 – 已存在
│   │   ├── types.js           # TypeScript 类型定义 – 已存在
│   │   ├── provider.js        # 示例：供应商管理模块
│   │   ├── skill.js           # 示例：技能管理模块
│   │   └── [new-module].js    # 你的新模块
│   └── package.json
├── cli/                # 命令行界面
│   └── src/index.js
└── web/                # Web UI（Vue 3 + Element Plus）
    ├── src/
    │   ├── api/[new-module].js   # 对应 API 接口层
    │   ├── views/[new-module]/   # 对应视图组件
    │   └── stores/[new-module].js # 对应状态管理（如需要）
    └── server.js
```

#### 文件命名
- **JavaScript 文件**：使用小写连字符（kebab-case）或直接描述性名称，如 `config.js`、`provider-manager.js`
- **Vue 组件**：大驼峰（PascalCase），如 `ProviderView.vue`
- **目录名**：单数名词，如 `provider`、`skill`

### 2. 代码注释规范

#### 文件头部注释
每个 `.js` 文件开头必须包含模块说明：

```javascript
/**
 * [模块名称] — [简短描述]
 *
 * [详细功能介绍，一行或多行]
 *
 * @module [模块标识]
 */
```

**示例**：
```javascript
/**
 * BillingManager — 计费与订阅管理
 *
 * 管理用户订阅状态、套餐升级、发票记录。
 * 与第三方支付服务（Stripe、支付宝）对接。
 *
 * @module billing
 */
```

#### 类注释
每个类必须包含描述、构造函数参数说明：

```javascript
/**
 * [类名] — [职责描述]
 *
 * [详细说明]
 *
 * @example
 * const mgr = new BillingManager(engine);
 */
export class BillingManager {
  /**
   * @param {import('./config.js').ConfigEngine} engine - 配置存储引擎
   * @param {object} [options] - 可选配置
   */
  constructor(engine, options) { ... }
}
```

#### 方法注释
公共方法必须包含 JSDoc：
- `@param` - 参数类型与说明
- `@returns` - 返回值类型与说明
- `@throws` - 可能抛出的异常
- `@example` - 使用示例（复杂方法）

**示例**：
```javascript
/**
 * 创建新订阅
 * @param {string} userId - 用户 ID
 * @param {string} planId - 套餐 ID
 * @param {object} [metadata] - 附加元数据
 * @returns {{success: boolean, subscriptionId?: string, message?: string}}
 * @throws {Error} 当支付服务不可用时抛出
 * @example
 * const result = billingMgr.createSubscription('user123', 'pro-monthly');
 * if (result.success) console.log(`订阅创建成功：${result.subscriptionId}`);
 */
createSubscription(userId, planId, metadata) { ... }
```

#### 行内注释
- 在复杂逻辑段落前用中文简短说明意图
- 避免在单行后加注释（除非特别关键）
- 使用 `//` 注释，而非 `/* */`

**良好示例**：
```javascript
// 合并两个配置列表，以本地数据为优先（保留用户自定义标签）
const merged = localItems.map(local => {
  const remote = remoteItems.find(r => r.id === local.id);
  return remote ? { ...remote, ...local } : local;
});
```

### 3. 命名约定

#### 变量与函数
- **camelCase**：`getActiveProvider`, `userSubscription`
- **布尔变量**：前缀 `is`/`has`/`can`，如 `isActive`, `hasPermission`
- **私有成员**：前缀 `_`，如 `_engine`, `_internalCache`
- **常量**：全大写 `SNAKE_CASE`，如 `DEFAULT_TIMEOUT`

#### 类与构造函数
- **PascalCase**：`ProviderManager`, `OfficialKeyManager`

#### 文件与模块
- **匹配功能**：`provider.js` 导出 `ProviderManager` 和 `OfficialKeyManager`

### 4. 错误处理模式

#### 统一返回格式
所有公共方法返回标准格式：

```javascript
{
  success: boolean,      // 操作是否成功
  message?: string,      // 成功或失败的描述信息
  data?: T,             // 成功时的附加数据
  errorCode?: string    // 错误代码（用于客户端处理）
}
```

**示例**：
```javascript
addItem(item) {
  try {
    // 业务逻辑
    return { success: true, data: newId };
  } catch (err) {
    return { 
      success: false, 
      message: `添加失败: ${err.message}`,
      errorCode: 'ITEM_ADD_FAILED'
    };
  }
}
```

#### 异常使用
- 仅在内部错误（如数据库连接失败）时抛出 `Error`
- 业务逻辑错误（如重复项）通过返回格式处理，不抛出

### 5. 类型定义

在 `packages/core/src/types.js` 中集中定义类型：

```javascript
/**
 * @typedef {object} BillingSubscription
 * @property {string} id
 * @property {string} userId
 * @property {string} planId
 * @property {Date} startDate
 * @property {Date} endDate
 * @property {'active'|'canceled'|'expired'} status
 */

/**
 * @typedef {object} StoreData
 * @property {OfficialKeyEntry[]} official_keys
 * @property {ProviderEntry[]} providers
 * @property {SkillsConfig} skills
 * @property {BillingSubscription[]} [billing_subscriptions] // ← 新增字段
 */
```

## 模块开发模板

### 1. 核心模块骨架

创建 `packages/core/src/[module-name].js`：

```javascript
/**
 * [ModuleName]Manager — [功能描述]
 *
 * [详细描述]
 *
 * @module [module-name]
 */

export class [ModuleName]Manager {
  /**
   * @param {import('./config.js').ConfigEngine} engine
   */
  constructor(engine) {
    this._engine = engine;
  }

  /**
   * 获取所有条目
   * @returns {import('./types.js').[ModuleName]Entry[]}
   */
  list() {
    // 从 engine 读取数据
    return this._engine.get[ModuleName]s();
  }

  /**
   * 添加条目
   * @param {object} opts
   * @returns {{success: boolean, id?: string, message?: string}}
   */
  add(opts) {
    // 参数验证
    if (!opts.requiredField) {
      return { success: false, message: '缺少必要字段' };
    }

    // 业务逻辑
    const items = this._engine.get[ModuleName]s();
    const id = generateId(opts);
    
    // 查重
    if (items.some(item => item.id === id)) {
      return { success: false, message: '条目已存在' };
    }

    // 保存
    items.push({ id, ...opts });
    this._engine.set[ModuleName]s(items);
    
    return { success: true, id };
  }

  // 更多方法：update, remove, getById, setActive 等
}
```

### 2. 配置引擎扩展

在 `ConfigEngine` 中添加对应方法：

```javascript
// 在 config.js 中添加
get[ModuleName]s() {
  return this.read().[module_name]s || [];
}

set[ModuleName]s(items) {
  this.update(data => {
    data.[module_name]s = items;
    return data;
  });
}
```

### 3. 类型定义扩展

在 `types.js` 中添加：

```javascript
/**
 * @typedef {object} [ModuleName]Entry
 * @property {string} id
 * @property {string} name
 * // ... 其他字段
 */

/**
 * @typedef {object} StoreData
 * @property {[ModuleName]Entry[]} [module_name]s
 */
```

### 4. 同步管理集成

如需与 CodeWhale config.toml 同步，在 `SyncManager` 中添加对应逻辑：

```javascript
// 在 sync.js 的 initSync 方法中添加同步逻辑
// 在 syncToCodeWhale 方法中添加写回逻辑
```

### 5. Web API 层

创建 `packages/web/src/api/[module-name].js`：

```javascript
import { [ModuleName]Manager } from '@codewhale/core';

/**
 * [ModuleName] API 路由
 * @param {Express} app
 * @param {import('@codewhale/core').ConfigEngine} engine
 */
export function setup[ModuleName]Routes(app, engine) {
  const mgr = new [ModuleName]Manager(engine);

  app.get('/api/[module-name]', (req, res) => {
    res.json({ success: true, data: mgr.list() });
  });

  app.post('/api/[module-name]', (req, res) => {
    const result = mgr.add(req.body);
    res.json(result);
  });

  // 更多路由...
}
```

### 6. Vue 视图层

创建 `packages/web/src/views/[module-name]/[ModuleName]View.vue`：

```vue
<template>
  <div class="[module-name]-view">
    <h2>{{ $t('[module-name].title') }}</h2>
    <!-- 组件内容 -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { list[ModuleName]s, add[ModuleName] } from '@/api/[module-name]';

const { t } = useI18n();
const items = ref([]);

onMounted(async () => {
  const res = await list[ModuleName]s();
  if (res.success) items.value = res.data;
});
</script>
```

### 7. 多语言支持

在 `packages/web/src/locales/` 各语言文件中添加：

```json
{
  "[module-name]": {
    "title": "模块名称",
    "add": "添加",
    "delete": "删除",
    "confirmDelete": "确认删除？"
  }
}
```

## 开发工作流

### 1. 规划阶段
1. 确定模块功能范围和数据结构
2. 更新 `types.js` 中的类型定义
3. 设计 API 接口（REST 端点）

### 2. 实现阶段
1. 创建核心 Manager 类（`packages/core/src/[module-name].js`）
2. 扩展 ConfigEngine 方法（`config.js`）
3. 实现 Web API 层（`packages/web/src/api/[module-name].js`）
4. 创建 Vue 视图组件（`packages/web/src/views/[module-name]/`）
5. 添加多语言文本

### 3. 集成阶段
1. 注册 Web API 路由（`server.js`）
2. 添加前端路由（`router/index.js`）
3. 更新导航菜单（如需要）

### 4. 测试阶段
1. 使用 `curl` 或 Postman 测试 API
2. 手动测试 Web UI 功能
3. 验证数据持久化（store.json）
4. 验证同步机制（如适用）

## 特定场景指南

### 场景 1：仅后端逻辑（无 UI）
- 只需实现核心 Manager 类
- 可选提供 CLI 命令（在 `packages/cli/src/index.js` 中添加）

### 场景 2：需要与 CodeWhale 配置同步
- 在 `SyncManager` 中实现 `initSync` 和 `syncToCodeWhale` 逻辑
- 确定同步策略：全量替换、按 ID 合并、仅激活项同步

### 场景 3：复杂表单处理
- 使用 `packages/web/src/composition/form/` 中的组合式函数
- 参考 ProviderView.vue 中的表单验证模式

### 场景 4：需要状态管理
- 创建 `packages/web/src/stores/[module-name].js`
- 使用 Pinia（如已集成）或 Vue reactive

## 质量要求

### 1. 代码审查清单
- [ ] 所有公共方法都有 JSDoc 注释
- [ ] 错误处理符合统一格式
- [ ] 多语言文本已添加
- [ ] 类型定义完整
- [ ] 无控制台日志残留（使用 debug 模块）

### 2. 性能考虑
- 大型列表使用分页或虚拟滚动
- 频繁操作的数据考虑内存缓存
- API 调用添加防抖/节流

### 3. 安全性
- 用户输入验证（服务端和客户端）
- API key 等敏感信息掩码显示
- 操作权限检查（如需要）

## 开发日志模板

为每个新模块创建开发日志文件 `docs/modules/[module-name]-log.md`：

````markdown
# [模块名称] 开发日志

## 2026-06-09 模块创建

### 目标
- [ ] 实现核心 Manager 类
- [ ] 添加 Web API 端点
- [ ] 创建基础 UI 界面

### 进展
1. 创建 `packages/core/src/[module-name].js` 骨架
2. 在 `types.js` 中添加类型定义
3. 实现 `add`、`list`、`remove` 方法

### 遇到的问题
- 问题1：描述
- 解决方案：说明

### 待办事项
- [ ] 添加表单验证
- [ ] 实现多语言支持
- [ ] 编写单元测试

## 2026-06-10 UI 实现
...
````

## 示例：计费模块

参考 `provider.js` 和 `skill.js` 的完整实现，创建：

1. `packages/core/src/billing.js` - BillingManager
2. `packages/web/src/api/billing.js` - API 路由
3. `packages/web/src/views/billing/` - 视图组件
4. 在 `store.json` 中添加 `billing_subscriptions` 字段

## 常见陷阱与解决方案

### 1. 数据不同步
- **现象**：store.json 修改后 config.toml 未更新
- **检查**：SyncManager 中是否添加了对应同步逻辑
- **解决**：确保在 Manager 方法中调用 `syncToCodeWhale()`

### 2. 类型错误
- **现象**：运行时类型不匹配
- **检查**：`types.js` 定义是否完整
- **解决**：使用 JSDoc 导入类型：`/** @type {import('./types.js').[TypeName]} */`

### 3. 多语言缺失
- **现象**：UI 显示键名而非翻译文本
- **检查**：语言文件中是否添加了对应键值
- **解决**：确保键名与 Vue 模板中的 `$t('module.key')` 一致

### 4. 样式冲突
- **现象**：组件样式影响全局
- **解决**：使用 CSS 作用域 `<style scoped>` 或 CSS Modules

---

## 版本历史

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-06-09 | 1.0 | 初始版本，基于 codewhale-tool 架构 |

## 贡献指南

发现模板不适用或有改进建议：
1. 在项目 issue 中提出
2. 直接修改本 skill 文件并提交 PR
3. 更新版本号和变更日志

---

**技能 ID**：module-template  
**适用版本**：codewhale-tool v1.0+  
**维护者**：项目核心团队