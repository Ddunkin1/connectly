import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    // On Vercel, outputDirectory is public/build so site root = /. Use base '/' so assets are /assets/..., not /build/assets/
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
