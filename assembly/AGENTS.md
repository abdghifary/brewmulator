# ASSEMBLY KNOWLEDGE BASE

**Generated:** 2026-01-25
**Language:** AssemblyScript (WASM)
**Parent Context:** [../AGENTS.md](../AGENTS.md)

## OVERVIEW
High-performance AssemblyScript physics engine implementing coffee extraction kinetics via WebAssembly.

## STRUCTURE
```
.
├── index.ts          # Main entry point and exported WASM API
└── tsconfig.json     # AssemblyScript-specific compiler configuration
```

## WHERE TO LOOK
| Feature | Implementation | Location |
|---------|----------------|----------|
| **Kinetics** | Arrhenius equation & Spiro/Selwood model | `calculateRateConstant`, `calculateExtractionYield` |
| **Fast Kinetics** | Surface-wash rate constant (two-phase model, E_A_FAST = 25 kJ/mol) | `calculateFastRateConstant` |
| **Strength** | TDS (Total Dissolved Solids) calculation | `calculateTDS` |
| **Analysis** | Extraction zone thresholds (Under/Sweet/Over) | `getExtractionZone` (Kept for backward compat; production code uses TypeScript zone classification via MethodConfig.sweetSpot) |
| **Extraction Maximum** | `E_MAX` | `index.ts` |
| **Solubility Coefficient** | `ALPHA` | `index.ts` |

## CALIBRATED CONSTANTS (DO NOT EDIT WITHOUT CALIBRATION)
The following constants in `index.ts` were empirically calibrated and must not be changed without re-running the full test suite (`pnpm test:unit`):

| Constant | Value | Role |
|----------|-------|------|
| `A` | `65000.0` | Slow-phase ceiling (Spiro/Selwood). Upper safe bound: 66000. Breaks cold brew regression at ≥ 67000. |
| `A_FAST` | `500.0` | Surface-wash pre-exponential factor. |
| `E_A_FAST` | `25000 J/mol` | Activation energy for fast surface-wash phase (half of E_A). |
| `PHI_SURFACE_REF` | `0.15` | Reference surface fraction φ_s at d₃₂ = 500 µm. |
| `D_REF_SURFACE` | `500.0` | Reference grind size (µm) for φ_s scaling. |

Calibration target at T_ref = 93°C (Hoffmann 15-1-2-3): t=15s≈6.49%, t=60s≈13.35%, t=180s≈20.46%. ε = k_slow/k_fast ≈ 0.035 (Moroney range: [0.025, 0.08]).

## CONVENTIONS
- **Strict Typing**: Use explicit WASM types (`f64`, `f32`, `i32`, `u32`). Avoid the generic `number`.
- **Math Operations**: Use built-in `Math` primitives. They map directly to WASM instructions.
- **Visibility**: Only `export` functions that must be accessed from the Nuxt/Pinia bridge.
- **No Side Effects**: Functions should be deterministic and pure where possible for simulator stability.
- **WASM Environment**: No access to DOM, `window`, or Node.js built-ins.
- **Validation Targets**: Every new physics function must document which published dataset, figure, or metric range it validates against (e.g., Moroney ε range 0.025–0.08, Arrhenius temperature sensitivity from Sano et al.). Encode these as numeric tolerances in unit tests that fail CI on drift.

## ANTI-PATTERNS
- **Generic Types**: Using `any` or ambiguous `number` types.
- **Host Dependencies**: Attempting to use `console.log` or `Date.now()` without host-provided imports.
- **Library Bloat**: Importing standard TypeScript libraries (e.g., `lodash`, `moment`) that are not AS-compatible.
- **Memory Pressure**: Creating high-frequency object allocations in the extraction loops; prefer primitive math.
- **Recursion**: Deep recursion can lead to stack overflow in WASM; use iterative approaches for simulations.
