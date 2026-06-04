/**
 * @codewhale/cli — CodeWhale 配置管理命令行工具
 *
 * 提供 provider 和 skill 两大命令组，支持完整的 CRUD 和切换操作。
 *
 * 用法：
 *   node packages/cli/src/index.js provider list
 *   node packages/cli/src/index.js skill install pdf
 *
 *   全局安装后：
 *   codewhale-tool provider list
 *   codewhale-tool skill install pdf
 *
 * @module cli
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { ConfigEngine, ProviderManager, SkillManager, probeProvider } from '@codewhale/core';

// ─── 初始化 ────────────────────────────────────────────────────

/** @type {ConfigEngine} 配置引擎单例 */
const engine = new ConfigEngine();

/** @type {ProviderManager} */
const providerMgr = new ProviderManager(engine);

/** @type {SkillManager} */
const skillMgr = new SkillManager(engine);

// ─── 工具函数 ──────────────────────────────────────────────────

/**
 * 格式化成功输出
 * @param {string} msg
 */
function ok(msg) {
  console.log(chalk.green('✓'), msg);
}

/**
 * 格式化错误输出
 * @param {string} msg
 */
function fail(msg) {
  console.error(chalk.red('✗'), msg);
}

/**
 * 输出 JSON 格式（支持 --json 选项时使用）
 * @param {object} data
 * @param {boolean} useJson
 */
function output(data, useJson) {
  if (useJson) {
    console.log(JSON.stringify(data, null, 2));
  } else if (Array.isArray(data)) {
    data.forEach((item, i) => {
      console.log(`  ${chalk.cyan(i + 1)}. ${item.name || item.id || item.alias || item}`);
    });
  } else if (typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      console.log(`  ${chalk.cyan(key)}: ${value}`);
    }
  } else {
    console.log(data);
  }
}

// ─── 全局选项 ──────────────────────────────────────────────────

const program = new Command();

program
  .name('codewhale-tool')
  .description('CodeWhale 配置管理工具 — provider 和 skill 管理')
  .version('0.1.0')
  .option('-c, --config <path>', '指定 config.toml 路径')
  .hook('preAction', (cmd) => {
    // 如果指定了 --config，重新初始化 engine
    const opts = cmd.opts();
    if (opts.config) {
      const newEngine = new ConfigEngine(opts.config);
      // 通过重新赋值来切换配置路径（模块级变量）
      Object.assign(engine, newEngine);
    }
  });

// ════════════════════════════════════════════════════════════════
// Provider 命令组
// ════════════════════════════════════════════════════════════════

const providerCmd = program
  .command('provider')
  .description('管理 AI 模型提供方配置');

/**
 * provider list — 列出所有 provider
 */
providerCmd
  .command('list')
  .description('列出所有已配置的 provider')
  .option('--json', '以 JSON 格式输出')
  .action((opts) => {
    const providers = providerMgr.listProviders();
    if (providers.length === 0) {
      console.log(chalk.yellow('（没有配置任何 provider）'));
      console.log(`  使用 ${chalk.cyan('codewhale-tool provider add <name>')} 添加`);
      return;
    }
    console.log(chalk.bold(`\n已配置的 Provider（${providers.length} 个）：`));
    output(providers, opts.json);
  });

/**
 * provider tree — 显示完整三级树
 */
providerCmd
  .command('tree')
  .description('显示 provider → API key → model 完整树形结构')
  .option('--json', '以 JSON 格式输出')
  .action((opts) => {
    const tree = providerMgr.getTree();
    const entries = Object.entries(tree);
    if (entries.length === 0) {
      console.log(chalk.yellow('（没有配置任何 provider）'));
      return;
    }
    if (opts.json) {
      console.log(JSON.stringify(tree, null, 2));
      return;
    }
    console.log(chalk.bold('\nProvider 配置树：'));
    for (const [name, cfg] of entries) {
      const isActive = active.active_provider === name;
      const marker = isActive ? chalk.green('★') : ' ';
      console.log(`\n  ${marker} ${chalk.bold.cyan(name)} ${chalk.gray(`(${cfg.label})`)}`);
      for (const [alias, keyCfg] of Object.entries(cfg.api_keys)) {
        const isKeyActive = isActive && active.active_api_key === alias;
        const keyMarker = isKeyActive ? chalk.green('★') : ' ';
        console.log(`    ${keyMarker} ${chalk.yellow(alias)} ${chalk.gray(`(${keyCfg.label})`)} ${chalk.dim(keyCfg.key_preview)}`);
        for (const model of keyCfg.models) {
          const isModelActive = isKeyActive && active.active_model === model;
          const modelMarker = isModelActive ? chalk.green('★') : ' ';
          console.log(`      ${modelMarker} ${isModelActive ? chalk.green(model) : model}`);
        }
      }
    }
  });

