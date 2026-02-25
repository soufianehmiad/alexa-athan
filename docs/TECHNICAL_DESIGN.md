# Technical Design Document — Athan for Alexa

**Version:** 0.1.0
**Last Updated:** 2026-02-24
**Architecture:** Pattern B — Minimal Backend

---

## 1. System Overview

```
┌─────────────────┐       ┌───────────────────────────┐       ┌──────────────────┐
│    iOS App       │──────▶│   AWS Backend             │──────▶│  Alexa Service   │
│                  │ HTTPS │                           │       │                  │
│  SwiftUI         │       │  API Gateway              │       │  Reminders API   │
│  Adhan-Swift     │       │  Lambda (Node.js/TS)      │       │  AudioPlayer     │
│  CoreData        │       │  CloudWatch Cron          │       │  Skills Kit      │
│  StoreKit 2      │       │  DynamoDB (minimal)       │       │                  │
└─────────────────┘       └───────────────────────────┘       └──────────────────┘
```

### Design Principles (from Architecture Decision)

1. **Compute at the Edge, Store Nothing at Rest** — prayer times are computed, not stored.
2. **Alexa is a Playback Terminal** — the skill is a thin adapter.
3. **iOS Works With Zero Network** — all core features are local.
4. **Every Component is Replaceable** — modular boundaries, shared interfaces.
5. **No Authentication, No Accounts, No Identity** — device tokens only.

---

## 2. Component Architecture

### 2.1 Core Prayer Engine

A standalone, pure-computation library with zero side effects.

