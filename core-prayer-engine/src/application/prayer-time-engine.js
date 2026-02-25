import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizePrayerTimeInput } from "../domain/validators.js";
import { sunAngleTime, solarNoon, sunPosition, julianDate, riseSetAngle } from "../services/astronomy.js";
import {
  formatLocalTime,
  getTimeZoneOffsetHoursForDate,
  localHoursToUtcDate,
  resolveDatePartsForCalculation
} from "../services/timezone.js";
import { adjustHighLatitudeTimes, dayPortions } from "../services/prayer-math.js";
import { arccotDeg, fixHour, tanDeg } from "../utils/math.js";

const PRAYER_ORDER = Object.freeze(["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]);
const DEFAULT_SEED_TIMES = Object.freeze({
  fajr: 5,
  sunrise: 6,
  dhuhr: 12,
  asr: 13,
  sunset: 18,
  maghrib: 18,
  isha: 18
});

function computeAsrTime({ latitude, julianDay, dayPortion, asrShadowFactor }) {
  const { declination } = sunPosition(julianDay + dayPortion);
  const angle = -arccotDeg(asrShadowFactor + tanDeg(Math.abs(latitude - declination)));

  return sunAngleTime({
    angle,
    julianDay,
    dayPortion,
    latitude,
    direction: "cw"
  });
}

function computeRawPrayerTimes(seedTimes, context) {
  const portions = dayPortions(seedTimes);
  const solarAngle = riseSetAngle();

  const sunrise = sunAngleTime({
    angle: solarAngle,
    julianDay: context.julianDay,
    dayPortion: portions.sunrise,
    latitude: context.lat,
    direction: "ccw"
  });

  const sunset = sunAngleTime({
    angle: solarAngle,
    julianDay: context.julianDay,
    dayPortion: portions.sunset,
    latitude: context.lat,
    direction: "cw"
  });

  const fajr = sunAngleTime({
    angle: context.methodConfig.fajrAngle,
    julianDay: context.julianDay,
    dayPortion: portions.fajr,
    latitude: context.lat,
    direction: "ccw"
  });

  const isha = context.methodConfig.ishaInterval
    ? sunset + context.methodConfig.ishaInterval / 60
    : sunAngleTime({
        angle: context.methodConfig.ishaAngle,
        julianDay: context.julianDay,
        dayPortion: portions.isha,
        latitude: context.lat,
        direction: "cw"
      });

  return {
    fajr,
    sunrise,
    dhuhr: solarNoon(context.julianDay, portions.dhuhr),
    asr: computeAsrTime({
      latitude: context.lat,
      julianDay: context.julianDay,
      dayPortion: portions.asr,
      asrShadowFactor: context.asrShadowFactor
    }),
    sunset,
    maghrib: sunset,
    isha
  };
}

function applyTimezoneAndLongitude(times, context) {
  const adjusted = {};

  for (const [name, value] of Object.entries(times)) {
    adjusted[name] = value + context.timeZoneOffsetHours - context.lon / 15;
  }

  if (context.methodConfig.ishaInterval) {
    adjusted.isha = adjusted.sunset + context.methodConfig.ishaInterval / 60;
  }

  return adjusted;
}

function normalizeTimes(times) {
  const normalized = {};

  for (const [name, value] of Object.entries(times)) {
    normalized[name] = Number.isFinite(value) ? fixHour(value) : Number.NaN;
  }

  return normalized;
}

function toPrayerEntry({ localHours, dateParts, timezone }) {
  if (!Number.isFinite(localHours)) {
    return {
      localTime: null,
      iso: null,
      date: null,
      hours: null
    };
  }

  const utcDate = localHoursToUtcDate({
    dateParts,
    localHours,
    timeZone: timezone
  });

  return {
    localTime: formatLocalTime(utcDate, timezone),
    iso: utcDate.toISOString(),
    date: utcDate,
    hours: localHours
  };
}

function buildPrayerEntries({ times, dateParts, timezone }) {
  const entries = {};

  for (const prayer of PRAYER_ORDER) {
    entries[prayer] = toPrayerEntry({
      localHours: times[prayer],
      dateParts,
      timezone
    });
  }

  return entries;
}

export class PrayerTimeEngine {
  calculate(input) {
    const normalizedInput = normalizePrayerTimeInput(input);
    const dateParts = resolveDatePartsForCalculation(normalizedInput.date, normalizedInput.timezone);

    const context = {
      lat: normalizedInput.lat,
      lon: normalizedInput.lon,
      methodConfig: normalizedInput.methodConfig,
      asrShadowFactor: normalizedInput.asrShadowFactor,
      julianDay: julianDate(dateParts) - normalizedInput.lon / (15 * 24),
      timeZoneOffsetHours: getTimeZoneOffsetHoursForDate(dateParts, normalizedInput.timezone)
    };

    let workingTimes = { ...DEFAULT_SEED_TIMES };
    for (let i = 0; i < 2; i += 1) {
      workingTimes = computeRawPrayerTimes(workingTimes, context);
    }

    workingTimes = applyTimezoneAndLongitude(workingTimes, context);

    workingTimes = adjustHighLatitudeTimes({
      times: workingTimes,
      rule: normalizedInput.highLatitudeRule,
      methodConfig: normalizedInput.methodConfig,
      sunrise: workingTimes.sunrise,
      sunset: workingTimes.sunset
    });

    workingTimes = normalizeTimes(workingTimes);

    return {
      metadata: {
        lat: normalizedInput.lat,
        lon: normalizedInput.lon,
        date: `${dateParts.year}-${String(dateParts.month).padStart(2, "0")}-${String(dateParts.day).padStart(2, "0")}`,
        timezone: normalizedInput.timezone,
        calculationMethod: normalizedInput.calculationMethod,
        madhab: normalizedInput.madhab,
        highLatitudeRule: normalizedInput.highLatitudeRule,
        source: "athan-core-prayer-engine-v1"
      },
      times: buildPrayerEntries({
        times: workingTimes,
        dateParts,
        timezone: normalizedInput.timezone
      })
    };
  }
}

export function createPrayerTimeEngine() {
  return new PrayerTimeEngine();
}

export function calculatePrayerTimes(input) {
  return createPrayerTimeEngine().calculate(input);
}

export function formatPrayerTimesForSpeech(result) {
  return PRAYER_ORDER.map((name) => {
    const display = result.times[name].localTime ?? "unavailable";
    return `${name} at ${display}`;
  }).join(", ");
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const sample = calculatePrayerTimes({
    lat: 40.7128,
    lon: -74.006,
    date: "2026-02-24",
    timezone: "America/New_York",
    calculationMethod: "MUSLIM_WORLD_LEAGUE",
    madhab: "SHAFI"
  });

  console.log(JSON.stringify(sample, null, 2));
}
