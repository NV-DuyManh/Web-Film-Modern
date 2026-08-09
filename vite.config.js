import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [tailwindcss(), react()],
    build: {
        cssCodeSplit: true,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('firebase')) return 'vendor-firebase';
                        if (id.includes('swiper')) return 'vendor-swiper';
                        if (id.includes('@mui') || id.includes('@emotion')) return 'vendor-mui';
                        if (id.includes('sweetalert2')) return 'vendor-sweetalert';
                        if (id.includes('artplayer') || id.includes('hls.js') || id.includes('react-player')) return 'vendor-player';
                        if (id.includes('xlsx')) return 'vendor-xlsx';
                        if (id.includes('framer-motion')) return 'vendor-framer-motion';
                    }
                }
            }
        },
        chunkSizeWarningLimit: 1000,
    },
})
