/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['react-app'],
  ignorePatterns: ['**/{node_modules,lib}'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: 'tsconfig.json'
  }
};
