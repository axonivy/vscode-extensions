import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => {
  const config = {
    plugins: [tsconfigPaths()],
    build: {
      manifest: 'build.manifest.json',
      outDir: '../../extension/dist/webviews/form-editor',
      chunkSizeWarningLimit: 5000
    },
    server: {
      port: 3000,
      open: false
    },
    base: './'
  };
  return config;
});
