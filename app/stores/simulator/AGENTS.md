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
└── composables/      # Encapsulated logic (math, limits)
```

## WHERE TO LOOK
| Task | Symbol | File |
|------|--------|------|
| **WASM Loading** | `initialize()` | `index.ts` |
| **Physics Loop** | `computeCurve()` | `index.ts` |
| **State Definition** | `SimulatorState` | `types.ts` |
| **Presets** | `setPreset()` | `index.ts` |

## CONVENTIONS
- **Single Source of Truth**: All simulation state (`recipe`, `extractionCurve`) lives here.
- **Async Initialization**: `initialize()` must complete before any physics calculation. Use `isLoading`.
- **Reactivity**: A deep watcher on `recipe` automatically calls `computeCurve()` on any change. Components do NOT need to trigger recomputation manually — just mutate the recipe.
- **Composables**: Complex logic (e.g., brew limits) is extracted to `composables/` to keep the store clean.

## ANTI-PATTERNS
- **Direct Store Modification**: Do NOT modify `state.recipe` directly from components; use actions.
- **Sync WASM Calls**: Do NOT assume WASM is loaded; always check `isLoading`.
- **Heavy Logic in Components**: Move all simulation logic to this store; components should only be generic UI.
