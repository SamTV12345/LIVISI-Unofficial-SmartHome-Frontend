import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const target = {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
    secure: false
}
// https://vitejs.dev/config/
export default defineConfig({
    base:'/ui/',
    plugins: [react()],
    server:{
        proxy:{
            '/websocket': target,
            '/usb_storage': target,
            '/unmount': target,
            '/status': target,
            '/states': target,
            '/device': target,
            '/capability': target,
            '/message':target,
            '/interaction':target,
            '/hash':target,
            '/api/server': target
        }
    }
})
