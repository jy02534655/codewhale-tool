
/**
 * Skill Downloader 最终版 - 完整使用示例
 * 
 * 运行方式：
 *   node example-final.mjs
 */

import { downloadSkill, createTerminalProgress } from './skill-downloader-final.mjs';

// ============ 示例 1：最基础用法 ============

async function example1() {
  console.log('=== 示例 1：最基础用法 ===\n');

  const result = await downloadSkill({
    repoUrl: 'https://github.com/vercel-labs/skills',
    skillName: 'find-skills',
    destDir: './skills'  // 保存到 ./skills/find-skills/
  });

  console.log('✅ 下载完成:', result);
}

// ============ 示例 2：自定义保存路径 ============

async function example2() {
  console.log('\n=== 示例 2：自定义保存路径 ===\n');

  const result = await downloadSkill({
    repoUrl: 'https://github.com/vercel-labs/skills',
    skillName: 'find-skills',
    savePath: './my-custom-dir/my-skill'  // 直接指定完整路径
  });

  console.log('✅ 下载完成:', result);
  // 输出: /absolute/path/to/my-custom-dir/my-skill
}

// ============ 示例 3：带进度条显示 ============

async function example3() {
  console.log('\n=== 示例 3：带进度条显示 ===\n');

  const result = await downloadSkill({
    repoUrl: 'https://github.com/vercel-labs/skills',
    skillName: 'find-skills',
    destDir: './skills',
    onProgress: createTerminalProgress()  // 使用内置终端进度条
  });

  console.log('\n✅ 下载完成:', result);
}

// ============ 示例 4：自定义进度回调 ============

async function example4() {
  console.log('\n=== 示例 4：自定义进度回调 ===\n');

  const result = await downloadSkill({
    repoUrl: 'https://github.com/vercel-labs/skills',
    skillName: 'find-skills',
    destDir: './skills',
    onProgress: (info) => {
      // 自定义进度处理
      if (info.stage === 'download') {
        const bar = '█'.repeat(Math.floor((info.percent || 0) / 5)) + 
                    '░'.repeat(20 - Math.floor((info.percent || 0) / 5));
        process.stdout.write(`\r[${bar}] ${info.percent?.toFixed(1) ?? '?'}% | ${info.speedFormatted} | ${info.currentFile ?? ''}`);
      } else if (info.stage === 'complete') {
        process.stdout.write('\n');
      }
    }
  });

  console.log('✅ 下载完成:', result);
}

// ============ 示例 5：使用 GitHub Token ============

async function example5() {
  console.log('\n=== 示例 5：使用 GitHub Token ===\n');

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.log('⚠️ 未设置 GITHUB_TOKEN 环境变量，跳过此示例');
    console.log('   设置方式: export GITHUB_TOKEN=ghp_xxxxxxxxxxxx');
    return;
  }

  const result = await downloadSkill({
    repoUrl: 'https://github.com/vercel-labs/skills',
    skillName: 'find-skills',
    destDir: './token-skills',
    token: token,  // 传入 Token 避免速率限制
    onProgress: createTerminalProgress()
  });

  console.log('\n✅ 下载完成:', result);
}

// ============ 示例 6：使用 HTTP 代理 ============

async function example6() {
  console.log('\n=== 示例 6：使用 HTTP 代理 ===\n');

  const result = await downloadSkill({
    repoUrl: 'https://github.com/vercel-labs/skills',
    skillName: 'find-skills',
    destDir: './proxy-skills',
    proxy: {
      type: 'http',
      host: '127.0.0.1',
      port: 7890
      // 如果代理需要认证：
      // auth: { username: 'user', password: 'pass' }
    },
    onProgress: createTerminalProgress()
  });

  console.log('\n✅ 下载完成:', result);
}

// ============ 示例 7：使用 SOCKS5 代理 ============

async function example7() {
  console.log('\n=== 示例 7：使用 SOCKS5 代理 ===\n');

  const result = await downloadSkill({
    repoUrl: 'https://github.com/vercel-labs/skills',
    skillName: 'find-skills',
    savePath: './socks5-skills/my-skill',
    proxy: {
      type: 'socks5',
      host: '127.0.0.1',
      port: 7898
      // auth: { username: 'user', password: 'pass' }
    },
    onProgress: createTerminalProgress()
  });

  console.log('\n✅ 下载完成:', result);
}

// ============ 示例 8：文件重命名 ============

async function example8() {
  console.log('\n=== 示例 8：文件重命名 ===\n');

  const result = await downloadSkill({
    repoUrl: 'https://github.com/vercel-labs/skills',
    skillName: 'find-skills',
    destDir: './renamed-skills',
    renameMap: {
      'SKILL.md': 'README.md',           // 重命名单个文件
      'assets/': 'resources/'             // 重命名目录
    },
    onProgress: createTerminalProgress()
  });

  console.log('\n✅ 下载完成:', result);
  // 目录中 SKILL.md 变成了 README.md，assets/ 变成了 resources/
}

// ============ 示例 9：函数式重命名 ============

async function example9() {
  console.log('\n=== 示例 9：函数式重命名 ===\n');

  const result = await downloadSkill({
    repoUrl: 'https://github.com/vercel-labs/skills',
    skillName: 'find-skills',
    destDir: './func-skills',
    renameMap: {
      // 函数式重命名：根据原文件名动态决定新名称
      'SKILL.md': (originalName) => originalName.toUpperCase()  // SKILL.md -> SKILL.MD
    },
    onProgress: createTerminalProgress()
  });

  console.log('\n✅ 下载完成:', result);
}

// ============ 示例 10：从环境变量读取配置 ============

async function example10() {
  console.log('\n=== 示例 10：从环境变量读取配置 ===\n');

  const proxyType = process.env.PROXY_TYPE || 'none';
  const proxy = proxyType !== 'none' ? {
    type: proxyType,
    host: process.env.PROXY_HOST || '127.0.0.1',
    port: parseInt(process.env.PROXY_PORT || '7890'),
    auth: process.env.PROXY_USER ? {
      username: process.env.PROXY_USER,
      password: process.env.PROXY_PASS || ''
    } : undefined
  } : { type: 'none' };

  const result = await downloadSkill({
    repoUrl: 'https://github.com/vercel-labs/skills',
    skillName: 'find-skills',
    destDir: './env-skills',
    token: process.env.GITHUB_TOKEN,
    proxy: proxy,
    onProgress: createTerminalProgress()
  });

  console.log('\n✅ 下载完成:', result);
}

// ============ 运行 ============

(async () => {
  // 选择要运行的示例（取消注释即可）

  await example1();  // 基础用法
  // await example2();  // 自定义路径
  // await example3();  // 内置进度条
  // await example4();  // 自定义进度
  // await example5();  // GitHub Token
  // await example6();  // HTTP 代理
  // await example7();  // SOCKS5 代理
  // await example8();  // 文件重命名
  // await example9();  // 函数式重命名
  // await example10(); // 环境变量配置

  console.log('\n🏁 所有示例执行完毕');
})();
