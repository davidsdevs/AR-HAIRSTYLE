import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['three/examples/jsm/loaders/FBXLoader'],
    include: ['three'],
  },
  server: {
    host: true,
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('═'.repeat(60));
            console.error('❌ [VITE PROXY] PROXY ERROR OCCURRED!');
            console.error('❌ [VITE PROXY] Error:', err.message);
            console.error('❌ [VITE PROXY] Request URL:', req.url);
            console.error('❌ [VITE PROXY] Is Node.js server running on port 3001?');
            console.error('═'.repeat(60));
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('═'.repeat(60));
            console.log('📤 [VITE PROXY] FORWARDING REQUEST TO NODE.JS SERVER');
            console.log(`📤 [VITE PROXY] From: http://localhost:5173${req.url}`);
            console.log(`📤 [VITE PROXY] To:   http://localhost:3001${req.url}`);
            console.log(`📤 [VITE PROXY] Method: ${req.method}`);
            console.log('═'.repeat(60));
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('═'.repeat(60));
            console.log('📥 [VITE PROXY] RECEIVED RESPONSE FROM NODE.JS SERVER');
            console.log(`📥 [VITE PROXY] Status: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
            console.log(`📥 [VITE PROXY] For: ${req.method} ${req.url}`);
            console.log('═'.repeat(60));
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
