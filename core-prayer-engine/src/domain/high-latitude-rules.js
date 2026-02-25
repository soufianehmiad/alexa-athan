export const HighLatitudeRule = Object.freeze({
  NONE: "NONE",
  MIDDLE_OF_THE_NIGHT: "MIDDLE_OF_THE_NIGHT",
  ONE_SEVENTH: "ONE_SEVENTH",
  ANGLE_BASED: "ANGLE_BASED"
});

export function resolveHighLatitudeRule(rule = HighLatitudeRule.ANGLE_BASED) {
  if (typeof rule !== "string" || rule.trim().length === 0) {
    throw new Error("highLatitudeRule must be a non-empty string.");
  }

  const normalized = rule.trim().toUpperCase();

  if (!HighLatitudeRule[normalized]) {
    throw new Error(`Unsupported highLatitudeRule: ${rule}`);
  }

  return HighLatitudeRule[normalized];
}
