# 模块开发规范与模板 Skill

为 `codewhale-tool` 项目提供模块开发编码规范、架构模板和最佳实践指南。

## 概述

本 skill 基于当前项目架构提炼出一套可复用的开发模式，帮助为新功能模块遵循统一的编码规范和架构模式。

**适用场景**：

- 新增一个独立的功能领域（如用户管理、计费模块、插件系统等）
- 为现有功能添加新的 CRUD 操作
- 扩展现有模块字段
- 重构或优化现有模块结构

## 项目架构总览

```
codewhale-tool/
├── packages/
│   ├── core/                           # @codewhale/core — 核心逻辑库（无 UI 依赖）
│   │   ├── package.json
│   │   └── src/
│   │       ├── config.js               # ConfigEngine — JSON 存储引擎
│   │       ├── provider.js             # ProviderManager + OfficialKeyManager
│   │       ├── skill.js                # SkillManager
│   │       ├── sync.js                 # SyncManager — 双向实时同步
│   │       ├── result.js               # guard / guardAsync 统一错误捕获
│   │       ├── i18n.js                 # 多语言映射（供应商名 + 服务器消息）
│   │       ├── types.js                # JSDoc 类型定义
│   │       └── index.js                # 统一导出入口
│   │
│   ├── server/                         # @codewhale/server — Express API 服务
│   │   ├── index.js                    # 入口：初始化引擎、组装路由、启动
│   │   ├── package.json
│   │   └── src/
│   │       ├── helpers.js              # ok() / fail() / langOf() 响应工具
│   │       ├── middleware.js            # noCache 全局缓存禁用中间件
│   │       └── routes/
│   │           ├── officialKey.js      # /api/official-key/* 路由
│   │           ├── provider.js         # /api/provider/* 路由
│   │           ├── skill.js            # /api/skill/* 路由
│   │           └── sync.js             # /api/sync /api/init-sync 路由
│   │
│   └── web/                            # @codewhale/web — Vue 3 + Element Plus
│       ├── package.json
│       └── src/
│           ├── main.js                 # Vue 应用入口（i18n 初始化）
│           ├── App.vue                 # 根组件
│           ├── router/index.js         # 前端路由
│           ├── api/                    # API 请求层
│           │   ├── officialKey.js
│           │   ├── provider.js
│           │   └── skill.js
│           ├── views/                  # 页面视图
│           │   └── provider/
│           │       ├── index.vue       # 页面主入口
│           │       └── edit/
│           │           ├── provider.vue  # 供应商新增/编辑弹窗
│           │           ├── model.vue     # 模型新增弹窗
│           │           └── officialKey.vue # 官方 key 新增/编辑弹窗
│           ├── composition/            # 组合函数（Composables）
│           │   ├── dialog/
│           │   │   ├── Base.js         # 弹窗显隐、数据初始化
│           │   │   ├── Form.js         # 弹窗表单（新增/编辑模式 + 提交逻辑）
│           │   │   └── Container.js    # 父组件弹窗 ref 管理
│           │   ├── view/
│           │   │   └── Form.js         # 纯表单逻辑（状态机 + 提交）
│           │   └── ...
│           ├── stores/                 # Pinia / reactive 状态
│           │   └── masking.js          # 全局加载状态
│           ├── locales/                # 多语言包
│           │   ├── zh-Hans.json
│           │   ├── en.json
│           │   ├── ja.json
│           │   └── pt-BR.json
│           └── utils/                  # 工具函数
│               ├── request.js          # ajaxBack / ajaxPostBack 等统一请求
│               ├── Masking.js          # API key 掩码
│               └── index.js
│
└── store.json                          # 本地 JSON 主存储（项目目录优先 → ~/.codewhale/）
```

## 第一部分：代码规范

### 1. 文件与目录命名

#### JavaScript 文件

- 小写驼峰（camelCase），直接描述模块名，如 `provider.js`、`sync.js`、`middleware.js`
- 路由文件在 `server/src/routes/` 下，文件名对应 API 前缀：`officialKey.js` → `/api/official-key/*`
- 核心模块在 `core/src/` 下，文件名直接匹配导出类名的主词：`provider.js` → `ProviderManager`

#### Vue 组件

- 驼峰命名（PascalCase 在 import 时，文件名为 camelCase）：`provider.vue`、`model.vue`、`officialKey.vue`
- 弹窗组件放在对应视图的 `edit/` 子目录下
- 页面入口放在视图根目录：`views/provider/index.vue`

