import { HighLatitudeRule } from "../domain/high-latitude-rules.js";
import { fixHour } from "../utils/math.js";

export function dayPortions(times) {
  return Object.fromEntries(Object.entries(times).map(([name, value]) => [name, value / 24]));
}

export function timeDifference(fromHours, toHours) {
  return fixHour(toHours - fromHours);
}

function nightPortion(angle, rule) {
  switch (rule) {
    case HighLatitudeRule.MIDDLE_OF_THE_NIGHT:
      return 0.5;
    case HighLatitudeRule.ONE_SEVENTH:
      return 1 / 7;
    case HighLatitudeRule.ANGLE_BASED:
      return angle / 60;
    case HighLatitudeRule.NONE:
    default:
      return null;
  }
}

export function adjustHighLatitudeTimes({
  times,
  rule,
  methodConfig,
  sunrise,
  sunset
}) {
  if (rule === HighLatitudeRule.NONE) {
    return times;
  }

  if (!Number.isFinite(sunrise) || !Number.isFinite(sunset)) {
    return times;
  }

  const nightDuration = timeDifference(sunset, sunrise);

  const fajrPortion = nightPortion(methodConfig.fajrAngle, rule);
  if (fajrPortion !== null) {
    const maxDiff = fajrPortion * nightDuration;
    if (!Number.isFinite(times.fajr) || timeDifference(times.fajr, sunrise) > maxDiff) {
      times.fajr = sunrise - maxDiff;
    }
  }

  if (!methodConfig.ishaInterval) {
    const ishaAngle = methodConfig.ishaAngle ?? methodConfig.fajrAngle;
    const ishaPortion = nightPortion(ishaAngle, rule);

    if (ishaPortion !== null) {
      const maxDiff = ishaPortion * nightDuration;
      if (!Number.isFinite(times.isha) || timeDifference(sunset, times.isha) > maxDiff) {
        times.isha = sunset + maxDiff;
      }
    }
  }

  return times;
}
