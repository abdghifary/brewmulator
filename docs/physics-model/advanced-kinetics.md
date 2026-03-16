# Advanced Kinetics

Real coffee extraction happens in two distinct phases and is heavily influenced by the distribution of particle sizes. Brewmulator models these complexities for V60 pour-over brewing.

## Two-phase Extraction (Surface Wash + Diffusion)

Extraction proceeds through two kinetic phases, first identified by Spiro and Selwood (1984) and formalized as a double porosity model by Moroney et al. (2015, 2016).

1. **Surface wash**: Solubles from broken cell fragments dissolve on contact with water. This is near-instantaneous (5 to 15 seconds) and contributes roughly 30% of total extractable mass.
2. **Internal diffusion**: Solubles trapped inside intact cell walls diffuse out through the pore network. This is a slow, Fickian transport process (60 to 300 seconds) and contributes roughly 70% of the total mass.

### Model Equation

The extraction yield at time $t$ is the sum of two independent first-order pools, both subject to the same Nernst-Brunner saturation limit:

$$E(t) = \phi_s \cdot Y_{eq} \cdot (1 - e^{-k_{fast,obs} \cdot t}) + (1 - \phi_s) \cdot Y_{eq} \cdot (1 - e^{-k_{slow,obs} \cdot t})$$

Where:
- $\phi_s$ is the surface solubles fraction (derived from grind size).
- $Y_{eq} = E_{max} / (1 + \alpha / ratio)$ is the shared equilibrium yield.
- $k_{fast,obs} = k_{fast} \cdot (1 + \alpha / ratio)$
- $k_{slow,obs} = k_{slow} \cdot (1 + \alpha / ratio)$

### Rate Constants and Activation Energies

The two rate constants follow the Arrhenius temperature dependence but differ in grind scaling, activation energy, and pre-exponential factors:

| Constant | Grind Scaling | Activation Energy | Physical Basis | Pre-exponential |
| :--- | :--- | :--- | :--- | :--- |
| $k_{slow}$ | $(600/d)^2$ (quadratic) | $E_A = 50,000\,\text{J/mol}$ | Fickian diffusion hindered by pore tortuosity | $A = 65,000$ |
| $k_{fast}$ | $600/d$ (linear) | $E_{A,fast} = 25,000\,\text{J/mol}$ | Boundary-layer mass transfer | $A_{fast} = 500.0$* |

*\*Calibrated at $T_{ref}=93°C$*

#### Why Separate Activation Energies?

The surface wash phase is fundamentally a **boundary-layer dissolution** process. Solubles already exposed at broken cell surfaces dissolve into the surrounding water. This process tracks liquid diffusivity and viscosity, which have modest temperature dependence.

The diffusion phase is an **effective intra-particle transport barrier** that bundles pore tortuosity, wetting, adsorption, and matrix hindrance, all of which are strongly thermally activated.

#### Temperature Sensitivity Examples

| Temperature Change | $k_{fast}$ change ($E_{A,fast} = 25,000$ J/mol) | $k_{slow}$ change ($E_A = 50,000$ J/mol) |
| :--- | :--- | :--- |
| 85°C → 96°C | +28% | +65% |
| 93°C → 20°C (cold brew) | 16× slower | 244× slower |

This explains why cold brew extracts surface compounds relatively efficiently but barely touches slow-diffusing compounds, leading to its characteristic smooth, low-acid profile.

### Surface Solubles Fraction ($\phi_s$)

The fraction of solubles accessible at broken cell surfaces is derived from the grind size:

$$\phi_s = \text{clamp}\left(\phi_{ref} \times \frac{d_{ref}}{d}, \; 0, \; 1\right)$$

Where $\phi_{ref} = 0.30$ at $d_{ref} = 600\mu m$. Finer grinding produces more broken cells, exposing more solubles for rapid dissolution.

### Piecewise Integration (V60 Multi-Pour)

For multi-pour V60 brewing, each timestep integrates both pools independently:

