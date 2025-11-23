import reactConfig from '@notify/eslint/react';

export default [
  ...reactConfig,
  {
    ignores: ['.next/*', 'node_modules/', 'dist/'],
  },
];