/**
 * provider active — 显示当前活动配置
 */
providerCmd
  .command('active')
  .description('显示当前活动的 provider / API key / model')
  .option('--json', '以 JSON 格式输出')
  .action((opts) => {
    const active = providerMgr.getActive();
    console.log(chalk.bold('\n当前活动配置：'));
    if (opts.json) {
      console.log(JSON.stringify(active, null, 2));
    } else {
      console.log(`  ${chalk.cyan('Provider')}: ${active.active_provider || chalk.gray('（未设置）')}`);
      console.log(`  ${chalk.cyan('API Key')}: ${active.active_api_key || chalk.gray('（未设置）')}`);
      console.log(`  ${chalk.cyan('Model')}  : ${active.active_model || chalk.gray('（未设置）')}`);
    }
  });

/**
 * provider switch — 切换配置
 */
providerCmd
  .command('switch')
  .description('切换当前使用的 provider / API key / model（支持部分切换）')
  .option('-p, --provider <name>', '切换到指定 provider')
  .option('-k, --key <alias>', '切换到指定 API key 别名')
  .option('-m, --model <id>', '切换到指定模型')
  .option('--json', '以 JSON 格式输出')
  .action((opts) => {
    if (!opts.provider && !opts.key && !opts.model) {
      fail('至少需要一个切换目标（--provider / --key / --model）');
      console.log(chalk.gray('  示例: codewhale-tool provider switch --key work'));
      process.exit(1);
    }
    const result = providerMgr.switch({
      provider: opts.provider,
      apiKey: opts.key,
      model: opts.model,
    });
    if (result.success) {
      ok(`已切换 → ${result.active.active_provider} / ${result.active.active_api_key} / ${result.active.active_model}`);
    } else {
      fail(result.message);
    }
  });

/**
 * provider add — 添加 provider
 */
providerCmd
  .command('add <name>')
  .description('添加一个新的 provider')
  .option('-l, --label <label>', '显示名称')
  .action((name, opts) => {
    const result = providerMgr.addProvider(name, opts.label);
    result.success ? ok(`已添加 provider "${name}"`) : fail(result.message);
  });

/**
 * provider add-key — 添加 API key
 */
providerCmd
  .command('add-key <provider> <alias> <key>')
  .description('为指定 provider 添加一个 API key')
  .option('-l, --label <label>', '显示名称')
  .option('-m, --models <list>', '逗号分隔的模型列表，如 "V4-Pro,V4-Flash"')
  .option('--base-url <url>', '自定义 API 基础 URL（可选）')
  .action((providerName, alias, key, opts) => {
    const models = opts.models ? opts.models.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const result = providerMgr.addApiKey(providerName, alias, key, opts.label, models, opts.baseUrl);
    result.success
      ? ok(`已为 "${providerName}" 添加 API key "${alias}"`)
      : fail(result.message);
  });

/**
 * provider remove — 删除 provider
 */
providerCmd
  .command('remove <name>')
  .description('删除一个 provider 及其所有 API key')
  .action((name) => {
    const result = providerMgr.removeProvider(name);
    result.success ? ok(`已删除 provider "${name}"`) : fail(result.message);
  });

/**
 * provider remove-key — 删除 API key
 */
providerCmd
  .command('remove-key <provider> <alias>')
  .description('删除指定 provider 下的一个 API key')
  .action((providerName, alias) => {
    const result = providerMgr.removeApiKey(providerName, alias);
    result.success
      ? ok(`已删除 "${providerName}" 下的 API key "${alias}"`)
      : fail(result.message);
  });

/**
 * provider probe — API 连通性测试
 */
providerCmd
  .command('probe <provider> <alias>')
  .description('测试指定 provider / API key 的连通性并获取可用模型列表')
  .option('--json', '以 JSON 格式输出')
  .action(async (providerName, alias, opts) => {
    // 从 ProviderManager 获取 key
    const provider = providerMgr._getProvider(providerName);
    if (!provider) {
      fail(`Provider "${providerName}" 不存在`);
      return;
    }
    const keyEntry = provider.api_keys?.[alias];
    if (!keyEntry) {
      fail(`API key "${alias}" 不存在`);
      return;
    }

    console.log(chalk.gray(`正在探测 ${providerName}/${alias} ...`));
    const result = await probeProvider(providerName, keyEntry.key);

    if (result.success) {
      ok(`连通成功！延迟 ${result.latency_ms}ms，可用模型 ${result.models.length} 个`);
      if (result.models.length > 0) {
        console.log(chalk.bold('\n可用模型：'));
        result.models.forEach((m) => console.log(`  - ${m}`));
      }
      // 自动更新模型列表
      const updateResult = providerMgr.addApiKey(providerName, alias, keyEntry.key, keyEntry.label, result.models);
      if (updateResult.success) {
        console.log(chalk.gray('\n（已自动刷新该 key 的模型列表）'));
      }
    } else {
      fail(`连通失败：${result.error}`);
    }
  });

