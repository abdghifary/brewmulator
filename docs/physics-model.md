# Physics Model: Saturation-Aware Extraction

## Overview
Brewmulator has transitioned from a simplified "Infinite Sink" model to a more realistic "Saturation-Aware" model. This change ensures that the brew ratio (the amount of water relative to coffee) correctly limits the maximum possible extraction yield, mirroring real-world physics where water can only hold a certain amount of dissolved coffee solids before becoming saturated.

## The Old Model: Irreversible (Infinite Sink)
In the previous model, extraction was treated as a one-way process where solids move from the coffee grounds into an infinite volume of water.
- **Assumption**: Water never gets "full" or saturated.
- **Result**: Given enough time, the extraction yield would always approach the theoretical maximum ($E_{max} \approx 28\%$), regardless of whether you were brewing a concentrated espresso or a dilute filter coffee.
- **Formula**: $E(t) = E_{max}(1 - e^{-kt})$

## The New Model: Reversible (Saturation Limited)
The updated model implements **Reversible Kinetics** based on the **Spiro & Selwood** pseudo-first order model and the **Nernst-Brunner** equation. It recognizes that extraction is a diffusion process driven by the concentration gradient between the grounds and the liquid.
- **Key Insight**: As the concentration of dissolved solids in the water increases, the "driving force" for extraction decreases.
- **Equilibrium**: Extraction stops when the liquid reaches an equilibrium concentration, which is determined by the solubility coefficient and the brew ratio.

## The Math
The core of the simulator uses the following mathematical framework:

### 1. Solubility Coefficient ($\alpha$)
We use $\alpha \approx 1.1$ as the partition coefficient. This represents the ratio of the concentration of coffee solids in the grounds to the concentration in the water at equilibrium.

### 2. Equilibrium Yield ($Y_{eq}$)
The maximum yield achievable for a given brew ratio is no longer a fixed $E_{max}$. Instead, it is limited by saturation:
$$Y_{eq} = \frac{E_{max}}{1 + \frac{\alpha}{ratio}}$$
Where `ratio` is the water-to-coffee weight ratio (e.g., 16 for a 1:16 brew).

### 3. Observed Rate Constant ($k_{obs}$)
The speed at which the system approaches equilibrium also scales with the ratio:
$$k_{obs} = k \left(1 + \frac{\alpha}{ratio}\right)$$
Where $k$ is the base rate constant derived from temperature, grind size, and roast level.

### 4. Extraction Equation
The final extraction yield $E(t)$ at time $t$ is:
$$E(t) = Y_{eq}(1 - e^{-k_{obs}t})$$

### 5. Rate Constant ($k$)

The base rate constant $k$ is determined by the temperature, grind size, roast level, and brewing method. It follows the Arrhenius equation for temperature dependence, modified by physical factors:

$$k = A \cdot e^{-\frac{E_A}{R \cdot T_K}} \cdot f_{grind} \cdot f_{roast} \cdot f_{method}$$

#### Temperature Dependence
Temperature affects extraction speed exponentially. The Arrhenius component uses:
- $T_K$: Water temperature in Kelvin ($T_C + 273.15$)
- $E_A = 50,000\,\text{J/mol}$: Activation energy
- $R = 8.314\,\text{J/(mol·K)}$: Ideal gas constant
- $A = 5 \times 10^4$: Pre-exponential factor

#### Physical Modifiers
- **Grind Factor** ($f_{grind}$): Scales inversely with the square of the grind size, using 600μm as the reference:
  $$f_{grind} = \left(\frac{600}{\text{grind}}\right)^2$$
- **Roast Factor** ($f_{roast}$): Scales linearly with the roast level ($0.8$ for light, $1.0$ for medium, $1.2$ for dark).
- **Method Modifier** ($f_{method}$): Accounts for mechanical extraction aid (pressure) or lack thereof (immersion):
  - **Espresso**: $7.0$ (pressure-driven)
  - **French Press / Cold Brew**: $0.85$ (immersion)
  - **All others**: $1.0$

| Parameter | Value | Description |
| :--- | :--- | :--- |
| $A$ | $5 \times 10^4$ | Pre-exponential factor |
| $E_A$ | $50,000\,\text{J/mol}$ | Activation energy |
| $R$ | $8.314\,\text{J/(mol·K)}$ | Gas constant |
| $T_{amb}$ | $22\,°C$ | Ambient temperature |
| $h$ | $0.001\,\text{s}^{-1}$ | Cooling coefficient |
| $k_{degas}$ | $0.03\,\text{s}^{-1}$ | CO₂ degassing rate |
| $B$ | $0.6$ | Initial bloom inhibition |

