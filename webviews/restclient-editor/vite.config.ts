import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  plugins: [react()],
  build: {
    manifest: 'build.manifest.json',
    outDir: '../../extension/dist/webviews/restclient-editor',
    chunkSizeWarningLimit: 5000
  },
  resolve: {
    dedupe: ['react', 'react-dom', 'i18next', 'react-i18next', '@tanstack/react-query']
  },
  server: {
    port: 3001,
    open: false
  },
  base: './'
}));
