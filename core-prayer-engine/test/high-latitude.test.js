import test from "node:test";
import assert from "node:assert/strict";
import { calculatePrayerTimes, HighLatitudeRule } from "../src/index.js";

test("applies high latitude adjustment for twilight prayers", () => {
  const noAdjustment = calculatePrayerTimes({
    lat: 64.1466,
    lon: -21.9426,
    date: "2026-06-21",
    timezone: "Atlantic/Reykjavik",
    calculationMethod: "MUSLIM_WORLD_LEAGUE",
    madhab: "SHAFI",
    highLatitudeRule: HighLatitudeRule.NONE
  });

  const adjusted = calculatePrayerTimes({
    lat: 64.1466,
    lon: -21.9426,
    date: "2026-06-21",
    timezone: "Atlantic/Reykjavik",
    calculationMethod: "MUSLIM_WORLD_LEAGUE",
    madhab: "SHAFI",
    highLatitudeRule: HighLatitudeRule.ANGLE_BASED
  });

  assert.equal(noAdjustment.times.fajr.localTime, null);
  assert.equal(noAdjustment.times.isha.localTime, null);

  assert.equal(typeof adjusted.times.fajr.localTime, "string");
  assert.equal(typeof adjusted.times.isha.localTime, "string");
});