## Practical Effects

### High Ratio (Dilute Brews)
When using a high water-to-coffee ratio (e.g., 1:17 or 1:20):
- $\frac{\alpha}{ratio}$ is small.
- $Y_{eq}$ remains close to $E_{max}$.
- The simulation allows for higher total extraction yields, as the water remains relatively "hungry" for solids.

### Low Ratio (Concentrated Brews)
When using a low water-to-coffee ratio (e.g., 1:2 espresso or 1:10 Moka pot):
- $\frac{\alpha}{ratio}$ is significant.
- $Y_{eq}$ is substantially lower than $E_{max}$ (e.g., for 1:2, $Y_{eq} \approx E_{max} / (1 + 2/2) = E_{max} / 2 \approx 14\%$).
- The simulation correctly predicts that you cannot reach high extraction yields in very concentrated brews without increasing the amount of water (i.e., bypass or longer ratio).

## References
- **Spiro, M., & Selwood, R. M.** (1984). The kinetics of coffee brewing. *Z. Lebensm. Unters. Forsch.*
- **Nernst-Brunner Theory**: Describes the dissolution of solids into a liquid where saturation limits the rate of diffusion.

## Multi-Step Pour Schedule Model

Real V60 brewing always involves multiple pours — a bloom phase followed by 2–5 main pours. Treating all water as present from *t* = 0 overestimates the water-to-coffee ratio during early extraction and underestimates the CO₂ inhibition from fresh grounds outgassing.

The multi-step model divides the brew into segments. Each segment has its own:
- **Water ratio**: only water already poured contributes to the ratio
- **Temperature**: decays between pours (Newton cooling), reheats on pour (mass-weighted average)
- **Rate modifier**: CO₂ bloom inhibition on the first pour reduces the effective rate constant

---

## Piecewise Extraction

For each time segment between consecutive pour events, the extraction yield evolves as:

$$E(t) = E_{eq} - (E_{eq} - E_{start}) \cdot e^{-k_{obs} \cdot \Delta t}$$

where:
- $E_{start}$ is the yield carried forward from the end of the previous segment
- $E_{eq} = \frac{E_{max}}{1 + \alpha / R}$ is the new equilibrium yield after water ratio *R* changes
- $k_{obs} = k \cdot (1 + \alpha / R)$ is the observed rate constant
- $k$ is obtained from `calculateRateConstant(T, grind, roast, method)` in the WASM engine
- $\Delta t = t - t_{pour}$ is time elapsed since the last pour

This formulation ensures extraction carries forward continuously — the equilibrium shifts when new water arrives, but yield never resets to zero.

---

## Thermal Model

### Newton Cooling
Between pours, the coffee slurry temperature decays toward ambient:

$$T(t) = T_{amb} + (T_0 - T_{amb}) \cdot e^{-h \cdot t}$$

where $T_{amb} = 22\,°C$ is ambient temperature, $T_0$ is the temperature at the last pour, and $h \approx 0.001\,\text{s}^{-1}$ is the Newton cooling coefficient (~4°C/min loss rate, realistic for a ceramic/glass V60 dripper).

### Pour Reheat
When a new pour of mass $m_p$ at temperature $T_p$ is added to existing slurry of mass $m_s$ at temperature $T_s$:

$$T_{new} = \frac{m_s \cdot T_s + m_p \cdot T_p}{m_s + m_p}$$

This mass-weighted average correctly models the thermal equilibration of the combined fluid.

### Temperature Effect on Rate
Temperature enters the extraction rate via the Arrhenius-type correction in `calculateRateConstant`. A 10°C drop between pours meaningfully reduces $k$, which is reflected automatically when the rate constant is recomputed at each segment.

---

## CO₂ Bloom Phase

Fresh-roasted coffee grounds contain significant dissolved CO₂ from the roasting process. During the bloom pour, outgassing CO₂ creates a physical barrier between water and ground coffee, reducing effective contact and inhibiting extraction.

The inhibition factor during the bloom phase is modeled as:

$$f_{CO_2}(t) = 1 - B \cdot e^{-k_{degas} \cdot (t - t_{bloom})}$$

where:
- $B = 0.6$ is the initial bloom inhibition coefficient (extraction rate reduced to ~40% at *t* = 0)
- $k_{degas} \approx 0.03\,\text{s}^{-1}$ is the CO₂ degassing rate constant
- $t_{bloom}$ is the time of the bloom pour