#### 目录名

- 使用单数名词：`provider`、`skill`、`sync`

### 2. 文件头部注释

每个源文件必须以 JSDoc 块开头，格式：

```javascript
/**
 * @codewhale/<package> — 简短模块描述
 *
 * 详细功能介绍，一行或多行。
 */
```

**示例**（来自 `packages/core/src/provider.js`）：

```javascript
/**
 * @codewhale/core — 自定义供应商与 API Key 管理
 *
 * ProviderManager 管理 store.json 中的 providers 列表，
 * OfficialKeyManager 管理 official_keys 列表。
 * 主键规则：provider + api_key 组合唯一。
 */
```

**示例**（来自 `packages/server/src/routes/officialKey.js`）：

```javascript
/**
 * @codewhale/server — 官方 API Key 路由
 *
 * 挂载路径: /api/official-key
 * 管理 DeepSeek 官方 API key 的增删改查与激活切换。
 */
```

### 3. 类与函数注释

#### Manager 类

```javascript
/**
 * [ClassName] — 职能说明
 *
 * 详细描述其负责的业务逻辑和数据读写。
 *
 * @example
 * const mgr = new MyManager(engine);
 * mgr.add({ key: 'value' });
 */
export class MyManager {
  /**
   * @param {import('./config.js').ConfigEngine} engine - 配置存储引擎实例
   */
  constructor(engine) {
    this._engine = engine;
  }
}
```

#### 公共方法

```javascript
/**
 * 创建新条目
 *
 * @param {string} name - 条目名称
 * @param {object} [opts] - 可选参数
 * @param {string} [opts.desc] - 描述
 * @returns {{success: boolean, id?: string, message?: string}}
 *
 * @example
 * const r = mgr.add('my-item', { desc: '测试用' });
 * if (r.success) console.log('ID:', r.id);
 */
add(name, opts = {}) {
  // ...
}
```

#### 方法注释规范

- 所有公共方法必须有 JSDoc
- `@param` — 参数名 + 类型 + 说明
- `@returns` — 返回值类型 + 各字段含义
- 内部私有辅助方法可用行内注释
- 不在 return 语句后添加行尾注释

### 4. 行内注释

- 在复杂逻辑段落前用简短中文说明意图
- 用 `//` 注释，不用 `/* */`
- **规则**：注释写在代码行**上方**，不使用行尾注释

**正确**：

```javascript
// 合并两个列表，以本地数据为优先（保留用户自定义标签）
const merged = localItems.map(local => {
  const remote = remoteItems.find(r => r.id === local.id);
  return remote ? { ...remote, ...local } : local;
});
```

**错误**：

```javascript
const merged = localItems.map(local => { // ← 避免这种行尾注释
```

### 5. 变量与函数命名

| 类别 | 规范 | 示例 |
|---|---|---|
| 变量/函数 | camelCase | `getActiveProvider`, `providerId` |
| 布尔变量 | 前缀 is/has/can | `isActive`, `hasPermission`, `canEdit` |
| 私有成员 | 前缀 `_` | `this._engine`, `this._cache` |
| 常量 | 全大写 SNAKE_CASE | `DEFAULT_TIMEOUT`, `MAX_RETRIES` |
| 类/构造函数 | PascalCase | `ProviderManager`, `OfficialKeyManager` |
| 文件名 | camelCase (JS) / kebab-case (JSON locales) | `provider.js`, `zh-Hans.json` |

### 6. 错误处理模式

#### 统一返回格式

所有 Manager 的公共方法返回标准对象：

```javascript
{
  success: boolean,       // 操作是否成功
  data?: any,            // 成功时的附加数据
  message?: string,      // 成功或失败描述
}
```

**示例**：

```javascript
addItem(opts) {
  const items = this._engine.getMyItems();
  const id = someHash(opts);

  // 检查重复
  if (items.some(item => item.id === id)) {
    return { success: false, message: '条目已存在' };
  }

  items.push({ id, ...opts });
  this._engine.setMyItems(items);
  return { success: true, message: '添加成功' };
}
```

#### 服务端路由错误处理

在 server 路由中，所有 handler 包裹在 `@codewhale/core` 的 `guard()` 或 `guardAsync()` 中：

