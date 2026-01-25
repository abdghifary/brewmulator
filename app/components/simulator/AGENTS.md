# SIMULATOR COMPONENTS KNOWLEDGE BASE

## OVERVIEW
Core UI domain for the coffee extraction simulator, providing specialized visualization and parameter control widgets.

## STRUCTURE
- `ExtractionChart.vue`: Real-time SVG visualization of the extraction yield curve.
- `ExtractionResults.vue`: Displays numeric metrics (EY, TDS, Weight) with color-coded feedback.
- `DoseParameters.vue`: Input controls for coffee mass and water volume.
- `BrewParameters.vue`: Controls for brew method-specific variables (temperature, pressure).
- `PresetSelector.vue`: Quick selection of brew methods (Espresso, V60, Cold Brew).

## WHERE TO LOOK
- **Chart Logic**: `ExtractionChart.vue` handles SVG path generation from `store.extractionCurve`.
- **Parameter Inputs**: `DoseParameters.vue` and `BrewParameters.vue` for user control.
- **Visual Feedback**: `ExtractionResults.vue` for target zone and extraction status.

## CONVENTIONS
- **Naming**: Components are automatically prefixed with `Simulator` via Nuxt 4 folder discovery.
- **State Binding**: Components MUST bind directly to `useSimulatorStore()` for global reactivity.
- **Reactivity**: Use `store.debouncedCompute` on input changes to prevent physics engine overhead.
- **Styling**: Leverages Nuxt UI (`UCard`, `USlider`, `UFormField`) for consistent look and feel.

## ANTI-PATTERNS
- **Direct WASM Calls**: NEVER call WASM functions from components; all physics must route through Pinia actions.
- **Local State for Parameters**: Don't use `ref` for brew/dose parameters; use the store to keep physics in sync.
- **Prop Drilling**: Avoid passing simulation state via props; prefer direct store access for domain data.
- **Hardcoded Bounds**: Use `presetDefaults` or store-provided limits instead of magic numbers for sliders.