The effective rate constant during bloom is $k_{eff} = k \cdot f_{CO_2}(t)$.

After the bloom phase (once all CO₂ has outgassed or a new pour begins), the inhibition disappears and $f_{CO_2} = 1$.

## Bimodal Particle Size Distribution (Model C: φₑ Compressed Harmonic Mean)

Real coffee grinding produces a bimodal distribution of particle sizes: small "fines" (<100μm)
and larger "boulders" (the target grind setting). The simulator computes an **effective grind
size** via harmonic mean, with a **φₑ compression** applied above the reference fines fraction
to prevent the harmonic mean from over-weighting fines at high φ.

### Effective Fines Fraction (φₑ)

The raw harmonic mean is highly sensitive to fines — at φ=0.20 (Timemore C2), an 850μm grind
collapses to d_eff≈340μm, making it impossible to brew in the sweet spot. This contradicts
real-world experience where mid-range grinders produce perfectly acceptable V60 coffee.

Physically, not all fines contribute equally to extraction in a percolation bed:
- Fines migrate and cluster, reducing their effective surface area
- Fine particles shield each other from water flow (bed clogging)
- Fines near the filter exhaust quickly, becoming inert

To model this, we compress φ above a reference point before applying the harmonic mean:

$$\varphi_e = \begin{cases} \varphi & \text{if } \varphi \leq \varphi_{ref} \\ \varphi_{ref} + \beta(\varphi) \cdot (\varphi - \varphi_{ref}) & \text{if } \varphi > \varphi_{ref} \end{cases}$$

where the compression factor β increases with φ:

$$\beta(\varphi) = \beta_0 + (\beta_1 - \beta_0) \cdot \left(\frac{\varphi - \varphi_{ref}}{\varphi_{hi} - \varphi_{ref}}\right)^n$$

### Effective Grind Size

The compressed φₑ is then used in the standard harmonic mean:

$$d_{eff} = \frac{1}{\frac{1 - \varphi_e}{d_{boulders}} + \frac{\varphi_e}{d_{fines}}}$$

where:
- $d_{boulders}$ is the user's grind size setting (μm)
- $d_{fines}$ = 100μm (fixed constant, per Gagné 2023 laser diffraction data)

### Parameters

| Parameter | Symbol | Value | Description |
|-----------|--------|-------|-------------|
| Reference fines fraction | $\varphi_{ref}$ | 0.15 | No compression below this |
| Upper fines fraction | $\varphi_{hi}$ | 0.40 | Blade grinder ceiling |
| Onset compression | $\beta_0$ | 0.20 | Compression strength at $\varphi_{ref}$ |
| Ceiling compression | $\beta_1$ | 0.60 | Compression strength at $\varphi_{hi}$ |
| Curve exponent | $n$ | 2 | Quadratic rolloff |

### Calibration

The model is calibrated so that the reference point is preserved exactly:
- φ=0.15 @ 850μm → φₑ=0.15 → d_eff=400μm → EY≈20.63% (Sweet Spot)

At higher fines fractions, the compression reduces the fines impact:

| Grinder | φ | φₑ | d_eff (850μm) | Effect |
|---------|---|-----|---------------|--------|
| No fines | 0 | 0 | 850μm | Baseline |
| Niche Zero | 0.08 | 0.08 | 547μm | Mild increase |
| Comandante C40 | 0.11 | 0.11 | 474μm | Moderate increase |
| Default (reference) | 0.15 | 0.15 | 400μm | Calibration point |
| Timemore C2 | 0.20 | 0.161 | 385μm | Compressed — realistic |
| Baratza Encore | 0.22 | 0.166 | 377μm | Compressed |
| Blade grinder | 0.40 | 0.210 | 313μm | Heavily compressed |

### Why φₑ Compression Over Raw Harmonic Mean

The raw harmonic mean (Model B) was too sensitive at high fines fractions:
- Timemore C2 (φ=0.20) at 850μm → d_eff=340μm → EY≈22.95% (Over-extracted)
- Even at max grind (1000μm) → d_eff=357μm → EY≈22.32% (Still over-extracted)
- This made it impossible for mid-range grinders to brew in the sweet spot

The φₑ compression (Model C) fixes this by modeling the diminishing returns of fines in a
percolation bed, supported by Moroney et al. (2019) bed clogging observations.

### Grinder Quality Effect

The fines fraction is controlled by grinder quality:

| Grinder Type | Typical Fines Fraction | Source |
|-------------|----------------------|--------|
| Premium flat burr (e.g., Niche Zero) | 5–10% | Gagné 2023 |
| Premium conical burr (e.g., Comandante C40) | 10–15% | Gagné 2023 |
| Mid-range conical (e.g., Timemore C2) | 15–20% | Gagné 2023 |
| Entry-level electric (e.g., Baratza Encore) | 18–25% | Smrke et al. 2024 |
| Blade grinder | 30–40% | Gagné 2023 |

In the simulator, users control this via the "Grinder Quality" slider (V60 only), which maps
directly to `finesFraction`.

### V60 Only

Bimodal PSD modeling is currently enabled only for V60 pour-over, where the effect is most
pronounced due to percolation through a coffee bed. Immersion methods (French Press, Cold Brew)
are less affected by particle distribution because all particles have equal contact time
regardless of size.

### Implementation

The effective grind size is computed by `computeEffectiveGrindSize()` in
`usePiecewiseExtraction.ts`, called before the existing `calculateRateConstant()` WASM call:

```typescript
export function computeEffectiveGrindSize(grindSize: number, phi: number): number {
  if (phi <= 0) return grindSize

  let phiE = phi
  if (phi > PHI_REF) {
    const x = Math.min(1, (phi - PHI_REF) / (PHI_HI - PHI_REF))
    const beta = BETA_0 + (BETA_1 - BETA_0) * Math.pow(x, N_COMPRESS)
    phiE = PHI_REF + beta * (phi - PHI_REF)
  }

  return 1 / ((1 - phiE) / grindSize + phiE / FINES_GRIND_SIZE)
}
```

When `phi` is 0 or undefined, `d_eff = grindSize` — behavior is identical to the
pre-bimodal model. No WASM changes are required.

### Scientific References (Bimodal PSD)