```javascript
router.post('/add', (req, res) => {
  const l = langOf(req);
  res.json(guard(() => {
    const r = myMgr.add(req.body);
    return r.success ? ok(null, getServerMessage(l, 'added')) : fail(r.message);
  }));
});
```

- `guard()` — 同步 handler 的错误捕获
- `guardAsync()` — 异步 handler 的错误捕获
- `ok(data, message)` — 构造成功响应
- `fail(message)` — 构造失败响应
- `langOf(req)` — 从 query/body 中提取语言代码
- `getServerMessage(locale, key)` — 按语言获取服务器提示消息

### 7. 类型定义

在 `packages/core/src/types.js` 中集中定义所有 JSDoc 类型：

```javascript
/**
 * @typedef {object} MyModuleEntry
 * @property {string} id           - 唯一标识
 * @property {string} name         - 显示名称
 * @property {string} [desc]       - 可选描述
 * @property {boolean} active      - 是否激活
 */

/**
 * @typedef {object} StoreData
 * // ... 已有的 official_keys, providers, skills 字段
 * @property {MyModuleEntry[]} my_module - 你的模块字段（新增）
 */
```

---

## 第二部分：分层开发模板

### 第 1 层：core — 核心 Manager 类

创建 `packages/core/src/<my-module>.js`：

```javascript
/**
 * @codewhale/core — <模块中文名>
 *
 * MyModuleManager 管理 store.json 中 my_module 列表的 CRUD 操作。
 * 主键规则：<id 生成规则说明>。
 */

/**
 * MyModuleManager — <模块>管理器
 *
 * @example
 * const mgr = new MyModuleManager(engine);
 * const items = mgr.list();
 */
export class MyModuleManager {
  /**
   * @param {import('./config.js').ConfigEngine} engine - 配置存储引擎
   */
  constructor(engine) {
    this._engine = engine;
  }

  /**
   * 获取所有条目
   * @returns {import('./types.js').MyModuleEntry[]}
   */
  list() {
    return this._engine.getMyModule() || [];
  }

  /**
   * 添加新条目
   *
   * @param {object} opts
   * @param {string} opts.name
   * @param {string} [opts.desc]
   * @returns {{success: boolean, id?: string, message?: string}}
   */
  add(opts) {
    const items = this.list();
    const id = opts.name;  // 或使用哈希/组合键

    if (items.find(item => item.id === id)) {
      return { success: false, message: '条目已存在' };
    }

    items.push({ id, active: false, ...opts });
    this._engine.setMyModule(items);
    return { success: true, id, message: '添加成功' };
  }

  /**
   * 删除指定条目
   *
   * @param {string} id
   * @returns {{success: boolean, message?: string}}
   */
  remove(id) {
    const items = this.list();
    const idx = items.findIndex(item => item.id === id);

    if (idx === -1) {
      return { success: false, message: '条目不存在' };
    }

    if (items.length <= 1) {
      return { success: false, message: '至少保留一个条目' };
    }

    items.splice(idx, 1);
    this._engine.setMyModule(items);
    return { success: true, message: '删除成功' };
  }
}
```

#### 在 ConfigEngine 中添加存取方法

编辑 `packages/core/src/config.js`，在 `ConfigEngine` 类中添加：

```javascript
/**
 * 获取 my_module 列表
 * @returns {import('./types.js').MyModuleEntry[]}
 */
getMyModule() {
  return this.read().my_module || [];
}

/**
 * 设置 my_module 列表
 * @param {import('./types.js').MyModuleEntry[]} items
 */
setMyModule(items) {
  this.update(data => {
    data.my_module = items;
    return data;
  });
}
```

#### 注册导出

编辑 `packages/core/src/index.js`，新增导出：

```javascript
export { MyModuleManager } from './my-module.js';
```

### 第 2 层：server — Express 路由模块

创建 `packages/server/src/routes/<myModule>.js`：

