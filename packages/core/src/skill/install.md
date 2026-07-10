# Skill 安装与更新流程说明

> 对应文件：`packages/core/src/skill/install.js`
>
> 本文用 Mermaid 流程图解释 skill 安装与更新的完整流程，方便对照代码阅读。

---

## 1. 整体架构

`install.js` 采用“统一入口 + 多实现分支 + 原子更新”的结构：

- `install()`：统一入口，按 `type` 分发到不同安装方式
- `_installFromGitHubV2()`：从 GitHub 仓库安装
- `installFromZip()`：从 ZIP 源安装（远程 URL 或本地文件）
- `installFromGithubTreePath()`：从 GitHub Tree URL 安装（仓库子目录）
- `installFromZipStream()`：ZIP 安装的封装层，增加日志记录
- `update()`：安全原子替换更新

所有安装方式最终都通过 `_finalizeInstall()` 完成收尾（写入 store + 记录安装参数）。

---

## 2. 统一入口：`install()`

前端调用 `install()` 时，根据 `opts.type` 分发到不同的安装实现：

```mermaid
graph TD
    A(install) --> B{opts.type}
    B -->|github| C(_installFromGitHubV2)
    B -->|githubPath| D(installFromGithubTreePath)
    B -->|zip| E(installFromZipStream)
    B -->|未知类型| F(failMsg)

    D --> G(parseGithubTreeUrl)
    G --> C

    E --> H(resolve proxyConfig)
    H --> I(installFromZip)

    C --> J(_finalizeInstall)
    I --> J

    J --> K(okMsg)
```

**关键点：**
- `githubPath` 先解析 Tree URL，再委托给 `_installFromGitHubV2`
- `zip` 先解析代理配置，再调用 `installFromZip`
- 所有分支最终都汇聚到 `_finalizeInstall`

---

## 3. GitHub 安装流程：`_installFromGitHubV2()`

从 GitHub 仓库安装 skill 的完整流程：

```mermaid
graph TD
    A(_installFromGitHubV2) --> B(_parseGitHubUrl)
    B --> C{URL 合法?}
    C -->|否| D(failMsg)
    C -->|是| E(确定 finalSkillId)
    E --> F(确定 finalTargetDir)
    F --> G(_resolveProjectId)
    G --> H{已安装?}
    H -->|是| I(failMsg)
    H -->|否| J(解析 proxyConfig)

    J --> K{opts.proxyUrl?}
    K -->|是| L(_parseProxyUrl)
    K -->|否| M{opts.proxyId?}
    M -->|是| N(store.engine.findProxy)
    M -->|否| O(无代理)
    L --> P(解析 token)
    N --> P
    O --> P

    P --> Q{opts.tokenId?}
    Q -->|是| R(store.engine.findToken)
    Q -->|否| S(无 token)
    R --> T(downloadSkillFromGitHub)
    S --> T

    T --> U(_extractMeta)
    U --> V(_finalizeInstall)
    V --> W(okMsg)

    T -->|异常| X(清理 finalTargetDir)
    X --> Y(fail)
```

**关键点：**
1. 先解析 GitHub URL，提取 owner/repo
2. 确定 skillId 和安装目录
3. 检查是否已安装同名 skill
4. 解析代理配置（三种方式：proxyConfig / proxyUrl / proxyId）
5. 解析 Token（通过 tokenId）
6. 调用 `downloadSkillFromGitHub` 下载
7. 提取元数据并写入 store

---

## 4. ZIP 安装流程：`installFromZip()`

从 ZIP 源安装 skill，支持远程 URL 和本地文件：

```mermaid
graph TD
    A(installFromZip) --> B(确定 finalSkillId)
    B --> C(确定 finalTargetDir)
    C --> D(_resolveProjectId)
    D --> E{已安装?}
    E -->|是| F(failMsg)
    E -->|否| G(创建临时目录)

    G --> H{zipSource 是 URL?}
    H -->|是| I(downloadAndExtractZip)
    H -->|否| J(AdmZip extractAllTo)

    I --> K(extractRoot)
    J --> K

    K --> L{指定了 skillPath?}
    L -->|是| M(store.findSkillDir)
    M --> N{找到?}
    N -->|否| O{根目录有 SKILL.md?}
    O -->|是| P(extractRoot)
    O -->|否| Q(清理 tempDir + failMsg)
    N -->|是| R(sourceDir)
    L -->|否| S{根目录有 SKILL.md?}
    S -->|是| P
    S -->|否| Q

    P --> T(清理 finalTargetDir)
    R --> T
    T --> U(_extractMeta)
    U --> V(store.copyDir)
    V --> W(_finalizeInstall)
    W --> X(清理 tempDir)
    X --> Y(okMsg)

    I -->|异常| Z(清理 finalTargetDir + fail)
    J -->|异常| Z
```

**关键点：**
1. 创建临时解压目录
2. 远程 URL 下载并解压，本地文件直接解压
3. 定位 skill 目录（支持子目录路径）
4. 复制到目标目录
5. 清理临时文件

---

## 5. GitHub Tree Path 安装流程：`installFromGithubTreePath()`

安装仓库中特定目录下的 skill：