1. **Moroney, K.M. et al. (2015)** — Modelling of coffee extraction during brewing using multiscale methods. *Chemical Engineering Science*, 137, 216–234. DOI: [10.1016/j.ces.2015.06.003](https://doi.org/10.1016/j.ces.2015.06.003)

2. **Moroney, K.M. et al. (2016)** — Coffee extraction kinetics in a well mixed system. *Journal of Mathematics in Industry*, 7, Article 2. DOI: [10.1186/s13362-016-0024-6](https://doi.org/10.1186/s13362-016-0024-6)

3. **Moroney, K.M. et al. (2019)** — Analysing extraction uniformity from porous coffee beds using mathematical modelling and CFD. *PLoS ONE*, 14(7), e0219906. DOI: [10.1371/journal.pone.0219906](https://doi.org/10.1371/journal.pone.0219906)

4. **Spiro, M. & Selwood, R.M. (1984)** — The kinetics and mechanism of caffeine infusion from coffee: The effect of particle size. *Journal of the Science of Food and Agriculture*, 35(8), 915–924. DOI: [10.1002/jsfa.2740350817](https://doi.org/10.1002/jsfa.2740350817)

5. **Cameron, M.I. et al. (2020)** — Systematically Improving Espresso: Insights from Mathematical Modeling and Experiment. *Matter*, 2(3), 631–648. DOI: [10.1016/j.matt.2019.12.019](https://doi.org/10.1016/j.matt.2019.12.019)

6. **Gagné, J. (2021)** — *The Physics of Filter Coffee*. Scott's Digital Alchemy. ISBN: 978-0578246086

7. **Gagné, J. (2023)** — What I Learned from Analyzing 300 Particle Size Distributions for 24 Espresso Grinders. *Coffee ad Astra*. URL: https://coffeeadastra.com/2023/09/21/what-i-learned-from-analyzing-300-particle-size-distributions-for-24-espresso-grinders

8. **Vaca Guerra, S. et al. (2023)** — Influence of particle size distribution on espresso extraction via packed bed compression. *Journal of Food Engineering*, 340, 111301. DOI: [10.1016/j.jfoodeng.2022.111301](https://doi.org/10.1016/j.jfoodeng.2022.111301)

9. **Smrke, S. et al. (2024)** — The role of fines in espresso extraction dynamics. *Scientific Reports*, 14, Article 5765. DOI: [10.1038/s41598-024-55831-x](https://doi.org/10.1038/s41598-024-55831-x)

10. **Castillo-Santos, K. et al. (2019)** — Mathematical model for coffee extraction based on the volume averaging theory. *Journal of Food Engineering*, 259, 1–8. DOI: [10.1016/j.jfoodeng.2019.05.025](https://doi.org/10.1016/j.jfoodeng.2019.05.025)

---

## Extended References

*(Extending prior references — Spiro & Selwood 1984 and Nernst-Brunner already listed above)*

- **Spiro, M. & Hunter, R.J.** (1985). The kinetics and mechanism of caffeine infusion from coffee. *Journal of the Science of Food and Agriculture*, 36(10), 869–876. DOI: [10.1002/jsfa.2740360917](https://doi.org/10.1002/jsfa.2740360917)

- **Moroney, K.M., Lee, W.T., O'Brien, S.B.G., Suijver, F., & Marra, J.** (2015). Modelling of coffee extraction during brewing using multiscale methods: Filter coffee. *Chemical Engineering Science*, 137, 216–234. DOI: [10.1016/j.ces.2015.06.003](https://doi.org/10.1016/j.ces.2015.06.003)

- **Moroney, K.M., Lee, W.T., O'Brien, S.B.G., Suijver, F., & Marra, J.** (2016). Coffee extraction kinetics in a well mixed system. *Journal of Mathematics in Industry*, 7, 3. DOI: [10.1186/s13362-016-0024-6](https://doi.org/10.1186/s13362-016-0024-6)

- **Anderson, B.A., Singh, R.P., & Ramaswamy, H.S.** (2003). Diffusivity of CO₂ from roasted coffee. *Journal of Food Engineering*, 59(1), 63–70. DOI: [10.1016/S0260-8774(02)00432-6](https://doi.org/10.1016/S0260-8774(02)00432-6)

- **Liang, C., et al.** (2021). Coffee extraction and its physicochemical model. *Scientific Reports*, 11, 5535. DOI: [10.1038/s41598-021-85787-1](https://doi.org/10.1038/s41598-021-85787-1)

- **Gagné, J.** (2021). *The Physics of Filter Coffee*. Scott's Digital Alchemy. ISBN: 978-0578246086

---

## Model Assumptions & Limitations

The Brewmulator physics engine uses a simplified extraction model. These assumptions should be understood when interpreting simulation results:

### Grind Size Model
1. **Mean particle diameter**: Grind size represents a single average particle diameter in microns (μm). Real coffee grinding produces a bimodal distribution of particle sizes. For V60 brewing, the simulator accounts for this via the φₑ Compressed Harmonic Mean model (see Bimodal PSD section above). For other methods, the distribution is not modeled.
2. **Inverse-square relationship**: Extraction rate scales with `(600/grind)²`, where 600μm is the reference "medium" grind (comparable to table salt). This models the surface-area-to-volume ratio of idealized spherical particles.
3. **No fines migration**: In real pour-over brewing, fine particles migrate downward and can clog the filter bed, dramatically slowing flow rate and increasing contact time. This effect is not modeled.
4. **No bed compaction**: Real coffee beds compact under water weight, creating channeling (uneven flow paths). The model assumes uniform water contact with all particles.

### Water Flow Model
5. **Ideal water distribution**: The model assumes uniform water distribution across the coffee bed, equivalent to using a drip assist device (e.g., Hario Drip Assist). Pouring technique, spiral patterns, and center-pour effects are not modeled.
6. **No channeling**: All water contacts all coffee grounds uniformly. In reality, channeling reduces effective extraction.

### Temperature Model
7. **Newton cooling**: Temperature decays exponentially toward ambient (22°C) with a single cooling coefficient. Real thermal dynamics depend on dripper material (ceramic vs plastic vs metal), pre-heating, and ambient conditions.
8. **Instantaneous mixing**: When new water is poured, it instantly mixes to a uniform temperature. Real slurry has thermal gradients.

### Calibrated Template Values
9. **Model-calibrated grind sizes**: V60 recipe template grind sizes are calibrated to produce realistic extraction yields within this simplified model. They may not correspond to literal grinder settings. For example, a template value of 500μm produces the same extraction yield in the simulator that the real-world recipe produces with its actual (typically coarser) grind setting — because real-world brewing benefits from effects (fines, compaction, channeling) that partially compensate for coarser grinds.

### What This Means for Users
- Use the simulator to understand **relative** effects: finer grind → faster extraction, higher temperature → faster extraction, etc.
- **Absolute** extraction yield numbers are approximate — real-world results depend on grinder quality, bean freshness, pouring technique, and many other factors.
- The grinder profile feature converts between grinder clicks/settings and microns for convenience, but the underlying simulation always operates on the model-calibrated micron scale.
