/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: 'config/base.eslintrc.js',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: 'tsconfig.json'
  }
};
