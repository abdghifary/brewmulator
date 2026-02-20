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

where $T_{amb} = 22\,°C$ is ambient temperature, $T_0$ is the temperature at the last pour, and $h \approx 0.005\,\text{s}^{-1}$ is the Newton cooling coefficient for a ceramic/glass V60 dripper.

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

---

## Extended References

*(Extending prior references — Spiro & Selwood 1984 and Nernst-Brunner already listed above)*

- **Spiro, M. & Hunter, R.J.** (1985). The kinetics and mechanism of caffeine infusion from coffee. *Journal of the Science of Food and Agriculture*, 36(10), 869–876. DOI: [10.1002/jsfa.2740360917](https://doi.org/10.1002/jsfa.2740360917)

- **Moroney, K.M., Lee, W.T., O'Brien, S.B.G., Suijver, F., & Marra, J.** (2015). Modelling of coffee extraction during brewing using multiscale methods: Filter coffee. *Chemical Engineering Science*, 137, 216–234. DOI: [10.1016/j.ces.2015.06.003](https://doi.org/10.1016/j.ces.2015.06.003)

- **Moroney, K.M., Lee, W.T., O'Brien, S.B.G., Suijver, F., & Marra, J.** (2016). Coffee extraction kinetics in a well mixed system. *Journal of Mathematics in Industry*, 7, 3. DOI: [10.1186/s13362-016-0024-6](https://doi.org/10.1186/s13362-016-0024-6)

- **Anderson, B.A., Singh, R.P., & Ramaswamy, H.S.** (2003). Diffusivity of CO₂ from roasted coffee. *Journal of Food Engineering*, 59(1), 63–70. DOI: [10.1016/S0260-8774(02)00432-6](https://doi.org/10.1016/S0260-8774(02)00432-6)

- **Liang, C., et al.** (2021). Coffee extraction and its physicochemical model. *Scientific Reports*, 11, 5535. DOI: [10.1038/s41598-021-85787-1](https://doi.org/10.1038/s41598-021-85787-1)

- **Gagné, J.** (2021). *The Physics of Filter Coffee*. Scott's Digital Alchemy. ISBN: 978-0578246086