$$E_{fast}(t) = \phi_s Y_{eq} - (\phi_s Y_{eq} - E_{fast,prev}) \cdot e^{-k_{fast,obs} \cdot \Delta t}$$
$$E_{slow}(t) = (1-\phi_s) Y_{eq} - ((1-\phi_s) Y_{eq} - E_{slow,prev}) \cdot e^{-k_{slow,obs} \cdot \Delta t}$$
$$E_{total}(t) = E_{fast}(t) + E_{slow}(t)$$

Both $E_{fast,prev}$ and $E_{slow,prev}$ carry forward continuously across pour boundaries. When a new pour changes the water ratio, $Y_{eq}$ shifts for both pools simultaneously, but extraction never resets.

### Model Interactions

- **Interaction with Bimodal PSD**: The effective grind size $d_{32}$ (Sauter mean) feeds into both $k_{fast}$ and $k_{slow}$ rate constant calculations. However, the surface fraction $\phi_s$ is derived from the **raw** grind size setting, as it represents cell-breaking behavior rather than size distribution.
- **Interaction with CO₂ Bloom**: During the bloom phase, CO₂ inhibition applies equally to both pools: $k_{fast,eff} = k_{fast} \cdot f_{CO_2}(t)$ and $k_{slow,eff} = k_{slow} \cdot f_{CO_2}(t)$. The gas barrier physically blocks both surface dissolution and pore diffusion.

### Scope and Gating

Two-phase extraction is currently enabled only for V60 pour-over with a pour schedule (`supportsTwoPhase: true` in MethodConfig). Other methods and V60 without a pour schedule use the original single-phase model.

### Calibration and Validation

The timescale ratio $\varepsilon = k_{slow} / k_{fast}$ quantifies the separation between the two kinetic phases.

| Grind Profile | ε | Interpretation |
| :--- | :--- | :--- |
| JK Drip (Fine) | 0.028 | Strong separation |
| Cimbali #20 (Coarse) | 0.071 | Moderate separation |
| **Simulator target** | **0.03 to 0.07** | **Validated range** |

## Bimodal Particle Size Distribution (Sauter mean $d_{32}$)

Coffee grinding produces a bimodal distribution of sizes: small fines (less than 100μm) and larger boulders (the target setting). The simulator computes an effective grind size using the Sauter mean diameter $d_{32}$.

### Why $d_{32}$?

Extraction rate scales with surface area per unit volume. The Sauter mean is the diameter of a mono-disperse bed with the same total surface-area-to-volume ratio as the mixture. This makes it the correct single-size surrogate for surface-area-driven kinetics.

### Effective Grind Size Formula

For a mixture of coarse particles and fines:

$$d_{eff} = d_{32} = \left(\frac{\varphi}{d_{fines}} + \frac{1-\varphi}{d_{boulders}}\right)^{-1}$$

- $d_{boulders}$ is the user setting.
- $d_{fines} = 100\mu m$.
- $\varphi$ is the fines mass fraction (0.0 to 0.40).

#### Grinder Calibration Table

The table below shows how different grinder profiles affect the effective grind size and extraction yield for a 850μm setting.

| Grinder | $\varphi$ | $d_{eff}$ (850μm) | Effect on EY |
| :--- | :--- | :--- | :--- |
| No fines | 0 | 850μm | Baseline |
| Niche Zero | 0.08 | 547μm | Mild increase |
| Comandante C40 | 0.11 | 474μm | Moderate increase |
| Default (reference) | 0.15 | 400μm | Calibration point (~20% EY) |
| Timemore C2 | 0.20 | 340μm | Strong increase (~23% EY) |
| Baratza Encore | 0.22 | 315μm | Strong increase |
| Blade grinder | 0.40 | 213μm | Aggressive extraction |

## Grinder Quality and Fines

The fines fraction is controlled by grinder quality. Better grinders produce fewer fines:

| Grinder Type | Typical Fines Fraction |
| :--- | :--- |
| Premium flat burr | 5% to 10% |
| Premium conical burr | 10% to 15% |
| Mid-range conical | 15% to 20% |
| Entry-level electric | 18% to 25% |
| Blade grinder | 30% to 40% |

In the simulator, the Grinder Quality slider maps directly to the `finesFraction` variable.

See [Implementation Notes](./implementation-notes.md) for details on how these models are integrated. Full citations are available in [References](./references.md).
