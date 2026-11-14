import { defineConfig } from 'vitest/config'
import type { Connect } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readdirSync, copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
const appFallback: Connect.NextHandleFunction = (request, _response, next) => {
  const path = request.url?.split('?')[0] || ''
  if (
    path.startsWith('/app/') &&
    !path.includes('.') &&
    request.headers.accept?.includes('text/html')
  ) {
    request.url = '/app/index.html'
  }
  next()
}
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'preserve-landing',
      configureServer(server) {
        server.middlewares.use(appFallback)
      },
      configurePreviewServer(server) {
        server.middlewares.use(appFallback)
      },
      closeBundle() {
        for (const file of readdirSync('.')) {
          if (
            /\.(html|css|js|jpeg|jpg|png|svg|ico|pdf|xml|txt)$/.test(file) &&
            !file.endsWith('.config.js')
          ) {
            copyFileSync(file, resolve('dist', file))
          }
        }
      },
    },
  ],
  server: { proxy: { '/api': process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000' } },
  build: { rollupOptions: { input: resolve('app/index.html') } },
  test: { environment: 'jsdom', include: ['app/tests/**/*.test.ts'], clearMocks: true },
})
