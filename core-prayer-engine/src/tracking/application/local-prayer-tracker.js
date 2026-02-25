import path from "node:path";
import {
  CURRENT_TRACKER_SCHEMA_VERSION,
  assertValidDateKey,
  assertValidPrayerName,
  createDailyRecord,
  createEmptyTrackerStore,
  toDailyOverview
} from "../domain/prayer-tracking-model.js";
import { JsonFileStore } from "../services/json-file-store.js";
import { migrateTrackerStore } from "../services/tracker-migrations.js";

function defaultStoragePath() {
  return path.resolve(process.cwd(), ".athan", "prayer-tracker.json");
}

function nowIso(clock) {
  return clock().toISOString();
}

export class LocalPrayerTracker {
  constructor({ storagePath = defaultStoragePath(), clock = () => new Date() } = {}) {
    this.clock = clock;
    this.store = new JsonFileStore(storagePath);
    this.cachedData = null;
  }

  loadStore() {
    if (this.cachedData) {
      return this.cachedData;
    }

    const timestamp = nowIso(this.clock);
    const baseStore = this.store.exists() ? this.store.read() : createEmptyTrackerStore(timestamp);
    const migrated = migrateTrackerStore(baseStore, timestamp);

    if (!this.store.exists() || migrated !== baseStore) {
      migrated.metadata = migrated.metadata || {};
      migrated.metadata.createdAt = migrated.metadata.createdAt || timestamp;
      migrated.metadata.updatedAt = timestamp;
      migrated.schemaVersion = CURRENT_TRACKER_SCHEMA_VERSION;
      this.store.write(migrated);
    }

    this.cachedData = migrated;
    return this.cachedData;
  }

  persist(storeData) {
    storeData.metadata.updatedAt = nowIso(this.clock);
    this.store.write(storeData);
    this.cachedData = storeData;
  }

  getDailyOverview({ date }) {
    assertValidDateKey(date);
    const storeData = this.loadStore();
    const dailyRecord = storeData.days[date] ?? createDailyRecord(date);
    return toDailyOverview(dailyRecord);
  }

  markPrayerCompleted({ date, prayerName, completedAt = null }) {
    assertValidDateKey(date);
    assertValidPrayerName(prayerName);

    const storeData = this.loadStore();
    const record = storeData.days[date] ?? createDailyRecord(date);
    const completedTimestamp = completedAt ?? nowIso(this.clock);
    record.prayers[prayerName].completedAt = completedTimestamp;
    storeData.days[date] = record;
    this.persist(storeData);
    return toDailyOverview(record);
  }
}

export function createLocalPrayerTracker(options) {
  return new LocalPrayerTracker(options);
}
