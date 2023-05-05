/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: '../../config/base.eslintrc.js',
  ignorePatterns: ['**/{public,build}', 'playwright.config.ts'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: 'dev.tsconfig.json'
  }
};
