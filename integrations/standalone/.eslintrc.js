/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: '../../config/base.eslintrc.js',
  ignorePatterns: ['**/{public,build}'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: 'tsconfig.json'
  }
};
