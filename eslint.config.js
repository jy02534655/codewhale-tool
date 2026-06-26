/**
 * ESLint 统一配置 — 入口配置
 * 参考：demo/eslint.config.cjs
 *
 * 组合方式：
 *   1. 通用 JS 规则（eslint-common-rules.js）— core、server、web 的 .js 文件
 *   2. Web 模块规则（packages/web/eslint.config.js）— web 的 .vue + .js 文件
 *
 * 如需单独使用某子包配置，VS Code 的 ESLint 扩展会自动发现最近的 eslint.config.js
 */

import js from '@eslint/js';
import globals from 'globals';
import { commonJsRules } from './eslint-common-rules.js';
import webConfig from './packages/web/eslint.config.js';

export default [
  // ========== 全局忽略目录 ==========
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/store.json',
      '**/*.min.js',
      '.git/**',
      '.vite/**',
      'demo/**',
    ],
  },

  // ========== ESLint 官方推荐基础规则 ==========
  js.configs.recommended,

  // ========== 通用 JS 规则（core / server / web 的 .js 文件） ==========
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...commonJsRules,
    },
  },

  // ========== Web 模块配置（导入自 packages/web/） ==========
  ...webConfig,
];