/**
 * @codewhale/cli — CodeWhale 配置管理命令行工具
 *
 * 基于 JSON 存储（store.json），管理官方 API key、Provider、模型。
 * 所有变更自动实时同步到 CodeWhale config.toml。
 */

import { Command } from 'commander';
import chalk from 'chalk';
import {
  ConfigEngine,
  ProviderManager,
  OfficialKeyManager,
  SkillManager,
  SyncManager,
  probeProvider,
} from '@codewhale/core';

const engine = new ConfigEngine();
const providerMgr = new ProviderManager(engine);
const officialKeyMgr = new OfficialKeyManager(engine);
const skillMgr = new SkillManager(engine);
const syncMgr = new SyncManager(engine, providerMgr, officialKeyMgr);

syncMgr.initSync();

function ok(msg) { console.log(chalk.green('✓'), msg); }
function fail(msg) { console.error(chalk.red('✗'), msg); }

const program = new Command();
program
  .name('codewhale-tool')
  .description('CodeWhale 配置管理工具')
  .version('0.2.0')
  .option('-c, --config <path>', '指定 store.json 路径')
  .hook('preAction', (cmd) => {
    if (cmd.opts().config) Object.assign(engine, new ConfigEngine(cmd.opts().config));
  });

// ════════════════════════════════════════════════════════════════
// Provider 命令组
// ════════════════════════════════════════════════════════════════

const providerCmd = program.command('provider').description('管理第三方 Provider');

providerCmd.command('list').description('列出所有 provider').option('--json').action((opts) => {
  const providers = providerMgr.listProviders();
  if (providers.length === 0) { console.log(chalk.yellow('（无配置）')); return; }
  if (opts.json) { console.log(JSON.stringify(providers, null, 2)); return; }
  console.log(chalk.bold(`\n${providers.length} 个 Provider：\n`));
  for (const p of providers) {
    console.log(`  ${p.active ? chalk.green('★') : ' '} ${chalk.bold.cyan(p.id)}`);
    console.log(`    类型: ${p.provider}  |  ${p.label}  |  Key: ${p.api_key_preview}`);
    console.log(`    模型: ${p.models.map((m) => (m.active ? chalk.green(m.name) : m.name)).join(', ')}\n`);
  }
});

providerCmd.command('active').description('当前激活的配置').option('--json').action((opts) => {
  const a = providerMgr.getActiveProvider();
  const m = providerMgr.getActiveModel();
  if (opts.json) { console.log(JSON.stringify({ provider: a, model: m }, null, 2)); return; }
  if (a) {
    console.log(chalk.bold('\n当前：'));
    console.log(`  Provider: ${a.id} (${a.provider})`);
    console.log(`  模型:     ${m ? m.model_name : '(无)'}`);
  } else { console.log(chalk.gray('使用官方 DeepSeek API')); }
});

providerCmd.command('add').requiredOption('--provider <type>').requiredOption('--api-key <key>').option('--label <l>').option('--base-url <url>').option('--models <list>').action((opts) => {
  const models = opts.models ? opts.models.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
  const r = providerMgr.addProvider({ provider: opts.provider, api_key: opts.apiKey, label: opts.label, base_url: opts.baseUrl, models });
  if (r.success) { syncMgr.syncToCodeWhale(); ok(r.message); } else fail(r.message);
});

providerCmd.command('remove <id>').action((id) => {
  const r = providerMgr.removeProvider(id);
  if (r.success) { syncMgr.syncToCodeWhale(); ok('已删除'); } else fail(r.message);
});

providerCmd.command('activate <id>').action((id) => {
  const r = syncMgr.activateAndSync(id);
  r.success ? ok('已激活 ' + id) : fail(r.message);
});

providerCmd.command('deactivate').action(() => {
  const r = syncMgr.deactivateAndSync();
  r.success ? ok('已切换回官方 API') : fail(r.message);
});

providerCmd.command('add-model <id> <model>').action((id, model) => {
  const r = providerMgr.addModel(id, model);
  if (r.success) { syncMgr.syncToCodeWhale(); ok(`已添加模型 "${model}"`); } else fail(r.message);
});

