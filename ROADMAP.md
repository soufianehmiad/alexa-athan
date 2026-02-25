# Roadmap — Athan for Alexa

**Last Updated:** 2026-02-24

---

## Release Timeline

```
MVP ──────▶ V1 ──────▶ V1.x ──────▶ V2 (Future)
Q2 2026      Q3 2026    Q4 2026       2027+
```

---

## MVP — Core Athan Playback

**Goal:** The Athan plays on your Alexa at the right time.

| Feature | Status |
|---|---|
| Prayer time calculation (6 methods, 2 madhabs) | Planned |
| City selection with coordinate lookup | Planned |
| Manual time offsets per prayer | Planned |
| Login with Amazon OAuth | Planned |
| Alexa device discovery and selection | Planned |
| Per-prayer enable/disable per device | Planned |
| Alexa Reminder scheduling (backend cron) | Planned |
| Alexa Skill: voice-triggered Athan audio playback | Planned |
| Default public domain Athan audio | Planned |
| Donation via Apple In-App Purchase | Planned |
| Alexa Skill certification | Planned |
| App Store submission | Planned |

**Exit Criteria:** Athan reminders fire reliably for 7 consecutive days in beta testing.

---

## V1 — Prayer Tracking and Polish

**Goal:** Users can track their daily prayers and the experience is polished.

| Feature | Status |
|---|---|
| Prayer tracking: mark completed / late / missed | Planned |
| Daily prayer status overview | Planned |
| Weekly tracking view | Planned |
| Local-only storage (SwiftData) | Planned |
| Multiple Athan audio choices (2-3 recordings) | Planned |
| Different Athan for Fajr vs other prayers | Planned |
| Arabic and French localization | Planned |
| Guided onboarding flow | Planned |
| Accessibility audit (VoiceOver, Dynamic Type) | Planned |

**Exit Criteria:** Prayer tracking works reliably with data persistence across app restarts.

---

## V1.x — Quality of Life

**Goal:** Address user feedback and improve reliability.

| Feature | Status |
|---|---|
| iOS push notifications for prayer times (local) | Planned |
| Athan volume control per prayer | Planned |
| Widget for home screen (prayer times) | Planned |
| Certificate pinning for API calls | Planned |
| Spanish localization | Planned |
| Improved high-latitude handling options | Planned |
| Prayer tracking data export (JSON) | Planned |

---

## V2 — Platform Expansion (Future)

**Goal:** Become a modular open-source platform.

These items are aspirational and will be scoped based on community feedback and contributor interest.

| Feature | Notes |
|---|---|
| Android app | Kotlin/Compose, same architecture |
| Google Home / Nest integration | Separate adapter module |
| Community Athan audio contributions | Upload pipeline with licensing verification |
| Qibla compass | iOS sensor integration |
| Islamic calendar (Hijri) display | On prayer times screen |
| Mosque community features | Shared prayer times, community tracking |
| Self-hosted backend option | Docker-based deployment guide |
| Plugin system | Third-party extensions to the platform |

---

## What We Will NOT Build

These are explicitly out of scope to keep the project focused:

- Social media features (feeds, followers, likes).
- Quran reader or audio streaming.
- Islamic education content.
- E-commerce or marketplace features.
- Features that require storing personal data in the cloud.
- Premium/paid tiers that gate core functionality.

---

## How Priorities Are Set

1. **Privacy impact:** Features that increase data collection are deprioritized.
2. **Core reliability:** Bugs in prayer time calculation or Alexa playback take top priority.
3. **Community demand:** Issues and discussions on GitHub inform V1.x and V2 priorities.
4. **Contributor interest:** Open-source contributions guide which V2 features happen first.

---

## Contributing to the Roadmap

We welcome community input on priorities. To propose a feature:

1. Open a GitHub Discussion with the `feature-request` label.
2. Describe the use case, not just the feature.
3. The community votes with reactions.
4. Maintainers review top-voted requests quarterly.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.
