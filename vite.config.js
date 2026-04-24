import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    base: process.env.VERCEL ? '/' : '/build/',
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/main.jsx'],
            refresh: true,
        }),
        react({
            jsxRuntime: 'automatic',
        }),
        tailwindcss(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    // Vendor: React core
                    if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                        return 'vendor-react';
                    }
                    // Vendor: Router
                    if (id.includes('node_modules/react-router')) {
                        return 'vendor-router';
                    }
                    // Vendor: TanStack Query
                    if (id.includes('node_modules/@tanstack')) {
                        return 'vendor-query';
                    }
                    // Vendor: misc (pusher, echo, axios, zustand, etc.)
                    if (id.includes('node_modules')) {
                        return 'vendor-misc';
                    }
                    // Admin chunk — lazy-loaded admin pages
                    if (id.includes('/pages/Admin/')) {
                        return 'chunk-admin';
                    }
                    // Messages chunk — heavy with many sub-components
                    if (id.includes('/pages/Messages') || id.includes('/components/messages/')) {
                        return 'chunk-messages';
                    }
                    // Communities chunk
                    if (id.includes('/pages/Communit')) {
                        return 'chunk-communities';
                    }
                    // Profile chunk
                    if (id.includes('/pages/Profile') || id.includes('/pages/Analytics')) {
                        return 'chunk-profile';
                    }
                },
            },
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5174,
        proxy: {
            '/api': {
                target: process.env.VITE_API_PROXY_TARGET || 'http://localhost',
                changeOrigin: true,
            },
        },
        hmr: {
            host: 'localhost',
            port: 5174,
        },
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});
