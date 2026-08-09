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
                        if (id.includes('react')) return 'vendor-react';
                        if (id.includes('firebase')) return 'vendor-firebase';
                        if (id.includes('framer-motion')) return 'vendor-framer-motion';
                        if (id.includes('swiper')) return 'vendor-swiper';
                        return 'vendor';
                    }
                }
            }
        },
        chunkSizeWarningLimit: 1000,
    },
})
