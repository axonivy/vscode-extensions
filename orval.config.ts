import { defineConfig } from 'orval';

export default defineConfig({
  openapiDev: {
    input: './openapi-dev.yaml',
    output: './extension/src/engine/api/generated/openapi-dev.ts',
    hooks: {
      afterAllFilesWrite: 'prettier --write'
    }
  },
  openapiSystem: {
    input: './openapi-system.yaml',
    output: './extension/src/engine/api/generated/openapi-system.ts',
    hooks: {
      afterAllFilesWrite: 'prettier --write'
    }
  }
});
