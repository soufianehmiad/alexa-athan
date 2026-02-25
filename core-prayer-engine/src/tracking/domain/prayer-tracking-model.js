export const PRAYER_NAMES = Object.freeze(["fajr", "dhuhr", "asr", "maghrib", "isha"]);
export const CURRENT_TRACKER_SCHEMA_VERSION = 2;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function createPrayerState() {
  return {
    completedAt: null
  };
}

export function assertValidDateKey(date) {
  if (typeof date !== "string" || !DATE_PATTERN.test(date)) {
    throw new Error("date must be in YYYY-MM-DD format.");
  }
}

export function assertValidPrayerName(prayerName) {
  if (!PRAYER_NAMES.includes(prayerName)) {
    throw new Error(`Unsupported prayer name: ${prayerName}`);
  }
}

export function createDailyRecord(date) {
  assertValidDateKey(date);

  return {
    date,
    prayers: {
      fajr: createPrayerState(),
      dhuhr: createPrayerState(),
      asr: createPrayerState(),
      maghrib: createPrayerState(),
      isha: createPrayerState()
    }
  };
}

export function createEmptyTrackerStore(nowIso) {
  return {
    schemaVersion: CURRENT_TRACKER_SCHEMA_VERSION,
    metadata: {
      createdAt: nowIso,
      updatedAt: nowIso
    },
    days: {}
  };
}

export function toDailyOverview(dailyRecord) {
  const prayers = {};
  let completedCount = 0;

  for (const prayerName of PRAYER_NAMES) {
    const completedAt = dailyRecord.prayers[prayerName]?.completedAt ?? null;
    const completed = typeof completedAt === "string";
    prayers[prayerName] = {
      completed,
      completedAt
    };
    if (completed) {
      completedCount += 1;
    }
  }

  return {
    date: dailyRecord.date,
    prayers,
    completedCount,
    totalPrayers: PRAYER_NAMES.length
  };
}
