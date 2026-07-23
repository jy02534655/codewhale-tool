# CodeWhale Handoff — 2026-07-23

## 当前目标（进行中）
按精简版 core 层优化方案继续实施（已去掉第 4、5 条），当前推进到阶段 2 中后段。

## 已完成修改

### 阶段 1：高优先级安全修复（已完成）
- **#2 命令注入修复**：`packages/core/src/file.js`
  - `getHiddenFiles()` 改用 `spawnSync('attrib', [dirPath + '\\*'], ...)` 参数数组传递，避免 shell 解析。
- **#3 路径穿越与符号链接防护**：`packages/core/src/file.js`
  - 新增 `safeResolve(userPath)`：`path.resolve()` + `fs.realpathSync()`，路径不存在时回退到 resolved。
  - `FileManager.list()` / `FileManager.read()` 已改为 `safeResolve(...)`。

### 阶段 2：中优先级改进（已完成）
- **#9 applyRenameMap 目录匹配加固**：`packages/core/src/download/utils.js`
  - 目录映射增加精确前缀边界检查，避免 `skills/my-skill-old/` 误匹配 `skills/my-skill/`。
- **#6 魔法数字提取为常量**：`packages/core/src/constants.js` 已新建
  - 已提取并使用：`MAX_FILE_SIZE`、`MAX_RETRIES`、`CONCURRENCY`、`HTTP_TIMEOUT_TAR`、`HTTP_TIMEOUT_ZIP`、`TARBALL_SIZE_THRESHOLD`、`TREE_COUNT_THRESHOLD`。
  - 已修改文件：
    - `packages/core/src/file.js`：导入 `MAX_FILE_SIZE`，`read()` 已使用。
    - `packages/core/src/download/http.js`：导入 `MAX_RETRIES`/`CONCURRENCY`/`HTTP_TIMEOUT_TAR`，超时和并发常量已替换，局部 `MAX_RETRIES/CONCURRENCY` 声明已删除。
    - `packages/core/src/download/orchestrator.js`：导入 `TARBALL_SIZE_THRESHOLD`/`TREE_COUNT_THRESHOLD`，`_shouldUseApi()` 与 `_logStrategy()` 条件判断已替换。
    - `packages/core/src/download/zip.js`：导入 `HTTP_TIMEOUT_ZIP`，两处 `120000` 已替换。
- **#7 原子写入全面应用**：
  - `packages/core/src/utils/config.js`：
    - `ConfigEngine` 新增 `static atomicWriteSync(filePath, content)`。
    - `write()` 已改为原子写入。
    - 语法错误已修复：将无参数 `catch` 改为 `catch (err)`，`throw;` 改为 `throw err;`。
  - `packages/core/src/settings/io.js`：
    - `writeConfig()` 已改为临时文件 + `renameSync` 覆盖。
    - 语法错误已修复：将无参数 `catch` 改为 `catch (err)`，`throw;` 改为 `throw err;`。
  - `packages/core/src/sync.js`：
    - `syncToCodeWhale()` 已改为临时文件 + `renameSync` 覆盖。
    - 语法错误已修复：`catch` 改为 `catch (err)`，`throw;` 改为 `throw err;`。

- **#8 错误日志保留堆栈**：
-  - `packages/core/src/download/orchestrator.js`：
-    - `span.finish('ERROR', 'skillLogError', ...)` 已追加 `{ error: tarErr.stack }` / `{ error: err.stack }`。
-    - `logger.log('ERROR', 'skillLogApiAllFailed', ...)` 已追加 `{ error: err.stack }`。
-  - `packages/core/src/skill/install.js`：
-    - 导入 `writeSkillLog`，两处 `catch (err)` 均已追加 `writeSkillLog('ERROR', ..., { error: err.stack })`。
-  - `packages/core/src/skill/cmd.js`：
-    - 导入 `writeSkillLog`，`catch (err)` 已追加 `writeSkillLog('ERROR', ..., { error: err.stack })`。
-  - `packages/core/src/skill/files.js`：
-    - 导入 `writeSkillLog`，`catch (err)` 已追加 `writeSkillLog('ERROR', ..., { error: err.stack })`。
- **#1 ConfigEngine I/O 缓存 + 原子写入**：
-  - `packages/core/src/utils/config.js`：
-    - `ConfigEngine` 新增 `this._cache = null`（实例级内存缓存）。
-    - `read()` 已改为缓存优先，写回时同步更新 `this._cache`。
-    - 新增 `readCached()`：优先返回缓存深拷贝，缓存不存在时自动回退 `read()`。
-    - 新增 `clearCache()`：手动清除缓存，强制下一次 `read()` 从磁盘重新加载。