```javascript
/**
 * @codewhale/server — <模块中文名> 路由
 *
 * 挂载路径: /api/my-module
 * <功能简述>。
 */

import { Router } from 'express';
import { guard, getServerMessage } from '@codewhale/core';
import { ok, fail, langOf } from '../helpers.js';

/**
 * 创建 <MyModule> 路由
 *
 * @param {import('@codewhale/core').MyModuleManager} myModuleMgr
 * @returns {import('express').Router}
 */
export function createMyModuleRouter(myModuleMgr) {
  const router = Router();

  /** 获取所有条目 */
  router.get('/list', (_req, res) => {
    res.json(guard(() => ok(myModuleMgr.list())));
  });

  /** 添加条目 */
  router.post('/add', (req, res) => {
    const l = langOf(req);
    res.json(guard(() => {
      const r = myModuleMgr.add(req.body);
      return r.success ? ok(null, getServerMessage(l, 'added')) : fail(r.message);
    }));
  });

  /** 删除条目 */
  router.delete('/:id', (req, res) => {
    const l = langOf(req);
    res.json(guard(() => {
      const r = myModuleMgr.remove(req.params.id);
      return r.success ? ok(null, getServerMessage(l, 'deleted')) : fail(r.message);
    }));
  });

  return router;
}
```

#### 在入口文件中挂载

编辑 `packages/server/index.js`：

```javascript
import { MyModuleManager } from '@codewhale/core';
import { createMyModuleRouter } from './src/routes/myModule.js';

// ─── 初始化管理器 ───
const myModuleMgr = new MyModuleManager(engine);

// ─── 挂载路由 ───
app.use('/api/my-module', createMyModuleRouter(myModuleMgr));
```

### 第 3 层：web — 前端请求层

创建 `packages/web/src/api/<my-module>.js`：

```javascript
/**
 * <模块名> 相关 API
 */

import { ajaxBack, ajaxPostBack, ajaxPutBack, ajaxDeleteBack } from '@/utils/request';

/**
 * 获取所有条目
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export function getMyModuleList() {
  return ajaxBack('/my-module/list');
}

/**
 * 新增条目
 * @param {Object} data
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export function addMyModule(data) {
  return ajaxPostBack('/my-module/add', data, { successMessage: 'added' });
}

/**
 * 删除条目
 * @param {string} id
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export function removeMyModule(id) {
  return ajaxDeleteBack('/my-module/' + id, {}, { successMessage: 'deleted' });
}
```

**request.js 提供的统一请求方法**：

| 方法 | HTTP 方法 | 用途 |
|---|---|---|
| `ajaxBack(url, opts)` | GET | 简单查询 |
| `ajaxPostBack(url, data, opts)` | POST | 新增 |
| `ajaxPutBack(url, data, opts)` | PUT | 编辑/更新 |
| `ajaxDeleteBack(url, data, opts)` | DELETE | 删除 |

`opts` 中的 `successMessage` / `errorMessage` 自动按当前语言翻译，统一处理 `maskingStore.isLoading` 加载状态。

### 第 4 层：web — Vue 弹窗组件

#### 弹窗组合函数体系

项目弹窗使用三层 Composable 架构：

```
composition/dialog/
├── Base.js      ← 基础层：弹窗显隐（isShow）、数据初始化（initfun）
├── Form.js      ← 表单层：继承 Base、新增/编辑模式切换（isEdit）、表单提交
└── Container.js ← 管理层：父组件通过 vm.refs 控制子弹窗
```

#### 简单弹窗（仅新增，无编辑）

使用 `compositionDialogBase`，参考 `model.vue`：

```vue
<!--
  model.vue — 模型新增弹窗（仅新增）
-->
<template>
  <el-dialog v-model="isShow" :title="$t('module.add_dialog_title')"
    width="400px" :close-on-click-modal="false">
    <el-form ref="form" :model="formData" label-position="top">
      <el-form-item prop="name">
        <el-input v-model="formData.name" placeholder="请输入名称" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="hideDialog">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" @click="onSubmit">
        {{ $t('common.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive } from 'vue';
import { addMyModule } from '@/api/my-module';
import { compositionDialogBase } from '@/composition/dialog/Base';

const emit = defineEmits(['submitSuccess']);
const formData = reactive({ name: undefined });

const { isShow, showDialog, hideDialog, showDialogByData } = compositionDialogBase({
  initfun({ data }) {
    // 支持外部传入初始数据
    if (data) Object.assign(formData, data);
  },
});

function onSubmit() {
  addMyModule(formData)
    .then(() => { hideDialog(); emit('submitSuccess'); });
}

defineExpose({ showDialog, hideDialog, showDialogByData });
</script>
```

#### 表单弹窗（新增 + 编辑模式）

使用 `compositionDialogForm`，参考 `provider.vue` 和 `officialKey.vue`：

