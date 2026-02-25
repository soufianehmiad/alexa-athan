import { calculatePrayerTimes, PRAYER_NAMES } from "../lib/prayerEngine";

describe("prayerEngine", () => {
  it("should calculate prayer times for New York", () => {
    const result = calculatePrayerTimes({
      lat: 40.7128,
      lon: -74.006,
      date: new Date(2026, 1, 24), // Feb 24, 2026
      method: "NORTH_AMERICA",
      madhab: "SHAFI",
    });

    expect(result.fajr).toBeInstanceOf(Date);
    expect(result.sunrise).toBeInstanceOf(Date);
    expect(result.dhuhr).toBeInstanceOf(Date);
    expect(result.asr).toBeInstanceOf(Date);
    expect(result.maghrib).toBeInstanceOf(Date);
    expect(result.isha).toBeInstanceOf(Date);

    // Fajr should be before sunrise
    expect(result.fajr.getTime()).toBeLessThan(result.sunrise.getTime());
    // Sunrise before dhuhr
    expect(result.sunrise.getTime()).toBeLessThan(result.dhuhr.getTime());
    // Dhuhr before asr
    expect(result.dhuhr.getTime()).toBeLessThan(result.asr.getTime());
    // Asr before maghrib
    expect(result.asr.getTime()).toBeLessThan(result.maghrib.getTime());
    // Maghrib before isha
    expect(result.maghrib.getTime()).toBeLessThan(result.isha.getTime());
  });

  it("should calculate prayer times for Makkah with UMM_AL_QURA", () => {
    const result = calculatePrayerTimes({
      lat: 21.4225,
      lon: 39.8262,
      date: new Date(2026, 0, 1), // Jan 1, 2026
      method: "UMM_AL_QURA",
      madhab: "SHAFI",
    });

    expect(result.fajr).toBeInstanceOf(Date);
    expect(result.isha).toBeInstanceOf(Date);
    // Basic ordering
    expect(result.fajr.getTime()).toBeLessThan(result.isha.getTime());
  });

  it("should apply Hanafi madhab", () => {
    const shafiResult = calculatePrayerTimes({
      lat: 40.7128,
      lon: -74.006,
      date: new Date(2026, 5, 15), // June 15
      method: "NORTH_AMERICA",
      madhab: "SHAFI",
    });

    const hanafiResult = calculatePrayerTimes({
      lat: 40.7128,
      lon: -74.006,
      date: new Date(2026, 5, 15),
      method: "NORTH_AMERICA",
      madhab: "HANAFI",
    });

    // Hanafi Asr is later than Shafi Asr
    expect(hanafiResult.asr.getTime()).toBeGreaterThan(shafiResult.asr.getTime());
    // Fajr times should be the same regardless of madhab
    expect(hanafiResult.fajr.getTime()).toBe(shafiResult.fajr.getTime());
  });

  it("should throw for unsupported method", () => {
    expect(() =>
      calculatePrayerTimes({
        lat: 40.7128,
        lon: -74.006,
        date: new Date(),
        method: "INVALID" as any,
        madhab: "SHAFI",
      })
    ).toThrow("Unsupported calculation method");
  });

  it("should throw for unsupported madhab", () => {
    expect(() =>
      calculatePrayerTimes({
        lat: 40.7128,
        lon: -74.006,
        date: new Date(),
        method: "NORTH_AMERICA",
        madhab: "MALIKI" as any,
      })
    ).toThrow("Unsupported madhab");
  });

  it("should export all prayer names", () => {
    expect(PRAYER_NAMES).toEqual(["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]);
  });

  it("should apply offsets", () => {
    const base = calculatePrayerTimes({
      lat: 40.7128,
      lon: -74.006,
      date: new Date(2026, 1, 24),
      method: "NORTH_AMERICA",
      madhab: "SHAFI",
    });

    const withOffset = calculatePrayerTimes({
      lat: 40.7128,
      lon: -74.006,
      date: new Date(2026, 1, 24),
      method: "NORTH_AMERICA",
      madhab: "SHAFI",
      offsets: { fajr: 5 },
    });

    // Fajr with +5 min offset should be ~5 minutes later
    const diff = withOffset.fajr.getTime() - base.fajr.getTime();
    expect(diff).toBeCloseTo(5 * 60 * 1000, -3); // within ~1 second
  });

  it("should work with all supported calculation methods", () => {
    const methods = [
      "MUSLIM_WORLD_LEAGUE",
      "EGYPTIAN",
      "KARACHI",
      "UMM_AL_QURA",
      "DUBAI",
      "NORTH_AMERICA",
    ] as const;

    for (const method of methods) {
      const result = calculatePrayerTimes({
        lat: 40.7128,
        lon: -74.006,
        date: new Date(2026, 1, 24),
        method,
        madhab: "SHAFI",
      });

      expect(result.fajr).toBeInstanceOf(Date);
      expect(result.isha).toBeInstanceOf(Date);
    }
  });
});
