/// <reference types="vitest" />
import { join } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePluginDoubleshot } from 'vite-plugin-doubleshot'

type PackageTarget = 'win' | 'mac' | 'linux'
type ElectronBuilderCliOptions = Record<string, string[] | boolean | 'never'>

function resolvePackageTarget(mode: string): PackageTarget | null {
  if (mode === 'win' || mode === 'mac' || mode === 'linux')
    return mode

  return null
}

function resolveElectronBuilderCliOptions(target: PackageTarget | null): ElectronBuilderCliOptions | undefined {
  if (!target)
    return undefined

  if (target === 'mac') {
    return {
      publish: 'never',
      mac: [],
      x64: true,
      arm64: true,
    }
  }

  return {
    publish: 'never',
    [target]: [],
  }
}

export default defineConfig(({ mode }) => {
  const packageTarget = resolvePackageTarget(mode)
  if (packageTarget)
    process.env.NVM_GUI_BUILD_TARGET = packageTarget
  const electronBuilderCliOptions = resolveElectronBuilderCliOptions(packageTarget)

  return {
    root: join(__dirname, 'src/render'),
    define: {
      __Admin_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    plugins: [
      vue(),
      VitePluginDoubleshot({
        type: 'electron',
        main: 'dist/main/index.js',
        entry: 'src/main/index.ts',
        outDir: 'dist/main',
        external: ['electron'],
        electron: {
          build: {
            config: './electron-builder.config.js',
            cliOptions: electronBuilderCliOptions,
          },
          preload: {
            entry: 'src/preload/index.ts',
            outDir: 'dist/preload',
          },
        },
      }),
    ],
    resolve: {
      alias: {
        '@render': join(__dirname, 'src/render'),
        '@main': join(__dirname, 'src/main'),
        '@common': join(__dirname, 'src/common'),
      },
    },
    base: './',
    build: {
      outDir: join(__dirname, 'dist/render'),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'naive-ui': ['naive-ui'],
            'vue-vendor': ['vue', 'vue-router', 'pinia', 'pinia-plugin-persistedstate'],
          },
        },
      },
    },
  }
})
