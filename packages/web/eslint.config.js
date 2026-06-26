/**
 * @codewhale/web — ESLint 校验配置
 *
 * 继承根目录的通用 JS 规则 + Vue 3 SFC 校验
 * 在 VS Code 中打开 packages/web/ 时自动生效
 *
 * 如需 unplugin-auto-import 支持，取消下方注释并：
 *   1. 安装 unplugin-auto-import（npm install -D unplugin-auto-import）
 *   2. 在 vite.config.js 中配置 AutoImport 插件
 *   3. 取消下方 autoImportGlobals 的引用
 */

import vuePlugin from 'eslint-plugin-vue';
import globals from 'globals';

// 从共享模块导入通用 JS 规则
import { commonJsRules } from '../../eslint-common-rules.js';

/* ---- unplugin-auto-import 生成的全局变量声明（按需启用） ---- */
// import autoImportGlobals from './.eslintrc-auto-import.json';

export default [
  // ========== 忽略目录 ==========
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '.vite/**',
    ],
  },

  // ========== Vue 3 SFC 必备规则（仅作用于 .vue 文件） ==========
  ...vuePlugin.configs['flat/essential'],

  // ========== 自定义规则（作用于 JS + Vue 文件） ==========
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        /* ---- unplugin-auto-import 引入的全局函数 ---- */
        // ...autoImportGlobals.globals,
      },
    },
    rules: {
      /* ---- 通用 JS 规则（继承自根配置） ---- */
      ...commonJsRules,

      /* ==================== Vue 3 SFC 专属规则 ==================== */

      // Vue 模板属性排序约定
      'vue/attributes-order': 'warn',
      // 限制模板里每行最多多少个属性（单行/多行模式下不同）
      'vue/max-attributes-per-line': [
        0,
        {
          singleline: 10,
          multiline: {
            max: 1,
            allowFirstLine: false,
          },
        },
      ],
      // 约束/规范自闭合标签（如 <img />）的写法
      'vue/html-self-closing': [
        'error',
        {
          html: {
            void: 'any',
            normal: 'any',
            component: 'any',
          },
          svg: 'any',
          math: 'any',
        },
      ],
      // 在单行元素的内容前后需要换行符（关闭）
      'vue/singleline-html-element-content-newline': 'off',
      // 解析错误配置
      'vue/no-parsing-error': [2, { 'invalid-first-character-of-tag-name': false }],
      // 不要把 v-if 和 v-for 用在同一个元素上——因为v-for 比 v-if 具有更高的优先级
      'vue/no-use-v-if-with-v-for': 2,
      // 在多行元素的内容之前和之后需要换行符（关闭）
      'vue/multiline-html-element-content-newline': 'off',
      // JS/JSX中的组件名应该始终是帕斯卡命名法（关闭）
      'vue/name-property-casing': [0, 'PascalCase'],
      // 模板关闭括号换行规则（关闭）
      'vue/html-closing-bracket-newline': [
        0,
        {
          singleline: 'never',
          multiline: 'always',
        },
      ],
      // 禁止在 computed 中做副作用（关闭）
      'vue/no-side-effects-in-computed-properties': 0,
      // 禁止未使用的组件（warn）
      'vue/no-unused-components': 1,
      // 禁止使用未声明的变量
      'vue/no-unused-vars': 1,
      // 关闭对 v-model 参数语法的限制
      'vue/no-v-model-argument': 'off',
      // 关闭要求默认 prop 的校验
      'vue/require-default-prop': 0,
      // 关闭多单词组件名命名约束
      'vue/multi-word-component-names': 0,
      // 允许属性名不强制使用连字符风格
      'vue/attribute-hyphenation': 0,
      // 允许 v-on 事件名不强制使用连字符风格
      'vue/v-on-event-hyphenation': 0,
      // eslint-plugin-vue 新版本规则名替换：component-tags-order -> order-in-components
      'vue/order-in-components': [
        1,
        {
          order: ['template', 'script', 'style'],
        },
      ],
      // Vue SFC 的 <script> 缩进规则（只影响脚本段落的缩进风格）
      'vue/script-indent': [0, 2, { baseIndent: 1, switchCase: 1 }],
    },
  },
];