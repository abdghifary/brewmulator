# Brewmulator

Physics-based coffee extraction simulator that combines a [Nuxt 4](https://nuxt.com) frontend with a high-performance [AssemblyScript](https://www.assemblyscript.org/) (WebAssembly) physics engine. Simulate real brewing scenarios, tweak parameters in real time, and watch extraction curves respond instantly.

## Features

- **5 Brew Methods** — V60, French Press, Espresso, AeroPress, Cold Brew
- **Real-Time Extraction Curve** — Interactive chart showing extraction yield over time with target zone highlighting
- **V60 Pour Schedule Editor** — Build custom multi-pour recipes or load named templates (Hoffmann, Rao, Kasuya 4:6, Hedrick, Winton)
- **Saturation-Aware Physics** — Reversible kinetics model (Spiro & Selwood) where brew ratio correctly limits maximum extraction yield
- **Thermal Modeling** — Newton cooling between pours, mass-weighted reheat on pour, Arrhenius temperature dependence
- **CO₂ Bloom Simulation** — Models outgassing inhibition during the bloom phase of pour-over brewing
- **Bimodal Grind Distribution** — Sauter mean diameter (d₃₂) models the effect of fines on extraction rate (V60)
- **Extraction Results** — Live readout of Extraction Yield %, TDS %, beverage weight, and zone classification
- **Two-Phase Extraction Kinetics** — Physically accurate surface-wash + Fickian diffusion model (Moroney 2015) separates fast surface solubles from slow cell-wall diffusion for V60 pour-over brewing

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Nuxt 4](https://nuxt.com) |
| UI | [Nuxt UI](https://ui.nuxt.com) |
| State | [Pinia](https://pinia.vuejs.org) |
| Physics Engine | [AssemblyScript](https://www.assemblyscript.org/) → WebAssembly |
| Charts | [ApexCharts](https://apexcharts.com/) (vue3-apexcharts) |
| Testing | [Vitest](https://vitest.dev/) |

## Architecture

```
┌─────────────────────────────────────────┐
│  Vue Components (UI only)               │
│  BrewParameters · DoseParameters        │
│  ExtractionChart · PourSchedule         │
├─────────────────────────────────────────┤
│  Pinia Store (bridge layer)             │
│  useSimulatorStore — reactive state,    │
│  composables, auto-recomputation        │
├─────────────────────────────────────────┤
│  WASM Physics Engine                    │
│  calculateExtractionYield               │
│  calculateRateConstant · calculateTDS   │
└─────────────────────────────────────────┘
```

Components never call WASM directly — all physics access goes through the Pinia store. Recipe changes trigger automatic curve recomputation via a deep watcher.

## Project Structure

```
├── app/                    # Nuxt 4 source (Vue/TS)
│   ├── components/simulator/   # UI widgets (chart, parameters, pour schedule)
│   ├── pages/                  # App routes
│   └── stores/simulator/       # Pinia store, composables, validation
│       └── composables/        # useBrewMath, useV60PourSchedule, etc.
├── assembly/               # AssemblyScript physics engine
├── build/                  # Compiled WASM artifacts (generated)
├── docs/                   # Physics model documentation
└── test/                   # Vitest suites (unit + nuxt)
```

## Setup

```bash
pnpm install
```

This installs dependencies and automatically compiles the AssemblyScript physics engine to WebAssembly.

## Development

```bash
pnpm dev
```

Starts the dev server at `http://localhost:3000`.

> [!TIP]
> Saving `.ts` files in `assembly/` automatically recompiles WASM and triggers a full page reload.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm build` | Compile WASM + build Nuxt for production |
| `pnpm preview` | Preview production build locally |
| `pnpm test` | Run all tests |
| `pnpm test:unit` | Run unit tests only (Node) |
| `pnpm test:nuxt` | Run Nuxt environment tests only |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm lint` | Lint with ESLint |
| `pnpm typecheck` | Run type checking |
| `pnpm run asbuild` | Manually compile WASM (release) |
| `pnpm run asbuild:debug` | Compile WASM with debug symbols |

## Physics Model

The extraction engine implements **Spiro & Selwood pseudo-first-order reversible kinetics** with Nernst-Brunner saturation limiting. Key equations:

- **Equilibrium Yield**: `Y_eq = E_max / (1 + α/ratio)` — brew ratio limits max extraction
- **Extraction**: `E(t) = Y_eq · (1 - e^(-k_obs · t))` — exponential approach to equilibrium
- **Rate Constant**: Arrhenius temperature dependence × grind factor × roast factor × method modifier

V60 piecewise extraction extends this with per-pour segments, thermal decay, and CO₂ bloom inhibition.

For the physics model overview and navigation to the detailed documentation set, see [`docs/physics-model.md`](docs/physics-model.md). The detailed pages live under [`docs/physics-model/`](docs/physics-model/).

### References

- Spiro, M. & Selwood, R. M. (1984). *The kinetics of coffee brewing.* Z. Lebensm. Unters. Forsch.
- Moroney, K.M. et al. (2015). *Modelling of coffee extraction during brewing using multiscale methods.* Chemical Engineering Science.
- Wang, X. & Lim, L.-T. (2021). *Modeling study of coffee extraction at different temperature and grind size conditions to better understand the cold and hot brewing process.* Journal of Food Process Engineering. DOI: [10.1111/jfpe.13748](https://doi.org/10.1111/jfpe.13748)
- Patricelli, A. et al. (1975). *Surface and diffusion phenomena in the coffee extraction process.* Journal of Food Science.
- Gagné, J. (2021). *The Physics of Filter Coffee.* Scott's Digital Alchemy.

## License

[MIT](LICENSE)
