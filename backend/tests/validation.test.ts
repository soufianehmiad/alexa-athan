import { validateSyncConfig } from "../lib/validation";

describe("validateSyncConfig", () => {
  const validInput = {
    city: "New York",
    lat: 40.7128,
    lon: -74.006,
    method: "NORTH_AMERICA",
    madhab: "SHAFI",
    enabledPrayers: ["fajr", "dhuhr", "asr", "maghrib", "isha"],
    alexaDeviceIds: ["device-1"],
    lwaAccessToken: "Atza|access-token",
    lwaRefreshToken: "Atzr|refresh-token",
  };

  it("should pass with valid input", () => {
    const { errors } = validateSyncConfig(validInput);
    expect(errors).toHaveLength(0);
  });

  it("should fail with null body", () => {
    const { errors } = validateSyncConfig(null);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe("body");
  });

  it("should fail with missing city", () => {
    const { errors } = validateSyncConfig({ ...validInput, city: "" });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.field === "city")).toBe(true);
  });

  it("should fail with invalid lat", () => {
    const { errors } = validateSyncConfig({ ...validInput, lat: 100 });
    expect(errors.some((e) => e.field === "lat")).toBe(true);
  });

  it("should fail with invalid lon", () => {
    const { errors } = validateSyncConfig({ ...validInput, lon: -200 });
    expect(errors.some((e) => e.field === "lon")).toBe(true);
  });

  it("should fail with invalid method", () => {
    const { errors } = validateSyncConfig({ ...validInput, method: "INVALID" });
    expect(errors.some((e) => e.field === "method")).toBe(true);
  });

  it("should fail with invalid madhab", () => {
    const { errors } = validateSyncConfig({ ...validInput, madhab: "MALIKI" });
    expect(errors.some((e) => e.field === "madhab")).toBe(true);
  });

  it("should fail with invalid prayer name in offsets", () => {
    const { errors } = validateSyncConfig({
      ...validInput,
      offsets: { fajr: 2, invalid_prayer: 1 },
    });
    expect(errors.some((e) => e.field.startsWith("offsets."))).toBe(true);
  });

  it("should fail with non-numeric offset value", () => {
    const { errors } = validateSyncConfig({
      ...validInput,
      offsets: { fajr: "two" as any },
    });
    expect(errors.some((e) => e.field === "offsets.fajr")).toBe(true);
  });

  it("should fail with invalid prayer in enabledPrayers", () => {
    const { errors } = validateSyncConfig({
      ...validInput,
      enabledPrayers: ["fajr", "lunch"],
    });
    expect(errors.some((e) => e.field === "enabledPrayers")).toBe(true);
  });

  it("should fail with missing lwaAccessToken", () => {
    const { errors } = validateSyncConfig({ ...validInput, lwaAccessToken: "" });
    expect(errors.some((e) => e.field === "lwaAccessToken")).toBe(true);
  });

  it("should fail with missing lwaRefreshToken", () => {
    const { errors } = validateSyncConfig({ ...validInput, lwaRefreshToken: "" });
    expect(errors.some((e) => e.field === "lwaRefreshToken")).toBe(true);
  });

  it("should accept valid offsets", () => {
    const { errors } = validateSyncConfig({
      ...validInput,
      offsets: { fajr: 2, isha: -3 },
    });
    expect(errors).toHaveLength(0);
  });

  it("should accept all valid methods", () => {
    const methods = [
      "MUSLIM_WORLD_LEAGUE",
      "EGYPTIAN",
      "KARACHI",
      "UMM_AL_QURA",
      "DUBAI",
      "NORTH_AMERICA",
    ];
    for (const method of methods) {
      const { errors } = validateSyncConfig({ ...validInput, method });
      expect(errors).toHaveLength(0);
    }
  });
});
