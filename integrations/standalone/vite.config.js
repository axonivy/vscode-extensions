/** @type {import('vite').UserConfig} */
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => {
  const config = {
    plugins: [react(), tsconfigPaths()],
    build: { outDir: 'build', chunkSizeWarningLimit: 5000 },
    server: { port: 3000, open: true },
    resolve: {
      alias: { path: 'path-browserify' }
    },
    base: './',
    optimizeDeps: {
      needsInterop: [
        'monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp.js',
        'monaco-editor/esm/vs/editor/standalone/browser/inspectTokens/inspectTokens.js'
      ]
    }
  };
  if (process.env.MOCK) {
    config.build.rollupOptions = { input: { app: './mock.html' } };
    config.server.open = false;
  }
  if (process.env.VSCODE) {
    config.build.rollupOptions = { input: { app: './vscode.html' } };
    config.server.open = false;
  }
  return config;
});
