import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxt/test-utils',
    '@nuxt/hints'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  build: {
    transpile: ['vue3-apexcharts']
  },

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  vite: {
    plugins: [
      wasm(),
      topLevelAwait(),
      {
        name: 'watch-assemblyscript',
        configureServer(server) {
          server.watcher.add(resolve(process.cwd(), './assembly'))
        },
        handleHotUpdate({ file, server }) {
          if (file.endsWith('.ts') && file.includes('/assembly/')) {
            console.log('Recompiling AssemblyScript...')
            try {
              execSync('pnpm run asbuild:release', { stdio: 'inherit' })
              server.ws.send({ type: 'full-reload' })
              return []
            } catch (e) {
              console.error('AssemblyScript build failed', e)
            }
          }
        }
      }
    ]
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
