import nodeConfig from '@notify/eslint/node';

export default [
  ...nodeConfig,
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '**/*.js', '**/*.mjs'],
  },
];