// ════════════════════════════════════════════════════════════════
// Skill 命令组
// ════════════════════════════════════════════════════════════════

const skillCmd = program
  .command('skill')
  .description('管理 CodeWhale skills');

/**
 * skill list — 列出已安装的 skill
 */
skillCmd
  .command('list')
  .description('列出所有已安装的 skill')
  .option('--json', '以 JSON 格式输出')
  .action((opts) => {
    const skills = skillMgr.listInstalled();
    if (skills.length === 0) {
      console.log(chalk.yellow('（没有安装任何 skill）'));
      console.log(`  使用 ${chalk.cyan('codewhale-tool skill install <id>')} 安装`);
      return;
    }
    console.log(chalk.bold(`\n已安装的 Skill（${skills.length} 个）：`));
    if (opts.json) {
      console.log(JSON.stringify(skills, null, 2));
      return;
    }
    skills.forEach((s) => {
      const status = s.enabled ? chalk.green('✓ 启用') : chalk.gray('✗ 禁用');
      const ver = s.version ? chalk.gray(`v${s.version}`) : '';
      console.log(`  ${status} ${chalk.cyan(s.id.padEnd(22))} ${chalk.gray(s.source.padEnd(10))} ${ver}`);
    });
  });

/**
 * skill show — 查看 skill 详情
 */
skillCmd
  .command('show <id>')
  .description('显示指定 skill 的详细信息（含 SKILL.md）')
  .action((skillId) => {
    const { entry, readme } = skillMgr.show(skillId);
    if (!entry) {
      fail(`Skill "${skillId}" 未安装`);
      return;
    }
    console.log(chalk.bold(`\n${entry.id}`));
    console.log(`  状态:   ${entry.enabled ? chalk.green('启用') : chalk.gray('禁用')}`);
    console.log(`  来源:   ${entry.source}`);
    console.log(`  路径:   ${entry.path}`);
    if (entry.version) console.log(`  版本:   ${entry.version}`);
    if (readme) {
      console.log(chalk.bold('\n─── SKILL.md ───'));
      console.log(readme.slice(0, 2000)); // 截断过长内容
      if (readme.length > 2000) {
        console.log(chalk.gray(`\n...（已截断，全文 ${readme.length} 字符）`));
      }
    }
  });

/**
 * skill install — 安装 skill
 */
skillCmd
  .command('install <id>')
  .description('从社区仓库安装一个 skill')
  .action(async (skillId) => {
    console.log(chalk.gray(`正在安装 skill "${skillId}" ...`));
    const result = await skillMgr.install(skillId);
    result.success ? ok(result.message) : fail(result.message);
  });

/**
 * skill enable — 启用 skill
 */
skillCmd
  .command('enable <id>')
  .description('启用一个 skill')
  .action((skillId) => {
    const result = skillMgr.enable(skillId);
    result.success ? ok(result.message) : fail(result.message);
  });

/**
 * skill disable — 禁用 skill
 */
skillCmd
  .command('disable <id>')
  .description('禁用一个 skill（不删除文件）')
  .action((skillId) => {
    const result = skillMgr.disable(skillId);
    result.success ? ok(result.message) : fail(result.message);
  });

/**
 * skill remove — 删除 skill
 */
skillCmd
  .command('remove <id>')
  .description('删除一个 skill（从磁盘和配置中移除）')
  .action((skillId) => {
    const result = skillMgr.remove(skillId);
    result.success ? ok(result.message) : fail(result.message);
  });

/**
 * skill search — 搜索社区 skill（静态已知列表）
 */
skillCmd
  .command('search [query]')
  .description('搜索社区可用的 skill（从内置已知列表匹配）')
  .action(async (query) => {
    console.log(chalk.gray('正在获取社区 skill 列表 ...'));
    const result = await skillMgr.searchCommunity();
    if (!result.success) {
      fail(result.message);
      return;
    }
    const all = result.skills || [];
    const filtered = query
      ? all.filter((s) => s.id.includes(query.toLowerCase()))
      : all;

    if (filtered.length === 0) {
      console.log(chalk.yellow(`（没有找到匹配 "${query}" 的 skill）`));
      return;
    }
    console.log(chalk.bold(`\n社区可用 Skill（${filtered.length} 个）：`));
    filtered.forEach((s) => {
      console.log(`  ${chalk.cyan(s.id)}`);
    });
    console.log(chalk.gray(`\n使用 ${chalk.cyan('codewhale-tool skill install <id>')} 安装`));
  });

// ─── 启动 ──────────────────────────────────────────────────────

// 确保 active 变量在 program 解析前初始化
const active = engine.getActive();

program.parse();