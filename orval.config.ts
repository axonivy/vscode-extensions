import { defineConfig } from 'orval';

const hooks = { afterAllFilesWrite: 'prettier --write' };
const filters = { tags: ['web-ide'] };

export default defineConfig({
  openapiDev: {
    input: {
      target: './openapi-dev.yaml',
      filters
    },
    output: './extension/src/engine/api/generated/openapi-dev.ts',
    hooks
  }
});
