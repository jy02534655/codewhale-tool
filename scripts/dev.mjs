#!/usr/bin/env node
/**
 * 一体化开发启动脚本
 *
 * 先启动后端 Express 服务器（端口 3456），
 * 等后端就绪后自动启动 Vite 前端开发服务器。
 *
 * 用法：
 *   node scripts/dev.mjs
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import http from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const PORT = 3456;

/** 等待后端就绪 */
function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
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

// 启动后端
const backend = spawn('node', ['packages/server/index.js'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

// 等待后端就绪后启动前端
try {
  await waitForServer('http://localhost:' + PORT + '/api/provider/list');
  console.log('✅ 后端就绪，启动前端 ...');

  const frontend = spawn('npx', ['vite', '--host', '--port', '5163'], {
    cwd: join(root, 'packages', 'web'),
    stdio: 'inherit',
    shell: true,
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