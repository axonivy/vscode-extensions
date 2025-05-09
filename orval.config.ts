import { defineConfig } from 'orval';

export default defineConfig({
  ivyOpenApi: {
    input: {
      target: 'target/engine/openapi.json',
      filters: { tags: ['web-ide', 'engine'] }
    },
    output: {
      target: 'extension/src/engine/api/generated/client.ts',
      prettier: true
    }
  }
});
