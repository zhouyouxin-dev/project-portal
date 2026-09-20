import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // 必须是绝对路径：配合 BrowserRouter，'./' 会让 /project/xxx 去 /project/assets/ 找资源而白屏
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // 生产产物不带 sourcemap，避免源码随构建物一起发布
    sourcemap: false,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // 保留：便于局域网或内网穿透预览。注意这会关闭 Vite 的 Host 头校验，
    // 仅适用于可信网络下的开发，不要用这份配置对公网暴露 dev server
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
