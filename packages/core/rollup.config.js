import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';

export default [
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/spa.esm.js',
      format: 'es',
      sourcemap: true,
    },
    external: [],
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declarationDir: './dist',
        declaration: true,
        declarationMap: true,
      }),
    ],
  },
  // UMD build for browsers
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/spa.umd.js',
      format: 'umd',
      name: 'SPA',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
  },
  // CommonJS build for Node.js
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/spa.cjs.js',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
  },
];