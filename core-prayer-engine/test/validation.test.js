import test from "node:test";
import assert from "node:assert/strict";
import { calculatePrayerTimes } from "../src/index.js";

test("throws when required fields are missing", () => {
  assert.throws(() => calculatePrayerTimes({}), /lat/);
  assert.throws(
    () =>
      calculatePrayerTimes({
        lat: 40,
        lon: -74,
        date: "2026-02-24",
        calculationMethod: "MUSLIM_WORLD_LEAGUE"
      }),
    /madhab/
  );
});

test("throws for unsupported calculation method", () => {
  assert.throws(
    () =>
      calculatePrayerTimes({
        lat: 40,
        lon: -74,
        date: "2026-02-24",
        calculationMethod: "UNKNOWN",
        madhab: "SHAFI"
      }),
    /Unsupported calculationMethod/
  );
});

test("throws for invalid timezone", () => {
  assert.throws(
    () =>
      calculatePrayerTimes({
        lat: 40,
        lon: -74,
        date: "2026-02-24",
        calculationMethod: "MUSLIM_WORLD_LEAGUE",
        madhab: "SHAFI",
        timezone: "Mars/Phobos"
      }),
    /Invalid timezone/
  );
});
