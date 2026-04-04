import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import { playwright } from '@vitest/browser-playwright'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(),react()],
  test: {
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.browser.test.{ts,tsx}'],
    onConsoleLog(log) {
      if (
        log.includes('Documentation: https://mswjs.io/docs') ||
        log.includes('Found an issue? https://github.com/mswjs/msw/issues') ||
        log.includes('Worker script URL:') ||
        log.includes('Worker scope:') ||
        log.includes('Client ID:') ||
        log.includes('Request {') ||
        log.includes('Handler: HttpHandler {') ||
        log.includes('Response {') ||
        log.includes('[MSW] Mocking disabled.') ||
        log.includes('i18next is maintained with support from Locize')
      ) {
        return false
      }
    },
    browser: {
      enabled: false,
      provider: playwright(),
      instances: [{ browser: 'chromium' }]
    }
  },
  base: '/ui/',
  server:{
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/websocket':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/login':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/usb_storage': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api/server':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api-docs':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/service': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/status':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/device':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/location':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/capability':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/message':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/product':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/interaction':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/hash':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/action':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/userstorage':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api/all': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/images': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
        '/resources': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
      '/email':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/sentry':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/data/capability':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
      }
    }
})
