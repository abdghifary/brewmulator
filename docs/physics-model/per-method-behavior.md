# Per-Method Two-Phase Extraction Behavior

Brewmulator implements two-phase extraction kinetics universally across all five brew methods — not just V60. Each method uses the same `computePiecewiseCurve()` engine with method-specific rate multipliers that capture the physical differences in extraction dynamics.

## Unified Dispatch Architecture

The `computeCurve()` function in `app/stores/simulator/index.ts` uses a single dispatch path for all methods:

1. **V60**: uses the real user-defined pour schedule from `useV60PourSchedule`
2. **All other methods** (French Press, Espresso, AeroPress, Cold Brew): uses a synthetic schedule from `generateSyntheticSchedule(recipe)` — a single pour at t=0 with the full water volume

This means every brew method goes through the same piecewise ODE integration with two-phase kinetics enabled (`twoPhaseEnabled: true`).

## Per-Method Rate Modifiers

Each method's extraction behavior is controlled by two multipliers in the MethodConfig registry:

| Method | `methodModifierFast` | `methodModifierSlow` | Physical Rationale |
|--------|---------------------|---------------------|-------------------|
| V60 | 1.0 | 1.0 | Identity (reference calibration) |
| French Press | 0.99 | 1.30 | Stagnant boundary layer slows surface wash; longer immersion extends slow Fickian diffusion |
| Espresso | 12.0 | 4.0 | Pressure-driven convective boundary transfer greatly exceeds diffusion; fast phase dominates |
| AeroPress | 1.35 | 1.20 | Gentle pressure and agitation moderately accelerate both phases |
| Cold Brew | 0.90 | 0.45 | Cold static immersion; Arrhenius already suppresses rates at 20°C; slow phase aggressively suppressed to model diffusion-dominant regime |

These multipliers apply inside the ODE loop: `k_fast_eff = k_fast_wasm × methodModifierFast` and `k_slow_eff = k_slow_wasm × methodModifierSlow`.

### Physical Invariants

The calibrated values satisfy these physical constraints:

- **French Press**: `methodModifierFast(0.99) < 1.0` — stagnant boundary layer suppresses surface wash
- **Espresso**: `methodModifierFast(12.0) > methodModifierSlow(4.0)` — pressure drives convective transfer faster than diffusion
- **Cold Brew**: both `< 1.0` (fast=0.90, slow=0.45) — cold static immersion suppresses all rates
- **AeroPress**: both in `[0.8, 1.5]` (fast=1.35, slow=1.20) — moderate boost from gentle pressure

## WASM Modifier Neutralization

The AssemblyScript WASM engine has its own internal per-method modifiers (e.g., espresso×7.0, French Press/Cold Brew×0.85). To prevent these from stacking with the TypeScript-side MethodConfig modifiers, `computePiecewiseCurve()` always passes `method=0` (V60/neutral) to both `calculateRateConstant()` and `calculateFastRateConstant()`:

```typescript
const kSlow = wasmModule.calculateRateConstant(currentTemp, effectiveGrindSize, roastLevel, 0)
const kFast = wasmModule.calculateFastRateConstant(currentTemp, effectiveGrindSize, roastLevel, 0)
```

This ensures `MethodConfig.methodModifierFast` and `MethodConfig.methodModifierSlow` are the **sole** source of per-method rate adjustments in piecewise mode.

## Synthetic Schedule for Non-V60 Methods

`generateSyntheticSchedule(recipe)` creates a single-element pour schedule:

```typescript
[{ startTime: 0, waterGrams: recipe.waterGrams }]
```

No `temperature` field is set on synthetic pours. This is intentional — see Cold Brew Temperature Handling below.

## Cold Brew Temperature Handling

`clampPourStep()` enforces an 80°C minimum temperature on pour steps — a guard designed for the V60 pour schedule UI where users enter temperatures manually. Synthetic pours must bypass this floor for cold brew (typically 20°C).

By omitting `temperature` from synthetic pours, `computePiecewiseCurve()` falls back to `globalTemp` for each step (line: `lastPour.temperature ?? globalTemp`). The `recipe.temperature` field is passed as `globalTemp` when building the params, so cold brew's 20°C is used directly without 80°C clamping.

## References

- Moroney, K.M. et al. (2015). *Modelling of coffee extraction during brewing using multiscale methods.* Chemical Engineering Science. — Two-phase kinetic model foundations (ε ≈ 0.025–0.08).
- Moroney, K.M. et al. (2016). *Asymptotic Analysis of the Dominant Mechanisms in the Coffee Extraction Process.* SIAM Journal on Applied Mathematics. — Immersion vs. drip comparison, supports universal two-phase.
- Wang, X. & Lim, L.-T. (2021). *Modeling study of coffee extraction at different temperature and grind size conditions.* Journal of Food Process Engineering. DOI: [10.1111/jfpe.13748](https://doi.org/10.1111/jfpe.13748) — Cold brew temperature dependence justification.
