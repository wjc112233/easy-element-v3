const { resolve } = require('path')
const { rollup } = require('rollup')
const Serve = require('rollup-plugin-serve')
const alias = require('@rollup/plugin-alias')
const Livereload = require('rollup-plugin-livereload')
const Vue = require('rollup-plugin-vue')
const NodeResolve = require('@rollup/plugin-node-resolve').default
const Commonjs = require('@rollup/plugin-commonjs')
const esbuild = require('rollup-plugin-esbuild').default
const Postcss = require('rollup-plugin-postcss')
const Eslint = require('@rollup/plugin-eslint')

const pkgJson = require('../package.json')

const projRoot = resolve(__dirname, '..')

const buildFile = async() => {
  const peerDependencies = Object.keys(pkgJson.peerDependencies)
  const bundle = await rollup({
    input: 'src/index.ts',
    watch: {
      include: ['src/**']
    },
    plugins: [
      alias({
        entries: [
          {
            find: '@',
            replacement: resolve(projRoot, 'src')
          }
        ]
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
      Serve({
        port: 3000,
        contentBase: 'example',
      }),
      Livereload('example'),
      Eslint({ fix: true })
    ],
    external: id => {
      return peerDependencies.some(pkg => {
        return pkg === id || id.startsWith(`${pkg}/`)
      })
    },
  })
  bundle.write({
    name: 'EasyElement',
    format: 'iife',
    dir: resolve(projRoot, 'example/'),
    exports: undefined,
    globals: {
      vue: 'Vue',
      'element-plus': 'ElementPlus',
      'lodash-es': '_'
    }
  })
}

buildFile()