```vue
<!--
  xxxDialog.vue — 新增/编辑弹窗
  新增模式：显示全部字段
  编辑模式：隐藏不可修改字段
-->
<template>
  <el-dialog v-model="isShow"
    :title="isEdit ? $t('module.edit_title') : $t('module.add_title')"
    width="500px" :close-on-click-modal="false" @closed="closeDialog">
    <el-form ref="form" :model="formData" :rules="rules" label-position="top">
      <el-form-item label="名称" prop="name">
        <el-input v-model="formData.name" />
      </el-form-item>
      <el-form-item v-if="!isEdit" label="密钥" prop="secret">
        <el-input v-model="formData.secret" type="password" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="closeDialog">{{ $t('common.cancel') }}</el-button>
      <el-button type="primary" :loading="maskingStore.isLoading" @click="onSubmit">
        {{ $t('common.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { assign } from 'lodash';
import { addMyModule, editMyModule } from '@/api/my-module';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogForm } from '@/composition/dialog/Form';

const emit = defineEmits(['submitSuccess']);
const maskingStore = useMaskingStore();

const formData = reactive({ name: undefined, secret: undefined, id: undefined });

// 动态校验：编辑时 name 必填，新增时 secret 必填
const rules = computed(() => {
  if (isEdit.value) {
    return { name: [{ required: true, message: '请输入名称', trigger: 'blur' }] };
  }
  return {
    secret: [{ required: true, message: '请输入密钥', trigger: 'blur' }],
  };
});

const { isEdit, isShow, showDialog, hideDialog, closeDialog, showDialogByData, submitDialogForm } =
  compositionDialogForm({
    formName: 'form',
    addFun: addMyModule,
    editFun: editMyModule,
    initfun({ data }) {
      if (data) assign(formData, data);
    },
  });

function onSubmit() {
  submitDialogForm(formData);
}

defineExpose({ showDialog, hideDialog, showDialogByData });
</script>
```

#### 父组件（页面）集成结构

参考 `packages/web/src/views/provider/index.vue` 的弹窗管理模式：

```vue
<template>
  <div class="my-module-view" v-loading="maskingStore.isLoading">
    <!-- 页面内容 -->
    <el-button @click="dialogCtrl.showAddDialog(null, 'myDialog')">
      新增
    </el-button>

    <!-- 弹窗组件区域（所有 dialogs 集中在视图底部） -->
    <MyDialog ref="myDialog" @submitSuccess="loadData" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getMyModuleList, removeMyModule } from '@/api/my-module';
import { useMaskingStore } from '@/stores/masking';
import { compositionDialogContainer } from '@/composition/dialog/Container';
import MyDialog from './edit/my-dialog.vue';

const maskingStore = useMaskingStore();
const dialogCtrl = compositionDialogContainer();

const items = ref([]);

function loadData() {
  getMyModuleList().then(data => { items.value = data || []; });
}

onMounted(loadData);
</script>
```

**弹窗管理模式核心要点**：

1. 每个 dialog 用 `ref` 注册（如 `ref="myDialog"`）
2. 所有 dialogs 的 `@submitSuccess` 统一调用 `loadData()` 刷新
3. `dialogCtrl.showAddDialog(data, 'refName')` 按 ref 名称打开
4. `dialogCtrl.showEditDialog(data, 'refName')` 按 ref 名称以编辑模式打开
5. `maskingStore.isLoading` 作为全局 `v-loading` 指令，统一控制加载状态

---

## 第三部分：与 CodeWhale 配置同步

若新模块需要同步到 CodeWhale 的 `config.toml`：

1. 在 `packages/core/src/sync.js` 的 `SyncManager` 中实现对应逻辑
2. 确定同步策略：
   - **全量替换**：本地数据完全覆盖 config.toml 对应段
   - **按 ID 合并**：保留本地独有项、更新冲突项
   - **仅激活项同步**：只同步状态为 `active` 的条目
3. 确保 `initSync()` 启动时能从 `config.toml` 反向加载

---

## 第四部分：多语言支持

### 前端多语言文本

在 `packages/web/src/locales/` 的各语言文件中添加：

```json
{
  "my_module": {
    "title": "我的模块",
    "add": "新增",
    "edit_title": "编辑条目",
    "add_title": "新增条目",
    "delete": "删除",
    "name_label": "名称",
    "confirm_delete": "确认删除此条目？"
  }
}
```

### 服务端消息

