import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

function vercelAiDevPlugin() {
    return {
        name: 'vercel-ai-dev-plugin',
        configureServer(server) {
            server.middlewares.use('/api/ai/chat', async (req, res) => {
                if (req.method === 'POST') {
                    let body = '';
                    req.on('data', chunk => { body += chunk; });
                    req.on('end', async () => {
                        try {
                            const { default: handler } = await import('./api/ai/chat.js');
                            const parsedBody = body ? JSON.parse(body) : {};
                            const mockReq = { method: 'POST', body: parsedBody };
                            const mockRes = {
                                statusCode: 200,
                                setHeader: (k, v) => res.setHeader(k, v),
                                status: function(code) { this.statusCode = code; return this; },
                                json: function(data) {
                                    res.statusCode = this.statusCode;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.end(JSON.stringify(data));
                                },
                                end: (data) => res.end(data)
                            };
                            await handler(mockReq, mockRes);
                        } catch (err) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ success: false, error: err.message }));
                        }
                    });
                } else if (req.method === 'OPTIONS') {
                    res.statusCode = 200;
                    res.end();
                } else {
                    res.statusCode = 405;
                    res.end();
                }
            });
        }
    };
}

export default defineConfig({
    plugins: [
        tailwindcss(), 
        react(),
        vercelAiDevPlugin(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'robots.txt', 'sitemap.xml'],
            workbox: {
                disableDevLogs: true,
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
                // Không cache navigation requests (index.html) - luôn lấy từ network
                navigateFallback: null,
                runtimeCaching: [
                    {
                        // Cache các file assets có hash (JS, CSS) - immutable
                        urlPattern: /\/assets\/.*\.(js|css|woff2?|ttf|eot)$/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'assets-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 năm
                            },
                        },
                    },
                    {
                        // Cache hình ảnh
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'images-cache',
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 ngày
                            },
                        },
                    },
                ],
            },
            manifest: {
                name: 'MFILM - Phim online chất lượng cao',
                short_name: 'MFILM',
                description: 'Trang web xem phim online chất lượng cao, cập nhật nhanh nhất.',
                theme_color: '#0a0a0f',
                background_color: '#0a0a0f',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            devOptions: {
                enabled: false
            }
        })
    ],
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
