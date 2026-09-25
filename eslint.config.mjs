import recommended from '@tiny-codes/code-style-all-in-one/eslint/react-recommended';
import { configs as storybookConfigs } from 'eslint-plugin-storybook';

export default [
  {
    name: 'jsoneo/ignores',
    ignores: [
      '.DS_Store',
      'node_modules/**',
      'coverage/**',
      'lib/**',
      'es/**',
      'es-legacy/**',
      'umd/**',
      'tslib/**',
      'tses/**',
      'public/**',
      '.vscode/**',
      '*.md',
    ],
  },
  ...recommended,
  ...storybookConfigs['flat/recommended'],
];
