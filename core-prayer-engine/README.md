# Core Prayer Engine

Reusable prayer time calculation library for Athan applications.

## Features

- Pure local calculations (no external API calls)
- Input contract: `lat`, `lon`, `date`, `calculationMethod`, `madhab`
- Timezone aware (IANA timezone support via built-in `Intl`)
- High-latitude adjustment strategies
- Clean architecture with domain, services, and application layers
- Unit tested and fully runnable with Node.js
- Local-only prayer tracking with migration-safe file storage

## Public API

```js
import {
  calculatePrayerTimes,
  createPrayerTimeEngine,
  createLocalPrayerTracker,
  CalculationMethod,
  Madhab,
  HighLatitudeRule
} from "@athan/core-prayer-engine";
```

### Input

```js
{
  lat: number,
  lon: number,
  date: string | Date, // YYYY-MM-DD or ISO date
  calculationMethod: string, // e.g. MUSLIM_WORLD_LEAGUE
  madhab: string, // SHAFI | HANAFI
  timezone?: string, // default: UTC
  highLatitudeRule?: string // default: ANGLE_BASED
}
```

### Output

```js
{
  metadata: { ... },
  times: {
    fajr: { localTime, iso, date, hours },
    sunrise: { localTime, iso, date, hours },
    dhuhr: { localTime, iso, date, hours },
    asr: { localTime, iso, date, hours },
    maghrib: { localTime, iso, date, hours },
    isha: { localTime, iso, date, hours }
  }
}
```

## Quick Example

```js
import { calculatePrayerTimes } from "@athan/core-prayer-engine";

const schedule = calculatePrayerTimes({
  lat: 40.7128,
  lon: -74.006,
  date: "2026-02-24",
  timezone: "America/New_York",
  calculationMethod: "MUSLIM_WORLD_LEAGUE",
  madhab: "SHAFI"
});

console.log(schedule.times.fajr.localTime);
```

## Local Prayer Tracking

```js
import { createLocalPrayerTracker } from "@athan/core-prayer-engine";

const tracker = createLocalPrayerTracker({
  storagePath: "./.athan/prayer-tracker.json"
});

tracker.markPrayerCompleted({
  date: "2026-02-24",
  prayerName: "fajr"
});

const overview = tracker.getDailyOverview({ date: "2026-02-24" });
console.log(overview.completedCount);
```

### Data Model

```json
{
  "schemaVersion": 2,
  "metadata": {
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  },
  "days": {
    "YYYY-MM-DD": {
      "date": "YYYY-MM-DD",
      "prayers": {
        "fajr": { "completedAt": "ISO-8601 or null" },
        "dhuhr": { "completedAt": "ISO-8601 or null" },
        "asr": { "completedAt": "ISO-8601 or null" },
        "maghrib": { "completedAt": "ISO-8601 or null" },
        "isha": { "completedAt": "ISO-8601 or null" }
      }
    }
  }
}
```

## Scripts

- `npm start` Run sample schedule output
- `npm test` Run unit tests
