import { calculate, CalculationMethod, Madhab, PrayerTimes } from "../src";

/**
 * Helper: returns hours and minutes from a Date in UTC.
 */
function utcHM(d: Date): { h: number; m: number } {
  return { h: d.getUTCHours(), m: d.getUTCMinutes() };
}

/**
 * Helper: asserts that all six prayer fields are valid Date instances.
 */
function expectValidPrayerTimes(times: PrayerTimes): void {
  const prayers = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"] as const;
  for (const prayer of prayers) {
    expect(times[prayer]).toBeInstanceOf(Date);
    expect(isNaN(times[prayer].getTime())).toBe(false);
  }
}

/**
 * Helper: asserts the chronological ordering fajr < sunrise < dhuhr < asr < maghrib < isha.
 */
function expectChronologicalOrder(times: PrayerTimes): void {
  expect(times.fajr.getTime()).toBeLessThan(times.sunrise.getTime());
  expect(times.sunrise.getTime()).toBeLessThan(times.dhuhr.getTime());
  expect(times.dhuhr.getTime()).toBeLessThan(times.asr.getTime());
  expect(times.asr.getTime()).toBeLessThan(times.maghrib.getTime());
  expect(times.maghrib.getTime()).toBeLessThan(times.isha.getTime());
}

describe("calculate", () => {
  // ─── NYC / ISNA ──────────────────────────────────────────────
  describe("New York City with ISNA method", () => {
    const times = calculate({
      latitude: 40.7128,
      longitude: -74.006,
      date: new Date(2024, 0, 15), // Jan 15, 2024
      method: CalculationMethod.ISNA,
      madhab: Madhab.Shafi,
    });

    it("returns valid Date objects for all prayers", () => {
      expectValidPrayerTimes(times);
    });

    it("returns times in chronological order", () => {
      expectChronologicalOrder(times);
    });

    it("has Fajr in the early morning UTC (roughly 10-13 UTC for NYC winter)", () => {
      const { h } = utcHM(times.fajr);
      expect(h).toBeGreaterThanOrEqual(10);
      expect(h).toBeLessThanOrEqual(13);
    });

    it("has Dhuhr around midday UTC (roughly 17 UTC for NYC winter)", () => {
      const { h } = utcHM(times.dhuhr);
      expect(h).toBeGreaterThanOrEqual(16);
      expect(h).toBeLessThanOrEqual(18);
    });
  });

  // ─── London / MWL ─────────────────────────────────────────────
  describe("London with MWL method", () => {
    const times = calculate({
      latitude: 51.5074,
      longitude: -0.1278,
      date: new Date(2024, 5, 21), // June 21, 2024 (summer solstice)
      method: CalculationMethod.MWL,
      madhab: Madhab.Shafi,
    });

    it("returns valid Date objects for all prayers", () => {
      expectValidPrayerTimes(times);
    });

    it("returns times in chronological order", () => {
      expectChronologicalOrder(times);
    });

    it("has a very early Fajr in summer (before 03:00 UTC)", () => {
      const { h } = utcHM(times.fajr);
      expect(h).toBeLessThanOrEqual(3);
    });

    it("has a late Isha in summer (after 21:00 UTC)", () => {
      const { h } = utcHM(times.isha);
      expect(h).toBeGreaterThanOrEqual(21);
    });
  });

  // ─── Mecca / UmmAlQura ────────────────────────────────────────
  describe("Mecca with UmmAlQura method", () => {
    const times = calculate({
      latitude: 21.4225,
      longitude: 39.8262,
      date: new Date(2024, 2, 15), // March 15, 2024
      method: CalculationMethod.UmmAlQura,
      madhab: Madhab.Shafi,
    });

    it("returns valid Date objects for all prayers", () => {
      expectValidPrayerTimes(times);
    });

    it("returns times in chronological order", () => {
      expectChronologicalOrder(times);
    });

    it("has Dhuhr around midday UTC (roughly 09-10 UTC for Mecca, UTC+3)", () => {
      const { h } = utcHM(times.dhuhr);
      expect(h).toBeGreaterThanOrEqual(9);
      expect(h).toBeLessThanOrEqual(10);
    });
  });

  // ─── Oslo summer (high latitude) ─────────────────────────────
  describe("Oslo in summer (high latitude)", () => {
    const times = calculate({
      latitude: 59.9139,
      longitude: 10.7522,
      date: new Date(2024, 5, 21), // June 21
      method: CalculationMethod.MWL,
      madhab: Madhab.Shafi,
    });

    it("returns valid Date objects for all prayers", () => {
      expectValidPrayerTimes(times);
    });

    it("returns times in chronological order", () => {
      expectChronologicalOrder(times);
    });

    it("has sunrise very early in summer", () => {
      const { h } = utcHM(times.sunrise);
      // Oslo sunrise on June 21 is around 01:53 UTC
      expect(h).toBeLessThanOrEqual(3);
    });
  });

  // ─── Reykjavik winter (extreme latitude) ──────────────────────
  describe("Reykjavik in winter (extreme high latitude)", () => {
    const times = calculate({
      latitude: 64.1466,
      longitude: -21.9426,
      date: new Date(2024, 11, 21), // December 21
      method: CalculationMethod.MWL,
      madhab: Madhab.Shafi,
    });

    it("returns valid Date objects for all prayers", () => {
      expectValidPrayerTimes(times);
    });

    it("returns times in chronological order", () => {
      expectChronologicalOrder(times);
    });

    it("has very late sunrise in winter", () => {
      const { h } = utcHM(times.sunrise);
      // Reykjavik sunrise around 11:22 UTC in Dec
      expect(h).toBeGreaterThanOrEqual(10);
    });
  });

  // ─── Southern Hemisphere (Sydney) ─────────────────────────────
  describe("Sydney, Australia (southern hemisphere)", () => {
    const times = calculate({
      latitude: -33.8688,
      longitude: 151.2093,
      date: new Date(2024, 0, 15), // Jan 15 (southern summer)
      method: CalculationMethod.MWL,
      madhab: Madhab.Shafi,
    });

    it("returns valid Date objects for all prayers", () => {
      expectValidPrayerTimes(times);
    });

    it("returns times in chronological order", () => {
      expectChronologicalOrder(times);
    });

    it("has early Fajr in southern summer (before 19 UTC previous day)", () => {
      // Sydney is UTC+11, Fajr ~4:30 AEDT = ~17:30 UTC prev day
      const { h } = utcHM(times.fajr);
      expect(h).toBeGreaterThanOrEqual(16);
      expect(h).toBeLessThanOrEqual(20);
    });
  });

  // ─── Hanafi madhab ────────────────────────────────────────────
  describe("Hanafi vs Shafi madhab difference", () => {
    const baseParams = {
      latitude: 40.7128,
      longitude: -74.006,
      date: new Date(2024, 3, 15), // April 15
      method: CalculationMethod.ISNA,
    };

    const shafiTimes = calculate({ ...baseParams, madhab: Madhab.Shafi });
    const hanafiTimes = calculate({ ...baseParams, madhab: Madhab.Hanafi });

    it("Hanafi Asr is later than Shafi Asr", () => {
      expect(hanafiTimes.asr.getTime()).toBeGreaterThan(
        shafiTimes.asr.getTime(),
      );
    });

    it("other prayer times are the same regardless of madhab", () => {
      expect(shafiTimes.fajr.getTime()).toBe(hanafiTimes.fajr.getTime());
      expect(shafiTimes.sunrise.getTime()).toBe(hanafiTimes.sunrise.getTime());
      expect(shafiTimes.dhuhr.getTime()).toBe(hanafiTimes.dhuhr.getTime());
      expect(shafiTimes.maghrib.getTime()).toBe(hanafiTimes.maghrib.getTime());
      expect(shafiTimes.isha.getTime()).toBe(hanafiTimes.isha.getTime());
    });
  });

  // ─── Offsets ──────────────────────────────────────────────────
  describe("prayer offsets", () => {
    const baseParams = {
      latitude: 40.7128,
      longitude: -74.006,
      date: new Date(2024, 0, 15),
      method: CalculationMethod.ISNA,
      madhab: Madhab.Shafi,
    };

    const baseTimes = calculate(baseParams);
    const offsetTimes = calculate({
      ...baseParams,
      offsets: {
        fajr: 2,
        sunrise: -1,
        dhuhr: 3,
        asr: -2,
        maghrib: 5,
        isha: -3,
      },
    });

    it("Fajr offset of +2 shifts time by 2 minutes", () => {
      const diff =
        (offsetTimes.fajr.getTime() - baseTimes.fajr.getTime()) / 60000;
      expect(diff).toBe(2);
    });

    it("Sunrise offset of -1 shifts time by -1 minute", () => {
      const diff =
        (offsetTimes.sunrise.getTime() - baseTimes.sunrise.getTime()) / 60000;
      expect(diff).toBe(-1);
    });

    it("Dhuhr offset of +3 shifts time by 3 minutes", () => {
      const diff =
        (offsetTimes.dhuhr.getTime() - baseTimes.dhuhr.getTime()) / 60000;
      expect(diff).toBe(3);
    });

    it("Asr offset of -2 shifts time by -2 minutes", () => {
      const diff =
        (offsetTimes.asr.getTime() - baseTimes.asr.getTime()) / 60000;
      expect(diff).toBe(-2);
    });

    it("Maghrib offset of +5 shifts time by 5 minutes", () => {
      const diff =
        (offsetTimes.maghrib.getTime() - baseTimes.maghrib.getTime()) / 60000;
      expect(diff).toBe(5);
    });

    it("Isha offset of -3 shifts time by -3 minutes", () => {
      const diff =
        (offsetTimes.isha.getTime() - baseTimes.isha.getTime()) / 60000;
      expect(diff).toBe(-3);
    });
  });

  // ─── All calculation methods produce valid times ──────────────
  describe("all calculation methods produce valid results", () => {
    const methods = Object.values(CalculationMethod);
    const baseParams = {
      latitude: 40.7128,
      longitude: -74.006,
      date: new Date(2024, 0, 15),
      madhab: Madhab.Shafi,
    };

    it.each(methods)("method %s returns valid chronological times", (method) => {
      const times = calculate({ ...baseParams, method });
      expectValidPrayerTimes(times);
      expectChronologicalOrder(times);
    });
  });

  // ─── Egyptian method (Cairo) ──────────────────────────────────
  describe("Cairo with Egyptian method", () => {
    const times = calculate({
      latitude: 30.0444,
      longitude: 31.2357,
      date: new Date(2024, 0, 15),
      method: CalculationMethod.Egyptian,
      madhab: Madhab.Shafi,
    });

    it("returns valid Date objects for all prayers", () => {
      expectValidPrayerTimes(times);
    });

    it("returns times in chronological order", () => {
      expectChronologicalOrder(times);
    });
  });

  // ─── Karachi method ───────────────────────────────────────────
  describe("Karachi with Karachi method", () => {
    const times = calculate({
      latitude: 24.8607,
      longitude: 67.0011,
      date: new Date(2024, 0, 15),
      method: CalculationMethod.Karachi,
      madhab: Madhab.Hanafi,
    });

    it("returns valid Date objects for all prayers", () => {
      expectValidPrayerTimes(times);
    });

    it("returns times in chronological order", () => {
      expectChronologicalOrder(times);
    });
  });

  // ─── Tehran method ────────────────────────────────────────────
  describe("Tehran with Tehran method", () => {
    const times = calculate({
      latitude: 35.6892,
      longitude: 51.389,
      date: new Date(2024, 0, 15),
      method: CalculationMethod.Tehran,
      madhab: Madhab.Shafi,
    });

    it("returns valid Date objects for all prayers", () => {
      expectValidPrayerTimes(times);
    });

    it("returns times in chronological order", () => {
      expectChronologicalOrder(times);
    });
  });

  // ─── DST transition date ──────────────────────────────────────
  describe("DST transition (US spring forward, March 10 2024)", () => {
    const times = calculate({
      latitude: 40.7128,
      longitude: -74.006,
      date: new Date(2024, 2, 10), // March 10, 2024
      method: CalculationMethod.ISNA,
      madhab: Madhab.Shafi,
    });

    it("returns valid Date objects for all prayers", () => {
      expectValidPrayerTimes(times);
    });

    it("returns times in chronological order", () => {
      expectChronologicalOrder(times);
    });
  });

  // ─── Edge dates ───────────────────────────────────────────────
  describe("edge dates", () => {
    const baseParams = {
      latitude: 40.7128,
      longitude: -74.006,
      method: CalculationMethod.ISNA,
      madhab: Madhab.Shafi,
    };

    it("handles Jan 1 (new year)", () => {
      const times = calculate({ ...baseParams, date: new Date(2024, 0, 1) });
      expectValidPrayerTimes(times);
      expectChronologicalOrder(times);
    });

    it("handles Dec 31 (year end)", () => {
      const times = calculate({ ...baseParams, date: new Date(2024, 11, 31) });
      expectValidPrayerTimes(times);
      expectChronologicalOrder(times);
    });

    it("handles Feb 29 (leap year)", () => {
      const times = calculate({ ...baseParams, date: new Date(2024, 1, 29) });
      expectValidPrayerTimes(times);
      expectChronologicalOrder(times);
    });
  });

  // ─── Partial offsets ──────────────────────────────────────────
  describe("partial offsets (only some prayers)", () => {
    const baseParams = {
      latitude: 40.7128,
      longitude: -74.006,
      date: new Date(2024, 0, 15),
      method: CalculationMethod.ISNA,
      madhab: Madhab.Shafi,
    };

    const baseTimes = calculate(baseParams);
    const offsetTimes = calculate({
      ...baseParams,
      offsets: { fajr: 5 },
    });

    it("applies offset only to specified prayer", () => {
      const diff =
        (offsetTimes.fajr.getTime() - baseTimes.fajr.getTime()) / 60000;
      expect(diff).toBe(5);
    });

    it("leaves other prayers unchanged", () => {
      expect(offsetTimes.dhuhr.getTime()).toBe(baseTimes.dhuhr.getTime());
      expect(offsetTimes.asr.getTime()).toBe(baseTimes.asr.getTime());
      expect(offsetTimes.maghrib.getTime()).toBe(baseTimes.maghrib.getTime());
      expect(offsetTimes.isha.getTime()).toBe(baseTimes.isha.getTime());
    });
  });
});
