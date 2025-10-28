import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

export default [
  // ES Module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: true,
    },
    external: ['react', 'react-dom', '@spa/core', '@spa/types'],
    plugins: [
      peerDepsExternal(),
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declarationDir: './dist',
        declaration: true,
        declarationMap: true,
      }),
    ],
  },
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    external: ['react', 'react-dom', '@spa/core', '@spa/types'],
    plugins: [
      peerDepsExternal(),
      resolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
    ],
  },
];
