# Thermal and Pour Dynamics

Real-world brewing, especially pour-over methods like the V60, involves complex water additions and temperature changes. Brewmulator models these dynamics to provide a more accurate simulation.

## Multi-Step Pour Schedule

Brewing involves multiple segments, starting with a bloom phase followed by several main pours. Treating all water as present from the start would overestimate the water-to-coffee ratio early on and ignore the effects of fresh grounds. The multi-step model divides the brew into segments where each has its own:

- **Water ratio**: Only water already poured contributes to the active ratio.
- **Temperature**: Water cools between pours and reheats when new hot water is added.
- **Rate modifier**: The CO₂ bloom phase inhibits extraction initially.

## Thermal Model

### Newton Cooling

Between pours, the coffee slurry temperature decays toward the ambient temperature:

$$T(t) = T_{amb} + (T_0 - T_{amb}) \cdot e^{-h \cdot t}$$

- $T_{amb} = 22\,°C$: Ambient temperature.
- $T_0$: Slurry temperature at the last pour.
- $h \approx 0.001\,\text{s}^{-1}$: Cooling coefficient.

This represents a loss of roughly 4°C per minute, which is realistic for ceramic or glass drippers.

### Pour Reheat

Adding a new pour of mass $m_p$ at temperature $T_p$ to an existing slurry of mass $m_s$ at temperature $T_s$ results in a new equilibrium temperature:

$$T_{new} = \frac{m_s \cdot T_s + m_p \cdot T_p}{m_s + m_p}$$

This mass-weighted average models the thermal equilibration of the combined fluid.

### Temperature Effect on Rate

Temperature enters the extraction rate via the Arrhenius-type correction in `calculateRateConstant`. A 10°C drop between pours meaningfully reduces the rate constant $k$, which is reflected automatically when the rate is recomputed at each segment.

## Piecewise Extraction Formulation

For each time segment between consecutive pour events, the extraction yield evolves as:

$$E(t) = E_{eq} - (E_{eq} - E_{start}) \cdot e^{-k_{obs} \cdot \Delta t}$$

where:
- $E_{start}$ is the yield carried forward from the end of the previous segment.
- $E_{eq} = \frac{E_{max}}{1 + \alpha / R}$ is the new equilibrium yield after water ratio $R$ changes.
- $k_{obs} = k \cdot (1 + \alpha / R)$ is the observed rate constant.
- $k$ is obtained from the WASM engine based on the current slurry temperature.
- $\Delta t = t - t_{pour}$ is the time elapsed since the last pour.

This formulation ensures extraction carries forward continuously—the equilibrium shifts when new water arrives, but yield never resets.

## CO₂ Bloom Phase

Freshly roasted grounds contain CO₂ that outgasses when hit with water. This creates a physical barrier that reduces contact and inhibits extraction.

The inhibition factor during the bloom phase is:

$$f_{CO_2}(t) = 1 - B \cdot e^{-k_{degas} \cdot (t - t_{bloom})}$$

- $B = 0.6$: Initial bloom inhibition coefficient. The rate is reduced to 40% at the start.
- $k_{degas} \approx 0.03\,\text{s}^{-1}$: CO₂ degassing rate constant.
- $t_{bloom}$: Time of the bloom pour.

The effective rate constant during the bloom is $k_{eff} = k \cdot f_{CO_2}(t)$. Once the CO₂ has outgassed or a new pour begins, the inhibition disappears and the factor becomes 1.

See [Core Mathematics](./core-mathematics.md) for the base extraction formulas.
