import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [tailwindcss(), react()],
    build: {
        cssCodeSplit: true,
        rollupOptions: {
            // Vercel/Rolldown compatibility: Let Vite handle chunks automatically
        },
        chunkSizeWarningLimit: 1000,
    },
})
