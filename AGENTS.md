# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-21
**Frameworks:** Nuxt 4, AssemblyScript, Pinia, Nuxt UI

## OVERVIEW
Brewmulator is a physics-based coffee extraction simulator. It combines a **Nuxt 4** frontend (UI/UX) with a high-performance **AssemblyScript (WASM)** physics engine. The architecture enforces a strict separation: UI in Vue, State in Pinia, and Physics in WASM.

## STRUCTURE
```
.
├── app/                  # Nuxt 4 source (Vue/TS)
│   ├── components/       # UI Components
│   │   └── simulator/    # Simulator-specific widgets
│   ├── pages/            # App routes
│   └── stores/           # Pinia stores (WASM bridge)
├── assembly/             # Physics engine (AssemblyScript)
├── build/                # Compiled WASM & JS glue (committed)
├── test/                 # Vitest suites (unit & nuxt)
└── nuxt.config.ts        # Framework config
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **UI Changes** | `app/components/simulator/` | Components prefixed `Simulator*` |
| **Physics Logic** | `assembly/index.ts` | Core extraction math (Spiro/Selwood) |
| **State/Data** | `app/stores/simulator.ts` | Bridge between Vue and WASM |
| **Theme/Styles** | `app/app.config.ts` | Colors & global config |
| **Build Config** | `asconfig.json` | AssemblyScript compiler settings |

## CONVENTIONS
- **Nuxt 4**: Source files live in `app/`, not root.
- **WASM Bridge**: NEVER call WASM directly from components. Use `app/stores/simulator.ts` actions.
- **Component Naming**: Domain components use prefix (e.g., `SimulatorExtractionChart`).
- **Debouncing**: Expensive calculations (curve generation) are debounced (150ms).
- **Testing**: Unit tests in `test/unit/` run in Node; UI tests in `test/nuxt/`.

## COMMANDS
```bash
pnpm dev             # Start dev server
pnpm run asbuild     # Compile AssemblyScript -> WASM (Required after physics changes)
pnpm test            # Run all tests
pnpm lint            # Lint code
```

## NOTES
- **WASM Artifacts**: `build/` contains generated files (`release.wasm`, `release.js`). These ARE version controlled to allow usage without the AS compiler.
- **Reactivity**: The WASM module is loaded async. Ensure `store.initialize()` is called before accessing physics functions.
