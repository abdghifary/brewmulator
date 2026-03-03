# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-25
**Frameworks:** Nuxt 4, AssemblyScript, Pinia, Nuxt UI

## OVERVIEW
Brewmulator is a physics-based coffee extraction simulator. It combines a **Nuxt 4** frontend (UI/UX) with a high-performance **AssemblyScript (WASM)** physics engine. The architecture enforces a strict separation: UI in Vue, State in Pinia, and Physics in WASM.

## STRUCTURE
```
.
├── app/                  # Nuxt 4 source (Vue/TS) - NOT in root
│   ├── components/       # UI Components
│   │   └── simulator/    # Simulator-specific widgets
│   ├── pages/            # App routes
│   ├── stores/           # Pinia stores (WASM bridge)
│   │   ├── methodConfig.ts # Method-specific config registry
│   │   └── utils.ts        # Shared formatting utilities
├── assembly/             # Physics engine (AssemblyScript)
├── build/                # Compiled WASM & JS glue (gitignored, built on install)
├── docs/                 # Physics model documentation
├── test/                 # Vitest suites (unit & nuxt)
└── nuxt.config.ts        # Framework config
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **UI Changes** | `app/components/simulator/` | Components prefixed `Simulator*` |
| **Physics Logic** | `assembly/index.ts` | Core extraction math (Spiro/Selwood) |
| **State/Bridge** | `app/stores/simulator/` | Bridge between Vue and WASM |
| **Theme/Styles** | `app/app.config.ts` | Colors & global config |
| **Build Config** | `asconfig.json` | AssemblyScript compiler settings |
| **Physics Docs** | `docs/physics-model.md` | Extraction math reference & model documentation |

## CODE MAP
| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `useSimulatorStore` | Store | `app/stores/simulator/index.ts` | Main state & WASM bridge |
| `calculateExtractionYield` | Function | `assembly/index.ts` | Core physics calculation |
| `ExtractionChart` | Component | `app/components/simulator/` | ApexCharts visualization |
| `computePiecewiseCurve` | Function | `app/stores/simulator/composables/usePiecewiseExtraction.ts` | V60 multi-pour extraction curve |
| `PourSchedule` | Component | `app/components/simulator/PourSchedule.vue` | V60 pour schedule UI |
| `clampPourStep` | Function | `app/stores/simulator/validation.ts` | Pour step validation & clamping |
| `v60Templates` | Constant | `app/stores/simulator/constants.ts` | V60 recipe templates (Hoffmann, Rao, etc.) |
| `useBrewMath` | Composable | `app/stores/simulator/composables/useBrewMath.ts` | Brew ratio, EY, TDS calculations |
| `getMethodConfig` | Function | `app/stores/simulator/methodConfig.ts` | Method-specific config registry |
| `useV60PourSchedule` | Composable | `app/stores/simulator/composables/useV60PourSchedule.ts` | V60 pour schedule state & actions |
| `formatTimeCompact` | Function | `app/stores/simulator/utils.ts` | Chart axis time formatting |
| `formatTimeFull` | Function | `app/stores/simulator/utils.ts` | Form label time formatting |
| `clampFinesFraction` | Function | `app/stores/simulator/validation.ts` | Clamps finesFraction to 0–MAX_FINES_FRACTION range |
| `FINES_GRIND_SIZE` | Constant | `app/stores/simulator/constants.ts` | Fixed fines bin size (100μm, Gagné 2023) |
| `DEFAULT_FINES_FRACTION` | Constant | `app/stores/simulator/constants.ts` | Default fines fraction (0.15, mid-range grinder) |

## CONVENTIONS
- **Nuxt 4**: Source files live in `app/`, not root.
- **WASM Bridge**: NEVER call WASM directly from components. Use `app/stores/simulator` actions.
- **Component Naming**: Domain components use prefix (e.g., `SimulatorExtractionChart`).
- **Reactivity**: Recipe changes automatically trigger `computeCurve()` via a deep watcher — no manual calls needed from components.
- **Testing**: Unit tests in `test/unit/` run in Node. (UI tests in `test/nuxt/` are configured but directory is currently missing).
- **MethodConfig**: All method-specific parameters (limits, thresholds, time steps) live in the MethodConfig registry. Never hardcode method-specific values in components or composables.
- **Method Isolation**: Method-specific logic lives in dedicated composables (e.g., useV60PourSchedule). The main store composes them. New brew method features should follow this pattern.

## COMMANDS
```bash
pnpm install         # Install dependencies & build WASM
pnpm dev             # Start dev server (watches assembly/ for changes)
pnpm run asbuild     # Manual WASM compilation
pnpm build           # Production build (WASM + Nuxt)
pnpm test            # Run all tests
pnpm lint            # Lint code
```

## NOTES
- **WASM Artifacts**: WASM artifacts are built automatically on `pnpm install` (via `prepare` script) and during production builds.
- **Reactivity**: The WASM module is loaded async. Ensure `store.initialize()` is called before accessing physics functions.
- **CI Gaps**: CI currently lacks `pnpm build` and `pnpm test` steps. WASM artifacts are not verified against source in CI.
