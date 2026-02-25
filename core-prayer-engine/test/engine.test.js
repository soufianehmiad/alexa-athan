import test from "node:test";
import assert from "node:assert/strict";
import { calculatePrayerTimes, formatPrayerTimesForSpeech } from "../src/index.js";

function hhmmToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

test("calculates a complete prayer schedule with ordered daily times", () => {
  const result = calculatePrayerTimes({
    lat: 40.7128,
    lon: -74.006,
    date: "2026-02-24",
    timezone: "America/New_York",
    calculationMethod: "MUSLIM_WORLD_LEAGUE",
    madhab: "SHAFI"
  });

  assert.equal(result.metadata.calculationMethod, "MUSLIM_WORLD_LEAGUE");
  assert.equal(result.metadata.madhab, "SHAFI");

  for (const prayer of ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]) {
    assert.equal(typeof result.times[prayer].localTime, "string");
    assert.ok(result.times[prayer].iso.endsWith("Z"));
    assert.ok(result.times[prayer].date instanceof Date);
  }

  const fajr = hhmmToMinutes(result.times.fajr.localTime);
  const sunrise = hhmmToMinutes(result.times.sunrise.localTime);
  const dhuhr = hhmmToMinutes(result.times.dhuhr.localTime);
  const asr = hhmmToMinutes(result.times.asr.localTime);

  assert.ok(fajr < sunrise, "fajr should be before sunrise");
  assert.ok(sunrise < dhuhr, "sunrise should be before dhuhr");
  assert.ok(dhuhr < asr, "dhuhr should be before asr");
});

test("is timezone aware", () => {
  const utcResult = calculatePrayerTimes({
    lat: 24.7136,
    lon: 46.6753,
    date: "2026-02-24",
    timezone: "UTC",
    calculationMethod: "MUSLIM_WORLD_LEAGUE",
    madhab: "SHAFI"
  });

  const riyadhResult = calculatePrayerTimes({
    lat: 24.7136,
    lon: 46.6753,
    date: "2026-02-24",
    timezone: "Asia/Riyadh",
    calculationMethod: "MUSLIM_WORLD_LEAGUE",
    madhab: "SHAFI"
  });

  assert.notEqual(utcResult.times.dhuhr.localTime, riyadhResult.times.dhuhr.localTime);
});

test("formats prayer times for speech", () => {
  const result = calculatePrayerTimes({
    lat: 40.7128,
    lon: -74.006,
    date: "2026-02-24",
    timezone: "America/New_York",
    calculationMethod: "MUSLIM_WORLD_LEAGUE",
    madhab: "SHAFI"
  });

  const speech = formatPrayerTimesForSpeech(result);
  assert.match(speech, /fajr at/);
  assert.match(speech, /isha at/);
});
