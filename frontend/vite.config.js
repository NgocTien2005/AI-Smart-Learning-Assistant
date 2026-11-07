import react from '@vitejs/plugin-react'
import process from 'node:process'
import { defineConfig } from 'vitest/config'
export default defineConfig({
  plugins: [react()],
  server: {
    strictPort: true,
    proxy: {
      '/api': { target: process.env.DEV_API_PROXY_TARGET || 'http://127.0.0.1:8080', changeOrigin: true },
    },
  },
  test: { environment: 'jsdom', environmentOptions: { jsdom: { url: 'http://localhost/' } }, setupFiles: ['./src/testSetup.js'] },
})
