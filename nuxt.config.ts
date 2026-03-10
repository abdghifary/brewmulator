import { execSync } from 'node:child_process'
import { resolve } from 'node:path'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxt/test-utils',
    '@nuxt/hints'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'dark'
  },

  build: {
    transpile: ['vue3-apexcharts']
  },

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  vite: {
    build: {
      rollupOptions: {
        output: {
          // Isolate ApexCharts (~700KB) into its own chunk so it can be lazy-loaded
          // independently. Referenced by the build:manifest hook below.
          manualChunks(id) {
            if (id.includes('apexcharts') || id.includes('vue3-apexcharts')) {
              return 'vendor-charts'
            }
          }
        }
      }
    },
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

  // ---------------------------------------------------------------------------
  // Performance: Prevent modulepreload of the vendor-charts chunk (~700KB).
  //
  // Without this hook, Nuxt adds <link rel="modulepreload"> for vendor-charts
  // in the prerendered HTML, causing the browser to eagerly fetch 700KB of
  // ApexCharts JS on every page load — even before the chart is needed.
  //
  // The chart component uses Lazy prefix + hydrate-on-visible + defineAsyncComponent,
  // so the chunk is only needed when the chart enters the viewport. This hook
  // ensures the prerendered HTML doesn't defeat that lazy-loading strategy.
  //
  // The chunk name 'vendor-charts' is set by manualChunks in vite.build above.
  // ---------------------------------------------------------------------------
  hooks: {
    'build:manifest': (manifest) => {
      for (const key in manifest) {
        const entry = manifest[key]
        if (entry?.name === 'vendor-charts') {
          entry.prefetch = false
          entry.preload = false
        }
      }
    }
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
