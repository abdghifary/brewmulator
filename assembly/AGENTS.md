# ASSEMBLY KNOWLEDGE BASE

**Generated:** 2026-01-21
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
| **Strength** | TDS (Total Dissolved Solids) calculation | `calculateTDS` |
| **Analysis** | Extraction zone thresholds (Under/Sweet/Over) | `getExtractionZone` |

## CONVENTIONS
- **Strict Typing**: Use explicit WASM types (`f64`, `f32`, `i32`, `u32`). Avoid the generic `number`.
- **Math Operations**: Use built-in `Math` primitives. They map directly to WASM instructions.
- **Visibility**: Only `export` functions that must be accessed from the Nuxt/Pinia bridge.
- **No Side Effects**: Functions should be deterministic and pure where possible for simulator stability.
- **WASM Environment**: No access to DOM, `window`, or Node.js built-ins.

## ANTI-PATTERNS
- **Generic Types**: Using `any` or ambiguous `number` types.
- **Host Dependencies**: Attempting to use `console.log` or `Date.now()` without host-provided imports.
- **Library Bloat**: Importing standard TypeScript libraries (e.g., `lodash`, `moment`) that are not AS-compatible.
- **Memory Pressure**: Creating high-frequency object allocations in the extraction loops; prefer primitive math.
- **Recursion**: Deep recursion can lead to stack overflow in WASM; use iterative approaches for simulations.
