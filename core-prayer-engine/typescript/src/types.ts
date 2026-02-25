/**
 * Supported calculation methods for prayer times.
 */
export enum CalculationMethod {
  /** Islamic Society of North America */
  ISNA = "ISNA",
  /** Muslim World League */
  MWL = "MWL",
  /** Egyptian General Authority of Survey */
  Egyptian = "Egyptian",
  /** Umm Al-Qura University, Makkah */
  UmmAlQura = "UmmAlQura",
  /** University of Islamic Sciences, Karachi */
  Karachi = "Karachi",
  /** Institute of Geophysics, University of Tehran */
  Tehran = "Tehran",
}

/**
 * Juristic school for Asr prayer calculation.
 */
export enum Madhab {
  /** Shafi'i, Maliki, Hanbali - shadow equals object length */
  Shafi = "Shafi",
  /** Hanafi - shadow equals twice object length */
  Hanafi = "Hanafi",
}

/**
 * Per-prayer minute offsets to adjust calculated times.
 * Positive values delay the time, negative values advance it.
 */
export interface PrayerOffsets {
  fajr?: number;
  sunrise?: number;
  dhuhr?: number;
  asr?: number;
  maghrib?: number;
  isha?: number;
}

/**
 * Calculated prayer times for a given date and location.
 */
export interface PrayerTimes {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

/**
 * Input parameters for calculating prayer times.
 */
export interface CalculateParams {
  latitude: number;
  longitude: number;
  date: Date;
  method: CalculationMethod;
  madhab: Madhab;
  offsets?: PrayerOffsets;
}
