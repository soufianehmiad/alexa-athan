export const CalculationMethod = Object.freeze({
  MUSLIM_WORLD_LEAGUE: "MUSLIM_WORLD_LEAGUE",
  EGYPTIAN: "EGYPTIAN",
  KARACHI: "KARACHI",
  UMM_AL_QURA: "UMM_AL_QURA",
  DUBAI: "DUBAI",
  NORTH_AMERICA: "NORTH_AMERICA"
});

export const CALCULATION_METHODS = Object.freeze({
  [CalculationMethod.MUSLIM_WORLD_LEAGUE]: Object.freeze({ fajrAngle: 18, ishaAngle: 17 }),
  [CalculationMethod.EGYPTIAN]: Object.freeze({ fajrAngle: 19.5, ishaAngle: 17.5 }),
  [CalculationMethod.KARACHI]: Object.freeze({ fajrAngle: 18, ishaAngle: 18 }),
  [CalculationMethod.UMM_AL_QURA]: Object.freeze({ fajrAngle: 18.5, ishaInterval: 90 }),
  [CalculationMethod.DUBAI]: Object.freeze({ fajrAngle: 18.2, ishaAngle: 18.2 }),
  [CalculationMethod.NORTH_AMERICA]: Object.freeze({ fajrAngle: 15, ishaAngle: 15 })
});

const CALCULATION_METHOD_ALIASES = Object.freeze({
  MWL: CalculationMethod.MUSLIM_WORLD_LEAGUE,
  EGYPT: CalculationMethod.EGYPTIAN,
  ISNA: CalculationMethod.NORTH_AMERICA,
  MAKKAH: CalculationMethod.UMM_AL_QURA,
  UMM_AL_QURA: CalculationMethod.UMM_AL_QURA
});

export function resolveCalculationMethod(method) {
  if (typeof method !== "string" || method.trim().length === 0) {
    throw new Error("calculationMethod is required.");
  }

  const normalized = method.trim().toUpperCase();
  const resolved = CalculationMethod[normalized] ?? CALCULATION_METHOD_ALIASES[normalized];

  if (!resolved) {
    throw new Error(`Unsupported calculationMethod: ${method}`);
  }

  return resolved;
}
