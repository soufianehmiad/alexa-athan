# Definition of Done — Athan for Alexa

**Last Updated:** 2026-02-24

---

## Purpose

This document defines what "done" means at each level — task, feature, and release. Nothing ships unless it meets these criteria.

---

## 1. Task Level (Individual PR)

A task (bug fix, small feature, refactor) is done when:

- [ ] Code compiles without warnings.
- [ ] All existing tests pass.
- [ ] New/changed behavior has corresponding tests.
- [ ] Code follows project coding standards (see CONTRIBUTING.md).
- [ ] No new dependencies added without prior discussion.
- [ ] No secrets, credentials, or PII in the code.
- [ ] PR has a clear description and links to the related issue.
- [ ] At least one reviewer has approved the PR.
- [ ] CI pipeline passes (lint, test, build).

---

## 2. Feature Level (PRD Feature Complete)

A feature (e.g., "Prayer Time Configuration," "Alexa Device Selection") is done when:

- [ ] All acceptance criteria from the PRD are met.
- [ ] All task-level criteria are met for every PR in the feature.
- [ ] Feature works on a physical device (not just simulator), where applicable.
- [ ] Feature works in offline mode, where applicable (iOS).
- [ ] Edge cases identified in TEST_PLAN.md are covered.
- [ ] No known P0 (critical) or P1 (major) bugs remain.
- [ ] Privacy review: no new data collection beyond what is documented in PRIVACY.md.
- [ ] Accessibility: VoiceOver navigable, Dynamic Type supported (iOS).
- [ ] Localization: all user-facing strings are in localization files (V1+).
- [ ] Documentation updated if feature changes public behavior.

---

## 3. Release Level

### MVP Release Criteria

All feature-level criteria are met for F1-F4 (see PRD), plus:

- [ ] **Prayer time accuracy:** Verified against reference source (e.g., IslamicFinder.org) for at least 5 cities across 3 continents. Accuracy within 2 minutes.
- [ ] **Alexa reliability:** Reminders fire correctly for 7 consecutive days in beta testing.
- [ ] **Alexa Skill certified:** Approved by Amazon and live in the Alexa Skills Store.
- [ ] **iOS app approved:** Accepted by Apple App Review and live in the App Store.
- [ ] **Donation flow works:** End-to-end purchase flow tested in production (StoreKit).
- [ ] **Privacy policy published:** PRIVACY.md content accessible from within the app and in app store listings.
- [ ] **Security checklist complete:** All items in SECURITY.md pre-release checklist pass.
- [ ] **No P0 or P1 bugs open.**
- [ ] **Onboarding is completable:** A new user can go from install to working Alexa reminders in under 5 minutes.
- [ ] **Audio licensing verified:** Every audio file has documented public domain or CC0 provenance.
- [ ] **LICENSE file present** in repository root.

### V1 Release Criteria

All MVP criteria remain met, plus:

- [ ] **Prayer tracking works:** Data persists across app restarts, device reboots.
- [ ] **Weekly view accurate:** Displays correct data for the past 7 days.
- [ ] **Migration tested:** Upgrade from MVP data schema to V1 schema works without data loss.
- [ ] **Multiple Athan audio:** At least 2 options available, selectable per prayer type.
- [ ] **Localization complete:** Arabic and French translations reviewed by native speakers.
- [ ] **Accessibility audit passed:** Tested with VoiceOver on a physical device.
- [ ] **Onboarding flow tested:** New user and existing-user upgrade paths both work.

---

## 4. Bug Severity Definitions

| Severity | Definition | Example | Release Blocker? |
|---|---|---|---|
| **P0 — Critical** | Core feature broken, no workaround | Prayer times calculated incorrectly; Alexa reminders not firing | Yes |
| **P1 — Major** | Feature impaired, workaround exists | Device selection fails on first try but works on retry | Yes |
| **P2 — Minor** | Cosmetic or minor UX issue | Alignment off on one screen size | No |
| **P3 — Trivial** | Negligible impact | Typo in settings label | No |

---

## 5. Regression Policy

- No release ships with a regression from the previous release.
- The full manual test checklist (TEST_PLAN.md section 4) is executed before every release.
- Automated test suite must pass at 100% before tagging a release.
