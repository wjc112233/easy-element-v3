const { resolve, relative } = require('path')
const exec = require("child_process").exec;
const glob = require('fast-glob')
const { rollup } = require('rollup')
const alias = require('@rollup/plugin-alias')
const fs = require('fs/promises')
const Vue = require('@vitejs/plugin-vue')
const VueJsx = require('@vitejs/plugin-vue-jsx')
const NodeResolve = require('@rollup/plugin-node-resolve').default
const Commonjs = require('@rollup/plugin-commonjs')
const esbuild = require('rollup-plugin-esbuild').default
const Postcss = require('rollup-plugin-postcss')

const pkgJson = require('../package.json')

const projRoot = resolve(__dirname, '..')
const srcRoot = resolve(projRoot, 'src')
const outDir = resolve(projRoot, 'dist')

const buildFile = async () => {
  const peerDependencies = Object.keys(pkgJson.peerDependencies)
  const bundle = await rollup({
    input: resolve(projRoot, 'src/index.ts'),
    plugins: [
      alias({
        entries: [
          {
            find: '@',
            replacement: srcRoot,
          },
        ],
      }),
      Vue({
        isProduction: false,
      }),
      VueJsx(),
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
      }),
    ],
    treeshake: false,
    external: (id) => {
      return peerDependencies.some((pkg) => {
        return pkg === id || id.startsWith(`${pkg}/`)
      })
    },
  })
  return bundle.write({
    format: 'esm',
    dir: outDir,
    preserveModules: true,
    preserveModulesRoot: srcRoot,
    exports: undefined,
    entryFileNames: `[name].mjs`,
  })
}

const buildTypes = async () => {
  return new Promise((resolve) => {
    exec('vue-tsc --declaration --emitDeclarationOnly', async (err) => {
      if (err) {
        console.log('build types error!')
        console.error(err)
        return
      }

      const filePaths = await glob('**/*.ts', {
        cwd: outDir,
        absolute: true,
        onlyFiles: true,
      })

      let content
      let isChange = false
      for (const path of filePaths) {
        content = await fs.readFile(path, 'utf8')
        content = content.replace(/(?<=from\s')@/g, (s) => {
          isChange = true
          return relative(path, outDir).split('\\').slice(0, -1).join('/')
        })
        if (isChange) {
          fs.writeFile(path, content, 'utf8')
        }
        isChange = false
      }

      resolve()
    });
  })
}

const buildPackageJson = async () => {
  fs.writeFile(resolve(outDir, 'package.json'), JSON.stringify({
    name: pkgJson.name,
    version: pkgJson.version,
    description: pkgJson.description,
    main: 'index.mjs',
    module: 'index.mjs',
    author: pkgJson.author,
    license: pkgJson.license,
    peerDependencies: pkgJson.peerDependencies
  }, null, 2), 'utf8')
}

+(async () => {
  await buildTypes()
  await buildFile()
  buildPackageJson()
})()
