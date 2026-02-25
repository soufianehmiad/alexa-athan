import type { ScheduledHandler } from "aws-lambda";
import { scanAllDevices, putDevice } from "../../lib/deviceStore.js";
import type { DeviceConfig } from "../../lib/deviceStore.js";
import { calculatePrayerTimes, PRAYER_NAMES } from "../../lib/prayerEngine.js";
import type { CalculationMethodName, MadhabName } from "../../lib/prayerEngine.js";
import {
  refreshLwaToken,
  createReminder,
  getAllReminders,
  deleteReminder,
  buildReminderRequest,
} from "../../lib/alexaReminders.js";
import { encrypt, decrypt } from "../../lib/encryption.js";
import { timezoneFromLongitude, getLocalDate, formatLocalDateTime } from "../../lib/timezone.js";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";
const LWA_CLIENT_ID = process.env.LWA_CLIENT_ID || "";
const LWA_CLIENT_SECRET = process.env.LWA_CLIENT_SECRET || "";

async function refreshTokenForDevice(
  device: DeviceConfig
): Promise<{ accessToken: string; updatedDevice: boolean }> {
  const refreshToken = decrypt(device.lwaRefreshTokenEncrypted, ENCRYPTION_KEY);

  const tokenResult = await refreshLwaToken(refreshToken, LWA_CLIENT_ID, LWA_CLIENT_SECRET);

  const newAccessTokenEncrypted = encrypt(tokenResult.access_token, ENCRYPTION_KEY);
  const newRefreshTokenEncrypted = encrypt(tokenResult.refresh_token, ENCRYPTION_KEY);

  await putDevice({
    ...device,
    lwaTokenEncrypted: newAccessTokenEncrypted,
    lwaRefreshTokenEncrypted: newRefreshTokenEncrypted,
  });

  return { accessToken: tokenResult.access_token, updatedDevice: true };
}

async function deleteExistingReminders(accessToken: string): Promise<number> {
  let deleted = 0;
  try {
    const existing = await getAllReminders(accessToken);
    for (const alert of existing.alerts ?? []) {
      try {
        await deleteReminder(accessToken, alert.alertToken);
        deleted++;
      } catch (err) {
        console.warn(`Failed to delete reminder ${alert.alertToken}:`, err);
      }
    }
  } catch (err) {
    console.warn("Failed to fetch existing reminders:", err);
  }
  return deleted;
}

async function scheduleRemindersForDevice(device: DeviceConfig): Promise<{
  scheduled: number;
  errors: number;
}> {
  const timezone = timezoneFromLongitude(device.lon);
  const localDate = getLocalDate(timezone);

  console.log(`Processing device ${device.deviceToken}: city=${device.city}, tz=${timezone}, date=${localDate.toISOString()}`);

  let accessToken: string;
  try {
    const tokenResult = await refreshTokenForDevice(device);
    accessToken = tokenResult.accessToken;
  } catch (err) {
    console.error(`Token refresh failed for device ${device.deviceToken}:`, err);
    throw new Error(`Token refresh failed: ${err instanceof Error ? err.message : "Unknown error"}`);
  }

  await deleteExistingReminders(accessToken);

  const prayerTimes = calculatePrayerTimes({
    lat: device.lat,
    lon: device.lon,
    date: localDate,
    method: device.method,
    madhab: device.madhab,
    offsets: device.offsets,
  });

  const enabledSet = new Set(device.enabledPrayers);
  let scheduled = 0;
  let errors = 0;

  const now = new Date();

  for (const prayerName of PRAYER_NAMES) {
    if (!enabledSet.has(prayerName)) continue;

    const prayerTime = prayerTimes[prayerName as keyof typeof prayerTimes];
    if (!(prayerTime instanceof Date) || prayerTime <= now) {
      console.log(`Skipping ${prayerName}: time already passed or invalid`);
      continue;
    }

    const scheduledTimeLocal = formatLocalDateTime(prayerTime, timezone);
    const reminder = buildReminderRequest(prayerName, scheduledTimeLocal, timezone);

    try {
      await createReminder(accessToken, reminder);
      scheduled++;
      console.log(`Scheduled ${prayerName} at ${scheduledTimeLocal} (${timezone})`);
    } catch (err) {
      errors++;
      console.error(`Failed to schedule ${prayerName} for device ${device.deviceToken}:`, err);

      if (err instanceof Error && err.message.includes("rate limit")) {
        console.warn("Rate limit hit, waiting 2 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  return { scheduled, errors };
}

export const handler: ScheduledHandler = async (event) => {
  console.log("Daily cron started:", JSON.stringify(event));

  const devices = await scanAllDevices();
  console.log(`Found ${devices.length} devices to process`);

  const results = {
    total: devices.length,
    successful: 0,
    failed: 0,
    totalScheduled: 0,
    totalErrors: 0,
  };

  for (const device of devices) {
    try {
      const { scheduled, errors } = await scheduleRemindersForDevice(device);
      results.successful++;
      results.totalScheduled += scheduled;
      results.totalErrors += errors;
    } catch (err) {
      results.failed++;
      console.error(`Failed to process device ${device.deviceToken}:`, err);
    }
  }

  console.log("Daily cron completed:", JSON.stringify(results));
};
