# CodeWhale Handoff — 2026-08-10

## 当前目标
API 传参统一化优化：将 Web API 层与 Server 路由层中“路径参数 + body 传参”的混合模式，统一为纯 body 传参。

## 已完成修改

### officialKey 模块
- Web API：`editOfficialKey`、`activateOfficialKey`、`removeOfficialKey` 统一改为 body 传参
- Server 路由：`PUT /edit`、`POST /activate`、`DELETE /remove`
- 调用方：`views/provider/officialKey.vue` 已改为传对象 `{ id }`

### project 模块
- Web API：`editProject`、`removeProject`、`setDefaultProject` 统一改为 body 传参
- Server 路由：`PUT /edit`、`DELETE /remove`、`PUT /default`
- 调用方：`views/project/index.vue` 已改为传对象 `{ id: row.id }`

### proxy 模块
- Web API：`editProxy`、`removeProxy`、`setDefaultProxy` 统一改为 body 传参
- Server 路由：`PUT /edit`、`DELETE /remove`、`PUT /default`
- 调用方：`views/proxy/index.vue` 已改为传对象 `{ id: row.id }`

### token 模块
- Web API：`editToken`、`removeToken`、`setDefaultToken` 统一改为 body 传参
- Server 路由：`PUT /edit`、`DELETE /remove`、`PUT /default`
- 调用方：`views/token/index.vue` 已改为传对象 `{ id: row.id }`
- **已完成**：修复 `views/token/index.vue` 中 `<TokenEdit ref="dialogRef" @submitSuccess="loadList(true)" />` 标签闭合问题

### provider 模块
- Web API：`editProvider`、`removeProvider`、`activateProvider` 统一改为 body 传参
- Server 路由：`PUT /edit`、`DELETE /remove`、`POST /activate`
- 调用方：`views/provider/thirdParty.vue` 已改为传对象 `{ id }`
- **注意**：删除了未使用的冗余文件 `packages/server/src/routes/provider.js`（provider 目录外），实际使用 `packages/server/src/routes/provider/index.js`

### skill 模块（cmd、files、routes）
- Web API：
  - `cmd.js`: `removeSkill`、`copySkillToProject` 改为 body 传参
  - `files.js`: `getSkillFiles`、`readSkillFile`、`saveSkillFile`、`removeSkillFile` 统一改为 body 传参
  - `routes.js`: `updateMeta`、`updateSkillSortOrder`、`saveReadme` 改为 body 传参
- Server 路由：
  - `cmd.js`: `DELETE /remove`、`POST /copy-to-project` 改为 body 传参；`POST /update/:id` 保留路径参数（避免与 install.js 的 `POST /update` 冲突）
  - `files.js`: `POST /files`、`POST /file`、`PUT /file`、`DELETE /file` 改为 body 传参
  - `routes.js`: `PUT /meta`、`PUT /sort`、`PUT /readme` 改为 body 传参；`GET /readme/:id` 保留路径参数
- 调用方：
  - `views/skill/edit/detail.vue` 已改为传对象
  - `views/skill/edit/info.vue` 已改为传对象
  - `views/skill/edit/readme.vue` 已改为传对象

## 关键决策
- **前端 API 层直接透传对象**，不做拆包/重组
- **Server 路由层从 req.body 取参**，对需要传给 core 的函数保留 `{ skillId: req.body.id, ...req.body }` 的适配（与 project/proxy 模块一致）
- **Core 层方法签名保持兼容**，仅 server 路由层做最小适配
- **调用方只构造一个对象**，降低维护成本
- **GET 详情接口保留路径参数**：`getProvider(id)`、`getReadme(id)` 等 GET 请求保留路径参数，符合 RESTful 惯例
- **避免路由冲突**：skill 模块 `POST /update/:id` 保留路径参数，因为 install.js 已占用 `POST /update`

## 进行中
- ~~token/index.vue lint 错误修复（line 51 标签闭合）~~ ✅ 已完成
- ~~运行构建验证（eslint / build）~~ ✅ 已完成

## 下一个动作
- 无待办事项

## 验证结果
- `npm run lint`：通过，无错误
- `npm run build`：通过，构建成功（vite build, 5.60s）

## 全局搜索确认结果
- `/token/` 旧 URL 模式已清除
- `/provider/` 旧 URL 模式已清除（除 `GET /:id` 获取详情保留）
- `/skill/` 旧 URL 模式已清除（除 `GET /readme/:id` 获取详情保留）
- `/project/` 旧 URL 模式已清除
- `/proxy/` 旧 URL 模式已清除
- `/official-key/` 旧 URL 模式已清除
