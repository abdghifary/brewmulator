# Implementation Notes

The physics engine is split between a high-performance WebAssembly (WASM) module and TypeScript composables that manage the higher-level brew logic.

## Piecewise Integration

For V60 brewing with a pour schedule, the simulator performs piecewise integration. Extraction yield carries forward across segments as the equilibrium shifts when new water arrives.

For each time segment between pour events, the yield evolves as:

$$E(t) = E_{eq} - (E_{eq} - E_{start}) \cdot e^{-k_{obs} \cdot \Delta t}$$

- $E_{start}$ is the yield from the end of the previous segment.
- $E_{eq}$ is the new equilibrium yield based on the updated water ratio.
- $k_{obs}$ is the updated observed rate constant.
- $\Delta t$ is the time elapsed since the last pour.

This logic ensures that extraction never resets to zero when a new pour occurs.

## Effective Grind Size

The bimodal particle distribution is implemented in TypeScript before calling the WASM engine. The `computeEffectiveGrindSize` function in `usePiecewiseExtraction.ts` calculates the Sauter mean diameter:

```typescript
export function computeEffectiveGrindSize(grindSize: number, phi: number): number {
  if (phi <= 0) return grindSize
  return 1 / (phi / FINES_GRIND_SIZE + (1 - phi) / grindSize)
}
```

If the fines fraction `phi` is zero, the behavior defaults to the standard single-grind model.

## Two-Phase Integration

When two-phase kinetics are enabled, the simulator integrates both the fast and slow pools independently:

1. Calculate $E_{fast}(t)$ and $E_{slow}(t)$ using their respective rate constants.
2. Sum them to get $E_{total}(t)$.
3. Carry both individual yields forward to the next segment.

The surface solubles fraction $\phi_s$ is derived from the raw grind size setting. This represents the cell-breaking behavior of the grinder.

## Model Interactions

- **Bimodal + Two-Phase**: The effective grind size $d_{32}$ feeds into both $k_{fast}$ and $k_{slow}$ calculations.
- **CO₂ Bloom**: Inhibition applies equally to both the fast and slow rate constants during the bloom phase.
- **Thermal Model**: Slurry temperature is recomputed at each segment and used to update the rate constants via the Arrhenius correction.

## WebAssembly (WASM) Scope

The WebAssembly (WASM) module handles the computationally intensive rate constant calculations and basic extraction formulas. The TypeScript layer manages the state of the pour schedule, thermal decay, and the summation of piecewise segments.
