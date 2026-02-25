import type { ScheduledHandler } from "aws-lambda";
import { scanAllDevices } from "../../lib/deviceStore.js";
import type { DeviceConfig } from "../../lib/deviceStore.js";
import { calculatePrayerTimes, PRAYER_NAMES } from "../../lib/prayerEngine.js";
import { getSkillMessagingToken, sendSkillMessage } from "../../lib/skillMessaging.js";
import { timezoneFromLongitude, getLocalDate, formatLocalDateTime } from "../../lib/timezone.js";

const SKILL_CLIENT_ID = process.env.SKILL_CLIENT_ID || "";
const SKILL_CLIENT_SECRET = process.env.SKILL_CLIENT_SECRET || "";

async function sendPrayerTimesForDevice(
  device: DeviceConfig,
  messagingToken: string
): Promise<{ sent: boolean }> {
  if (!device.alexaUserId) {
    console.warn(`Device ${device.deviceToken} has no alexaUserId, skipping`);
    return { sent: false };
  }

  const timezone = timezoneFromLongitude(device.lon);
  const localDate = getLocalDate(timezone);

  console.log(`Processing device ${device.deviceToken}: city=${device.city}, tz=${timezone}, date=${localDate.toISOString()}`);

  const prayerTimes = calculatePrayerTimes({
    lat: device.lat,
    lon: device.lon,
    date: localDate,
    method: device.method,
    madhab: device.madhab,
    offsets: device.offsets,
  });

  const enabledSet = new Set(device.enabledPrayers);
  const prayerTimesPayload: Record<string, string> = {};

  for (const prayerName of PRAYER_NAMES) {
    if (!enabledSet.has(prayerName)) continue;

    const prayerTime = prayerTimes[prayerName as keyof typeof prayerTimes];
    if (!(prayerTime instanceof Date)) continue;

    prayerTimesPayload[prayerName] = formatLocalDateTime(prayerTime, timezone);
  }

  const dateStr = localDate.toISOString().split("T")[0];

  await sendSkillMessage(messagingToken, device.alexaUserId, {
    prayerTimes: prayerTimesPayload,
    timezone,
    date: dateStr,
  });

  console.log(`Sent prayer times for device ${device.deviceToken} (${Object.keys(prayerTimesPayload).length} prayers)`);
  return { sent: true };
}

export const handler: ScheduledHandler = async (event) => {
  console.log("Daily cron started:", JSON.stringify(event));

  const devices = await scanAllDevices();
  console.log(`Found ${devices.length} devices to process`);

  const results = {
    total: devices.length,
    successful: 0,
    failed: 0,
    skipped: 0,
  };

  let messagingToken: string;
  try {
    messagingToken = await getSkillMessagingToken(SKILL_CLIENT_ID, SKILL_CLIENT_SECRET);
    console.log("Obtained Skill Messaging access token");
  } catch (err) {
    console.error("Failed to get Skill Messaging token:", err);
    return;
  }

  for (const device of devices) {
    try {
      const { sent } = await sendPrayerTimesForDevice(device, messagingToken);
      if (sent) {
        results.successful++;
      } else {
        results.skipped++;
      }
    } catch (err) {
      results.failed++;
      console.error(`Failed to process device ${device.deviceToken}:`, err);
    }
  }

  console.log("Daily cron completed:", JSON.stringify(results));
};
