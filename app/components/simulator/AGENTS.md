# SIMULATOR COMPONENTS KNOWLEDGE BASE

**Generated:** 2026-01-25
**Domain:** UI/Visualization
**Parent Context:** [../../AGENTS.md](../../AGENTS.md)

## OVERVIEW
Core UI domain for the coffee extraction simulator, providing specialized visualization and parameter control widgets.

## STRUCTURE
- `ExtractionChart.vue`: Real-time ApexCharts area chart visualization of the extraction yield curve (client-only rendered).
- `ExtractionResults.vue`: Displays numeric metrics (EY, TDS, Weight) with color-coded feedback.
- `DoseParameters.vue`: Input controls for coffee mass and water volume.
- `BrewParameters.vue`: Controls for grind size and roast level. Temperature and brew time sliders are hidden for V60 (managed by pour schedule).
- `PourSchedule.vue`: V60 pour schedule management — template selection, pour step CRUD, per-pour temperature overrides, and schedule summary.
- `PresetSelector.vue`: Quick selection of brew methods (Espresso, V60, Cold Brew).

## WHERE TO LOOK
- **Chart Logic**: `ExtractionChart.vue` renders `store.extractionCurve` via ApexCharts (wrapped in `<ClientOnly>` for SSR safety).
- **Parameter Inputs**: `DoseParameters.vue` and `BrewParameters.vue` for user control.
- **Visual Feedback**: `ExtractionResults.vue` for target zone and extraction status.
- **Pour Management**: `PourSchedule.vue` for V60 template selection, pour step editing, and temperature overrides.

## CONVENTIONS
- **Naming**: Components are automatically prefixed with `Simulator` via Nuxt 4 folder discovery.
- **State Binding**: Components MUST bind directly to `useSimulatorStore()` for global reactivity.
- **Reactivity**: Components mutate `store.recipe` directly — a deep watcher in the store automatically triggers `computeCurve()`. No manual recompute calls needed.
- **Styling**: Leverages Nuxt UI (`UCard`, `USlider`, `UFormField`) for consistent look and feel.

## ANTI-PATTERNS
- **Direct WASM Calls**: NEVER call WASM functions from components; all physics must route through Pinia actions.
- **Local State for Parameters**: Don't use `ref` for brew/dose parameters; use the store to keep physics in sync.
- **Prop Drilling**: Avoid passing simulation state via props; prefer direct store access for domain data.
- **Hardcoded Bounds**: Use `presetDefaults` or store-provided limits instead of magic numbers for sliders.
