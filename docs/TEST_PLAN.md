# Test Plan — Athan for Alexa

**Version:** 0.1.0
**Last Updated:** 2026-02-24

---

## 1. Testing Strategy

### Principles

- **Test the engine exhaustively.** Prayer time calculation is the core domain — it must be correct across all methods, locations, and edge cases.
- **Test adapters for contract compliance.** Alexa handlers and API endpoints are tested against their interface contracts, not business logic.
- **Test locally first.** Minimize dependence on cloud services in the test suite.
- **Cross-platform consistency.** The Swift and TypeScript prayer engines must produce identical results for the same inputs.

### Coverage Targets

| Component | Framework | Target | Rationale |
|---|---|---|---|
| Prayer Engine (Swift) | XCTest | 95%+ | Core domain, must be bulletproof |
| Prayer Engine (TypeScript) | Jest | 95%+ | Must match Swift output exactly |
| iOS ViewModels | XCTest | 80%+ | Business logic layer |
| iOS Views | XCTest UI Tests | Critical flows | Smoke tests for navigation and setup |
| Alexa Handlers | Jest + ASK test utils | 90%+ | Contract compliance |
| Backend Lambdas | Jest | 85%+ | API behavior and cron logic |
| Cross-platform | Custom script | 100% of test vectors | Swift vs TS consistency |

---

## 2. Test Categories

### 2.1 Unit Tests — Prayer Engine

**Purpose:** Verify prayer time calculation accuracy.

| ID | Test Case | Input | Expected Output |
|---|---|---|---|
| PE-01 | Standard calculation (ISNA, NYC) | lat=40.71, lon=-74.01, 2026-03-15, ISNA, Standard | Times within 1 min of reference |
| PE-02 | Standard calculation (MWL, London) | lat=51.51, lon=-0.13, 2026-06-21, MWL, Standard | Times within 1 min of reference |
| PE-03 | Hanafi Asr | lat=40.71, lon=-74.01, 2026-03-15, ISNA, Hanafi | Asr later than Standard |
| PE-04 | All calculation methods | Fixed location/date, all 6 methods | Each method produces valid, distinct times |
| PE-05 | High latitude (Oslo, summer) | lat=59.91, lon=10.75, 2026-06-21, MWL | Valid times, no NaN or midnight wrapping |
| PE-06 | High latitude (Reykjavik, winter) | lat=64.13, lon=-21.90, 2026-12-21, ISNA | Valid times with high-lat adjustment |
| PE-07 | Equator (Singapore) | lat=1.35, lon=103.82, 2026-03-21, MWL | Minimal seasonal variation |
| PE-08 | Southern hemisphere (Sydney) | lat=-33.87, lon=151.21, 2026-06-21, MWL | Valid times (winter solstice there) |
| PE-09 | Date boundary (midnight UTC) | lat=40.71, lon=-74.01, 2026-01-01, ISNA | Correct date handling across UTC boundary |
| PE-10 | Manual offsets | Base times + offsets {fajr: +5, isha: -3} | Times shifted by exact offset |
| PE-11 | DST transition (spring forward) | NYC, 2026-03-08, ISNA | Correct times despite DST change |
| PE-12 | DST transition (fall back) | NYC, 2026-11-01, ISNA | No duplicate or skipped prayer times |
| PE-13 | Leap year handling | 2028-02-29, any location | Valid times computed |
| PE-14 | Year boundary | 2026-12-31 to 2027-01-01 | Continuous, no gaps |

### 2.2 Unit Tests — Cross-Platform Consistency

**Purpose:** Ensure Swift and TypeScript engines produce identical results.

| ID | Test Case | Method |
|---|---|---|
| XP-01 | Run PE-01 through PE-14 on both platforms | Compare outputs, max delta 1 second |
| XP-02 | 365-day sweep for NYC, ISNA | Run full year, compare all 5 prayers, max delta 1 second |
| XP-03 | 365-day sweep for Mecca, Umm al-Qura | Same as above |

**Implementation:** A CI script runs both engines against a shared JSON test vector file and compares outputs.

### 2.3 Unit Tests — Alexa Skill Handlers

| ID | Test Case | Input | Expected |
|---|---|---|---|
| AX-01 | LaunchRequest | Standard launch | Welcome response with next prayer |
| AX-02 | PlayAthanIntent | Valid invocation | AudioPlayer.Play directive |
| AX-03 | GetPrayerTimesIntent | User with city set | All 5 times spoken |
| AX-04 | SetCityIntent (valid) | "Chicago" | Confirmation, city stored |
| AX-05 | SetCityIntent (invalid) | "Xyzzy" | Error response, prompt retry |
| AX-06 | AudioPlayer.PlaybackFinished | After athan ends | Session ends cleanly |
| AX-07 | AudioPlayer.PlaybackFailed | Stream error | Graceful error message |
| AX-08 | SessionEndedRequest | Any | No error, clean exit |
| AX-09 | HelpIntent | Any | Usage instructions spoken |
| AX-10 | StopIntent during playback | AudioPlayer active | AudioPlayer.Stop directive |

