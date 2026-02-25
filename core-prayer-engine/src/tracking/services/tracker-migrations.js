import {
  CURRENT_TRACKER_SCHEMA_VERSION,
  PRAYER_NAMES,
  createDailyRecord,
  createEmptyTrackerStore
} from "../domain/prayer-tracking-model.js";

function normalizeCompletedAt(value, fallbackIso) {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (value === true) {
    return fallbackIso;
  }

  return null;
}

function migrateFromVersion1(store, nowIso) {
  const migrated = createEmptyTrackerStore(nowIso);
  const sourceDays = store.days && typeof store.days === "object" ? store.days : {};

  for (const [date, dayValue] of Object.entries(sourceDays)) {
    const record = createDailyRecord(date);
    const prayers = dayValue?.prayers && typeof dayValue.prayers === "object" ? dayValue.prayers : {};

    for (const prayerName of PRAYER_NAMES) {
      record.prayers[prayerName].completedAt = normalizeCompletedAt(prayers[prayerName], nowIso);
    }

    migrated.days[date] = record;
  }

  return migrated;
}

function migrateFromLegacyUnversioned(store, nowIso) {
  const migrated = createEmptyTrackerStore(nowIso);
  const sourceDays = store.entries && typeof store.entries === "object" ? store.entries : {};

  for (const [date, dayValue] of Object.entries(sourceDays)) {
    const record = createDailyRecord(date);
    const prayers = dayValue && typeof dayValue === "object" ? dayValue : {};

    for (const prayerName of PRAYER_NAMES) {
      record.prayers[prayerName].completedAt = normalizeCompletedAt(prayers[prayerName], nowIso);
    }

    migrated.days[date] = record;
  }

  return migrated;
}

export function migrateTrackerStore(store, nowIso) {
  if (!store || typeof store !== "object") {
    throw new Error("Tracker store is not a valid object.");
  }

  const version = Number(store.schemaVersion ?? store.version ?? 0);

  if (version === CURRENT_TRACKER_SCHEMA_VERSION) {
    return store;
  }

  if (version === 1) {
    return migrateFromVersion1(store, nowIso);
  }

  if (version === 0) {
    return migrateFromLegacyUnversioned(store, nowIso);
  }

  throw new Error(`Unsupported tracker schemaVersion: ${version}`);
}
