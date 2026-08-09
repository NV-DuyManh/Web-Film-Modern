import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [tailwindcss(), react()],
    build: {
        cssCodeSplit: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth', 'firebase/storage'],
                    'vendor-ui': ['framer-motion', 'swiper', 'sweetalert2'],
                    'vendor-icons': ['react-icons/fa', 'react-icons/md', 'react-icons/io5'],
                },
            },
        },
        chunkSizeWarningLimit: 1000,
    },
})
