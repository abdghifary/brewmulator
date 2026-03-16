# Physics Roadmap

## Overview

Brewmulator aims to be the most physics-accurate coffee extraction simulator. This roadmap prioritizes universal extraction physics first, applying to all brew methods. We then add a stochastic realism layer and finally branch into method-specific physics.

Our design philosophy is to cover all the basics realistically first, using calculations, formulas, and algorithms that apply to all brew methods. We branch based on brew method only after establishing this core.

## Current State

The current implementation includes the following features:

- Spiro and Selwood pseudo-first-order reversible kinetics with Nernst-Brunner saturation.
- Equilibrium yield: $Y_{eq} = E_{max} / (1 + \alpha / R)$.
- Arrhenius temperature dependence with grind, roast, and method modifiers.
- V60 piecewise multi-pour model with thermal decay and CO₂ bloom inhibition.
- Bimodal PSD via Sauter mean $d_{32}$, currently for V60 only.
- Support for five brew methods: V60, French Press, Espresso, AeroPress, and Cold Brew.

## Phase 0: Two-Phase Kinetics ✅

**Status: Merged into `main`.**

Two-phase extraction model (fast surface washing + slow Fickian diffusion) based on the Moroney et al. interpretation of Spiro and Selwood. Enabled for V60 piecewise extraction.

### What Was Implemented

- WASM: `calculateFastRateConstant()` with $E_{A,fast} = 25$ kJ/mol (vs 50 kJ/mol for diffusion), linear grind scaling ($1/d$ vs $1/d^2$), $A_{fast} = 500$, $A$ recalibrated to 65,000.
- Piecewise engine: Two independent extraction pools (`eFastPrev`, `eSlowPrev`) carrying forward across pour boundaries.
- Surface fraction auto-derivation: $\varphi_s = \varphi_{s,ref} \times (d_{ref} / d_{grind})$, clamped [0, 1]. Reference: 0.30 at 600μm.
- Gating: `supportsTwoPhase` flag in `MethodConfig`, enabled for V60 only.

### Formulas

Fast phase:
$$k_{fast} = A_{fast} \cdot e^{-E_{A,fast}/(RT)} \cdot (d_{ref}/d_{grind}) \cdot f_{roast} \cdot f_{method}$$

Slow (diffusion) phase:
$$k_{slow} = A \cdot e^{-E_A/(RT)} \cdot (d_{ref}/d_{grind})^2 \cdot f_{roast} \cdot f_{method}$$

Combined extraction:
$$E(t) = \varphi_s \cdot E_{max,fast}(1 - e^{-k_{fast}t}) + (1-\varphi_s) \cdot E_{max,slow}(1 - e^{-k_{slow}t})$$

### Validation

Tests cover Moroney $\epsilon$ range (0.025–0.08), temperature sensitivity, calibration targets, monotonicity, and bloom interaction. Remaining open task: scaling $\varphi_s$ by roast level (see Phase 1.4).

## Phase 1: Universal Extraction Core

### 1.1 Extend Two-Phase to All Methods ✅

Currently gated to V60. We will enable `supportsTwoPhase` universally and wire the non-piecewise code path for immersion and espresso methods. Spiro and Selwood originally studied immersion brewing, so two-phase kinetics are fundamentally universal.

- Complexity: Medium
- Impact: High

### 1.2 Extend Bimodal PSD to All Methods

Currently V60 only. We will enable `supportsFineFraction` universally. Fines affect extraction surface area in all methods. Hydraulic effects like bed clogging are method-specific and belong in Phase 3.

- Complexity: Low
- Impact: Medium

### 1.3 Roast-Dependent $E_{max}$

$E_{max}$ is currently hardcoded at 28%. It should vary by roast level because darker roasts have more degraded cellulose and increased solubility.

- Light roast: ~26% (denser, less developed)
- Medium roast: ~28% (baseline)
- Dark roast: ~30-31% (more porous, more soluble)

Formula:
$$E_{max}(roast) = 26 + 5 \times roastLevel$$
where $roastLevel \in [0, 1]$.

