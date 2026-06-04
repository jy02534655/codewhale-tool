/**
 * @codewhale/cli — CodeWhale 配置管理命令行工具
 *
 * 基于 JSON 存储（store.json），管理 Provider、模型和 Skill。
 * 所有 provider 变更自动实时同步到 CodeWhale config.toml。
 *
 * @module cli
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  ConfigEngine,
  ProviderManager,
  SkillManager,
  SyncManager,
  probeProvider,
  KNOWN_PROVIDERS,
} from '@codewhale/core';

// ─── 初始化 ────────────────────────────────────────────────────

const engine = new ConfigEngine();
const providerMgr = new ProviderManager(engine);
const skillMgr = new SkillManager(engine);
const syncMgr = new SyncManager(engine, providerMgr);

// 启动时同步
syncMgr.initSync();

// ─── 工具函数 ──────────────────────────────────────────────────

function ok(msg) {
  console.log(chalk.green('✓'), msg);
}

function fail(msg) {
  console.error(chalk.red('✗'), msg);
}

function output(data, useJson) {
  if (useJson) {
    console.log(JSON.stringify(data, null, 2));
  } else if (Array.isArray(data)) {
    data.forEach((item, i) => {
      if (typeof item === 'object') {
        console.log(JSON.stringify(item, null, 2));
      } else {
        console.log(`  ${chalk.cyan(i + 1)}. ${item}`);
      }
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
  .description('CodeWhale 配置管理工具 — provider / 模型 / skill 管理')
  .version('0.2.0')
  .option('-c, --config <path>', '指定 store.json 路径')
  .hook('preAction', (cmd) => {
    const opts = cmd.opts();
    if (opts.config) {
      const newEngine = new ConfigEngine(opts.config);
      Object.assign(engine, newEngine);
    }
  });

// ════════════════════════════════════════════════════════════════
// Provider 命令组
// ════════════════════════════════════════════════════════════════

const providerCmd = program
  .command('provider')
  .description('管理第三方 AI 模型提供方');

// --- provider list ---
providerCmd
  .command('list')
  .description('列出所有 provider')
  .option('--json', '以 JSON 格式输出')
  .action((opts) => {
    const providers = providerMgr.listProviders();
    if (providers.length === 0) {
      console.log(chalk.yellow('（没有配置任何 Provider）'));
      return;
    }
    if (opts.json) {
      console.log(JSON.stringify(providers, null, 2));
      return;
    }
    console.log(chalk.bold(`\n已配置的 Provider（${providers.length} 个）：\n`));
    for (const p of providers) {
      const star = p.active ? chalk.green('★') : ' ';
      console.log(`  ${star} ${chalk.bold.cyan(p.id)}`);
      console.log(`    类型: ${p.provider}  |  Label: ${p.label}`);
      console.log(`    Key:  ${p.api_key_preview}  |  URL: ${p.base_url || '(默认)'}`);
      console.log(`    模型: ${p.models.map((m) => (m.active ? chalk.green(m.name) : m.name)).join(', ')}`);
      console.log();
    }
  });

// --- provider active ---
providerCmd
  .command('active')
  .description('显示当前激活的 provider 和模型')
  .option('--json', '以 JSON 格式输出')
  .action((opts) => {
    const active = providerMgr.getActiveProvider();
    const activeModel = providerMgr.getActiveModel();
    if (opts.json) {
      console.log(JSON.stringify({ provider: active, model: activeModel }, null, 2));
      return;
    }
    console.log(chalk.bold('\n当前活动配置：'));
    if (active) {
      console.log(`  ${chalk.cyan('Provider')}: ${active.id} (${active.provider})`);
      console.log(`  ${chalk.cyan('模型')}    : ${activeModel ? activeModel.model_name : '(无)'}`);
    } else {
      console.log(`  ${chalk.gray('使用官方 DeepSeek API')}`);
    }
  });

// --- provider add ---
providerCmd
  .command('add')
  .description('添加一个新的 provider')
  .requiredOption('--provider <type>', 'provider 类型，如 siliconflow')
  .requiredOption('--api-key <key>', 'API key')
  .option('--label <label>', '显示名称')
  .option('--base-url <url>', '自定义 API 基础 URL')
  .option('--models <list>', '逗号分隔的模型列表，如 "V4-Pro,V4-Flash"')
  .action((opts) => {
    const models = opts.models ? opts.models.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
    const result = providerMgr.addProvider({
      provider: opts.provider,
      api_key: opts.apiKey,
      label: opts.label,
      base_url: opts.baseUrl,
      models,
    });
    if (result.success) {
      syncMgr.syncToCodeWhale();
      ok(result.message);
    } else {
      fail(result.message);
    }
  });

// --- provider remove ---
providerCmd
  .command('remove <id>')
  .description('删除一个 provider')
  .action((id) => {
    const result = providerMgr.removeProvider(id);
    if (result.success) {
      syncMgr.syncToCodeWhale();
      ok(result.message);
    } else {
      fail(result.message);
    }
  });

// --- provider activate ---
providerCmd
  .command('activate <id>')
  .description('激活指定 provider（开启第三方模式）')
  .action((id) => {
    const result = syncMgr.activateAndSync(id);
    result.success ? ok(`已激活 ${id}`) : fail(result.message);
  });

// --- provider deactivate ---
providerCmd
  .command('deactivate')
  .description('关闭第三方模式，切换回官方 API')
  .action(() => {
    const result = syncMgr.deactivateAndSync();
    result.success ? ok('已切换回官方 DeepSeek API') : fail(result.message);
  });

// --- provider add-model ---
providerCmd
  .command('add-model <id> <model>')
  .description('为指定 provider 添加模型')
  .action((id, model) => {
    const result = providerMgr.addModel(id, model);
    if (result.success) {
      syncMgr.syncToCodeWhale();
      ok(`已添加模型 "${model}"`);
    } else {
      fail(result.message);
    }
  });

// --- provider remove-model ---
providerCmd
  .command('remove-model <id> <model>')
  .description('删除指定 provider 下的模型')
  .action((id, model) => {
    const result = providerMgr.removeModel(id, model);
    if (result.success) {
      syncMgr.syncToCodeWhale();
      ok(`已删除模型 "${model}"`);
    } else {
      fail(result.message);
    }
  });

// --- provider set-model ---
providerCmd
  .command('set-model <id> <model>')
  .description('设置当前激活的模型')
  .action((id, model) => {
    const result = syncMgr.setActiveModelAndSync(id, model);
    result.success ? ok(`当前模型 → "${model}"`) : fail(result.message);
  });

// --- provider probe ---
providerCmd
  .command('probe <id>')
  .description('测试指定 provider 的连通性并获取可用模型列表')
  .option('--json', '以 JSON 格式输出')
  .action(async (id, opts) => {
    const p = providerMgr.getProvider(id);
    if (!p) {
      fail(`Provider "${id}" 不存在`);
      return;
    }
    console.log(chalk.gray(`正在探测 ${id} ...`));
    const result = await probeProvider(p.provider, p.api_key, p.base_url);
    if (result.success) {
      ok(`连通成功！延迟 ${result.latency_ms}ms，可用模型 ${result.models.length} 个`);
      if (result.models.length > 0 && !opts.json) {
        console.log(chalk.bold('\n远程可用模型：'));
        result.models.forEach((m) => console.log(`  - ${m}`));
      }
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      }
    } else {
      fail(`连通失败：${result.error}`);
    }
  });

// --- provider sync ---
providerCmd
  .command('sync')
  .description('手动同步到 CodeWhale 配置')
  .action(() => {
    const result = syncMgr.syncToCodeWhale();
    result.success ? ok(result.message) : fail(result.message);
  });

// --- provider init-sync ---
providerCmd
  .command('init-sync')
  .description('从 CodeWhale 配置初始化本地数据')
  .action(() => {
    const result = syncMgr.initSync();
    result.success ? ok(result.message) : fail(result.message);
  });

// ════════════════════════════════════════════════════════════════
// 官方 API Key 命令
// ════════════════════════════════════════════════════════════════

const keyCmd = program
  .command('key')
  .description('管理官方 DeepSeek API key');

keyCmd
  .command('show')
  .description('查看官方 API key（掩码显示）')
  .action(() => {
    const key = engine.getOfficialApiKey();
    if (key) {
      const masked = key.slice(0, 5) + '...' + key.slice(-4);
      console.log(`  官方 API key: ${masked}`);
    } else {
      console.log(chalk.yellow('  （未设置官方 API key）'));
    }
  });

keyCmd
  .command('set <key>')
  .description('设置官方 API key')
  .action((key) => {
    engine.setOfficialApiKey(key);
    syncMgr.syncToCodeWhale();
    ok('官方 API key 已更新');
  });

// ════════════════════════════════════════════════════════════════
// Skill 命令组
// ════════════════════════════════════════════════════════════════

const skillCmd = program
  .command('skill')
  .description('管理 CodeWhale skills');

skillCmd
  .command('list')
  .description('列出所有已安装的 skill')
  .option('--json', '以 JSON 格式输出')
  .action((opts) => {
    const skills = skillMgr.listInstalled();
    if (skills.length === 0) {
      console.log(chalk.yellow('（没有安装任何 skill）'));
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

skillCmd
  .command('show <id>')
  .description('显示指定 skill 的详细信息')
  .action((skillId) => {
    const { entry, readme } = skillMgr.show(skillId);
    if (!entry) {
      fail(`Skill "${skillId}" 未安装`);
      return;
    }
    console.log(chalk.bold(`\n${entry.id}`));
    console.log(`  状态: ${entry.enabled ? chalk.green('启用') : chalk.gray('禁用')}`);
    console.log(`  来源: ${entry.source}`);
    console.log(`  路径: ${entry.path}`);
    if (entry.version) console.log(`  版本: ${entry.version}`);
    if (readme) {
      console.log(chalk.bold('\n─── SKILL.md ───'));
      console.log(readme.slice(0, 2000));
      if (readme.length > 2000) {
        console.log(chalk.gray(`\n...（已截断，全文 ${readme.length} 字符）`));
      }
    }
  });

skillCmd
  .command('install <id>')
  .description('从社区仓库安装一个 skill')
  .action(async (skillId) => {
    console.log(chalk.gray(`正在安装 "${skillId}" ...`));
    const result = await skillMgr.install(skillId);
    result.success ? ok(result.message) : fail(result.message);
  });

skillCmd
  .command('enable <id>')
  .description('启用一个 skill')
  .action((skillId) => {
    const result = skillMgr.enable(skillId);
    result.success ? ok(result.message) : fail(result.message);
  });

skillCmd
  .command('disable <id>')
  .description('禁用一个 skill')
  .action((skillId) => {
    const result = skillMgr.disable(skillId);
    result.success ? ok(result.message) : fail(result.message);
  });

skillCmd
  .command('remove <id>')
  .description('删除一个 skill')
  .action((skillId) => {
    const result = skillMgr.remove(skillId);
    result.success ? ok(result.message) : fail(result.message);
  });

skillCmd
  .command('search [query]')
  .description('搜索社区 skill')
  .action(async (query) => {
    console.log(chalk.gray('正在获取社区 skill 列表 ...'));
    const result = await skillMgr.searchCommunity();
    if (!result.success) {
      fail(result.message);
      return;
    }
    let skills = result.skills;
    if (query) {
      const q = query.toLowerCase();
      skills = skills.filter((s) => s.id.toLowerCase().includes(q));
    }
    console.log(chalk.bold(`\n社区 Skill（${skills.length} 个）：`));
    skills.forEach((s) => {
      console.log(`  ${chalk.cyan(s.id.padEnd(22))} ${s.description || ''}`);
    });
  });

// ─── 启动 ──────────────────────────────────────────────────────

program.parse();
