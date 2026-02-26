# SIMULATOR STORE KNOWLEDGE BASE

**Generated:** 2026-01-25
**Type:** Pinia Store / WASM Bridge
**Parent Context:** [../../AGENTS.md](../../AGENTS.md)

## OVERVIEW
The Simulator Store acts as the **mandatory bridge** between the Vue frontend and the AssemblyScript physics engine. It handles WASM loading, state management, and reactive curve computation.

## STRUCTURE
```
.
├── index.ts          # Main store definition & actions
├── types.ts          # TypeScript interfaces for recipe/state
├── constants.ts      # Default values and constraints
├── validation.ts     # Pour step clamping & validation
└── composables/      # Encapsulated logic (math, limits)
```

## WHERE TO LOOK
| Task | Symbol | File |
|------|--------|------|
| **WASM Loading** | `initialize()` | `index.ts` |
| **Physics Loop** | `computeCurve()` | `index.ts` |
| **State Definition** | `BrewRecipe` | `types.ts` |
| **Presets** | `setPreset()` | `index.ts` |
| **Piecewise Extraction** | `computePiecewiseCurve()` | `composables/usePiecewiseExtraction.ts` |
| **Brew Math** | `useBrewMath()` | `composables/useBrewMath.ts` |
| **Dose/Water Limits** | `useBrewLimits()` | `composables/useBrewLimits.ts` |
| **Pour Actions** | `addPourStep()`, `removePourStep()`, `updatePourStep()`, `loadTemplate()`, `clearPourSchedule()` | `index.ts` |
| **Pour State** | `hasPourSchedule`, `pourSchedule` | `index.ts` |
| **Pour Validation** | `clampPourStep()` | `validation.ts` |

## CONVENTIONS
- **Single Source of Truth**: All simulation state (`recipe`, `extractionCurve`) lives here.
- **Async Initialization**: `initialize()` must complete before any physics calculation. Use `isLoading`.
- **Reactivity**: A deep watcher on `recipe` automatically calls `computeCurve()` on any change. Components do NOT need to trigger recomputation manually — just mutate the recipe.
- **Composables**: Complex logic (e.g., brew limits) is extracted to `composables/` to keep the store clean.

## ANTI-PATTERNS
- **Reactivity Pattern**: Components mutate `store.recipe` properties directly (via `v-model` or assignment). This is intentional — the store's deep watcher on `recipe` automatically triggers `computeCurve()`. Do NOT add manual `computeCurve()` calls from components.
- **Sync WASM Calls**: Do NOT assume WASM is loaded; always check `isLoading`.
- **Heavy Logic in Components**: Move all simulation logic to this store; components should only be generic UI.
