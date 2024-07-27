import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths'
import svgr from "vite-plugin-svgr";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(),react()],
  base: '/ui/',
  server:{
    port: 3000,
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
      '/api/server':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/status':{
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
      '/states':{
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
      }
    }
  }
})
