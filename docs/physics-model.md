# Physics Model: Saturation-Aware Extraction

Brewmulator uses a physics-based simulation to model how coffee solids dissolve into water over time. Unlike simpler models that assume water can hold an infinite amount of coffee, our "Saturation-Aware" engine recognizes that extraction is a reversible process. As water becomes more concentrated with coffee solids, it becomes less effective at extracting more, eventually reaching an equilibrium.

This documentation is organized into focused sections covering the various aspects of the simulation.

## The Reversible Paradigm

Brewmulator has transitioned from a simplified "Infinite Sink" model to a more realistic "Saturation-Aware" model.

- **The Old Model (Infinite Sink)**: Extraction was treated as a one-way process. Water never got "full," so given enough time, any brew would approach the theoretical maximum extraction ($E_{max} \approx 28\%$), regardless of the brew ratio.
- **The New Model (Reversible)**: Based on the **Spiro and Selwood** pseudo-first order model and the **Nernst-Brunner** equation, this model recognizes that extraction is a diffusion process driven by the concentration gradient. As water becomes saturated, the "driving force" for extraction decreases, and the system reaches an equilibrium yield determined by the brew ratio.

## Documentation Sections

### 1. [Core Mathematics](./physics-model/core-mathematics.md)
The foundational mathematical framework. Covers reversible kinetics, equilibrium yield formulas, and the base rate constant calculation using the Arrhenius equation.

### 2. [Advanced Kinetics](./physics-model/advanced-kinetics.md)
Two-phase extraction model (surface wash + Fickian diffusion), now universal across all 5 brew methods. Also covers bimodal particle size distribution (Sauter mean $d_{32}$) for fines modeling (currently V60).

### 3. [Thermal and Pour Dynamics](./physics-model/thermal-and-pour-dynamics.md)
How the simulator handles multi-step pour schedules. Covers Newton cooling between pours, thermal equilibration when adding new water, and the inhibition effect of CO₂ during the bloom phase.

### 4. [Implementation Notes](./physics-model/implementation-notes.md)
Technical details on how the physics engine is built. Covers piecewise integration logic and how the TypeScript layer interacts with the high-performance WebAssembly (WASM) module.

### 5. [Assumptions and Limitations](./physics-model/assumptions-and-limitations.md)
A guide to the simplifications made in the model. Essential reading for understanding where the simulation mirrors reality and where it uses approximations for performance or simplicity.

### 6. [References](./physics-model/references.md)
A centralized list of the scientific literature and research papers used to calibrate and validate the Brewmulator physics engine.

### 7. [Per-Method Behavior](./physics-model/per-method-behavior.md)
Unified two-phase dispatch across all 5 brew methods. Covers per-method rate modifiers (`methodModifierFast`/`methodModifierSlow`), WASM modifier neutralization, synthetic single-pour schedules for non-V60 methods, and cold brew temperature handling.

## Suggested Reading Order

If you're new to the physics of coffee extraction, we recommend starting with the **Core Mathematics** to understand the basic behavior of the simulator. From there, explore **Advanced Kinetics** and **Thermal Dynamics** for a deeper look at the V60-specific features. Always keep the **Assumptions and Limitations** in mind when interpreting absolute extraction yield numbers.