- Complexity: Low
- Impact: Medium

### 1.4 Roast-Level $\varphi_s$ Scaling

Darker roasts are more porous, leading to a higher surface-accessible fraction. This is already noted in the two-phase branch code.

Formula:
$$\varphi_s = \varphi_{s,ref} \times (d_{ref}/d_{grind}) \times f_{roast,surface}$$

- Complexity: Low
- Impact: Low-Medium

### 1.5 Wetting and Imbibition Kinetics

We currently assume dry grounds saturate instantly. In reality, water penetration into porous coffee particles takes time. We will model a wetted fraction that ramps from 0 to 1.

Washburn equation for imbibition:
$$L(t) = \sqrt{\frac{\gamma r \cos\theta \cdot t}{2\mu}}$$

Wetted fraction model:
$$f_{wet}(t) = 1 - e^{-k_{wet} \cdot t}$$

$k_{wet}$ depends on roast level, grind size, and water temperature. Fresh beans with CO₂ resist wetting, which this model will capture more fundamentally than the current bloom model.

- Complexity: Medium
- Impact: High

### 1.6 External Mass-Transfer and Agitation Modifier

Boundary layer thickness affects extraction rate. Stirring, flow velocity, and pressure all thin the boundary layer. This concept applies to all methods: flow velocity in V60, stirring in French Press, and pressure-driven flow in espresso or AeroPress.

Sherwood/Reynolds correlation for the full model:
$$Sh = 2 + 0.6 \cdot Re^{1/2} \cdot Sc^{1/3}$$

Simplified model for the simulator:
$$k_{eff} = k \times f_{agitation}$$
where $f_{agitation} \in [0.5, 2.0]$.

| Method | Agitation Source | Typical $f_{agitation}$ |
| :--- | :--- | :--- |
| V60 | Flow velocity through bed | 1.0 (baseline) |
| French Press | Manual stirring | 0.7–1.3 |
| Espresso | Pressure-driven flow | 1.5–2.0 |
| AeroPress | Plunge pressure + stir | 1.0–1.5 |
| Cold Brew | None (static immersion) | 0.5–0.8 |

- Complexity: Medium
- Impact: High

### 1.7 Bean Freshness Modifier

Fresh beans contain CO₂ that inhibits wetting and creates gas pockets. Stale beans wet faster but may have degraded solubles. This is modeled as a modifier on wetting speed and CO₂ amplitude, not a standalone extraction model.

$f_{freshness}$ modulates two parameters:
- CO₂ bloom amplitude: $B_{eff} = B \times f_{freshness,CO_2}$
- Wetting rate: $k_{wet,eff} = k_{wet} \times f_{freshness,wet}$

Where $f_{freshness,CO_2}$ decreases and $f_{freshness,wet}$ increases as beans age (more CO₂ off-gassed, less resistance to wetting).

- Complexity: Low
- Impact: Medium

### 1.8 Water Chemistry Modifier

Hard water increases extraction rate as ions facilitate solubility. SCA recommends 50 to 175 ppm $CaCO_3$.

Formula:
$$k_{eff} = k \times f_{hardness}$$
where $f_{hardness} = 1 + \beta \cdot (hardness - 100)$ with a reference of 100 ppm $CaCO_3$.

- Complexity: Medium
- Impact: Medium

## Phase 2: Stochastic Realism Layer

This layer allows toggling between deterministic and stochastic modes. Stochastic mode shows confidence bands and the probability of hitting target extraction values.

### 2.1 Ornstein-Uhlenbeck (OU) Process for Pour Rate

This process models mean-reverting human behavior, where a user aims for a target pour rate but wobbles around it.

Formula:
$$x_{t+\Delta t} = x_t + \theta(\mu - x_t)\Delta t + \sigma\sqrt{\Delta t} \cdot W_t$$

Skill level controls $\theta$ (mean reversion speed) and $\sigma$ (noise magnitude):

