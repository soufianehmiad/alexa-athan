import { timezoneFromLongitude, getLocalDate, formatLocalDateTime } from "../lib/timezone";

describe("timezone", () => {
  describe("timezoneFromLongitude", () => {
    it("should return Etc/GMT for longitude 0", () => {
      expect(timezoneFromLongitude(0)).toBe("Etc/GMT");
    });

    it("should return Etc/GMT+5 for New York longitude (~-74)", () => {
      // -74 / 15 = -4.93, rounds to -5
      // Etc sign inversion: -(-5) = +5
      expect(timezoneFromLongitude(-74)).toBe("Etc/GMT+5");
    });

    it("should return Etc/GMT-3 for Makkah longitude (~40)", () => {
      // 40 / 15 = 2.67, rounds to 3
      // Etc sign inversion: -(3) = -3
      expect(timezoneFromLongitude(40)).toBe("Etc/GMT-3");
    });

    it("should return Etc/GMT-9 for Tokyo longitude (~140)", () => {
      // 140 / 15 = 9.33, rounds to 9
      expect(timezoneFromLongitude(140)).toBe("Etc/GMT-9");
    });

    it("should return Etc/GMT+8 for Los Angeles longitude (~-118)", () => {
      // -118 / 15 = -7.87, rounds to -8
      expect(timezoneFromLongitude(-118)).toBe("Etc/GMT+8");
    });
  });

  describe("getLocalDate", () => {
    it("should return a Date object", () => {
      const result = getLocalDate("Etc/GMT");
      expect(result).toBeInstanceOf(Date);
    });

    it("should return a date with time set to midnight (local)", () => {
      const result = getLocalDate("Etc/GMT");
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });
  });

  describe("formatLocalDateTime", () => {
    it("should format a date as YYYY-MM-DDTHH:mm:ss", () => {
      const date = new Date("2026-02-24T12:30:00Z");
      const formatted = formatLocalDateTime(date, "Etc/GMT");
      expect(formatted).toBe("2026-02-24T12:30:00");
    });

    it("should apply timezone offset", () => {
      const date = new Date("2026-02-24T12:30:00Z");
      // Etc/GMT+5 = UTC-5
      const formatted = formatLocalDateTime(date, "Etc/GMT+5");
      expect(formatted).toBe("2026-02-24T07:30:00");
    });

    it("should handle date change across midnight", () => {
      const date = new Date("2026-02-25T02:00:00Z");
      // Etc/GMT+5 = UTC-5 => 21:00 on Feb 24
      const formatted = formatLocalDateTime(date, "Etc/GMT+5");
      expect(formatted).toBe("2026-02-24T21:00:00");
    });
  });
});
