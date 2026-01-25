# SIMULATOR STORE KNOWLEDGE BASE

**Generated:** 2026-01-25
**Type:** Pinia Store / WASM Bridge
**Parent Context:** [../../AGENTS.md](../../AGENTS.md)

## OVERVIEW
The Simulator Store acts as the **mandatory bridge** between the Vue frontend and the AssemblyScript physics engine. It handles WASM loading, state management, and debounced calculations.

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
| **Input Debounce** | `debouncedCompute` | `index.ts` |
| **Presets** | `setPreset()` | `index.ts` |

## CONVENTIONS
- **Single Source of Truth**: All simulation state (`recipe`, `extractionCurve`) lives here.
- **Async Initialization**: `initialize()` must complete before any physics calculation. Use `isLoading`.
- **Debouncing**: User input triggers `debouncedCompute` (150ms) to avoid blocking the main thread with excessive WASM calls.
- **Composables**: Complex logic (e.g., brew limits) is extracted to `composables/` to keep the store clean.

## ANTI-PATTERNS
- **Direct Store Modification**: Do NOT modify `state.recipe` directly from components; use actions.
- **Sync WASM Calls**: Do NOT assume WASM is loaded; always check `isLoading`.
- **Heavy Logic in Components**: Move all simulation logic to this store; components should only be generic UI.