| Skill Level | $\theta$ | $\sigma$ | Behavior |
| :--- | :--- | :--- | :--- |
| Expert | 2.0 | 0.1 | Quick correction, little noise |
| Intermediate | 1.0 | 0.25 | Moderate correction and noise |
| Novice | 0.3 | 0.5 | Slow correction, lots of noise |

Reference: Uhlenbeck and Ornstein (1930).

### 2.2 Coherent Noise for Hand Tremor

We will use 1D Perlin or Simplex noise for smooth, realistic hand movement rather than jittery white noise. This applies to the pour position on the coffee bed.

### 2.3 Box-Muller Transform

Needed to generate Gaussian samples for the OU process in WASM, as AssemblyScript lacks a native Gaussian random function.

$$Z_0 = \sqrt{-2\ln U_1} \cos(2\pi U_2)$$
$$Z_1 = \sqrt{-2\ln U_1} \sin(2\pi U_2)$$

where $U_1, U_2 \sim \text{Uniform}(0, 1)$. Each pair of uniform samples yields two independent standard normal samples.

The uniform source must be a **deterministic seeded PRNG** (e.g., xorshift128+) rather than `Math.random`. This enables reproducible stochastic runs — the same seed produces identical confidence bands, which is essential for shareable brew scenarios, snapshot testing, and debugging. Expose the seed in the UI and persist it with saved recipes.

### 2.4 AR(1) Filter for Temperature Drift

A simpler alternative to the OU process for slow-varying parameters like kettle temperature.

Formula:
$$Y_t = \phi \cdot Y_{t-1} + (1-\phi) \cdot Z_t$$

$\phi$ close to 1 results in very smooth drift.

### 2.5 Monte Carlo Wrapper

Run 100 to 500 extractions with perturbed inputs. WASM makes this feasible in real-time — each extraction run is a simple exponential formula over ~300 time steps, so 500 runs amount to roughly 150,000 arithmetic operations (sub-millisecond in WASM, single-digit milliseconds in plain JS). Debouncing the reactive watcher (50-100ms) is sufficient to keep slider interactions smooth; Web Workers are unnecessary given the trivial per-run cost. The output will show confidence bands on the extraction curve and the probability of hitting target zones. Report percentiles (5th / 50th / 95th) rather than just mean with symmetric bands.

### 2.6 Skill Level Profiles

Parameterize all noise sources by skill level. Progression from expert to novice affects pour rate variance, temperature consistency, timing accuracy, and grind consistency.

### 2.7 Validation Framework

- **Chi-Square Goodness-of-Fit**: Verify output distributions match expected shapes.
- **Wald-Wolfowitz Runs Test**: Expect this to **fail** for independence since our noise is intentionally correlated. If it passes, the noise is too random and unrealistic.
- **Autocorrelation Analysis**: Tune smoothness, expecting exponential decay with $\tau \approx 200$–$500$ ms for hand movements.

## Phase 3: Method-Specific Branches

### 3.1 V60 Pour-Over

#### 3.1a Percolation Driving Force Multiplier

A scalar rate-constant multiplier modeling how gravity-driven flow through the coffee bed enhances extraction compared to immersion. Fresh water continually contacts grounds, and micro-turbulence at particle surfaces thins the diffusion boundary layer — analogous to continuous stirring.

$$k_{eff} = k \cdot m_{perc}$$

where $m_{perc}$ is calibrated per method ($\approx 1.2$–$1.3$ for V60, $1.0$ for all others). Applied in the TypeScript piecewise ODE stepper after Arrhenius, grind, and bloom corrections — zero WASM changes. The `MethodConfig.percolationMultiplier` extension point already exists at `1.0`.

- Complexity: Small
- Impact: Low-Medium (calibration knob, not new physics)
- Depends on: Phase 0 ✅, Plans 1–2 ✅
- Conditional: Executes only if Plan 2's GO/NO-GO gate returned GO (see `.sisyphus/evidence/plan2-gate-result.md`)

#### 3.1b Dripper Geometry — Water Holdup Model

