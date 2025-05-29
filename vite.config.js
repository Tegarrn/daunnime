import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to avoid CORS and 403 issues
      '/api': {
        target: 'https://animek-api-ten.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/api/, '');
          console.log(`🔄 Rewriting path: ${path} -> ${newPath}`);
          return newPath;
        },
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('❌ Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`📡 Proxying: ${req.method} ${req.url} -> https://animek-api-ten.vercel.app${proxyReq.path}`);
            // Add headers to make request look like it's coming from browser
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            proxyReq.setHeader('Accept', 'application/json, text/plain, */*');
            proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9,id;q=0.8');
            proxyReq.setHeader('Referer', 'https://otakudesu.cloud/');
            proxyReq.setHeader('Cache-Control', 'no-cache');
            // Remove problematic headers that might cause 403
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('host');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`📥 Proxy response: ${proxyRes.statusCode} for ${req.url}`);
          });
        },
      },
    },
  },
  build: {
    sourcemap: true,
  },
})