providerCmd.command('remove-model <id> <model>').action((id, model) => {
  const r = providerMgr.removeModel(id, model);
  if (r.success) { syncMgr.syncToCodeWhale(); ok(`已删除 "${model}"`); } else fail(r.message);
});

providerCmd.command('set-model <id> <model>').action((id, model) => {
  const r = syncMgr.setActiveModelAndSync(id, model);
  r.success ? ok(`当前模型 → "${model}"`) : fail(r.message);
});

providerCmd.command('probe <id>').option('--json').action(async (id, opts) => {
  const p = providerMgr.getProvider(id);
  if (!p) { fail(`Provider "${id}" 不存在`); return; }
  console.log(chalk.gray('探测中...'));
  const r = await probeProvider(p.provider, p.api_key, p.base_url);
  if (r.success) {
    ok(`连通！${r.latency_ms}ms，${r.models.length} 个模型`);
    if (!opts.json) r.models.forEach((m) => console.log('  - ' + m));
    else console.log(JSON.stringify(r, null, 2));
  } else fail(r.error);
});

providerCmd.command('sync').action(() => {
  const r = syncMgr.syncToCodeWhale();
  r.success ? ok(r.message) : fail(r.message);
});

providerCmd.command('init-sync').action(() => {
  const r = syncMgr.initSync();
  r.success ? ok(r.message) : fail(r.message);
});

// ════════════════════════════════════════════════════════════════
// 官方 Key 命令组
// ════════════════════════════════════════════════════════════════

const keyCmd = program.command('key').description('管理官方 DeepSeek API key');

keyCmd.command('list').option('--json').action((opts) => {
  const keys = officialKeyMgr.list();
  if (keys.length === 0) { console.log(chalk.yellow('（无官方 API key）')); return; }
  if (opts.json) { console.log(JSON.stringify(keys, null, 2)); return; }
  console.log(chalk.bold(`\n${keys.length} 个官方 Key：\n`));
  for (const k of keys) {
    console.log(`  ${k.active ? chalk.green('★') : ' '} ${chalk.cyan(k.alias)}  ${k.api_key_preview}`);
  }
});

keyCmd.command('add').requiredOption('--api-key <key>').option('--alias <a>', '别名').action((opts) => {
  const r = officialKeyMgr.add({ alias: opts.alias || '默认', api_key: opts.apiKey });
  if (r.success) { syncMgr.syncToCodeWhale(); ok(r.message); } else fail(r.message);
});

keyCmd.command('activate <id>').action((id) => {
  const r = syncMgr.activateOfficialAndSync(id);
  r.success ? ok('已激活') : fail(r.message);
});

keyCmd.command('remove <id>').action((id) => {
  const r = officialKeyMgr.remove(id);
  if (r.success) { syncMgr.syncToCodeWhale(); ok('已删除'); } else fail(r.message);
});

keyCmd.command('alias <id> <alias>').action((id, alias) => {
  const r = officialKeyMgr.updateAlias(id, alias);
  r.success ? ok('别名已更新') : fail(r.message);
});

// ════════════════════════════════════════════════════════════════
// Skill 命令组（保留）
// ════════════════════════════════════════════════════════════════

const skillCmd = program.command('skill').description('管理 Skills');

skillCmd.command('list').option('--json').action((opts) => {
  const skills = skillMgr.listInstalled();
  if (skills.length === 0) { console.log(chalk.yellow('（无 skill）')); return; }
  if (opts.json) { console.log(JSON.stringify(skills, null, 2)); return; }
  skills.forEach((s) => console.log(`  ${s.enabled ? chalk.green('✓') : chalk.gray('✗')} ${chalk.cyan(s.id)}  ${s.source}`));
});

skillCmd.command('install <id>').action(async (id) => {
  console.log(chalk.gray('安装中...'));
  const r = await skillMgr.install(id);
  r.success ? ok(r.message) : fail(r.message);
});

skillCmd.command('enable <id>').action((id) => {
  const r = skillMgr.enable(id);
  r.success ? ok(r.message) : fail(r.message);
});

skillCmd.command('disable <id>').action((id) => {
  const r = skillMgr.disable(id);
  r.success ? ok(r.message) : fail(r.message);
});

skillCmd.command('remove <id>').action((id) => {
  const r = skillMgr.remove(id);
  r.success ? ok(r.message) : fail(r.message);
});

program.parse();
