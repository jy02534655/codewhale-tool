#!/usr/bin/env node
const { rmSync, existsSync } = require('node:fs');
const { execSync } = require('node:child_process');
const path = require('node:path');

for (const f of ['fix-skill-patch.mjs', 'test-skill-fallback.mjs']) {
  const fp = path.resolve(f);
  if (existsSync(fp)) {
    rmSync(fp);
    console.log('Removed:', f);
  }
}
const selfPath = path.resolve('_clear-temp.mjs');
rmSync(selfPath);
execSync('git add -u', { stdio: 'inherit' });
execSync('git diff --cached --stat', { stdio: 'inherit' });
execSync('git commit -m "fix: degit 回退 + codeload URL 修正, 清理辅助脚本"', { stdio: 'inherit' });
execSync('git log --oneline -1', { stdio: 'inherit' });