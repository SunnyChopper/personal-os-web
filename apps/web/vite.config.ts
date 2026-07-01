import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';
import { createFrontendLogWriterPlugin } from './vite-plugin-log-writer';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), createFrontendLogWriterPlugin()],
  // Served from CloudFront at https://<host>/admin/ (see github.com/SunnyChopper/personal-os-infra)
  base: '/admin/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('aws-amplify')) return 'vendor-amplify';
          if (id.includes('@excalidraw')) return 'vendor-excalidraw';
          if (id.includes('@xyflow')) return 'vendor-xyflow';
          if (id.includes('katex')) return 'vendor-katex';
          if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
        },
      },
    },
  },
  resolve: {
    alias: {
      // Path alias for src directory
      '@': resolve(__dirname, './src'),
    },
  },
});
