# Assumptions and Limitations

The Brewmulator physics engine uses a simplified model. You should understand these assumptions when interpreting simulation results.

## Grind Size Model

- **Mean particle diameter**: Grind size represents a single average diameter in microns (μm). While the V60 model uses the Sauter mean $d_{32}$ to account for fines, other methods do not.
- **Inverse-square relationship**: The extraction rate scales with `(600/grind)²`, where 600μm is the reference "medium" grind. This models the surface-area-to-volume ratio of ideal spheres.
- **No fines migration**: In real brewing, small particles can migrate and clog the filter bed. This increases contact time but is not modeled here.
- **No bed compaction**: The model assumes uniform contact with all particles and ignores the effects of the bed compacting under the weight of water.

## Water Flow Model

- **Ideal water distribution**: We assume water is distributed uniformly across the coffee bed. The model does not account for specific pouring techniques or spiral patterns.
- **No channeling**: All water is assumed to contact all grounds evenly. Real-world channeling reduces extraction efficiency.

## Temperature Model

- **Newton cooling**: Temperature decays toward the ambient 22°C using a single cooling coefficient. Real dynamics depend on the dripper material and pre-heating.
- **Instantaneous mixing**: New water is assumed to mix instantly to a uniform temperature, ignoring thermal gradients in the slurry.

## Calibrated Template Values

V60 recipe templates use grind sizes calibrated to produce realistic yields within this model. These values might not match your actual grinder settings. A template value of 500μm produces the expected yield even if a real recipe uses a coarser setting, because the model doesn't account for real-world factors like compaction that increase extraction.

## Two-Phase Kinetics Model

- **V60 only**: Two-phase extraction is currently limited to V60 recipes with a pour schedule. Other methods use the legacy single-phase model.
- **Derived fraction**: The surface solubles fraction $\phi_s$ is auto-derived from the grind size. Bean hardness and roast level effects on cell breakage are not yet modeled.
- **Approximated energies**: The activation energies for the fast and slow phases are empirical approximations ($E_{A,fast} = 25,000$ J/mol and $E_A = 50,000$ J/mol). Exact values vary by coffee variety and roast profile.

## What This Means for Users

The simulator is best used to understand **relative** effects. You can see how a finer grind or higher temperature speeds up extraction. Absolute numbers are approximate because real-world results depend on bean freshness, technique, and grinder quality. The grinder profile feature helps map your settings to microns, but the simulation always runs on the model-calibrated scale.