```mermaid
graph TD
    A(installFromGithubTreePath) --> B(parseGithubTreeUrl)
    B --> C{URL 合法?}
    C -->|否| D(failMsg)
    C -->|是| E(构造 repoUrl + skillPath)
    E --> F(清理 safeExtra 中的空字段)
    F --> G(_installFromGitHubV2)
    G --> H(完成 GitHub 安装流程)
```

**关键点：**
- 先解析 Tree URL 提取 owner/repo/path/branch
- 构造标准 GitHub 仓库 URL
- 委托给 `_installFromGitHubV2` 完成实际安装

---

## 6. 更新流程：`update()` 原子替换

更新已安装 skill 的安全流程，采用“临时安装 + 原子替换”策略：

```mermaid
graph TD
    A(update) --> B{skillId 存在?}
    B -->|否| C(failMsg)
    B -->|是| D(store.findEntry)
    D --> E{skill 存在?}
    E -->|否| F(failMsg)
    E -->|是| G(确定 level + baseTargetDir)

    G --> H(_resolveProjectId)
    H --> I(创建临时 skillId + tempTargetDir)
    I --> J(调用 install 安装到临时目录)

    J --> K{临时安装成功?}
    K -->|否| L(清理 tempTargetDir)
    L --> M(返回错误)

    K -->|是| N(删除旧目录 baseTargetDir)
    N --> O(renameSync tempTargetDir -> baseTargetDir)
    O --> P{重命名成功?}
    P -->|否| Q(清理 tempTargetDir)
    Q --> R(fail)
    P -->|是| S(清理 store 中临时 entry)
    S --> T(更新原 skill entry)
    T --> U(okMsg)
```

**关键点：**
1. 先安装到临时目录（带 `.tmp-` 后缀）
2. 临时安装成功后，删除旧目录
3. 重命名临时目录为正式目录
4. 清理 store 中的临时 entry
5. 更新原 skill entry 的路径和参数

**为什么需要原子替换？**
- 避免在更新过程中出现“旧文件已删、新文件未就位”的中间状态
- 如果临时安装失败，旧版本完全不受影响
- 重命名操作是文件系统级别的原子操作

---

## 7. 收尾流程：`_finalizeInstall()`

所有安装方式的最终收尾步骤：

```mermaid
graph TD
    A(_finalizeInstall) --> B{是临时更新?}
    B -->|是| C(保持原 skillId)
    B -->|否| D(生成随机 UUID)
    C --> E(store.addToConfig)
    D --> E

    E --> F{有 rawOpts?}
    F -->|是| G(浅拷贝参数)
    G --> H(删除 _skillId / _targetDir)
    H --> I(store.mutate 写入 installParams)
    F -->|否| J(完成)
    I --> J
```

**关键点：**
- 临时更新保持原 skillId，新安装生成 UUID
- 记录原始安装参数到 `installParams`，供前端回填表单
- 去掉内部字段 `_skillId` 和 `_targetDir`

---

## 8. 路径解析辅助流程

### 8.1 `_getProjectBaseDir()`

```mermaid
graph TD
    A(_getProjectBaseDir) --> B{level === project?}
    B -->|是| C(返回 projectPath)
    B -->|否| D(返回空字符串)
```

### 8.2 `_resolveProjectId()`

```mermaid
graph TD
    A(_resolveProjectId) --> B{level === project?}
    B -->|否| C(返回 null)
    B -->|是| D{projectId 存在?}
    D -->|是| E(返回 projectId)
    D -->|否| F(store.getProjectIdByPath)
    F --> G(返回 projectId 或 null)
```

---

## 9. 各安装方式对比

| 安装方式 | 入口函数 | 数据源 | 适用场景 |
|---------|---------|--------|---------|
| GitHub 仓库 | `_installFromGitHubV2` | GitHub 仓库 | 安装公开 skill 仓库 |
| ZIP 文件 | `installFromZip` | 远程 ZIP URL 或本地 ZIP | 从 ZIP 包安装 |
| GitHub Tree Path | `installFromGithubTreePath` | GitHub 仓库子目录 | 安装仓库中特定目录的 skill |
| ZIP 流 | `installFromZipStream` | 本地 ZIP 文件 | 带日志的 ZIP 安装封装 |

---

## 10. 错误处理与清理

所有安装流程都遵循“失败清理”原则：

1. **临时目录清理**：安装过程中创建的临时目录，失败时必须清理
2. **目标目录清理**：如果目标目录已存在且安装失败，需要清理已部分写入的文件
3. **原子性保证**：update 流程通过临时目录保证原子性，失败不会影响旧版本

```mermaid
graph TD
    A(安装或更新开始) --> B(创建临时资源)
    B --> C{执行成功?}
    C -->|否| D(清理临时资源)
    D --> E(返回错误)
    C -->|是| F{是更新?}
    F -->|是| G(原子替换旧版本)
    F -->|否| H(直接完成)
    G --> I(完成)
    H --> I
```

---

## 11. 对照代码阅读建议

1. **先看统一入口**：`install()` 函数（第 363-397 行）
2. **再看 GitHub 安装**：`_installFromGitHubV2()` 函数（第 108-184 行）
3. **然后看 ZIP 安装**：`installFromZip()` 函数（第 199-280 行）
4. **最后看更新流程**：`update()` 函数（第 413-490 行）

每个函数内部的注释已经详细说明了每一步的用途，可以结合本文的流程图对照阅读。
