# Handoff — skill 管理：unknown 修复 + 复制到项目

> 最后更新: 2026-07-02
> 状态: **进行中**

## 本次目标
1. 修复前端项目 Tab 中项目级 skill 显示为 `unknown` 的问题
2. 为全局 skill 增加「复制到项目」能力，规避前端读取复杂 skill 的权限问题

## 根因定位
- 前端 `packages/web/src/views/skill/index.vue` 的 `projectTree` 仅按 `path` 是否含 `.codewhale` 猜测项目名，猜不到时降级为 `unknown`
- 后端 `/list/project` 原本不返回真实项目名，导致前端只能猜测

## 已完成的实现

### core 层（已完成）
- 文件: `packages/core/src/skill/index.js`
- `listProject()`：每个 entry 附加 `project` 字段（取 `packageJson.project` 或 `config.extra.project`，兜底 `'unknown'`）
- 新增 `copyToProject(skillId)`：定位全局 skill → 递归复制到 `process.cwd() + .codewhale/skills/<id>` → 写入项目级 `skills.json` → 失败时清理目标目录

### 未改动的 core 文件
- `packages/core/src/skill/project.js`：保持不变

## 待继续实现（精确修改点）

### 1. server 路由
- 文件: `packages/server/src/routes/skill.js`
- 在现有 `router.delete('/remove/:id', ...)` 后插入：
  ```js
  router.post('/copy-to-project/:id', (req, res) => {
    res.json(guard(() => skillMgr.copyToProject(req.params.id)));
  });
  ```

### 2. web api
- 文件: `packages/web/src/api/skill.js`
- 在 `removeSkill` 后插入：
  ```js
  export function copySkillToProject(id) {
    return ajaxPostBack('/skill/copy-to-project/' + id, {}, { successMessage: true })
  }
  ```

### 3. 项目 Tab unknown 修复
- 文件: `packages/web/src/views/skill/index.vue`
- 修改 `projectTree` computed 的 `pn` 计算：
  - 原逻辑：`s.path.indexOf('.codewhale') !== -1 ? 'codewhale-tool' : 'unknown'`
  - 改为：`s.project || (s.path.indexOf('.codewhale') !== -1 ? 'codewhale-tool' : 'unknown')`
- 修改 `loadSkills()` 中全局 skill 标记：
  - 原逻辑：`globalSkills.value = results[0] || []`
  - 改为：`globalSkills.value = (results[0] || []).map(function (s) { s.level = 'global'; return s })`

### 4. detail.vue 复制按钮
- 文件: `packages/web/src/views/skill/edit/detail.vue`
- script:
  - 图标 import 增加 `DocumentCopy`
  - API import 增加 `copySkillToProject`
  - 在 `removeCurrentSkill` 方法后新增：
    ```js
    function copyCurrentSkill() {
      if (!props.skill) return
      copySkillToProject(props.skill.id).then(function () {
        emit('refresh')
        ElMessage.success(t('skill.copyToProjectSuccess'))
      }).catch(function () {
        ElMessage.error(t('message.networkError') || 'Copy to project failed')
      })
    }
    ```
- template:
  - 在 detail-actions 区（编辑信息、编辑 README、删除 之间）增加：
    ```xml
    <el-button v-if="skill.level === 'global'" size="small" type="info" :icon="DocumentCopy" @click="copyCurrentSkill">
      {{ $t('skill.copyToProject') }}
    </el-button>
    ```

### 5. i18n 文案
- 文件:
  - `packages/web/src/locales/zh-Hans.json`
  - `packages/web/src/locales/en.json`
  - `packages/web/src/locales/ja.json`
  - `packages/web/src/locales/pt-BR.json`
- 在 skill 段添加：
  - `copyToProject`: 复制到项目
  - `copyToProjectSuccess`: 已复制到项目 skill 目录
- zh-Hans 参考文案：
  ```json
  "copyToProject": "复制到项目",
  "copyToProjectSuccess": "已复制到项目 skill 目录"
  ```

## 外部接口不变
- `packages/web/src/views/skill/edit/progress.vue`：无需改动（STAGE_MAP 已覆盖）
- `packages/server/src/routes/skill.js`：其余路由无需改动（SSE 桥接已统一）

## 下一步行动
1. 按上面 1-5 的顺序提交剩余修改
2. 自检：读取修改后的关键文件确认改动落地
3. 可选：运行前端开发服务，验证 unknown 修复与复制流程
