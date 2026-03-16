# Core Mathematics

Brewmulator uses a saturation-aware extraction model based on the Spiro and Selwood pseudo-first order model and the Nernst-Brunner equation. It treats extraction as a reversible diffusion process driven by the concentration gradient between the coffee grounds and the liquid.

## The Reversible Model

Extraction is not a one-way process into an infinite volume. As the concentration of dissolved solids in the water increases, the driving force for extraction decreases. The system eventually reaches an equilibrium where no more solids can be dissolved for a given brew ratio.

### 1. Solubility Coefficient ($\alpha$)

We use $\alpha \approx 1.1$ as the partition coefficient. It represents the ratio of the concentration of coffee solids in grounds to the concentration in the water at equilibrium.

### 2. Equilibrium Yield ($Y_{eq}$)

The maximum yield achievable for a given brew ratio is limited by saturation:

$$Y_{eq} = \frac{E_{max}}{1 + \frac{\alpha}{ratio}}$$

Here, `ratio` is the water-to-coffee weight ratio. For a 1:16 brew, the ratio is 16.

### 3. Observed Rate Constant ($k_{obs}$)

The speed at which the system approaches equilibrium scales with the ratio:

$$k_{obs} = k \left(1 + \frac{\alpha}{ratio}\right)$$

The base rate constant $k$ is derived from temperature, grind size, and roast level.

### 4. Extraction Equation

The final extraction yield $E(t)$ at time $t$ is:

$$E(t) = Y_{eq}(1 - e^{-k_{obs}t})$$

## Base Rate Constant ($k$)

The base rate constant $k$ follows the Arrhenius equation for temperature dependence, modified by physical factors:

$$k = A \cdot e^{-\frac{E_A}{R \cdot T_K}} \cdot f_{grind} \cdot f_{roast} \cdot f_{method}$$

### Temperature Dependence

Temperature affects extraction speed exponentially. The Arrhenius component uses:
- $T_K$: Water temperature in Kelvin ($T_C + 273.15$)
- $E_A = 50,000\,\text{J/mol}$: Activation energy
- $R = 8.314\,\text{J/(mol·K)}$: Ideal gas constant
- $A = 5 \times 10^4$: Pre-exponential factor

### Physical Modifiers

- **Grind Factor** ($f_{grind}$): Scales inversely with the square of the grind size, using 600μm as the reference:
  $$f_{grind} = \left(\frac{600}{\text{grind}}\right)^2$$
- **Roast Factor** ($f_{roast}$): Scales linearly with the roast level (0.8 for light, 1.0 for medium, 1.2 for dark).
- **Method Modifier** ($f_{method}$): Accounts for mechanical extraction aid like pressure or lack of agitation:
  - **Espresso**: 7.0 (pressure-driven)
  - **French Press / Cold Brew**: 0.85 (immersion)
  - **All others**: 1.0

## Practical Effects

### High Ratio (Dilute Brews)
When you use a high water-to-coffee ratio, like 1:17 or 1:20, the $\alpha/ratio$ term is small. The equilibrium yield $Y_{eq}$ remains close to $E_{max}$. The simulation allows for higher total extraction yields because the water remains relatively "hungry" for solids.

### Low Ratio (Concentrated Brews)
In concentrated brews like espresso (1:2) or Moka pot (1:10), the $\alpha/ratio$ term is significant. $Y_{eq}$ is substantially lower than $E_{max}$. For a 1:2 espresso, $Y_{eq}$ might be around 14%. The simulation correctly predicts that you cannot reach high yields in concentrated brews without adding more water.

## Core Parameters

| Parameter | Value | Description |
| :--- | :--- | :--- |
| $A$ | $5 \times 10^4$ | Pre-exponential factor |
| $E_A$ | $50,000\,\text{J/mol}$ | Activation energy |
| $R$ | $8.314\,\text{J/(mol·K)}$ | Gas constant |
| $E_{max}$ | $28\%$ | Theoretical maximum extraction yield |
| $\alpha$ | $1.1$ | Solubility coefficient (partition coefficient) |

See [Advanced Kinetics](./advanced-kinetics.md) for bimodal particle distribution and two-phase modeling.