Model how different drippers (V60, Kalita Wave, Chemex, Origami) affect extraction through **water residence time**, not rate-constant scaling. Drippers differ in drain rate — a Kalita holds water in contact with grounds longer, producing more total extraction at the same extraction rate per second.

> ⚠️ **Physics note**: An earlier proposal used `k *= flowRestriction` per dripper. This is **physically wrong** — rate constants ($k$) are intrinsic to bean/roast/temperature (Arrhenius), not the dripper. The correct mechanism is hydraulic: drippers control how long water stays in the bed, not how fast extraction occurs per second of contact.

**Core model — dynamic water-in-bed tracking:**

$$\frac{dW_{bed}}{dt} = Q_{pour}(t) - Q_{drain}(t)$$

where $Q_{drain}$ is governed by dripper geometry and a drain coefficient. The simplest form uses exponential decay:

$$W_{bed}(t + dt) = W_{bed}(t) + (Q_{pour} - \lambda \cdot W_{bed}(t)) \cdot dt$$

where $\lambda$ is the drain coefficient (high for V60, low for Kalita). The instantaneous effective brew ratio becomes $W_{bed}(t) / m_{coffee}$, feeding into the equilibrium yield calculation at each ODE time step.

**Dripper parameters** (minimum viable):

| Parameter | V60 | Kalita Wave | Chemex | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `drainCoefficient` ($\lambda$) | High | Low | Medium | Controls drain rate / residence time |
| `geometryType` | conical | flat-bottom | conical | Determines $V \to h$ relationship |

**Full-fidelity extension** (future): Geometry-specific hydrostatic head ($h \propto V^{1/3}$ for cones, $h \propto V$ for flat-bottom), Darcy-derived $Q_{drain}$ with $R_{bed} + R_{dripper}$, and bypass flow modeling (Gagné 2021).

**Architecture implications**:
- Adds `waterInBed` state variable to the ODE inner loop
- Dynamic brew ratio replaces fixed cumulative water per pour segment
- Backward-compatible: undefined `drainCoefficient` falls back to `waterInBed = cumulativeWater` (legacy V60 behavior)
- Requires recalibration of `A` and `A_FAST` constants after integration (dynamic $W_{bed}$ is always ≤ cumulative water, shifting curves downward)

- Complexity: Large
- Impact: High (transforms V60 from "generic pour-over" to "dripper-aware")
- Depends on: Phase 0 ✅, Plans 1–2 ✅. Plan 3 (3.1a) is NOT required.
- Includes: Dripper selector UI (V60 only), `DripperConfig` data model, `useDripperProfile` composable

#### 3.1c Advanced V60 Bed Physics (Future)

- Darcy's law and Kozeny-Carman for flow resistance through the packed bed.
- Fines migration where small particles move and clog the filter.
- Bed compaction under water weight.
- Channeling via a two-pathway model (fast channel and slow bulk).
- Filter bypass differences between paper and metal filters.
- Axial dispersion using the Bodenstein number (Vaca Guerra et al. 2024).

### 3.2 Espresso

- Pressure-time profile modeling pre-infusion, peak pressure, and decline.
- Puck hydraulics using Darcy and compressibility.
- Stochastic clogging regime (Cameron et al. 2020).
- Puck erosion and bed degradation over time.
- Fine migration under pressure.

### 3.3 French Press (Immersion)

- Equilibrium limits where extraction caps at certain ratios and times (Liang et al. 2021).
- Settling and stratification of particles.
- Fines pass-through mesh affecting cup body and turbidity.
- Agitation model for initial stir and press timing.

### 3.4 Cold Brew

- Diffusion-dominant regime at low temperature.
- $k_{slow}$ drops approximately 244 times at 20°C compared to 93°C (Arrhenius).
- Time-dependent equilibrium cap.
- Modeling for extended contact times of 12 to 24 hours.
- **Temperature profile**: `computePiecewiseCurve()` uses `globalTemp` as a static starting temperature with Newton cooling. Future heated cold brew or variable-temperature immersion would need a `ThermalProfile` concept or per-method `minTemperature` in MethodConfig rather than modifying the `clampPourStep()` 80°C floor.