在 `packages/core/src/i18n.js` 的 `SERVER_MSG` 对象中添加：

```javascript
export const SERVER_MSG = {
  // ... 已有消息
  // 你的模块消息：
  'myModuleAdded': {
    'zh-Hans': '条目添加成功',
    'en': 'Item added successfully',
    'ja': 'アイテム追加完了',
    'pt-BR': 'Item adicionado com sucesso',
  },
  'myModuleDeleted': {
    'zh-Hans': '条目已删除',
    'en': 'Item deleted',
    'ja': 'アイテム削除済み',
    'pt-BR': 'Item excluído',
  },
};
```

---

## 第五部分：开发工作流

### 步骤 1：规划

1. 确定模块功能范围和数据结构
2. 在 `types.js` 中添加类型定义
3. 设计 API 路径（RESTful，`/api/<module-name>/<action>`）
4. 确定是否需要与 `config.toml` 同步

### 步骤 2：实现 core 层

1. 创建 `packages/core/src/<module-name>.js`
2. 扩展 `ConfigEngine`（在 `config.js` 中添加 get/set 方法）
3. 注册导出（在 `index.js` 中添加 export 行）

### 步骤 3：实现 server 路由层

1. 创建 `packages/server/src/routes/<moduleName>.js`
2. 在 `packages/server/index.js` 中初始化 Manager 并挂载路由

### 步骤 4：实现 web 层

1. 创建 `packages/web/src/api/<module-name>.js`
2. 创建弹窗组件（`views/<module>/edit/<dialog>.vue`）
3. 创建页面视图（`views/<module>/index.vue`），集成弹窗管理
4. 添加多语言文本
5. 在 `router/index.js` 中添加路由（如需要新页面）

### 步骤 5：验证

1. 启动 dev 环境（`pnpm dev`），测试 Web UI 交互
2. 用 `curl` 测试 API 端点是否返回正确
3. 检查 `store.json` 是否持久化正确
4. 检查同步到 `config.toml` 的数据是否正确

---

## 质量检查清单

- [ ] 所有公共方法都有 JSDoc 注释
- [ ] core 层的 Manager 返回 `{ success, data, message }` 标准格式
- [ ] server 路由 handler 全部包裹在 `guard()` / `guardAsync()` 中
- [ ] 错误消息使用 `getServerMessage(locale, key)` 多语言
- [ ] 前端请求使用 `ajaxBack` / `ajaxPostBack` / `ajaxPutBack` / `ajaxDeleteBack`
- [ ] 弹窗组件使用 `compositionDialogBase` 或 `compositionDialogForm`
- [ ] 父组件使用 `compositionDialogContainer` 统一管理弹窗
- [ ] 多语言文本在全部 4 种语言文件中添加
- [ ] 类型定义在 `types.js` 中完整（含 StoreData 扩展）
- [ ] API 调用无需传 absolute URL（Vite dev proxy 自动转发 `/api`）
- [ ] 注释写在代码行上方，非行尾
- [ ] 无 console.log 残留

---

## 常见陷阱与解决方案

### 1. 路由顺序问题

- **现象**：`/:id` 通配路由拦截了 `/add`、`/models/add` 等具体路由
- **解决**：**具体路由必须在通配路由之前注册**（Express 按注册顺序匹配）

### 2. 弹窗 ref 名称不一致

- **现象**：`dialogCtrl.showAddDialog(data, 'myDialog')` 找不到弹窗
- **检查**：父组件中 `<MyDialog ref="myDialog">` 的 ref 值与 show 调用中的名称一致

### 3. 多语言键缺失

- **现象**：UI 显示键名而非翻译文本（如 `"module.title"`）
- **解决**：检查语言 JSON 文件中是否添加了对应键值，确认键名路径无误

### 4. API 代理未生效

- **现象**：前端请求 `/api/my-module/list` 返回 404
- **解决**：确认 Vite proxy 配置在 `vite.config.js` 中（默认 `/api → localhost:3456`）

### 5. store.json 路径错乱

- **现象**：修改了 store.json 但 Web UI 显示旧数据
- **解决**：`ConfigEngine` 自动探测项目目录优先 → `~/.codewhale/`，确认工作目录正确

---

**版本**：2.0
**最后更新**：2026-06-09
**基于项目**：codewhale-tool（@codewhale/core v1.0+）
**维护者**：CodeWhale 社区