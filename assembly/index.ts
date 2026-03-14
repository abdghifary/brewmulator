// Coffee Extraction Physics Engine
// Based on Spiro & Selwood Pseudo-First Order Kinetics Model

export const E_MAX: f64 = 28.0
export const ALPHA: f64 = 1.1
const A: f64 = 65000.0 // Calibrated slow-phase ceiling; keeps cold brew EY within regression bounds.
const E_A: f64 = 50000.0
const E_A_FAST: f64 = 25000.0 // Activation energy for surface wash phase (J/mol)
// Lower than E_A (50000) — boundary-layer mass transfer
// has modest thermal dependence (Patricelli research).
// At 85→96°C: k_fast changes +28% vs k_slow +65%.
const A_FAST: f64 = 500.0 // Calibrated surface wash pre-exponential factor.
// Final Task 4 calibration at T_ref=93°C (366.15K): ε=k_slow/k_fast≈0.035.
// This gives k_fast/k_slow≈28× at reference conditions for the two-phase wash.
// Safe upper bound for slow phase remains A≤66000; cold brew breaks at A≥67000.
const R: f64 = 8.314

/**
 * Calculate rate constant using Arrhenius equation
 * @param temp - Temperature in Celsius
 * @param grind - Grind size in microns
 * @param roast - Roast level (0.8 = light, 1.0 = medium, 1.2 = dark)
 * @param method - Brew method (0 = v60, 1 = french press, 2 = espresso, 3 = aeropress, 4 = cold brew)
 * @returns Rate constant k (s⁻¹)
 */
export function calculateRateConstant(
  temp: f64,
  grind: f64,
  roast: f64,
  method: i32
): f64 {
  const tempK = temp + 273.15
  const arrhenius = Math.exp(-E_A / (R * tempK))
  const grindFactor = (600.0 * 600.0) / (grind * grind)

  let methodModifier: f64 = 1.0
  if (method === 2) {
    methodModifier = 7.0
  } else if (method === 1 || method === 4) {
    methodModifier = 0.85
  }

  return A * arrhenius * grindFactor * roast * methodModifier
}

/**
 * Calculate FAST rate constant for surface wash phase.
 * Uses:
 *   - Separate activation energy E_A_FAST = 25000 J/mol (boundary-layer transfer)
 *     vs E_A = 50000 J/mol for diffusion (Fickian intra-particle transport)
 *   - Linear grind scaling (1/d) instead of quadratic (1/d²),
 *     reflecting boundary-layer mass transfer kinetics.
 *
 * The lower E_A_FAST means k_fast is less temperature-sensitive than k_slow:
 *   85→96°C: k_fast +28%, k_slow +65%
 * This matches real brewing: initial saturation looks similar across temps,
 * but total extraction changes significantly with temperature.
 *
 * @param temp - Temperature in Celsius
 * @param grind - Grind size in microns
 * @param roast - Roast level (0.8 = light, 1.0 = medium, 1.2 = dark)
 * @param method - Brew method (0 = v60, 1 = french press, 2 = espresso, 3 = aeropress, 4 = cold brew)
 * @returns Rate constant k_fast (s⁻¹)
 *
 * References: Moroney et al. (2016), Spiro & Selwood (1984), Patricelli model
 */
export function calculateFastRateConstant(
  temp: f64,
  grind: f64,
  roast: f64,
  method: i32
): f64 {
  const tempK = temp + 273.15
  const arrhenius = Math.exp(-E_A_FAST / (R * tempK))
  const grindFactor = 600.0 / grind

  let methodModifier: f64 = 1.0
  if (method === 2) {
    methodModifier = 7.0
  } else if (method === 1 || method === 4) {
    methodModifier = 0.85
  }

  return A_FAST * arrhenius * grindFactor * roast * methodModifier
}

/**
 * Calculate extraction yield percentage using Reversible Kinetics (Nernst-Brunner)
 * @param time - Brew time in seconds
 * @param temp - Temperature in Celsius
 * @param grind - Grind size in microns
 * @param roast - Roast level (0.8 = light, 1.0 = medium, 1.2 = dark)
 * @param method - Brew method (0 = v60, 1 = french press, 2 = espresso, 3 = aeropress, 4 = cold brew)
 * @param waterGrams - Total water weight in grams
 * @param coffeeGrams - Coffee dose in grams
 * @returns Extraction yield as percentage (0-28%)
 */
export function calculateExtractionYield(
  time: f64,
  temp: f64,
  grind: f64,
  roast: f64,
  method: i32,
  waterGrams: f64,
  coffeeGrams: f64
): f64 {
  const k = calculateRateConstant(temp, grind, roast, method)

  // Edge cases
  if (coffeeGrams <= 0.0) return E_MAX
  if (waterGrams <= 0.0) return 0.0

  // Reversible Kinetics (Nernst-Brunner / Saturation)
  const ratio = waterGrams / coffeeGrams
  const invRatio = ALPHA / ratio
  const yieldEq = E_MAX / (1.0 + invRatio)
  const kObs = k * (1.0 + invRatio)

  const extractionYield = yieldEq * (1.0 - Math.exp(-kObs * time))

  if (extractionYield < 0.0) return 0.0
  if (extractionYield > E_MAX) return E_MAX

  return extractionYield
}

/**
 * Calculate Total Dissolved Solids (TDS) percentage
 * @param extractionYield - Extraction yield percentage
 * @param coffeeGrams - Coffee dose in grams
 * @param beverageWeight - Final beverage weight in grams
 * @returns TDS as percentage
 */
export function calculateTDS(
  extractionYield: f64,
  coffeeGrams: f64,
  beverageWeight: f64
): f64 {
  if (beverageWeight === 0.0) return 0.0
  return (extractionYield * coffeeGrams) / beverageWeight
}

/**
 * Determine extraction zone based on yield
 * @param extractionYield - Extraction yield percentage
 * @param method - Brew method (0-4)
 * @returns Zone: 0 = under-extracted, 1 = sweet spot, 2 = over-extracted
 */
export function getExtractionZone(extractionYield: f64, method: i32): i32 {
  // Default range (V60, French Press, Aeropress): 18-22%
  let minYield: f64 = 18.0
  let maxYield: f64 = 22.0

  if (method === 2) {
    // Espresso: Broader, often higher range (17-23%)
    minYield = 17.0
    maxYield = 23.0
  } else if (method === 4) {
    // Cold Brew: Often lower due to temperature (16-20%)
    minYield = 16.0
    maxYield = 20.0
  }

  if (extractionYield < minYield) {
    return 0
  } else if (extractionYield <= maxYield) {
    return 1
  } else {
    return 2
  }
}
