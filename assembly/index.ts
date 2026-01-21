// Coffee Extraction Physics Engine
// Based on Spiro & Selwood Pseudo-First Order Kinetics Model

const E_MAX: f64 = 28.0
const A: f64 = 5e4
const E_A: f64 = 50000.0
const R: f64 = 8.314

/**
 * Calculate rate constant using Arrhenius equation
 * @param temp - Temperature in Celsius
 * @param grind - Grind size in microns
 * @param roast - Roast level (0.8 = light, 1.0 = medium, 1.2 = dark)
 * @param method - Brew method (0 = v60, 1 = french press, 2 = espresso, 3 = aeropress, 4 = cold brew)
 * @returns Rate constant k
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
    methodModifier = 2.5
  } else if (method === 1 || method === 4) {
    methodModifier = 0.85
  }
  
  return A * arrhenius * grindFactor * roast * methodModifier
}

/**
 * Calculate extraction yield percentage using Spiro & Selwood kinetics model
 * @param time - Brew time in seconds
 * @param temp - Temperature in Celsius
 * @param grind - Grind size in microns
 * @param roast - Roast level (0.8 = light, 1.0 = medium, 1.2 = dark)
 * @param method - Brew method (0 = v60, 1 = french press, 2 = espresso, 3 = aeropress, 4 = cold brew)
 * @returns Extraction yield as percentage (0-28%)
 */
export function calculateExtractionYield(
  time: f64,
  temp: f64,
  grind: f64,
  roast: f64,
  method: i32
): f64 {
  const k = calculateRateConstant(temp, grind, roast, method)
  const extractionYield = E_MAX * (1.0 - Math.exp(-k * time))
  
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
  if (extractionYield < 18.0) {
    return 0
  } else if (extractionYield <= 22.0) {
    return 1
  } else {
    return 2
  }
}
