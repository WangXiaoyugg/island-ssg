import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/node/cli.ts', 'src/node/index.ts', 'src/node/dev.ts'],
  clean: true,
  bundle: true,
  splitting: true,
  outDir: 'dist',
  format: ['cjs', 'esm'],
  dts: true,
  shims: true,
  minify: process.env.NODE_ENV === 'production'
  // banner: {
  //   js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);'
  // }
});
