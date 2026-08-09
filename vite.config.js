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
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
                        if (id.includes('firebase')) return 'vendor-firebase';
                        if (id.includes('framer-motion') || id.includes('swiper') || id.includes('sweetalert2')) return 'vendor-ui';
                        if (id.includes('react-icons')) return 'vendor-icons';
                        return 'vendor';
                    }
                }
            },
        },
        chunkSizeWarningLimit: 1000,
    },
})
