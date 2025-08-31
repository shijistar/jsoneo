import { defineConfig } from 'father';

export default defineConfig({
  esm: { input: 'src', output: 'es', transformer: 'babel' },
  umd: {
    entry: 'src',
    name: 'JSONeo',
    output: {
      path: 'umd',
      filename: 'jsoneo.min',
    },
  },
  sourcemap: true,
  targets: /* ES2020 */ { chrome: 80 },
});