### ESLint 警告修复（已完成）
- `packages/core/src/file.js`：移除未使用的 `execSync` 导入
- `packages/core/src/settings/io.js`：移除未使用的 `err2` catch 绑定
- `packages/core/src/settings/utils.js`：移除未使用的 `isEmpty` 导入
- `packages/core/src/skill/cmd.js`：移除未使用的 `isEmpty` 导入
- `packages/core/src/sync.js`：移除未使用的 `err2` catch 绑定
- `packages/core/src/utils/config.js`：移除未使用的 `cloneDeep` 导入和 `err2` catch 绑定

### atomicWriteSync 提取重构（已完成）
- `packages/core/src/utils/config.js`：将 `ConfigEngine.atomicWriteSync` 从静态方法提取为独立导出函数 `export function atomicWriteSync(filePath, content)`，`ConfigEngine.write()` 改为直接调用
- `packages/core/src/settings/io.js`：`writeConfig` 内联原子写入逻辑替换为 `atomicWriteSync(cwPath, content)`，移除冗余导入 `writeFileSync`、`renameSync`、`unlinkSync`、`randomUUID`
- `packages/core/src/sync.js`：`syncToCodeWhale` 内联原子写入逻辑替换为 `atomicWriteSync(cwPath, ...)`，移除冗余导入 `writeFileSync`、`renameSync`、`unlinkSync`、`randomUUID`

## 已完成的后续优化

### lodash 化与去重优化（已完成）
- **cloneDeep 替换 JSON.parse(JSON.stringify(...))**：
  - `packages/core/src/utils/config.js`：导入 `cloneDeep`，`read()`/`write()`/`readCached()`/`_mergeDefaults()` 中 6 处深拷贝已替换
  - `packages/core/src/settings/index.js`：导入 `cloneDeep`，`writeInstructionsToConfig()` 中 1 处已替换
  - `packages/core/src/settings/writer.js`：导入 `cloneDeep`，`writeSettingsToCodeWhale()` 中 1 处已替换
- **嵌套操作 lodash 化**：
  - `packages/core/src/settings/utils.js`：`getNested`/`setNested`/`deleteNested` 已改为 lodash `get`/`set`/`unset`，保持兼容导出
- **空对象判断统一为 isEmpty/clearObject**：
  - `packages/core/src/settings/io.js`：导入 `isEmpty`，`writeConfig()` 中空配置判断已替换
  - `packages/core/src/settings/reader.js`：导入 `isEmpty`，`readSettingsFromCodeWhale()` 中空配置判断已替换
  - `packages/core/src/settings/writer.js`：导入 `isEmpty`，`writeSettingsToCodeWhale()` 中空对象清理判断已替换
- **验证状态**：对上述 6 个文件运行 `npx eslint`，通过（无错误）

## 待继续任务（按建议顺序）

### 低优先级（按需推进）
- **#10 异步 I/O 改造**
- **#11 SkillStore 查找索引优化**
- **#12 下载并发控制库替换**

1. **低优先级按需推进**：
   - **#10 异步 I/O 改造**
   - **#11 SkillStore 查找索引优化**
   - **#12 下载并发控制库替换**

## 排除项
- 敏感信息加密存储（原 #4）
- 统一 Store 基类使用方式（原 #5）
- 统一配置存储抽象、依赖注入、JSDoc/TS 迁移继续保持排除。
