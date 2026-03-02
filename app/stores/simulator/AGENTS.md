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
├── methodConfig.ts   # MethodConfig registry (NEW)
├── utils.ts          # Shared formatTime utilities (NEW)
├── types.ts          # TypeScript interfaces for recipe/state
├── constants.ts      # Default values and constraints
├── validation.ts     # Pour step clamping & validation
└── composables/      # Encapsulated logic (math, limits)
    ├── useBrewLimits.ts
    ├── useBrewMath.ts
    ├── useGrinderProfile.ts
    ├── usePiecewiseExtraction.ts
    └── useV60PourSchedule.ts  # V60 pour schedule state & actions (NEW)
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
| **Pour Actions** | `addPourStep()`, `removePourStep()`, `updatePourStep()`, `loadTemplate()`, `clearPourSchedule()` | `composables/useV60PourSchedule.ts` |
| **Pour State** | `hasPourSchedule`, `pourSchedule` | `composables/useV60PourSchedule.ts` |
| **Pour Validation** | `clampPourStep()` | `validation.ts` |
| **Method Config** | `getMethodConfig()`, `METHOD_CONFIGS` | `methodConfig.ts` |
| **Zone Classification** | `extractionZone` computed | `composables/useBrewMath.ts` (uses MethodConfig.sweetSpot, not WASM) |
| **Time Formatting** | `formatTimeCompact()`, `formatTimeFull()` | `utils.ts` |

## CONVENTIONS
- **Single Source of Truth**: All simulation state (`recipe`, `extractionCurve`) lives here.
- **Async Initialization**: `initialize()` must complete before any physics calculation. Use `isLoading`.
- **Reactivity**: A deep watcher on `recipe` automatically calls `computeCurve()` on any change. Components do NOT need to trigger recomputation manually — just mutate the recipe.
- **Composables**: Complex logic (e.g., brew limits) is extracted to `composables/` to keep the store clean.
- **MethodConfig-Driven**: Brew limits, absorption rates, zone thresholds, and time steps come from MethodConfig. Never add method-specific if/else chains in composables.
- **V60 Isolation**: All V60-specific logic (pour schedule, templates, piecewise extraction) lives in dedicated composables. The store composes them via spread operator.
- **Zone Classification**: Extraction zones are classified in TypeScript using MethodConfig.sweetSpot, not via WASM getExtractionZone.

## ANTI-PATTERNS
- **Method-specific if/else**: Don't add if (method === 'espresso') in composables. Add the value to MethodConfig instead.
- **Hardcoded thresholds**: Don't use magic numbers for zone boundaries (18, 22). Use getMethodConfig(method).sweetSpot.
- **Local formatTime**: Don't create local formatting functions in components. Import formatTimeCompact or formatTimeFull from utils.
- **Reactivity Pattern**: Components mutate `store.recipe` properties directly (via `v-model` or assignment). This is intentional — the store's deep watcher on `recipe` automatically triggers `computeCurve()`. Do NOT add manual `computeCurve()` calls from components.
- **Sync WASM Calls**: Do NOT assume WASM is loaded; always check `isLoading`.
- **Heavy Logic in Components**: Move all simulation logic to this store; components should only be generic UI.
