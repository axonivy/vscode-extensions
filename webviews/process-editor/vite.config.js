/** @type {import('vite').UserConfig} */
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => {
  const config = {
    plugins: [tsconfigPaths()],
    build: {
      manifest: 'build.manifest.json',
      outDir: '../dist/process-editor',
      chunkSizeWarningLimit: 5000
      // rollupOptions: {
      //   output: {
      //     manualChunks: id => {
      //       if (id.includes('@axonivy/inscription')) {
      //         return 'inscription';
      //       }
      //     }
      //   }
      // },
      // sourcemap: 'inline'
    },
    server: {
      port: 3000,
      open: false,
      sourcemapIgnoreList(sourcePath, sourcemapPath) {
        return sourcePath.includes('node_modules') && !sourcePath.includes('@eclipse-glsp') && !sourcePath.includes('@axonivy');
      }
    },
    resolve: { alias: { path: 'path-browserify' } },
    base: './',
    optimizeDeps: {
      needsInterop: [
        'monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp.js',
        'monaco-editor/esm/vs/editor/standalone/browser/inspectTokens/inspectTokens.js'
      ]
    }
  };
  return config;
});
