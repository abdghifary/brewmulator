# Performance Optimization

Documented findings from performance investigation and optimization of the Brewmulator frontend.

## Baseline (Before)

Metrics reported from `@nuxt/hints` web-vitals in production preview:

| Metric | Value | Rating |
|--------|-------|--------|
| SSR to full load | 1,630ms | Poor |
| Page load | 1,560ms | Poor |
| Navigation | 897ms | Needs improvement |

**Root cause**: ApexCharts (~700KB) was loaded eagerly via a global Nuxt plugin (`app/plugins/apexcharts.client.ts`) that statically imported `vue3-apexcharts`. This single dependency accounted for nearly all of the load time.

## After Optimization

Production build metrics (5-run median, localhost, Playwright):

| Metric | Value | Rating |
|--------|-------|--------|
| First Contentful Paint | 72ms | Good |
| DOM Interactive | 9ms | Good |
| DOM Content Loaded | 26ms | Good |
| Load Event | 27ms | Good |
| Network Idle | 669ms | Expected (includes lazy chart load) |

## What Changed

### 1. Lazy ApexCharts loading (biggest impact)

**Before**: A global plugin (`app/plugins/apexcharts.client.ts`) eagerly imported `vue3-apexcharts` and registered it as a global component. This forced the browser to download, parse, and execute 700KB of chart library JS before any interaction was possible.

**After**: The plugin was deleted. `ExtractionChart.vue` uses `defineAsyncComponent(() => import('vue3-apexcharts'))` to load the library on demand.

### 2. Lazy component with deferred hydration

The chart component in `app/pages/index.vue` uses Nuxt's `Lazy` prefix with `hydrate-on-visible`:

```vue
<LazySimulatorExtractionChart hydrate-on-visible />
```

This defers both the JS chunk download and Vue hydration until the component enters the viewport via `IntersectionObserver`. Since the chart is immediately visible on desktop, the chunk loads shortly after initial paint — but critically, it doesn't block FCP.

### 3. Vendor chunk isolation

`nuxt.config.ts` uses Vite's `manualChunks` to isolate ApexCharts into a dedicated `vendor-charts` chunk:

```ts
manualChunks(id) {
  if (id.includes('apexcharts') || id.includes('vue3-apexcharts')) {
    return 'vendor-charts'
  }
}
```

This ensures the chart library doesn't get bundled into the entry chunk or other shared chunks.

### 4. Modulepreload suppression

A `build:manifest` hook in `nuxt.config.ts` prevents Nuxt from adding `<link rel="modulepreload">` for the vendor-charts chunk in prerendered HTML. Without this, the browser would eagerly fetch the 700KB chunk on every page load, defeating the lazy-loading strategy.

**This hook is essential** — removing it causes the vendor-charts chunk to appear as a modulepreload link in the HTML. The hook matches by chunk name (`entry?.name === 'vendor-charts'`), which is set by the `manualChunks` config above.

### 5. WASM init guard

`app/stores/simulator/index.ts` — the `initialize()` action now returns early if the WASM module is already loaded (`if (wasmModule.value) return`). Previously it re-imported the WASM module on every call.

### 6. Removed redundant computeCurve() call

`setPreset()` in the simulator store was explicitly calling `computeCurve()` after updating recipe properties. This was redundant because the store has a deep watcher on `recipe` that automatically triggers `computeCurve()` on any change.

## Architecture

The loading strategy works in layers:

```
Page Load (prerendered HTML)
  ├── SSR HTML rendered instantly (prerendered at build time)
  ├── Entry chunk + core chunks loaded via modulepreload (~85KB gzipped)
  ├── Vue hydrates the page (sidebar, controls, results)
  └── IntersectionObserver fires for chart area
       ├── vendor-charts chunk fetched (~180KB gzipped)
       └── Chart component hydrates and renders
```

## Dev Mode vs Production

Dev mode metrics (e.g., LCP of 3600ms from `@nuxt/hints`) are **not representative** of production performance. Vite's dev server compiles modules on-the-fly, which inflates TTFB dramatically. Always measure against `pnpm build && pnpm preview` for real performance numbers.

## Key Files

| File | Role |
|------|------|
| `nuxt.config.ts` | Chunk splitting, modulepreload suppression |
| `app/components/simulator/ExtractionChart.vue` | Lazy `defineAsyncComponent` for ApexCharts |
| `app/pages/index.vue` | `<LazySimulatorExtractionChart hydrate-on-visible />` |
| `app/stores/simulator/index.ts` | WASM init guard, reactive curve computation |
