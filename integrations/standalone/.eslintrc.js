/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['react-app'],
  ignorePatterns: ['**/{node_modules,public,build}', 'playwright.config.ts'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: 'dev.tsconfig.json'
  }
};
