# Release Readiness Review — Athan for Alexa

**Date:** 2026-02-24
**Reviewers:** Internal multi-agent team (6 roles)
**Scope:** MVP and V1 release readiness

---

## Assumptions

Before beginning, we list what we assume to be true about the current state:

1. Code exists for all modules (core-prayer-engine, ios-app, alexa-skill, backend) with passing tests per the test plan.
2. The Alexa skill has NOT yet been submitted for Amazon certification.
3. The iOS app has NOT yet been submitted for Apple review.
4. No real users have tested the full end-to-end flow on physical Alexa hardware for 7+ days.
5. Public domain Athan audio has been identified but licensing provenance has NOT been formally documented with legal certainty.
6. The five "Open Questions" in the PRD (Section 10) remain unanswered.
7. A solo maintainer will handle all fixes and operations.

---

## Agent Reviews

### Agent 1: Product Lead

**Scope Assessment:** MVP scope is tight and appropriate. The four features (prayer config, device selection, auto playback, donation) represent the minimum viable path to value. V1 additions (tracking, localization, onboarding, multiple audio) are well-separated.

**Findings:**

- **PL-01 (P0): The two-tier playback UX is not clearly communicated in marketing or UX copy.** The PRD says "Automatic Athan Playback" (F3) but the actual experience is: reminder speaks text, then user must say "Alexa, play athan." This gap between expectation and reality will generate negative reviews. The App Store listing, skill description, and onboarding must explicitly set the expectation: "Alexa will remind you at prayer time. Say 'Alexa, open Athan' to hear the full call to prayer."

- **PL-02 (P1): Success metric "Athan plays at correct time — 95%" has no measurement mechanism.** Privacy-preserving monitoring (TDD Section 8) tracks cron success rate and reminder API error rate, but not whether the reminder actually fired on the device at the correct time. There's no feedback loop from Alexa to the backend confirming delivery. Recommendation: redefine the metric as "Reminders scheduled successfully at the correct time" — which IS measurable via CloudWatch logs.

- **PL-03 (P2): No "Alexa-free" user flow documented.** A user who never links Amazon can still use the app as a prayer times display. This is a valid use case (and avoids Apple review friction from mandatory third-party login). The onboarding should make Alexa linking optional, with a clear "Skip — just show me prayer times" path.