**Implementation:** Wraps [Adhan-Swift](https://github.com/batoulapps/adhan-swift) for iOS and [Adhan-JS](https://github.com/batoulapps/adhan-js) for Lambda.

**Interface:**

```
PrayerEngine.calculate(
  latitude: Double,
  longitude: Double,
  date: Date,
  method: CalculationMethod,
  madhab: Madhab,
  offsets: PrayerOffsets?
) -> PrayerTimes

PrayerTimes {
  fajr: Date
  sunrise: Date
  dhuhr: Date
  asr: Date
  maghrib: Date
  isha: Date
}
```

**Calculation Methods Supported:**
- ISNA (Islamic Society of North America)
- MWL (Muslim World League)
- Egyptian (Egyptian General Authority of Survey)
- Umm al-Qura (Umm al-Qura University, Makkah)
- Karachi (University of Islamic Sciences, Karachi)
- Tehran (Institute of Geophysics, University of Tehran)

**High-latitude Handling:** Middle of the night method (default) with angle-based as fallback. Configurable.

**Shared Logic:** The prayer engine interface is identical across Swift and TypeScript. Both wrap the same upstream library (Adhan) with the same method signatures to ensure consistency.

---

### 2.2 iOS App

**Framework:** SwiftUI, iOS 17+
**Architecture:** MVVM with service layer

```
ios-app/
├── AthanApp.swift                 # Entry point
├── Models/
│   ├── PrayerConfiguration.swift  # Location, method, madhab, offsets
│   ├── DeviceSelection.swift      # Alexa device model
│   └── PrayerRecord.swift         # V1: tracking data model
├── ViewModels/
│   ├── PrayerTimesViewModel.swift
│   ├── DeviceSetupViewModel.swift
│   ├── SettingsViewModel.swift
│   └── TrackingViewModel.swift    # V1
├── Views/
│   ├── PrayerTimesView.swift      # Main screen
│   ├── SettingsView.swift
│   ├── DeviceSetupView.swift
│   ├── DonationView.swift
│   ├── OnboardingView.swift       # V1
│   └── TrackingView.swift         # V1
├── Services/
│   ├── PrayerEngineService.swift  # Wraps Adhan-Swift
│   ├── AlexaSyncService.swift     # Calls backend API
│   ├── AmazonAuthService.swift    # LWA OAuth
│   ├── DonationService.swift      # StoreKit 2
│   └── PersistenceService.swift   # CoreData/SwiftData
├── Persistence/
│   ├── AthanModel.xcdatamodeld    # Core Data model
│   └── MigrationPolicies/         # V1+: schema migrations
└── Resources/
    ├── Localizable.xcstrings      # V1: multi-language
    └── Assets.xcassets
```

**Local Storage:**

| Entity | Fields | Storage |
|---|---|---|
| `UserPreferences` | city, lat, lon, method, madhab, offsets | UserDefaults |
| `DeviceConfig` | deviceId, deviceName, enabledPrayers[] | UserDefaults |
| `AuthTokens` | lwaAccessToken, lwaRefreshToken | Keychain |
| `PrayerRecord` (V1) | date, prayer, status, timestamp | CoreData |

**Offline Behavior:** Prayer times are computed locally using Adhan-Swift. No network required for displaying times. Network is only needed for: initial Alexa device discovery, syncing schedule changes to backend, and donations.

---

### 2.3 Alexa Skill

**Runtime:** Node.js 20 on AWS Lambda
**Framework:** ASK SDK v2

```
alexa-skill/
├── lambda/
│   ├── index.ts                    # Handler entry point
│   ├── handlers/
│   │   ├── LaunchHandler.ts        # "Alexa, open Athan"
│   │   ├── PlayAthanHandler.ts     # "Play the Athan" → AudioPlayer
│   │   ├── SetCityHandler.ts       # "Set my city to Chicago"
│   │   ├── PrayerTimesHandler.ts   # "What are today's prayer times?"
│   │   ├── AudioPlayerHandlers.ts  # Playback lifecycle events
│   │   ├── HelpHandler.ts
│   │   └── ErrorHandler.ts
│   ├── services/
│   │   ├── PrayerEngineService.ts  # Wraps adhan-js
│   │   └── AudioService.ts         # Audio URL resolution
│   └── models/
│       └── types.ts
├── skill-package/
│   ├── interactionModels/
│   │   └── custom/
│   │       └── en-US.json          # Intent schema
│   └── skill.json                  # Skill manifest
└── package.json
```

**Intents:**

| Intent | Utterances | Response |
|---|---|---|
| `LaunchRequest` | "Open Athan" | Greeting + next prayer time |
| `PlayAthanIntent` | "Play the Athan", "Play the call to prayer" | Streams Athan audio via AudioPlayer |
| `GetPrayerTimesIntent` | "What are today's prayer times?" | Speaks all five times |
| `SetCityIntent` | "Set my city to {CityName}" | Confirms city, recalculates |
| `AMAZON.HelpIntent` | "Help" | Usage instructions |
| `AMAZON.StopIntent` | "Stop" | Stops audio playback |

**AudioPlayer Integration:**

```typescript
// Simplified playback flow
const playDirective = {
  type: 'AudioPlayer.Play',
  playBehavior: 'REPLACE_ALL',
  audioItem: {
    stream: {
      url: getAthanAudioUrl(prayer, preference),
      token: `athan-${prayer}-${Date.now()}`,
      offsetInMilliseconds: 0
    }
  }
};
```

Audio files hosted on S3 with CloudFront CDN. URLs are signed with short-lived tokens.

---

### 2.4 Backend (Minimal)

**Infrastructure:** AWS Serverless

```
backend/
├── functions/
│   ├── api/
│   │   ├── syncConfig.ts          # POST: iOS sends config
│   │   ├── getDevices.ts          # GET: Alexa device discovery
│   │   └── health.ts              # GET: health check
│   ├── scheduler/
│   │   └── dailyCron.ts           # CloudWatch: recalculate reminders
│   └── alexa/
│       └── skillHandler.ts        # Alexa skill Lambda handler
├── lib/
│   ├── prayerEngine.ts            # Shared prayer calculation
│   ├── alexaReminders.ts          # Reminders API client
│   └── deviceStore.ts             # DynamoDB access
├── serverless.yml                 # Infrastructure as code
└── package.json
```

**DynamoDB Schema:**

Single table design. Minimal data.

```
Table: athan-devices

PK: DEVICE#{deviceToken}

Attributes:
  city: string            # City name (not GPS coordinates)
  lat: number             # City-center latitude (not user GPS)
  lon: number             # City-center longitude (not user GPS)
  method: string          # Calculation method enum
  madhab: string          # Hanafi | Standard
  offsets: Map             # Per-prayer minute offsets
  enabledPrayers: List     # Which prayers trigger reminders
  alexaDeviceIds: List     # Target Alexa device IDs
  lwaTokenEncrypted: string # Encrypted LWA refresh token
  updatedAt: string        # ISO timestamp
  ttl: number              # Auto-expire after 90 days of inactivity
```

**No user table. No email. No names. No analytics.** The device token is a random UUID generated by the iOS app and stored in Keychain. It cannot be traced back to a person.

**Daily Cron Flow:**

```
CloudWatch (02:00 UTC daily)
  → dailyCron Lambda
  → Scan all active device configs
  → For each config:
      → Compute today's prayer times (PrayerEngine)
      → Delete yesterday's Alexa Reminders
      → Create today's Alexa Reminders via Reminders API
      → If API failure: log, retry once, mark for next run
```

**API Endpoints:**

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/config` | Device token header | Sync config from iOS |
| `GET` | `/api/devices` | LWA access token | List Alexa devices |
| `GET` | `/api/health` | None | Healthcheck |
| `POST` | `/alexa` | Alexa request validation | Skill handler |

---

## 3. Data Flow Diagrams

### 3.1 Initial Setup

```
iOS App                    Backend                  Amazon
   │                          │                        │
   ├── LWA OAuth ─────────────┼───────────────────────▶│
   │◀── Access + Refresh Token┼────────────────────────│
   │                          │                        │
   ├── GET /api/devices ─────▶│── List Devices ───────▶│
   │◀── Device list ──────────│◀── Device list ────────│
   │                          │                        │
   │  User selects devices,   │                        │
   │  configures prayers      │                        │
   │                          │                        │
   ├── POST /api/config ─────▶│                        │
   │   {deviceToken, city,    │── Store in DynamoDB    │
   │    method, madhab,       │                        │
   │    devices, offsets}      │── Schedule Reminders ─▶│
   │                          │                        │
   │◀── 200 OK ──────────────│                        │
```

### 3.2 Daily Reminder Cycle

```
CloudWatch (02:00 UTC)
   │
   ▼
dailyCron Lambda
   │
   ├── Scan DynamoDB (all active configs)
   │
   ├── For each config:
   │     ├── PrayerEngine.calculate(city, date, method)
   │     ├── Delete existing reminders (Reminders API)
   │     └── Create new reminders for today (Reminders API)
   │
   └── Log results to CloudWatch Logs

          ... later that day ...

Alexa Device
   │
   ├── Reminder fires at prayer time
   ├── Alexa speaks: "It is time for Dhuhr prayer"
   └── User (optionally): "Alexa, open Athan" → AudioPlayer plays Athan
```

---

## 4. Security Design

### 4.1 Authentication

- **iOS ↔ Backend:** Device token (UUID) in `X-Device-Token` header. Not a security credential — it's an anonymous identifier. All endpoints are HTTPS.
- **Backend ↔ Alexa:** LWA tokens stored encrypted (AES-256) in DynamoDB. Decrypted only in-memory during reminder scheduling. Refresh tokens rotated on each use.
- **Alexa Skill:** Standard Alexa request signature validation via ASK SDK.

### 4.2 Data Protection

- DynamoDB encryption at rest (AWS managed keys).
- All API traffic over TLS 1.2+.
- LWA tokens encrypted at application level before storage.
- No PII stored. City names are not PII under GDPR.
- DynamoDB TTL auto-deletes inactive records after 90 days.

### 4.3 Audio Assets

- Hosted on S3 with CloudFront.
- Signed URLs with 1-hour expiry.
- No user-uploaded audio in MVP/V1.

---

## 5. Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│                  AWS Account                     │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │API Gateway│  │CloudWatch│  │  S3 + CDN     │  │
│  │          │  │  Cron    │  │  (audio)      │  │
│  └────┬─────┘  └────┬─────┘  └───────────────┘  │
│       │              │                           │
│  ┌────▼─────┐  ┌────▼─────┐                     │
│  │  Lambda  │  │  Lambda  │                      │
│  │  (API)   │  │  (Cron)  │                      │
│  └────┬─────┘  └────┬─────┘                      │
│       │              │                           │
│  ┌────▼──────────────▼─────┐                     │
│  │      DynamoDB           │                     │
│  │   (athan-devices)       │                     │
│  └─────────────────────────┘                     │
│                                                  │
│  ┌─────────────────────────┐                     │
│  │  Lambda (Alexa Skill)   │                     │
│  └─────────────────────────┘                     │
└─────────────────────────────────────────────────┘
```

**Infrastructure as Code:** Serverless Framework (serverless.yml) for all AWS resources.

**Environments:**
- `dev` — developer testing, separate AWS account or stage.
- `prod` — production, deployed via CI/CD on merge to `main`.

**Estimated Monthly Cost (1,000 users):**

| Service | Estimated Cost |
|---|---|
| Lambda (API + Cron + Skill) | $2-5 |
| API Gateway | $1-3 |
| DynamoDB (on-demand) | $1-2 |
| S3 + CloudFront (audio) | $1-3 |
| CloudWatch | $1 |
| **Total** | **~$6-14/mo** |

---

## 6. Error Handling

### 6.1 Reminder Scheduling Failures

- **Retry:** Each reminder creation retries once on failure.
- **Dead letter:** Failed configs are logged to a CloudWatch metric.
- **Alerting:** CloudWatch alarm triggers if > 5% of configs fail in a cron run.
- **Recovery:** Next day's cron will recreate all reminders from scratch (idempotent).

### 6.2 LWA Token Expiration

- Refresh tokens are used to obtain new access tokens before each reminder batch.
- If refresh fails (user revoked access), the config is marked `inactive` in DynamoDB.
- iOS app checks sync status on launch and prompts re-authentication if needed.

### 6.3 iOS App Errors

- Network failures during config sync: queued locally, retried on next app launch.
- Prayer engine errors: fallback to ISNA method with default offsets.
- Keychain access failures: prompt user to re-authenticate.

---

## 7. Testing Strategy

See [TEST_PLAN.md](./TEST_PLAN.md) for complete test plan.

**Summary:**

| Layer | Framework | Coverage Target |
|---|---|---|
| Core Prayer Engine (Swift) | XCTest | 95%+ |
| Core Prayer Engine (TS) | Jest | 95%+ |
| iOS ViewModels | XCTest | 80%+ |
| iOS Views | XCTest UI | Critical flows only |
| Alexa Handlers | Jest + ASK SDK test utils | 90%+ |
| Backend Lambdas | Jest | 85%+ |
| Integration | Manual + scripted | Pre-release |

---

## 8. Monitoring (Privacy-Preserving)

No user-level analytics. Aggregate metrics only.

| Metric | Source | Purpose |
|---|---|---|
| Total active configs | DynamoDB scan count | Growth tracking |
| Cron success rate | CloudWatch Logs | Reliability |
| Reminder API error rate | CloudWatch Logs | Alexa API health |
| Skill invocation count | Alexa Developer Console | Usage patterns |
| Lambda error rate | CloudWatch Metrics | Backend health |
| API latency (p50, p99) | API Gateway Metrics | Performance |
