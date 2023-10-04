/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: '../config/base.eslintrc.js',
  ignorePatterns: ['playwright.config.ts'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: 'tsconfig.json'
  },
  rules: {
    'import/no-unresolved': 'off'
  }
};
