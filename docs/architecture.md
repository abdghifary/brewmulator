# Brewmulator Architecture

## Overview

Brewmulator uses a config-driven design that separates core physics from brew-method-specific behavior. This architecture avoids complex OOP inheritance, preferring a functional composition pattern where the main simulator store orchestrates specialized composables.

### System Diagram

```
[ UI Components ] <---> [ Simulator Store ] <---> [ MethodConfig Registry ]
                            |         ^
                            |         |
                            v         |
                    [ Method Composables ] <---> [ WASM Physics Engine ]
                      (V60, Espresso, etc)
```

## MethodConfig Registry

All brew-method-specific parameters live in `app/stores/simulator/methodConfig.ts`. This registry serves as the single source of truth for constraints and behavioral flags.

### Configuration Fields

| Field | Description |
| :--- | :--- |
| `limits` | Min/max bounds for dose, water, and grind size. |
| `sweetSpot` | Ideal extraction yield range (e.g., 18% to 22%). |
| `timeStep` | Simulation resolution (seconds). |
| `absorptionRate` | Ground coffee water retention coefficient. |

### Extension Points

The registry includes flags to toggle advanced physics features:
- `supportsFineFraction`: Toggle for fine-particle migration modeling.
- `percolationMultiplier`: Scales extraction for drip vs immersion.
- `supportsDripperGeometry`: Toggle for filter shape effects.

## Piecewise Extraction Architecture

The piecewise extraction engine (`usePiecewiseExtraction`) is universal — all 5 brew methods route through `computePiecewiseCurve()`:
- V60 uses the real pour schedule from `useV60PourSchedule`.
- All other methods use a synthetic single-pour schedule from `generateSyntheticSchedule()`.

V60-specific isolation applies only to the **pour schedule UI**: `useV60PourSchedule` manages the multi-step pour sequence, templates, and step editing. The extraction engine itself is shared.

See [Per-Method Behavior](./physics-model/per-method-behavior.md) for modifier values and physical rationale.

## Store Composition Pattern

The main `useSimulatorStore` uses the spread pattern to compose specialized logic:

```typescript
export const useSimulatorStore = defineStore('simulator', () => {
  const brewMath = useBrewMath();
  const v60Schedule = useV60PourSchedule();
  // ...
  return {
    ...brewMath,
    ...v60Schedule,
    // Main store state and actions
  };
});
```

## Physics & Math

Extraction kinetics are implemented in AssemblyScript for performance. The frontend handles high-level coordination and zone classification using `MethodConfig.sweetSpot`.

For the physics model overview and links to the detailed extraction formulas, see [Physics Model Documentation](./physics-model.md).

## Related Documentation

- [Root Knowledge Base](../AGENTS.md): Project overview and directory structure.
- [Store Knowledge Base](../app/stores/simulator/AGENTS.md): State management details.
- [Component Knowledge Base](../app/components/simulator/AGENTS.md): UI patterns.
