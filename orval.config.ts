import { defineConfig } from 'orval';

const hooks = { afterAllFilesWrite: 'prettier --write' };
const filters = { tags: ['web-ide'], schemas: [/.*/] };

export default defineConfig({
  openapiDev: {
    input: {
      target: './openapi-dev.yaml',
      filters
    },
    output: './extension/src/engine/api/generated/openapi-dev.ts',
    hooks
  },
  openapiDefault: {
    input: {
      target: './openapi-default.yaml',
      filters
    },
    output: './extension/src/engine/api/generated/openapi-default.ts',
    hooks
  }
});
