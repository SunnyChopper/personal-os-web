import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
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
  },
  resolve: {
    alias: {
      // Path alias for src directory
      '@': resolve(__dirname, './src'),
    },
  },
});
