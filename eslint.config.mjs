import typescript from '@tiny-codes/code-style-all-in-one/eslint/typescript';

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
      '.storybook/**',
      '*.md',
    ],
  },
  ...typescript,
];
