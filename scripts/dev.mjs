#!/usr/bin/env node
/**
 * 一体化开发启动脚本
 *
 * 先启动后端 Express 服务器（端口 7000），
 * 等后端就绪后自动启动 Vite 前端开发服务器。
 *
 * 用法：
 *   node scripts/dev.mjs
 */

import { execSync } from 'node:child_process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import http from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const PORT = 7000;

/** Windows 终端切换到 UTF-8 编码 */
const UTF8 = 'chcp 65001 >nul && ';

/** 清理占用端口的旧进程（Windows） */
function killPortProcess(port) {
  try {
    const cmd = `netstat -ano | findstr :${port} `;
    const output = execSync(cmd, { shell: 'powershell.exe', encoding: 'utf-8', timeout: 5000 });
    const pids = new Set();
    for (const line of output.split('\n')) {
      const m = line.trim().match(/(\d+)\s*$/);
      if (m) pids.add(m[1]);
    }
    for (const pid of pids) {
      if (pid === '0') continue; // 跳过系统空闲进程
      execSync(`taskkill /PID ${pid} /F`, { shell: 'powershell.exe', timeout: 5000 });
    }
  } catch { /* 无人占用，跳过 */ }
}

/** 等待后端就绪 */
function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, () => {
        resolve();
      }).on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error('后端启动超时'));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

console.log('🔧 启动后端 (localhost:' + PORT + ') ...');

// 先清理旧进程
killPortProcess(PORT);

// 启动后端（切换到 UTF-8 编码防止乱码）
const backend = spawn('cmd.exe', ['/c', UTF8 + 'node packages/server/index.js'], {
  cwd: root,
  stdio: 'inherit',
});

// 等待后端就绪后启动前端
try {
  await waitForServer('http://localhost:' + PORT + '/api/provider/list');
  console.log('✅ 后端就绪，启动前端 ...');

  const frontend = spawn('cmd.exe', ['/c', UTF8 + 'node ' + join(root, 'node_modules', 'vite', 'bin', 'vite.js') + ' --host --port 7200'], {
    cwd: join(root, 'packages', 'web'),
    stdio: 'inherit',
  });

  frontend.on('close', (code) => {
    backend.kill();
    process.exit(code);
  });
} catch (err) {
  console.error('❌ ' + err.message);
  backend.kill();
  process.exit(1);
}

// 清理
process.on('SIGINT', () => {
  backend.kill();
  process.exit(0);
});
process.on('SIGTERM', () => {
  backend.kill();
  process.exit(0);
});