### 3.5 AeroPress

- Hybrid immersion and pressure two-stage model.
- Variable plunge pressure controlled by the user.
- Short contact time with high agitation.
- Paper vs metal filter effects.

## Dependency Graph

```
Phase 0: Two-Phase Kinetics ✅
    │
    ▼
Phase 1: Universal Extraction Core
    │
    ├── 1.1 Two-Phase (all methods) ─┐
    ├── 1.2 Bimodal PSD (all methods)┤
    │                                ├──► 1.5 Wetting/Imbibition ──► 1.7 Bean Freshness
    ├── 1.3 Roast-Dependent E_max ───┤
    ├── 1.4 Roast-Level φ_s ─────────┘
    │
    ├── 1.6 Mass-Transfer/Agitation (independent)
    ├── 1.8 Water Chemistry (independent)
    │
    ▼ (all Phase 1 complete)
    │
    ├────────────────────┐
    ▼                    ▼
Phase 2: Stochastic   Phase 3: Method-Specific
(2.1 → 2.3 → 2.5)    (3.1─3.5 independent)
(2.2 parallel)         3.1a Percolation multiplier ←── Phase 0 (early-start)
(2.4 parallel)         3.1b Water holdup model ←─────── Phase 0 (early-start)
(2.5 → 2.6 → 2.7)     3.1c Advanced bed physics ←──── 3.1b
```

- Phase 0 is complete (merged). Phase 1 work can begin.
- 1.1 and 1.2 can run in parallel (both "enable universally" tasks).
- 1.3 and 1.4 can run in parallel (both roast-related).
- 1.5 must precede 1.7 because freshness modifies wetting parameters.
- 1.6 and 1.8 are independent of other Phase 1 items.
- Phase 2 and Phase 3 can run in parallel once Phase 1 is complete.
- **Early-start exception**: 3.1a and 3.1b depend only on Phase 0 (complete) and Plans 1–2 (complete). They can execute in parallel with Phase 1 work without waiting for Phase 1 completion. 3.1a is conditional on the Plan 2 GO/NO-GO gate. 3.1b is independent of 3.1a.

## Scientific References

