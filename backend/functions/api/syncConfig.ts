import type { APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { validateSyncConfig } from "../../lib/validation.js";
import { putDevice } from "../../lib/deviceStore.js";
import { encrypt } from "../../lib/encryption.js";
import type { CalculationMethodName, MadhabName } from "../../lib/prayerEngine.js";

const DEFAULT_PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

function jsonResponse(statusCode: number, body: Record<string, unknown>): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const deviceToken = event.headers["X-Device-Token"] || event.headers["x-device-token"];

    if (!deviceToken || deviceToken.trim().length === 0) {
      return jsonResponse(400, { error: "X-Device-Token header is required" });
    }

    let body: unknown;
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return jsonResponse(400, { error: "Invalid JSON body" });
    }

    const { data, errors } = validateSyncConfig(body);

    if (errors.length > 0) {
      return jsonResponse(400, { error: "Validation failed", details: errors });
    }

    const encryptionKey = process.env.ENCRYPTION_KEY || "";
    if (!encryptionKey) {
      return jsonResponse(500, { error: "Server configuration error" });
    }

    const lwaTokenEncrypted = encrypt(data.lwaAccessToken, encryptionKey);
    const lwaRefreshTokenEncrypted = encrypt(data.lwaRefreshToken, encryptionKey);

    const config = await putDevice({
      deviceToken: deviceToken.trim(),
      city: data.city.trim(),
      lat: data.lat,
      lon: data.lon,
      method: data.method as CalculationMethodName,
      madhab: data.madhab as MadhabName,
      offsets: data.offsets ?? {},
      enabledPrayers: data.enabledPrayers ?? DEFAULT_PRAYERS,
      alexaDeviceIds: data.alexaDeviceIds ?? [],
      alexaUserId: data.alexaUserId,
      lwaTokenEncrypted,
      lwaRefreshTokenEncrypted,
      updatedAt: new Date().toISOString(),
    });

    return jsonResponse(200, {
      message: "Configuration saved",
      deviceToken: config.deviceToken,
      updatedAt: config.updatedAt,
    });
  } catch (err) {
    console.error("syncConfig error:", err);
    return jsonResponse(500, { error: "Internal server error" });
  }
};
