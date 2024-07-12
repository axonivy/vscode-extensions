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
  },
  openapiSystem: {
    input: {
      target: './openapi-system.yaml',
      filters
    },
    output: './extension/src/engine/api/generated/openapi-system.ts',
    hooks
  }
});