### 2.4 Unit Tests — Backend Lambdas

| ID | Test Case | Input | Expected |
|---|---|---|---|
| BE-01 | POST /api/config (valid) | Full config payload | 200, stored in DynamoDB |
| BE-02 | POST /api/config (missing fields) | Incomplete payload | 400, validation error |
| BE-03 | POST /api/config (invalid method) | method="INVALID" | 400, validation error |
| BE-04 | GET /api/devices (valid token) | Valid LWA token | 200, device list |
| BE-05 | GET /api/devices (expired token) | Expired LWA token | 401, re-auth prompt |
| BE-06 | Daily cron (single config) | 1 device config in DB | 5 reminders created |
| BE-07 | Daily cron (multiple configs) | 50 configs | All processed, errors logged |
| BE-08 | Daily cron (LWA token refresh fail) | Revoked token | Config marked inactive, no crash |
| BE-09 | Daily cron (Reminders API failure) | API returns 429 | Retry once, log failure |
| BE-10 | Health endpoint | GET /api/health | 200, timestamp |

### 2.5 Unit Tests — iOS ViewModels

| ID | Test Case | Expected |
|---|---|---|
| VM-01 | PrayerTimesViewModel loads times for configured city | 5 valid prayer times displayed |
| VM-02 | PrayerTimesViewModel highlights next prayer | Correct prayer highlighted based on current time |
| VM-03 | SettingsViewModel saves calculation method | Persisted to UserDefaults |
| VM-04 | DeviceSetupViewModel handles LWA auth failure | Error state shown, retry available |
| VM-05 | DeviceSetupViewModel toggles prayer per device | Config updated correctly |
| VM-06 | TrackingViewModel marks prayer completed (V1) | Record persisted in SwiftData |
| VM-07 | TrackingViewModel loads weekly overview (V1) | 7 days of records returned |
| VM-08 | DonationViewModel handles purchase success | Thank you state shown |
| VM-09 | DonationViewModel handles purchase cancel | Returns to previous state |

### 2.6 UI Tests — iOS

| ID | Test Case | Steps | Expected |
|---|---|---|---|
| UI-01 | First launch onboarding | Launch fresh → walk through setup | Reaches main prayer times screen |
| UI-02 | Change city | Settings → change city → save | Prayer times update |
| UI-03 | Donation flow | Settings → Donate → select amount | StoreKit sheet appears |
| UI-04 | Prayer tracking (V1) | Main screen → tap prayer → mark done | Status updates immediately |

### 2.7 Integration Tests

| ID | Test Case | Method | Expected |
|---|---|---|---|
| IT-01 | iOS config sync to backend | iOS sends config, verify DynamoDB | Config stored correctly |
| IT-02 | Cron creates Alexa reminders | Trigger cron, check Reminders API mock | Correct number of reminders |
| IT-03 | End-to-end: setup → reminder | Full flow with mocked Alexa API | Reminder scheduled at correct time |
| IT-04 | LWA token refresh cycle | Simulate token expiry → refresh | New token obtained, reminder scheduled |

---

## 3. Edge Cases

| Scenario | What to Test | Risk |
|---|---|---|
| **DST transition** | Prayer times correct day-of and day-after DST change | Times could be off by 1 hour |
| **User travels** | City changes, times recalculate | Stale reminders from previous city |
| **Alexa offline** | Reminder fires but device unreachable | Missed athan — expected degradation |
| **App not opened for 90 days** | DynamoDB TTL expires config | Reminders stop — expected, resumable |
| **Multiple devices, different prayers** | Device A: all prayers. Device B: Fajr only | Correct reminder per device |
| **Midnight-crossing prayers** | Isha at 11:30 PM, Fajr at 4:00 AM | Both scheduled on correct calendar day |
| **Ramadan timing** | Fajr/Maghrib critical for fasting | Accuracy within 1 minute |
| **GPS vs city-level accuracy** | 2-minute variance from city center | Acceptable, documented |
| **Concurrent config updates** | iOS sends config while cron is running | No corruption — DynamoDB handles this |

---

## 4. Manual Test Checklist (Pre-Release)

- [ ] Install on physical iPhone, complete onboarding.
- [ ] Verify prayer times match IslamicFinder.org for the same city/method.
- [ ] Link Amazon account successfully.
- [ ] Discover at least one Alexa device.
- [ ] Trigger test reminder on Alexa device.
- [ ] Say "Alexa, open Athan" — verify audio plays.
- [ ] Change city — verify times update.
- [ ] Change calculation method — verify times change.
- [ ] Complete donation flow (sandbox).
- [ ] Kill app, wait 24 hours — verify reminders still fire (backend cron).
- [ ] Revoke Amazon account access — verify graceful handling.
- [ ] Test with airplane mode — verify local prayer times still display.
- [ ] V1: Mark prayers as completed, verify persistence across app restarts.
- [ ] V1: Verify weekly tracking view shows correct data.
