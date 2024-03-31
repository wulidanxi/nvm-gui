// @ts-check
const lightwing = require('@lightwing/eslint-config').default

module.exports = lightwing(
  {
    ignores: [
      'dist',
      'node_modules',
      '*.svelte',
      '*.snap',
      '*.d.ts',
      'coverage',
      'js_test',
      'local-data',
      'src',
    ],
  },
  {
    rules: {
      'node/prefer-global/process': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
)
