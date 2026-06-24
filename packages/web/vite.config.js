import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vite 配置
 *
 * 开发模式下将 /api 请求代理到 Express 后端（端口 3456），
 * 生产模式下由 Express 直接托管 dist/ 静态文件。
 */
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5163,
    proxy: {
      '/api': {
        target: 'http://localhost:3456',
        changeOrigin: true,
      },
    },
  },
  // 构建输出到 dist/，由 Express server.js 托管
  build: {
    outDir: 'dist',
  },
});