- **PL-04 (P2): Donation prompt timing needs specification.** PRD says "shown once after initial setup." Define precisely when: after setup completion? After the first successful reminder? On second app launch? Recommendation: show on second app launch (first launch is setup-heavy; user hasn't received value yet).

---

### Agent 2: iOS Lead

**Architecture Assessment:** MVVM with service layer is appropriate. SwiftUI + iOS 17+ is a reasonable floor. Adhan-Swift is a solid dependency.

**Findings:**

- **iOS-01 (P1): TDD inconsistency between CoreData and SwiftData.** TDD Section 2.2 references `AthanModel.xcdatamodeld` (CoreData file format) and the local storage table says "CoreData" for PrayerRecord. ADR-004 says SwiftData. These must be reconciled. If SwiftData is the choice (correct per ADR-004), remove all CoreData references from the TDD. SwiftData uses `@Model` macros, not `.xcdatamodeld` files.
  - **Fix location:** `docs/TECHNICAL_DESIGN.md` lines 108, 121.

- **iOS-02 (P1): No handling for Keychain item persistence after app reinstall.** Keychain items survive app deletion on iOS. If a user reinstalls the app, the old device token is still in Keychain, but the backend config may have expired (90-day TTL). The app needs to handle this: on launch, check if the device token exists in Keychain, and if so, validate it against the backend. If the backend returns 404, generate a new token and re-run setup.
  - **Fix location:** `ios-app/Services/PersistenceService.swift`, `ios-app/ViewModels/DeviceSetupViewModel.swift`.

- **iOS-03 (P1): UserDefaults data is not encrypted and survives iTunes/iCloud backup.** UserDefaults data (city, method, devices) is included in iCloud and iTunes backups. This is a minor privacy concern. More importantly, if a user restores a backup to a new phone, the device token in UserDefaults won't match the one in Keychain (which might not have been backed up, or might differ). Recommendation: store the device token ONLY in Keychain and derive/validate all other state on launch.
  - **Fix location:** `ios-app/Services/PersistenceService.swift`.

- **iOS-04 (P2): No background app refresh or local notification scheduling.** The iOS app has no mechanism to notify the user of prayer times ON THE PHONE. This is out of scope for MVP (notifications are via Alexa only), but users will expect it. The PRD explicitly lists this as out of scope, which is fine, but onboarding should clarify: "Prayer time notifications come through your Alexa. To see times on your phone, open the app."

- **iOS-05 (P2): StoreKit 2 consumable IAP requires transaction finish handling.** StoreKit 2 consumable purchases must have `Transaction.finish()` called after granting the content. If the app crashes between purchase and finish, the purchase is "stuck." The DonationService must implement `Transaction.updates` listener on app launch to catch unfinished transactions.
  - **Fix location:** `ios-app/Services/DonationService.swift`.

- **iOS-06 (P2): RTL layout support for Arabic (V1).** Arabic is RTL. SwiftUI handles basic RTL flipping, but custom layouts, padding, and alignment may need explicit `layoutDirection` handling. This needs dedicated testing in V1.
  - **Fix location:** All Views in `ios-app/Views/`.

---

### Agent 3: Alexa/Voice Lead

**This is where the highest-risk findings are concentrated.**

**Findings:**

- **AX-01 (P0 — POTENTIAL SHOW-STOPPER): The cron-based Reminders API scheduling may not work as designed.** The architecture assumes the backend cron can call the Alexa Reminders API using stored LWA refresh tokens. However, the Reminders API (`/v1/alerts/reminders`) requires an `apiAccessToken` that is normally provided in-session by the Alexa request envelope (`handlerInput.requestEnvelope.context.System.apiAccessToken`). This token is short-lived and cannot be refreshed via LWA OAuth.

  **The critical question:** Can the Reminders API be called out-of-session using LWA user tokens with the `alexa::alerts:reminders:skill:readwrite` permission scope? Amazon's documentation is ambiguous on this. Some developer forum posts suggest it IS possible using the Alexa REST API with a properly scoped LWA access token. Others indicate reminders can only be managed from within a skill handler.

  **This MUST be validated before any release.** The entire architecture depends on this capability.

  **Validation steps:**
  1. Create a test skill with `alexa::alerts:reminders:skill:readwrite` permission.
  2. Complete LWA OAuth with reminder scope.
  3. Use the LWA access token to call `POST https://api.amazonalexa.com/v1/alerts/reminders` from a Lambda (outside the skill handler context).
  4. Confirm the reminder is created and fires on the device.

  **Fallback if it does NOT work:** The Skill Messaging API may provide a path. The cron would send a message to the skill endpoint via `POST /v2/skills/{skillId}/messages`, the skill handler would receive a `Messaging.MessageReceived` request with a valid `apiAccessToken`, and then create reminders in-session. This fallback adds complexity but preserves the architecture.

  **Fallback if Skill Messaging also fails:** Require the user to say "Alexa, update my athan" once daily (or the app prompts them). The skill handler schedules the next day's reminders during this interaction. This is a severely degraded UX and should be treated as a last resort.
  - **Fix location:** `backend/lib/alexaReminders.ts`, `backend/functions/scheduler/dailyCron.ts`, potentially `alexa-skill/lambda/handlers/` if fallback needed.

- **AX-02 (P0): PRD Open Question #3 is unresolved — Amazon religious content policy.** Alexa skill certification could be rejected for religious content. Amazon's content policy does not explicitly prohibit religious skills (prayer apps exist in the store), but the app name "Athan" and descriptions referencing Islamic prayer need careful framing. The skill description should focus on function ("schedule timed audio reminders") rather than religion. Check existing approved skills for precedent.

  **Validation steps:**
  1. Search the Alexa Skills Store for existing Islamic prayer/athan skills.
  2. Review Amazon's Alexa Skills Kit certification requirements for content policies.
  3. If no clear precedent: contact Amazon developer support for pre-certification guidance.

- **AX-03 (P1): Reminder rate limits are unvalidated (PRD Open Question #2).** A user with 3 Alexa devices and 5 prayers enabled has 15 reminders created daily (plus 15 deleted). The cron processes all users serially. At scale, rate limiting could cause partial failures.

  **Validation steps:**
  1. Create 50 reminders in rapid succession via the API. Record rate limit behavior.
  2. Document the limit and implement throttling/batching in the cron accordingly.
  - **Fix location:** `backend/functions/scheduler/dailyCron.ts`.

- **AX-04 (P1): Reminders API does not support custom audio (PRD Open Question #1).** Alexa Reminders speak text (with limited SSML support) and play a built-in chime. They do NOT play custom audio files. The reminder will sound like "ding... It is time for Fajr prayer" — a generic Alexa chime, not the Athan. This is architecturally sound (it's the design per ADR-003) but users expecting the actual Athan sound to play automatically will be disappointed.

  **Mitigation:** Test whether SSML `<audio>` tags work in reminder text. If yes, a short Athan clip (5-10 seconds) could play as part of the reminder. If no, the two-tier experience is the only option.

  **Validation step:** Create a reminder with SSML `<audio src="...">` tag. Confirm whether it renders or is rejected.

- **AX-05 (P1): Device discovery via LWA may not return individual Echo devices (PRD Open Question #5).** The Smart Home API and Alexa API expose device endpoints, but the available data and required scopes vary. The `alexa::devices:all:address` scope might not be what we need. We need the `alexa::devices:all:name:read` scope or similar to discover device names and IDs.

  **Validation step:** Complete LWA flow with device-related scopes. Call the Alexa API device endpoint. Confirm individual Echo devices appear with names and IDs.

- **AX-06 (P2): SetCityIntent city resolution is underspecified.** How does "Set my city to Springfield" resolve? There are many Springfields. The Alexa skill needs either: (a) a slot type with city disambiguation (ask "Did you mean Springfield, IL or Springfield, MO?"), or (b) acceptance that Alexa-side city setting is a convenience feature and the iOS app is the authoritative configuration source.

  Recommendation: For MVP, treat Alexa-side city setting as best-effort. Use Amazon's built-in `AMAZON.City` slot type and resolve to the first match. Document that the iOS app is the canonical configuration method.

---

### Agent 4: Security & Privacy Lead

**Overall Assessment:** Privacy posture is strong for this category of app. Data minimization is well-executed. Key concerns are around token handling and the device-token-as-identifier model.

**Findings:**

- **SP-01 (P1): Device token is an unauthenticated bearer credential.** The `X-Device-Token` UUID is the ONLY thing protecting a user's configuration. Anyone who obtains or guesses a device token can: overwrite the user's city/method, change Alexa device targets, and cause the user's reminders to stop or play at wrong times. UUIDs are 128-bit and collision-resistant, but they're not secret — they could be intercepted on a compromised network (TLS mitigates this) or leaked via client-side logs.

  **Minimal fix:** Add HMAC-based request signing. The iOS app generates a secret key stored in Keychain alongside the device token. Each request includes `X-Device-Token` + `X-Signature` (HMAC-SHA256 of the request body using the secret key). The backend stores the hash of the secret and validates signatures. This prevents token-only impersonation.

  **Pragmatic alternative (acceptable for MVP):** Document the risk, ensure TLS is enforced, ensure device tokens are never logged server-side. Add a `lastKnownIP` hash (not the IP itself) to detect token migration between very different network ranges, as an anomaly signal only.
  - **Fix location:** `backend/functions/api/syncConfig.ts`, `ios-app/Services/AlexaSyncService.swift`.

- **SP-02 (P1): AES-256 encryption key management for LWA tokens is unspecified.** The TDD says LWA tokens are "AES-256 encrypted" but does not specify: where is the encryption key stored? If it's a Lambda environment variable, it's recoverable by anyone with Lambda console access. If it's in AWS Secrets Manager or KMS, that's better but adds cost and complexity.

  **Recommendation:** Use AWS KMS for envelope encryption. The Lambda calls KMS to decrypt a data key, uses that data key for AES-256 encryption/decryption. KMS key access is controlled by IAM policy. Cost is negligible (<$1/mo).

  **Validation step:** Confirm `serverless.yml` provisions a KMS key and the Lambda IAM role has `kms:Decrypt` permission for only that key.
  - **Fix location:** `backend/serverless.yml`, `backend/lib/deviceStore.ts`.

- **SP-03 (P2): PRIVACY.md says "city names are not PII under GDPR."** This is an oversimplification. A city name combined with a device token (even anonymous) and prayer calculation method COULD theoretically narrow down identity in small communities. The statement should be softened: "We believe city-level location data, combined with the other anonymous data we store, does not constitute personal data under GDPR. We have minimized data collection to reduce this risk."
  - **Fix location:** `PRIVACY.md`. (Note: the statement is actually in `docs/TECHNICAL_DESIGN.md` Section 4.2, not in PRIVACY.md directly. Both should be updated.)

- **SP-04 (P2): SECURITY.md mentions "CORS restricted to iOS app origin" — this is nonsensical.** CORS (Cross-Origin Resource Sharing) is a browser security mechanism. Native iOS apps do not send Origin headers and are not subject to CORS restrictions. This line should be removed or replaced with: "API Gateway is configured to reject requests without the required `X-Device-Token` header."
  - **Fix location:** `SECURITY.md` API Security table, `docs/TECHNICAL_DESIGN.md` if mentioned there.

- **SP-05 (P2): PRIVACY.md and SECURITY.md both have placeholder contact emails.** "[privacy contact to be added before release]" and "[security contact to be added before release]" — these are release blockers. Even a GitHub issue template is better than a placeholder.
  - **Fix location:** `PRIVACY.md` line 118, `SECURITY.md` line 13.

- **SP-06 (P3): DynamoDB TTL is 90 days, but there's no user-facing communication of this.** If a user stops using the app for 90 days (e.g., Ramadan break, travel), their Alexa reminders silently stop. The app should detect this on next launch and show a "Your Alexa schedule expired. Tap to re-sync" prompt.
  - **Fix location:** `ios-app/Services/AlexaSyncService.swift`.

---

### Agent 5: QA Lead

**Assessment:** Test plan is solid for unit and handler tests. Significant gaps exist in integration, end-to-end, and edge case coverage.

**Findings:**

- **QA-01 (P0): No end-to-end test on real Alexa hardware.** The test plan's integration tests (IT-01 through IT-04) all use mocked Alexa APIs. The manual test checklist (Section 4) mentions real devices, but there's no structured protocol for the 7-day reliability test required by the DoD. Define:
  - How many devices? (Minimum 2 — different Echo models.)
  - How many cities/methods? (Minimum 3.)
  - What constitutes a pass? (All 5 reminders fire within 2 minutes of expected time for 7 consecutive days.)
  - Who runs it? (Solo maintainer — block calendar time.)
  - How to record results? (Spreadsheet with timestamps.)

- **QA-02 (P1): Missing test case — timezone-different user and server.** The cron runs at 02:00 UTC. A user in UTC+12 (New Zealand) has their "today" start 12 hours ahead of UTC. If the cron computes prayer times for "today" using UTC date, it will produce WRONG times for this user. The cron must compute prayer times using the user's local date, derived from their timezone (which must be inferred from longitude or stored in config).

  **Missing test case:**
  | ID | Test Case | Input | Expected |
  |---|---|---|---|
  | BE-11 | Cron handles UTC+12 timezone | Config: Auckland (lat=-36.85, lon=174.76), cron runs at 02:00 UTC (14:00 NZST) | Prayer times for the correct local date in Auckland |
  | BE-12 | Cron handles UTC-10 timezone | Config: Honolulu (lat=21.31, lon=-157.86), cron runs at 02:00 UTC (16:00 previous day HST) | Prayer times for the correct local date in Honolulu |
  - **Fix location:** `backend/functions/scheduler/dailyCron.ts` (add timezone derivation), test plan.

- **QA-03 (P1): Missing test case — Ramadan edge accuracy.** Fajr and Maghrib times are critical during Ramadan (they define fasting start/end). The 2-minute accuracy tolerance may not be acceptable. Users following strict interpretations need 1-minute accuracy.

  **Missing test case:**
  | ID | Test Case | Input | Expected |
  |---|---|---|---|
  | PE-15 | Ramadan Fajr accuracy (Mecca) | lat=21.42, lon=39.83, 2027-03-01, Umm al-Qura | Fajr within 1 min of Umm al-Qura authority published time |
  | PE-16 | Ramadan Maghrib accuracy (NYC) | lat=40.71, lon=-74.01, 2027-03-15, ISNA | Maghrib within 1 min of IslamicFinder.org |

- **QA-04 (P1): Missing test case — config sync race condition.** The test plan mentions "Concurrent config updates" (Section 3, edge cases) but there's no actual test case. What happens when: (a) iOS sends POST /api/config, (b) cron reads the config simultaneously, (c) cron schedules reminders based on old config? DynamoDB's eventual consistency or the timing could cause stale reminders for one day.

  **Missing test case:**
  | ID | Test Case | Input | Expected |
  |---|---|---|---|
  | IT-05 | Config update during cron execution | iOS updates city from NYC to London while cron is processing | Reminders use either the old or new city consistently (not mixed) |

- **QA-05 (P1): No test for LWA OAuth token revocation by user.** If a user revokes Amazon account access via Amazon's security settings (not via the app), the backend's stored refresh token becomes invalid. Next cron run should detect this, mark config inactive, and the iOS app should prompt re-authentication on next launch.

  **Missing test case:**
  | ID | Test Case | Input | Expected |
  |---|---|---|---|
  | IT-06 | LWA token revoked externally | Revoke access via Amazon account settings | Cron marks config inactive, iOS shows re-auth prompt |

- **QA-06 (P2): Missing test case — iOS app upgrade from MVP to V1.** The DoD requires "Migration tested: Upgrade from MVP data schema to V1 schema works without data loss." But there's no test case that simulates: install MVP, add preferences + device config, upgrade to V1, verify all MVP data intact AND prayer tracking schema available.

  **Missing test case:**
  | ID | Test Case | Steps | Expected |
  |---|---|---|---|
  | UI-05 | MVP → V1 upgrade path | Install MVP, configure fully, overlay V1 build | All settings preserved, tracking view available, no crash |

- **QA-07 (P2): Cross-platform test (XP-01 through XP-03) has no CI implementation described.** The plan says "A CI script runs both engines against a shared JSON test vector file." But there's no specification of: how the Swift tests produce JSON output, how the CI orchestrates running Swift tests (requires macOS runner), or where the test vector file lives.
  - **Fix location:** `scripts/cross-platform-check.sh`, CI workflow file.

---

### Agent 6: Devil's Advocate

**My job is to assume this project is NOT ready and find show-stoppers.**

**Findings:**

- **DA-01 (SHOW-STOPPER): The five PRD Open Questions are unanswered.** Three of them (Q1: SSML in reminders, Q2: rate limits, Q5: device discovery) directly affect whether core features WORK AT ALL. Q3 (religious content policy) affects whether the skill can ship. These are not "nice to know" — they are architectural assumptions that could invalidate the entire design. No code should ship until every one is resolved.

  **Verdict:** These are validation debts, not code debts. They can be resolved in days with focused API testing and a support ticket, but they MUST be resolved before release.

- **DA-02 (SHOW-STOPPER): No Athan audio with verified provenance exists in the repository.** `audio/athan/default.mp3` is listed in the repo structure doc but doesn't exist yet. The audio asset is the literal product. Without it, there's nothing to play. And "public domain" Athan recordings are extremely rare — most well-known Athan recordings are copyrighted. The project needs EITHER:
  (a) A recording commissioned explicitly as CC0 by a muezzin who agrees in writing, OR
  (b) A recording old enough to be in the public domain (varies by jurisdiction — 70+ years in most of the world).

  A verbal agreement is not sufficient. A signed release document or CC0 dedication statement must exist.

- **DA-03 (HIGH RISK): "Works on my machine" trap — DynamoDB Scan at scale.** The daily cron does a full DynamoDB Scan of all device configs. A Scan reads every item in the table, limited to 1MB per page. At 1,000 users (~1KB per config), that's 1 page and works fine. At 100,000 users, it's ~100 pages and the Lambda may timeout (default 15 minutes). More importantly, it consumes significant read capacity.

  **Fix:** Add a Global Secondary Index (GSI) on a `status` attribute to query only `active` configs, or switch to a DynamoDB Stream + SQS architecture where each config update triggers its own reminder scheduling (event-driven instead of batch).

  For MVP with expected low user count: this is acceptable. But add a monitoring alarm for cron execution time and a TODO for the event-driven approach.

- **DA-04 (HIGH RISK): No LICENSE file in the repo.** The DoD says "LICENSE file present in repository root" but it doesn't exist yet. No open-source project is shippable without this. Additionally, Adhan-Swift (MIT) and Adhan-JS (MIT) require attribution. A `NOTICE` file should accompany the LICENSE listing all third-party dependencies and their licenses.

- **DA-05 (MEDIUM RISK): Apple App Store review risk.** Apple may push back on:
  (a) Requiring Amazon login — make it optional (prayer times work without it).
  (b) Consumable IAP for "donation" — Apple's guidelines (3.2.1) require IAPs to unlock digital content. A "tip jar" is acceptable under Rule 3.2.1(vii) for free apps. Ensure the IAP is categorized correctly in App Store Connect.
  (c) Privacy nutrition labels — Apple requires privacy declarations. Our minimal data collection works in our favor, but the declarations must be accurate (especially regarding "Data Linked to You" vs "Data Not Linked to You"). Since we store no PII, all data should be declared as "Data Not Linked to You."

- **DA-06 (MEDIUM RISK): The project has no CI/CD pipeline defined.** CONTRIBUTING.md references "CI pipeline passes" as a merge criterion, and the repo structure shows `.github/workflows/` with CI files, but no actual pipeline configuration exists. Until CI is running, the DoD is unenforceable.

---

## Deliverable A: Readiness Verdict

### MVP Verdict: NOT READY

**Rationale:** Three unresolved blockers prevent release:
1. The Reminders API out-of-session capability is UNVALIDATED (AX-01). The entire scheduling architecture depends on this.
2. Five PRD Open Questions remain unanswered (DA-01), three of which could invalidate core features.
3. No Athan audio with verified legal provenance exists (DA-02).

**Path to READY:** Resolve AX-01 (1-3 days of API testing), answer all Open Questions (1 week), source and legally verify Athan audio (1-2 weeks), fix P1 items below (1 week). Estimated: **3-4 weeks of focused work.**

### V1 Verdict: NOT READY

**Rationale:** V1 inherits all MVP blockers, plus:
1. SwiftData/CoreData inconsistency in docs (iOS-01) creates ambiguity for implementation.
2. No upgrade migration test exists (QA-06).
3. RTL layout for Arabic localization untested (iOS-06).
4. Multiple Athan audio requires at least 2 more licensed recordings.

**Path to READY:** Resolve all MVP blockers first, then 2-3 additional weeks for V1-specific items.

---

## Deliverable B: Must-Fix List (Release Blockers)

Prioritized by impact. All must be resolved before MVP ships.

| # | Issue | Why It's a Blocker | Location | Minimal Fix |
|---|---|---|---|---|
| B-1 | AX-01: Validate Reminders API works out-of-session | Entire scheduling architecture depends on this | `backend/lib/alexaReminders.ts` | Build a proof-of-concept: LWA OAuth → store token → call Reminders API from Lambda. If fails, implement Skill Messaging fallback. |
| B-2 | DA-01: Resolve all 5 PRD Open Questions | Core features may not work as designed | `docs/PRD.md` | Spend 1-2 days on each: (Q1) test SSML audio in reminders, (Q2) load-test reminder creation rate, (Q3) search Alexa store for precedent + contact Amazon support, (Q4) source audio, (Q5) test LWA device discovery scopes. |
| B-3 | DA-02: Source and verify Athan audio | No product without audio | `audio/athan/` | Commission a recording under CC0 with a written dedication. Store the signed document in `audio/LICENSES.md`. |
| B-4 | AX-02: Validate Alexa skill certification for religious content | Skill may be rejected | `alexa-skill/skill-package/skill.json` | Search store for existing Islamic skills. Frame skill description functionally. Contact Amazon developer support if unclear. |
| B-5 | SP-05: Fill in security and privacy contact emails | Placeholder contacts in released docs | `PRIVACY.md`, `SECURITY.md` | Add actual email address or "open a GitHub issue with label `security`" |
| B-6 | DA-04: Add LICENSE and NOTICE files | Open-source project requires license | repo root | Create `LICENSE` (MIT or Apache 2.0) + `NOTICE` with Adhan-Swift/JS attribution. |
| B-7 | QA-01: Complete 7-day end-to-end Alexa test | DoD requires it, never been done | Manual test | Block 1 week of calendar. 2+ Echo devices, 3+ cities, log every reminder. |
| B-8 | QA-02: Fix timezone handling in daily cron | Wrong prayer times for non-UTC timezones | `backend/functions/scheduler/dailyCron.ts` | Derive user's timezone from stored longitude (or add timezone to config). Compute prayer times for the user's local date. |

---

## Deliverable C: Should-Fix List (Non-Blocking Improvements)

Prioritized by impact.

| # | Issue | Impact | Location | Fix |
|---|---|---|---|---|
| C-1 | SP-01: Harden device token auth | Prevent config impersonation | Backend + iOS | Add HMAC request signing (or accept risk for MVP, document it) |
| C-2 | SP-02: Specify KMS key management for LWA token encryption | Encryption key currently unspecified | `backend/serverless.yml` | Provision KMS key, use envelope encryption |
| C-3 | iOS-01: Reconcile CoreData/SwiftData references in TDD | Doc inconsistency causes confusion | `docs/TECHNICAL_DESIGN.md` | Update TDD to reference SwiftData and `@Model` macros, remove `.xcdatamodeld` |
| C-4 | iOS-02: Handle stale Keychain token after reinstall | Edge case causes silent failure | `ios-app/Services/PersistenceService.swift` | Validate token on launch, regenerate if backend returns 404 |
| C-5 | iOS-05: StoreKit 2 unfinished transaction handling | Stuck purchases on crash | `ios-app/Services/DonationService.swift` | Add `Transaction.updates` listener on app launch |
| C-6 | SP-04: Remove CORS reference from security doc | Incorrect technical claim | `SECURITY.md` | Replace with API key header requirement |
| C-7 | SP-03: Soften GDPR PII claim | Legal overstatement | `docs/TECHNICAL_DESIGN.md` | Reword to acknowledge nuance |
| C-8 | PL-04: Specify donation prompt timing | UX ambiguity | `docs/PRD.md` | Define: second app launch, after first successful sync |
| C-9 | DA-03: Add cron execution time monitoring | Scale risk | `backend/serverless.yml` | Add CloudWatch alarm if cron exceeds 5 minutes |
| C-10 | SP-06: Detect expired backend config on app launch | Silent failure after 90 days | `ios-app/Services/AlexaSyncService.swift` | Sync status check, prompt re-sync if stale |
| C-11 | DA-06: Create CI/CD pipeline | No automated quality gates | `.github/workflows/` | GitHub Actions for lint, test, build on each platform |
| C-12 | PL-03: Document Alexa-free user flow | Valid use case undocumented | `docs/PRD.md`, onboarding | Add "Skip Alexa" path in onboarding |

---

## Deliverable D: Risk Register

| # | Risk | Category | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| R-1 | Reminders API cannot be called out-of-session | Technical | Medium | Critical — architecture invalid | Validate immediately (B-1). Fallback: Skill Messaging API. Last resort: daily user voice command. |
| R-2 | Alexa skill certification rejected | Policy | Low-Medium | High — no Alexa distribution | Pre-check with Amazon support (B-4). Precedent: existing Islamic prayer skills suggest low risk. |
| R-3 | No high-quality public domain Athan audio available | Legal | Medium | High — no product | Commission original recording (B-3). Budget $200-500 for a professional muezzin. |
| R-4 | Amazon deprecates or changes Reminders API | Technical | Low | Critical | Monitor Amazon developer blog. Implement abstraction layer so playback strategy can be swapped. |
| R-5 | Apple rejects app (IAP classification or third-party login) | Policy | Medium | Medium | Make Alexa linking optional. Categorize IAP as "tip" under Rule 3.2.1(vii). |
| R-6 | Prayer time accuracy disputed by users (community expectations vary) | Community | High | Medium — negative reviews | Document calculation method used. Allow manual offsets. Link to authoritative sources. |
| R-7 | Solo maintainer burnout or unavailability | Maintenance | Medium | High — project stalls | Automate everything possible (CI/CD, cron monitoring). Write comprehensive docs. Design for zero-touch operation. |
| R-8 | DynamoDB scan times out at scale | Technical | Low (short-term) | Medium | Add monitoring alarm (C-9). Plan event-driven architecture for V2+. |
| R-9 | LWA refresh token revoked silently by Amazon | Technical | Low-Medium | Medium — reminders stop silently | Cron detects refresh failure, marks config inactive, iOS prompts re-auth (already designed in TDD 6.2). Verify this works. |
| R-10 | Open-source trolling or malicious PRs | Community | Medium | Low | Require signed commits for releases. Maintainer-only merge to `main`. GitHub branch protection. |

---

## Deliverable E: Policy & Legal Safety Checks

### Alexa Policy Compliance

| Check | Status | Verification Step |
|---|---|---|
| Skill invocation name "Athan" is allowed | UNVERIFIED | Check Alexa invocation name requirements. "Athan" must not conflict with existing skills or reserved words. Test via ASK CLI `ask validate`. |
| Religious content is permitted | UNVERIFIED | Search Alexa Skills Store for "athan", "prayer", "adhan", "islamic". Document at least 3 existing approved skills as precedent. If <3 exist, contact Amazon developer support. |
| Reminders permission request is compliant | UNVERIFIED | Skill must declare `alexa::alerts:reminders:skill:readwrite` in skill manifest. User must grant permission explicitly. Verify permission card is shown during skill enablement. |
| AudioPlayer usage is compliant | UNVERIFIED | Audio must be HTTPS, valid MP3/AAC format, hosted on a reachable URL. Verify CloudFront-signed URLs work with Alexa's AudioPlayer. |
| Privacy policy URL is provided | NOT DONE | Skill manifest requires a `privacyAndCompliance.locales.en-US.privacyPolicyUrl`. Must link to a hosted version of PRIVACY.md. |
| Terms of use URL (if required) | NOT DONE | Check if Amazon requires ToU for skills with account linking. |

### Audio Licensing Verification

**For EACH audio file in the repository, the following must be documented in `audio/LICENSES.md`:**

| Field | Requirement | How to Verify |
|---|---|---|
| Filename | Exact filename | File exists in `audio/athan/` |
| Title / Description | Human-readable name | Present |
| Source | Where the recording came from | URL or physical description |
| Reciter (if applicable) | Name of the muezzin | Present or "Unknown (historical)" |
| Date of recording | Approximate date | Present |
| License | "Public Domain" or "CC0 1.0 Universal" | One of two acceptable values |
| License evidence | PROOF of licensing status | One of: (a) CC0 dedication document signed by the rights holder, (b) court document/legal analysis showing public domain status, (c) written assignment from the copyright holder, (d) if commissioned: signed contract specifying CC0 |
| Jurisdiction considerations | Which jurisdictions' public domain status was verified | At minimum: US, EU. Ideally also: Saudi Arabia (for cultural relevance). |

**"Probably public domain" is NOT acceptable.** If evidence cannot be obtained, do not ship the file.

---

## Deliverable F: Test Coverage Gaps

### Missing Test Cases (add to TEST_PLAN.md)

| ID | Category | Test Case | Input | Expected Outcome |
|---|---|---|---|---|
| BE-11 | Backend | Cron: UTC+12 timezone | Auckland config, cron at 02:00 UTC | Correct local date used for prayer calculation |
| BE-12 | Backend | Cron: UTC-10 timezone | Honolulu config, cron at 02:00 UTC | Correct local date used |
| BE-13 | Backend | Cron: Lambda timeout with 10,000 configs | 10K items in DynamoDB | Completes or fails gracefully within 15 min |
| PE-15 | Prayer Engine | Ramadan Fajr accuracy | Mecca, 2027-03-01, Umm al-Qura | Within 1 min of authority published time |
| PE-16 | Prayer Engine | Ramadan Maghrib accuracy | NYC, 2027-03-15, ISNA | Within 1 min of IslamicFinder.org |
| PE-17 | Prayer Engine | Invalid coordinates | lat=999, lon=-999 | Graceful error, not NaN/crash |
| PE-18 | Prayer Engine | Null island | lat=0, lon=0 | Valid prayer times (equator/prime meridian) |
| IT-05 | Integration | Config update during cron | Concurrent write + read | Reminders are consistent (not mixed old/new) |
| IT-06 | Integration | LWA token revoked externally | Token revoked via Amazon settings | Cron detects failure, marks inactive |
| IT-07 | Integration | Backend unreachable from iOS | Network error during sync | iOS queues config, retries on next launch |
| UI-05 | iOS UI | MVP → V1 upgrade | Install MVP, overlay V1 | Settings preserved, no crash, tracking available |
| UI-06 | iOS UI | No Alexa configured | Skip Alexa in onboarding | Prayer times display correctly, no errors |
| UI-07 | iOS UI | VoiceOver navigation | Full onboarding with VoiceOver | Every element has accessibility label, flow is completable |
| AX-11 | Alexa | Skill invoked with no city configured | First invocation, no config | Prompts user to set city or use iOS app |
| AX-12 | Alexa | PlayAthanIntent when audio URL expired | Signed URL past 1hr | Graceful error, suggests retry |
| AX-13 | Alexa | Concurrent skill invocations | Two devices invoke simultaneously | Both respond correctly, no race condition |

### Missing Test Infrastructure

| Gap | Fix |
|---|---|
| No CI pipeline runs tests automatically | Create GitHub Actions workflows per the repo structure spec |
| Cross-platform JSON test vectors don't exist | Create `core-prayer-engine/test-vectors.json` with PE-01 through PE-18 inputs and expected outputs |
| No way to run Swift tests in CI | Use macOS GitHub Actions runner, or maintain Swift test vectors manually |

---

## Deliverable G: Release Checklist

### MVP Release Checklist

**Documentation:**
- [ ] LICENSE file in repo root (MIT or Apache 2.0)
- [ ] NOTICE file with third-party attributions (Adhan-Swift MIT, Adhan-JS MIT)
- [ ] PRIVACY.md: real contact email, no placeholders
- [ ] SECURITY.md: real contact email, no placeholders
- [ ] PRIVACY.md content hosted at a public URL (for Alexa skill manifest and App Store)
- [ ] README.md in repo root with project overview, setup, and link to docs
- [ ] All PRD Open Questions resolved and documented

**Versioning:**
- [ ] Semantic version set: `1.0.0` for MVP
- [ ] Git tag: `v1.0.0`
- [ ] iOS app version matches (CFBundleShortVersionString = "1.0.0")
- [ ] Alexa skill version in skill manifest matches

**Audio:**
- [ ] At least 1 Athan recording present in `audio/athan/`
- [ ] `audio/LICENSES.md` completed with full provenance per Deliverable E
- [ ] Audio file uploaded to S3 and accessible via CloudFront signed URL
- [ ] Audio tested on at least 2 different Echo device models

**Backend:**
- [ ] `serverless.yml` deploys successfully to prod stage
- [ ] DynamoDB table created with TTL enabled
- [ ] CloudWatch cron schedule confirmed (02:00 UTC or adjusted per QA-02 timezone fix)
- [ ] CloudWatch alarms configured: cron error rate, Lambda errors, API latency
- [ ] KMS key provisioned for LWA token encryption
- [ ] API Gateway rate limiting configured

**Alexa Skill:**
- [ ] Skill manifest includes privacy policy URL
- [ ] Skill manifest declares `alexa::alerts:reminders:skill:readwrite` permission
- [ ] Skill submitted to Amazon for certification
- [ ] Skill APPROVED by Amazon
- [ ] AudioPlayer tested with CloudFront signed URLs on physical device

**iOS App:**
- [ ] Tested on physical iPhone (not just simulator)
- [ ] App Store screenshots captured
- [ ] App Store description written (clear about two-tier Alexa experience)
- [ ] Privacy nutrition labels configured in App Store Connect
- [ ] IAP configured as "tip" consumable in App Store Connect
- [ ] Submitted to Apple review
- [ ] APPROVED by Apple

**Testing:**
- [ ] All automated tests pass (100%)
- [ ] Cross-platform consistency tests pass (max 1-second delta)
- [ ] Full manual test checklist completed (TEST_PLAN.md Section 4)
- [ ] 7-day Alexa reliability test completed and passed
- [ ] Prayer time accuracy verified against reference for 5+ cities

**Security:**
- [ ] All items in SECURITY.md pre-release checklist pass
- [ ] No secrets in source code (run `trufflehog` or similar)
- [ ] Dependabot enabled

### V1 Release Checklist

All MVP items remain checked, plus:

- [ ] SwiftData migration from MVP schema tested (install MVP → upgrade to V1)
- [ ] Prayer tracking: mark/view/persist across restarts tested
- [ ] Weekly view displays 7 correct days
- [ ] At least 2 Athan audio recordings with full licensing provenance
- [ ] Arabic translation reviewed by native speaker
- [ ] French translation reviewed by native speaker
- [ ] RTL layout tested on Arabic locale
- [ ] VoiceOver accessibility tested on physical device
- [ ] Onboarding flow tested: new user + existing user upgrade paths
- [ ] Version: `1.1.0`, tag: `v1.1.0`

---

## Deliverable H: Post-Release Plan

### Monitoring (Privacy-Preserving)

| What to Monitor | How | Alert Threshold |
|---|---|---|
| Cron execution success rate | CloudWatch Logs metric filter | < 95% success triggers alarm |
| Cron execution duration | CloudWatch Lambda Duration metric | > 5 minutes triggers alarm |
| Reminder API error rate | CloudWatch Logs metric filter on `ReminderError` | > 10% error rate |
| Lambda error rate (all functions) | CloudWatch Errors metric | Any non-zero sustained errors |
| API Gateway 4xx/5xx rates | API Gateway metrics | 5xx > 1% triggers alarm |
| DynamoDB throttling | DynamoDB ThrottledRequests metric | Any throttling events |
| Skill invocation errors | Alexa Developer Console | Check weekly |
| App Store crash reports | Xcode Organizer / App Store Connect | Any crash cluster > 5 reports |

**No user-level monitoring.** All metrics are aggregate. No individual user's behavior is tracked.

### Bug Report Handling

**For GitHub Issues:**

1. User opens an issue using the bug report template.
2. Maintainer triages within 48 hours (weekdays).
3. Assign severity label (P0/P1/P2/P3 per DoD definitions).
4. Assign component label.
5. P0: Drop everything, fix and release within 24 hours.
6. P1: Fix within 1 week.
7. P2: Fix in next planned release.
8. P3: Fix when convenient.

**For Alexa Skill Reviews:**

- Monitor skill reviews in the Alexa Developer Console weekly.
- Respond to negative reviews with actionable information (if Amazon allows).
- Track common complaints → create issues → prioritize.

**For App Store Reviews:**

- Monitor via App Store Connect.
- Respond to reviews (Apple allows developer responses).
- Track feature requests and bugs from reviews.

### Triage Labels

| Label | Meaning |
|---|---|
| `P0-critical` | Release blocker, core feature broken |
| `P1-major` | Feature impaired, workaround exists |
| `P2-minor` | Cosmetic or minor UX |
| `P3-trivial` | Negligible |
| `bug` | Defect report |
| `feature-request` | Enhancement request |
| `question` | Usage question |
| `security` | Security-related (may need private handling) |
| `ios` | iOS app component |
| `alexa` | Alexa skill component |
| `backend` | Backend Lambda/API component |
| `prayer-engine` | Core calculation engine |
| `docs` | Documentation |
| `good-first-issue` | Suitable for new contributors |
| `wont-fix` | Intentional behavior, not a bug |
| `duplicate` | Duplicate of existing issue |
| `needs-info` | Waiting for reporter to provide details |

### Issue Response SLA (Solo Maintainer)

| Severity | Acknowledgment | Resolution |
|---|---|---|
| P0 | Same day | 24 hours |
| P1 | 48 hours | 1 week |
| P2 | 1 week | Next release |
| P3 | 2 weeks | Best effort |
| Security | 48 hours | Depends on severity (see SECURITY.md) |
| Feature request | 1 week | Quarterly review |

### First-Week Post-Release Actions

1. **Day 1:** Monitor CloudWatch dashboards hourly. Check App Store Connect and Alexa Developer Console for review status.
2. **Day 2-3:** Check for early bug reports. Monitor cron success rate.
3. **Day 4-5:** Review any App Store or skill store reviews. Address P0/P1 issues.
4. **Day 7:** Write a brief "Week 1 Report" — aggregate stats (active configs count, cron success rate), notable bugs, user feedback themes. Post to GitHub Discussions.

---

## Unified Decision

**The project is NOT ready for either MVP or V1 release.**

The architecture is sound in design, the documentation is thorough, and the privacy posture is genuinely strong. However, the project has a critical **validation gap**: the core technical assumption (out-of-session Alexa Reminders API access) has never been proven. Combined with unresolved open questions, missing audio assets, and missing CI/CD, the project needs **3-4 weeks of focused validation and fix work** before MVP can ship.

### Recommended Next Steps (in order)

| Week | Action |
|---|---|
| **Week 1** | Validate AX-01 (Reminders API out-of-session). Resolve all 5 PRD Open Questions. This is pure research — no code changes yet. Results determine if architecture needs revision. |
| **Week 2** | Source Athan audio (B-3). Add LICENSE + NOTICE (B-6). Fix timezone handling (B-8). Set up CI/CD (C-11). Fill in contact emails (B-5). |
| **Week 3** | Fix P1 code issues (SP-02, iOS-02, iOS-05). Add missing test cases (Deliverable F). Submit Alexa skill for certification (B-4). |
| **Week 4** | Run 7-day end-to-end Alexa test (B-7). Submit iOS app to Apple. Fix any issues found. |
| **Week 5** | (Buffer) Address Apple/Amazon review feedback. Prepare V1 work. |

If Week 1 reveals that the Reminders API does NOT work out-of-session and the Skill Messaging fallback also fails, the architecture requires revision. Reconvene and re-evaluate before continuing.
