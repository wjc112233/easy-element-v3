const { resolve } = require('path')
const { rollup } = require('rollup')
const alias = require('@rollup/plugin-alias')
const Vue = require('rollup-plugin-vue')
const NodeResolve = require('@rollup/plugin-node-resolve').default
const Commonjs = require('@rollup/plugin-commonjs')
const esbuild = require('rollup-plugin-esbuild').default
const Postcss = require('rollup-plugin-postcss')

const pkgJson = require('../package.json')

const projRoot = resolve(__dirname, '..')

const buildFile = async () => {
  const peerDependencies = Object.keys(pkgJson.peerDependencies)
  const bundle = await rollup({
    input: resolve(projRoot, 'src/index.ts'),
    plugins: [
      alias({
        entries: [
          {
            find: '@',
            replacement: resolve(projRoot, 'src'),
          },
        ],
      }),
      Vue({
        isProduction: false,
      }),
      Postcss(),
      NodeResolve({
        extensions: ['.mjs', '.js', '.json', '.ts'],
      }),
      Commonjs(),
      esbuild({
        sourceMap: true,
        target: 'es2018',
        loaders: {
          '.vue': 'ts',
        },
        jsxFactory: 'h',
      }),
    ],
    external: (id) => {
      return peerDependencies.some((pkg) => {
        return pkg === id || id.startsWith(`${pkg}/`)
      })
    },
  })
  bundle.write({
    name: 'EasyElement',
    format: 'iife',
    dir: resolve(projRoot, 'dist/'),
    exports: undefined,
    globals: {
      vue: 'Vue',
      'element-plus': 'ElementPlus',
      'lodash-es': '_',
    },
  })
}

buildFile()
