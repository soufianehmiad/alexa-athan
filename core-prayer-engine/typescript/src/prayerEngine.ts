import {
  Coordinates,
  PrayerTimes as AdhanPrayerTimes,
  CalculationParameters,
  Madhab as AdhanMadhab,
  HighLatitudeRule,
} from "adhan";
import { getCalculationParameters } from "./methods";
import {
  CalculateParams,
  Madhab,
  PrayerOffsets,
  PrayerTimes,
} from "./types";

/**
 * Maps our Madhab enum to the adhan-js madhab value.
 */
function mapMadhab(madhab: Madhab): "shafi" | "hanafi" {
  switch (madhab) {
    case Madhab.Shafi:
      return AdhanMadhab.Shafi;
    case Madhab.Hanafi:
      return AdhanMadhab.Hanafi;
    default: {
      const _exhaustive: never = madhab;
      throw new Error(`Unknown madhab: ${_exhaustive}`);
    }
  }
}

/**
 * Applies per-prayer minute offsets to the adhan-js adjustments object.
 */
function applyOffsets(
  params: CalculationParameters,
  offsets: PrayerOffsets,
): void {
  if (offsets.fajr !== undefined) params.adjustments.fajr = offsets.fajr;
  if (offsets.sunrise !== undefined)
    params.adjustments.sunrise = offsets.sunrise;
  if (offsets.dhuhr !== undefined) params.adjustments.dhuhr = offsets.dhuhr;
  if (offsets.asr !== undefined) params.adjustments.asr = offsets.asr;
  if (offsets.maghrib !== undefined)
    params.adjustments.maghrib = offsets.maghrib;
  if (offsets.isha !== undefined) params.adjustments.isha = offsets.isha;
}

/**
 * Calculate prayer times for a given location, date, method, and madhab.
 *
 * @param params - Calculation input parameters
 * @returns An object containing Date instances for each prayer time
 */
export function calculate(params: CalculateParams): PrayerTimes {
  const { latitude, longitude, date, method, madhab, offsets } = params;

  const coordinates = new Coordinates(latitude, longitude);
  const calculationParams = getCalculationParameters(method);

  calculationParams.madhab = mapMadhab(madhab);

  // Use recommended high latitude rule for the coordinates
  calculationParams.highLatitudeRule =
    HighLatitudeRule.recommended(coordinates);

  if (offsets) {
    applyOffsets(calculationParams, offsets);
  }

  const prayerTimes = new AdhanPrayerTimes(
    coordinates,
    date,
    calculationParams,
  );

  return {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
  };
}