- **Spiro, M. & Selwood, R. M.** (1984). The kinetics and mechanism of caffeine infusion from coffee: The effect of particle size. *Journal of the Science of Food and Agriculture*, 35(8), 915–924. DOI: [10.1002/jsfa.2740350817](https://doi.org/10.1002/jsfa.2740350817)

- **Moroney, K. M., Lee, W. T., O'Brien, S. B. G., Suijver, F. & Marra, J.** (2015). Modelling of coffee extraction during brewing using multiscale methods. *Chemical Engineering Science*, 137, 216–234. DOI: [10.1016/j.ces.2015.06.003](https://doi.org/10.1016/j.ces.2015.06.003)

- **Moroney, K. M., Lee, W. T., O'Brien, S. B. G., Suijver, F. & Marra, J.** (2016). Coffee extraction kinetics in a well mixed system. *Journal of Mathematics in Industry*, 7, Article 2. DOI: [10.1186/s13362-016-0024-6](https://doi.org/10.1186/s13362-016-0024-6)

- **Moroney, K. M. et al.** (2019). Analysing extraction uniformity from porous coffee beds using mathematical modelling and CFD. *PLoS ONE*, 14(7), e0219906. DOI: [10.1371/journal.pone.0219906](https://doi.org/10.1371/journal.pone.0219906)

- **Cameron, M. I. et al.** (2020). Systematically Improving Espresso: Insights from Mathematical Modeling and Experiment. *Matter*, 2(3), 631–648. DOI: [10.1016/j.matt.2019.12.019](https://doi.org/10.1016/j.matt.2019.12.019)

- **Gagné, J.** (2021). *The Physics of Filter Coffee*. Scott's Digital Alchemy. ISBN: 978-0578246086

- **Liang, C. et al.** (2021). Coffee extraction and its physicochemical model. *Scientific Reports*, 11, 5535. DOI: [10.1038/s41598-021-85787-1](https://doi.org/10.1038/s41598-021-85787-1)

- **Wang, X. & Lim, L.-T.** (2021). Modeling study of coffee extraction at different temperature and grind size conditions to better understand the cold and hot brewing process. *Journal of Food Process Engineering*, 44(8), e13748. DOI: [10.1111/jfpe.13748](https://doi.org/10.1111/jfpe.13748)

- **Lee, W. T. et al.** (2023). Dissolution flow instabilities in coffee extraction.

- **Anderson, B. A., Singh, R. P. & Ramaswamy, H. S.** (2003). Diffusivity of CO₂ from roasted coffee. *Journal of Food Engineering*, 59(1), 63–70. DOI: [10.1016/S0260-8774(02)00432-6](https://doi.org/10.1016/S0260-8774(02)00432-6)

- **Sano, Y. et al.** (2019). Mathematical model for coffee extraction based on the volume averaging theory. *Journal of Food Engineering*, 263, 1–8. DOI: [10.1016/j.jfoodeng.2019.05.025](https://doi.org/10.1016/j.jfoodeng.2019.05.025)

- **Vaca Guerra, S. et al.** (2024). Influence of particle size distribution on espresso extraction via packed bed compression. *Journal of Food Engineering*, 340, 111301. DOI: [10.1016/j.jfoodeng.2022.111301](https://doi.org/10.1016/j.jfoodeng.2022.111301)

- **Gagné, J.** (2023). What I Learned from Analyzing 300 Particle Size Distributions for 24 Espresso Grinders. *Coffee ad Astra*. URL: [coffeeadastra.com](https://coffeeadastra.com/2023/09/21/what-i-learned-from-analyzing-300-particle-size-distributions-for-24-espresso-grinders)

- **Uhlenbeck, G. E. & Ornstein, L. S.** (1930). On the Theory of the Brownian Motion. *Physical Review*, 36(5), 823–841. DOI: [10.1103/PhysRev.36.823](https://doi.org/10.1103/PhysRev.36.823)

## Implementation Notes

- **WASM bridge rule**: All physics logic remains in AssemblyScript. Never call WASM functions directly from components.
- **MethodConfig registry**: All method-specific parameters must live in this registry. Never hardcode method-specific values in components or composables.
- **Method isolation**: Use dedicated composables for each method (e.g., `useV60PourSchedule`). New brew method features follow this pattern.
- **Reactivity**: Recipe changes automatically trigger `computeCurve()` via a deep watcher. No manual recomputation calls from components.
- **Testing**: Every phase item requires corresponding physics unit tests validating the new math against published data or known physical constraints.
- **Feature-gating continuity**: When enabling a feature universally (e.g., flipping `supportsTwoPhase` from V60-only to all methods), the extraction curves for previously-unsupported methods will change discontinuously. Each gating expansion must include unit tests asserting: (a) monotonicity in grind size vs. extraction, (b) continuity within reasonable tolerance at parameter boundaries, and (c) that existing method curves remain within calibrated ranges.
- **Validation targets**: For each major model addition, document which published dataset, figure, or metric range the implementation must match. Examples: Moroney $\epsilon$ range 0.025-0.08 for two-phase, Arrhenius temperature sensitivity from Sano et al., extraction vs. time curve shapes from Liang et al. for immersion. Test assertions should encode these as numeric tolerances that fail CI on drift.
- **Per-method temperature validation**: `clampPourStep()` enforces an 80°C minimum designed for the V60 pour schedule UI. When extending piecewise extraction to non-V60 methods, synthetic schedules must omit per-step temperature to fall back to `globalTemp`, bypassing this floor. Future dynamic temperature profiles should introduce `MethodConfig.minTemperature` per method or a `ThermalProfile` concept rather than modifying the `clampPourStep()` guard.
