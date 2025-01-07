import config from '@axonivy/eslint-config';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...config.base,
  // TypeScript configs
  {
    name: 'typescript-eslint',
    languageOptions: {
      parserOptions: {
        project: true, // Uses tsconfig.json from current directory
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  // Project specific configs
  {
    name: 'ignore-files',
    ignores: ['**/scripts/download-*', '**/.vscode-test/*', '**/generated/openapi-*', '**/browser/media/*']
  },
  {
    name: 'vscode/rules',
    rules: {}
  }
);
