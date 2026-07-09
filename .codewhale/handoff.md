# Handoff — 修复 global skill update 时 Windows 跨盘路径拼接错误

> 最后更新: 2026-07-09
> 状态: **待验证**

## 目标
修复更新 global skill 时出现 `ENOENT: no such file or directory, mkdir 'D:\Code\codewhale-tool\C:\Users\53450\.codewhale\skills\...'` 错误的问题。

## 根因分析
在 Windows 上，`path.join()` 遇到不同盘符的绝对路径时，**不会**丢弃前面的路径段，而是简单拼接：

```javascript
// Node.js Windows 行为
path.join('D:\\Code\\codewhale-tool', 'C:\\Users\\53450\\.codewhale\\skills', 'ui-ux-pro-max')
// 返回: 'D:\Code\codewhale-tool\C:\Users\53450\.codewhale\skills\ui-ux-pro-max'
```

在 `packages/core/src/skill/install.js` 的 `update` 函数中（以及 `_installFromGitHubV2`、`installFromZip` 中）：

```javascript
const baseTargetDir = (level === 'project'
  ? join(_getProjectBaseDir(level, opts.projectPath), store.projectSkillsDir, existing.slug)
  : join(_getProjectBaseDir(level, opts.projectPath), store.skillsDir, existing.slug));
```

`_getProjectBaseDir('global', ...)` 返回 `process.cwd()`（`D:\Code\codewhale-tool`），而 `store.skillsDir` 是 `C:\Users\53450\.codewhale\skills`（通过 `join(homedir(), '.codewhale', 'skills')` 计算得到）。

两者盘符不同（D: vs C:），导致 `path.join` 生成了无效的拼接路径。

## 修复方案
修改 `_getProjectBaseDir` 函数，让 global 级返回空字符串：

```javascript
function _getProjectBaseDir(level, projectPath) {
  return level === 'project' ? projectPath : '';
}
```

这样：
- global 级：`join('', store.skillsDir, slug)` → `C:\Users\53450\.codewhale\skills\<slug>` ✅
- project 级：`join(projectPath, 'skills', slug)` → `<projectPath>\skills\<slug>` ✅

## 待修改的文件
- `packages/core/src/skill/install.js`：第 70-72 行

## 验证计划
- 运行 `npm run lint` 确保代码规范通过
- 验证 update global skill 时路径计算正确
