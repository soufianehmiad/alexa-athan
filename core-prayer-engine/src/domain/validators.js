import { CALCULATION_METHODS, resolveCalculationMethod } from "./calculation-methods.js";
import { MADHAB_SHADOW_FACTORS, resolveMadhab } from "./madhab.js";
import { resolveHighLatitudeRule } from "./high-latitude-rules.js";
import { assertValidTimeZone } from "../services/timezone.js";

function parseDateInput(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("date must be a valid Date.");
    }

    return value;
  }

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("date must be a valid ISO date or YYYY-MM-DD.");
    }

    return parsed;
  }

  throw new Error("date is required and must be a Date or date string.");
}

function assertRange(value, min, max, fieldName) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${fieldName} must be a number in [${min}, ${max}].`);
  }
}

export function normalizePrayerTimeInput(input) {
  if (!input || typeof input !== "object") {
    throw new Error("Input is required.");
  }

  const lat = Number(input.lat);
  const lon = Number(input.lon);
  assertRange(lat, -90, 90, "lat");
  assertRange(lon, -180, 180, "lon");

  const date = parseDateInput(input.date);
  const calculationMethod = resolveCalculationMethod(input.calculationMethod);
  const madhab = resolveMadhab(input.madhab);
  const highLatitudeRule = resolveHighLatitudeRule(input.highLatitudeRule);

  const timezone = input.timezone ?? "UTC";
  if (typeof timezone !== "string" || timezone.trim().length === 0) {
    throw new Error("timezone must be a non-empty string.");
  }
  assertValidTimeZone(timezone);

  return Object.freeze({
    lat,
    lon,
    date,
    calculationMethod,
    methodConfig: CALCULATION_METHODS[calculationMethod],
    madhab,
    asrShadowFactor: MADHAB_SHADOW_FACTORS[madhab],
    highLatitudeRule,
    timezone: timezone.trim()
  });
}
