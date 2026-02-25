export interface ValidationError {
  field: string;
  message: string;
}

export interface SyncConfigInput {
  city: string;
  lat: number;
  lon: number;
  method: string;
  madhab: string;
  offsets?: Record<string, number>;
  enabledPrayers?: string[];
  alexaDeviceIds?: string[];
  lwaAccessToken: string;
  lwaRefreshToken: string;
}

const VALID_METHODS = [
  "MUSLIM_WORLD_LEAGUE",
  "EGYPTIAN",
  "KARACHI",
  "UMM_AL_QURA",
  "DUBAI",
  "NORTH_AMERICA",
];

const VALID_MADHABS = ["SHAFI", "HANAFI"];

const VALID_PRAYERS = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

export function validateSyncConfig(body: unknown): { data: SyncConfigInput; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!body || typeof body !== "object") {
    return { data: {} as SyncConfigInput, errors: [{ field: "body", message: "Request body is required" }] };
  }

  const input = body as Record<string, unknown>;

  if (typeof input.city !== "string" || input.city.trim().length === 0) {
    errors.push({ field: "city", message: "city is required and must be a non-empty string" });
  }

  if (typeof input.lat !== "number" || input.lat < -90 || input.lat > 90) {
    errors.push({ field: "lat", message: "lat must be a number between -90 and 90" });
  }

  if (typeof input.lon !== "number" || input.lon < -180 || input.lon > 180) {
    errors.push({ field: "lon", message: "lon must be a number between -180 and 180" });
  }

  if (typeof input.method !== "string" || !VALID_METHODS.includes(input.method)) {
    errors.push({ field: "method", message: `method must be one of: ${VALID_METHODS.join(", ")}` });
  }

  if (typeof input.madhab !== "string" || !VALID_MADHABS.includes(input.madhab)) {
    errors.push({ field: "madhab", message: `madhab must be one of: ${VALID_MADHABS.join(", ")}` });
  }

  if (input.offsets !== undefined) {
    if (typeof input.offsets !== "object" || input.offsets === null || Array.isArray(input.offsets)) {
      errors.push({ field: "offsets", message: "offsets must be an object" });
    } else {
      for (const [key, val] of Object.entries(input.offsets as Record<string, unknown>)) {
        if (!VALID_PRAYERS.includes(key)) {
          errors.push({ field: `offsets.${key}`, message: `Invalid prayer name: ${key}` });
        }
        if (typeof val !== "number") {
          errors.push({ field: `offsets.${key}`, message: "offset value must be a number" });
        }
      }
    }
  }

  if (input.enabledPrayers !== undefined) {
    if (!Array.isArray(input.enabledPrayers)) {
      errors.push({ field: "enabledPrayers", message: "enabledPrayers must be an array" });
    } else {
      for (const prayer of input.enabledPrayers) {
        if (!VALID_PRAYERS.includes(prayer)) {
          errors.push({ field: "enabledPrayers", message: `Invalid prayer name: ${prayer}` });
        }
      }
    }
  }

  if (input.alexaDeviceIds !== undefined) {
    if (!Array.isArray(input.alexaDeviceIds)) {
      errors.push({ field: "alexaDeviceIds", message: "alexaDeviceIds must be an array" });
    }
  }

  if (typeof input.lwaAccessToken !== "string" || input.lwaAccessToken.trim().length === 0) {
    errors.push({ field: "lwaAccessToken", message: "lwaAccessToken is required" });
  }

  if (typeof input.lwaRefreshToken !== "string" || input.lwaRefreshToken.trim().length === 0) {
    errors.push({ field: "lwaRefreshToken", message: "lwaRefreshToken is required" });
  }

  return {
    data: input as unknown as SyncConfigInput,
    errors,
  };
}
