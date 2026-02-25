import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CURRENT_TRACKER_SCHEMA_VERSION,
  createLocalPrayerTracker
} from "../src/index.js";

function createTempStoragePath() {
  const directory = mkdtempSync(path.join(os.tmpdir(), "athan-tracker-"));
  return {
    directory,
    storagePath: path.join(directory, "tracker.json")
  };
}

function fixedClock() {
  return new Date("2026-02-24T10:30:00.000Z");
}

test("creates local store and returns empty daily overview", () => {
  const { directory, storagePath } = createTempStoragePath();

  try {
    const tracker = createLocalPrayerTracker({ storagePath, clock: fixedClock });
    const overview = tracker.getDailyOverview({ date: "2026-02-24" });

    assert.equal(overview.completedCount, 0);
    assert.equal(overview.totalPrayers, 5);
    assert.equal(overview.prayers.fajr.completed, false);

    const persisted = JSON.parse(readFileSync(storagePath, "utf8"));
    assert.equal(persisted.schemaVersion, CURRENT_TRACKER_SCHEMA_VERSION);
    assert.ok(persisted.metadata.createdAt);
    assert.ok(persisted.metadata.updatedAt);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("marks prayer as completed and persists data locally", () => {
  const { directory, storagePath } = createTempStoragePath();

  try {
    const tracker = createLocalPrayerTracker({ storagePath, clock: fixedClock });
    const updated = tracker.markPrayerCompleted({
      date: "2026-02-24",
      prayerName: "asr"
    });

    assert.equal(updated.prayers.asr.completed, true);
    assert.equal(updated.completedCount, 1);

    const trackerReloaded = createLocalPrayerTracker({ storagePath, clock: fixedClock });
    const overview = trackerReloaded.getDailyOverview({ date: "2026-02-24" });
    assert.equal(overview.prayers.asr.completed, true);
    assert.equal(overview.prayers.asr.completedAt, "2026-02-24T10:30:00.000Z");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("migrates legacy store safely to current schema", () => {
  const { directory, storagePath } = createTempStoragePath();

  try {
    const legacyStore = {
      version: 1,
      days: {
        "2026-02-24": {
          prayers: {
            fajr: true,
            dhuhr: false,
            asr: false,
            maghrib: true,
            isha: false
          }
        }
      }
    };

    writeFileSync(storagePath, JSON.stringify(legacyStore, null, 2), "utf8");

    const tracker = createLocalPrayerTracker({ storagePath, clock: fixedClock });
    const overview = tracker.getDailyOverview({ date: "2026-02-24" });

    assert.equal(overview.prayers.fajr.completed, true);
    assert.equal(overview.prayers.maghrib.completed, true);
    assert.equal(overview.completedCount, 2);

    const migrated = JSON.parse(readFileSync(storagePath, "utf8"));
    assert.equal(migrated.schemaVersion, CURRENT_TRACKER_SCHEMA_VERSION);
    assert.ok(migrated.days["2026-02-24"].prayers.fajr.completedAt);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("validates input for prayer completion", () => {
  const { directory, storagePath } = createTempStoragePath();

  try {
    const tracker = createLocalPrayerTracker({ storagePath, clock: fixedClock });

    assert.throws(
      () =>
        tracker.markPrayerCompleted({
          date: "24-02-2026",
          prayerName: "fajr"
        }),
      /YYYY-MM-DD/
    );

    assert.throws(
      () =>
        tracker.markPrayerCompleted({
          date: "2026-02-24",
          prayerName: "tahajjud"
        }),
      /Unsupported prayer name/
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
