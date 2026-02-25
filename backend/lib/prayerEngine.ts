import {
  Coordinates,
  CalculationMethod as AdhanMethod,
  CalculationParameters,
  PrayerTimes,
  Madhab as AdhanMadhab,
} from "adhan";

export type CalculationMethodName =
  | "MUSLIM_WORLD_LEAGUE"
  | "EGYPTIAN"
  | "KARACHI"
  | "UMM_AL_QURA"
  | "DUBAI"
  | "NORTH_AMERICA";

export type MadhabName = "SHAFI" | "HANAFI";

export interface PrayerTimeInput {
  lat: number;
  lon: number;
  date: Date;
  method: CalculationMethodName;
  madhab: MadhabName;
  offsets?: Record<string, number>;
}

export interface PrayerTimeResult {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

const METHOD_MAP: Record<CalculationMethodName, () => CalculationParameters> = {
  MUSLIM_WORLD_LEAGUE: () => AdhanMethod.MuslimWorldLeague(),
  EGYPTIAN: () => AdhanMethod.Egyptian(),
  KARACHI: () => AdhanMethod.Karachi(),
  UMM_AL_QURA: () => AdhanMethod.UmmAlQura(),
  DUBAI: () => AdhanMethod.Dubai(),
  NORTH_AMERICA: () => AdhanMethod.NorthAmerica(),
};

const MADHAB_MAP: Record<MadhabName, string> = {
  SHAFI: AdhanMadhab.Shafi,
  HANAFI: AdhanMadhab.Hanafi,
};

export function calculatePrayerTimes(input: PrayerTimeInput): PrayerTimeResult {
  const coordinates = new Coordinates(input.lat, input.lon);
  const methodFactory = METHOD_MAP[input.method];
  if (!methodFactory) {
    throw new Error(`Unsupported calculation method: ${input.method}`);
  }

  const params = methodFactory();
  const madhabValue = MADHAB_MAP[input.madhab];
  if (madhabValue === undefined) {
    throw new Error(`Unsupported madhab: ${input.madhab}`);
  }
  params.madhab = madhabValue as any;

  if (input.offsets) {
    const prayerNames = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;
    for (const name of prayerNames) {
      if (input.offsets[name] !== undefined) {
        (params.adjustments as any)[name] = input.offsets[name];
      }
    }
  }

  const prayerTimes = new PrayerTimes(coordinates, input.date, params);

  return {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
  };
}

export const PRAYER_NAMES = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerName = (typeof PRAYER_NAMES)[number];
