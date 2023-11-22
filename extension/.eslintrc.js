/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: '../config/base.eslintrc.json',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: 'tsconfig.json'
  }
};
