# Product Requirements Document — Athan for Alexa

**Version:** 0.1.0
**Last Updated:** 2026-02-24
**Status:** Draft

---

## 1. Vision

Athan for Alexa is a privacy-first, open-source platform that plays the Islamic call to prayer (Athan) through Alexa-enabled devices at the correct times, configured via an iOS companion app. It is free, donation-supported, and uses only public domain audio.

## 2. Problem Statement

Muslims who want automated Athan playback at home face fragmented options: existing Alexa skills are unreliable, ad-supported, or privacy-invasive. There is no open-source solution that combines accurate prayer time calculation, reliable Alexa playback, and zero data harvesting.

## 3. Target Users

- **Primary:** Muslims in North America and Europe who own Alexa devices and iPhones.
- **Secondary:** Developers and mosque communities who want to self-host or extend the platform.

## 4. Success Metrics

| Metric | MVP Target | V1 Target |
|---|---|---|
| Athan plays at correct time (within 2 min) | 95% of scheduled prayers | 98% of scheduled prayers |
| App crash rate | < 1% | < 0.5% |
| Skill certification | Approved | Maintained |
| User-reported privacy incidents | 0 | 0 |
| Donation conversion (of active users) | Baseline measurement | > 2% |

---

## 5. Scope

### 5.1 MVP — Minimum Viable Product

The MVP delivers the core value proposition: the Athan plays automatically on your Alexa at the right times.

#### Features

**F1: Prayer Time Configuration**
- User selects city (from a searchable list) or enters coordinates manually.
- User selects calculation method (ISNA, MWL, Egyptian, Umm al-Qura, Karachi, Tehran).
- User selects madhab (Shafi/Hanbali/Maliki vs Hanafi) for Asr calculation.
- App displays today's five prayer times + sunrise.
- User can apply manual offset (+/- minutes) per prayer.
- Times update automatically each day.

**F2: Alexa Device Selection**
- User links their Amazon account via Login with Amazon (LWA) OAuth.
- App discovers Alexa-enabled devices on the account.
- User selects which device(s) should play the Athan.
- User can enable/disable individual prayers per device (e.g., no Fajr Athan in the living room).

**F3: Automatic Athan Playback**
- Backend schedules Alexa Reminders at each enabled prayer time.
- Reminders include a spoken announcement (e.g., "It is time for Fajr prayer").
- User can invoke "Alexa, open Athan" to hear the full Athan audio via AudioPlayer.
- One default public domain Athan recording ships with MVP.
- Reminders are recalculated daily by a server-side cron.

**F4: Donation**
- In-app donation screen via Apple In-App Purchase (consumable).
- Preset amounts ($1, $5, $10, $25) + custom amount.
- Brief, non-intrusive prompt shown once after initial setup, then accessible from settings.
- No features gated behind donation.

#### MVP Non-Goals
- No prayer tracking or logging.
- No multi-language UI (English only in MVP).
- No Android app.
- No multiple Athan audio choices.
- No user accounts or cloud sync of personal data.

---

### 5.2 V1 — First Full Release

V1 adds prayer tracking and polish. All MVP features are included.

#### Additional Features

**F5: Prayer Tracking (Local Only)**
- User can mark each prayer as completed (prayed / prayed late / missed).
- Daily overview shows status of all five prayers.
- Simple weekly view with completion indicators.
- All data stored locally on-device (CoreData/SwiftData).
- No cloud sync. No export. No analytics.
- Data model is migration-safe for future schema changes.

**F6: Multiple Athan Audio**
- User can choose from 2-3 public domain Athan recordings.
- Different Athan can be assigned to Fajr vs other prayers.

**F7: Localization**
- Arabic and French UI translations.
- Prayer names displayed in Arabic alongside English.

**F8: Onboarding Flow**
- Guided first-launch experience.
- Step-by-step: location setup, Alexa linking, device selection, test playback.
- Skip option for users who want manual setup.

#### V1 Non-Goals
- No cloud-based prayer tracking sync.
- No social or community features.
- No Android app.
- No Qibla direction.
- No Quran integration.

---

## 6. User Flows

### 6.1 First Launch (MVP)

```
Open App
  → Welcome screen (app purpose, privacy statement)
  → Select city or enter coordinates
  → Select calculation method + madhab
  → Display today's prayer times for confirmation
  → Prompt to link Amazon account (LWA OAuth)
  → Discover Alexa devices
  → Select device(s) and configure per-prayer toggles
  → "Test Athan" button → plays Athan on selected device
  → Setup complete → show daily prayer times
  → Donation prompt (dismissible, shown once)
```

### 6.2 Daily Use (MVP)

```
App opens to today's prayer times
  → Next prayer highlighted
  → Countdown to next prayer shown
  → Alexa reminder fires at prayer time (automatic, no app interaction needed)
  → User optionally says "Alexa, open Athan" for full audio
```

### 6.3 Prayer Tracking (V1)

```
App opens to today's prayer times
  → Each prayer shows status: upcoming / completed / missed
  → User taps prayer → marks as prayed / prayed late / missed
  → Weekly view accessible via tab → shows 7-day grid
```

---

## 7. Technical Constraints

- **Architecture:** Pattern B — Minimal Backend (see ADR-001).
- **iOS minimum:** iOS 17.
- **Alexa:** Uses Reminders API for scheduled notifications + AudioPlayer for full Athan.
- **Backend:** AWS Lambda + API Gateway + CloudWatch cron. No persistent database for user profiles (DynamoDB on-demand for device config only).
- **Audio:** All audio files must be verifiably public domain or commissioned under CC0.
- **Privacy:** No GPS coordinates stored server-side. City-level granularity only. No user accounts.

## 8. Out of Scope (All Versions in This Document)

- Android app
- Web app
- Qibla compass
- Quran reader or audio
- Community / social features
- Mosque finder
- Islamic calendar (Hijri) as primary interface
- Push notifications for prayer times on iOS (may be added post-V1)

## 9. Dependencies

| Dependency | Type | Risk |
|---|---|---|
| Amazon Alexa Skills Kit | External API | Alexa policy changes could break playback |
| Login with Amazon (LWA) | OAuth provider | Required for device discovery |
| Alexa Reminders API | External API | Rate limits, API deprecation |
| Apple In-App Purchase | Payment | Apple review process |
| Adhan-Swift library | Open-source | Well-maintained, low risk |
| AWS Lambda / API Gateway | Infrastructure | Cost scales with users |

## 10. Open Questions

| # | Question | Impact | Status |
|---|---|---|---|
| 1 | Can Alexa Reminders include SSML audio snippets? | Affects playback UX | Needs validation |
| 2 | What is the Reminders API rate limit per user? | Affects bulk scheduling | Needs validation |
| 3 | Does Amazon allow religious content in skill store? | Certification blocker | Needs policy review |
| 4 | Are there high-quality public domain Athan recordings available? | Core feature dependency | Needs sourcing |
| 5 | Can LWA device discovery list individual Echo devices? | Affects device selection UX | Needs API testing |
