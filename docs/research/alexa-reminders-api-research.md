# Alexa Reminders API — Out-of-Session Research Report

**Date:** 2026-02-25
**Author:** API Research (automated)
**Issue:** AX-01 (P0 SHOW-STOPPER) from Release Readiness Review
**Status:** RESOLVED — Architecture requires modification

---

## Executive Summary

**Can the Alexa Reminders API create reminders out-of-session?**

**NO — not directly.** Amazon explicitly prohibits creating or updating reminders with out-of-session (LWA) tokens. However, a supported workaround exists using the **Skill Messaging API**, which triggers the skill handler with a valid in-session `apiAccessToken`. This token CAN be used to create reminders. The architecture must be modified to use this two-hop pattern.

---

## 1. API Capabilities and Limitations

### 1.1 Reminders API Operations by Token Type

| Operation | In-Session `apiAccessToken` | Out-of-Session LWA Token |
|-----------|:---------------------------:|:------------------------:|
| **CREATE** (`POST /v1/alerts/reminders`) | YES | **NO** |
| **UPDATE** (`PUT /v1/alerts/reminders/{id}`) | YES | **NO** |
| **DELETE** (`DELETE /v1/alerts/reminders/{id}`) | YES | YES |
| **GET** (`GET /v1/alerts/reminders/{id}`) | YES | YES |
| **LIST** (`GET /v1/alerts/reminders`) | YES | YES |

**Source:** [Alexa Reminders API Reference](https://developer.amazon.com/en-US/docs/alexa/smapi/alexa-reminders-api-reference.html)

> Amazon's documentation states: "You can create reminders from your skill with the apiAccessToken. Don't use an out-of-session token."

### 1.2 What This Means for Our Architecture

The current `dailyCron.ts` Lambda calls `POST /v1/alerts/reminders` directly using an LWA access token obtained by refreshing the stored LWA refresh token. **This will fail with a 401 or 403 error.** The Reminders API explicitly rejects CREATE requests made with LWA tokens.

---

## 2. Out-of-Session Feasibility

### Verdict: YES — via Skill Messaging API (two-hop pattern)

Amazon provides an official workaround documented in their [Tutorial: Update a Reminder from Outside of an Alexa Skill Session](https://developer.amazon.com/en-US/docs/alexa/smapi/tutorial-update-reminder-from-outside-of-session.html). While the tutorial focuses on UPDATE operations, the underlying mechanism applies to CREATE as well.

### 2.1 How the Skill Messaging API Workaround Works

```
Backend Cron Lambda                    Amazon Alexa Service               Skill Lambda
       |                                        |                              |
       |-- 1. Get LWA token (skill creds) ----->|                              |
       |<-- access_token (skill_messaging) ------|                              |
       |                                        |                              |
       |-- 2. POST /v1/skillmessages/users/{userId} -->|                       |
       |   { data: { prayer times, timezone } }  |                              |
       |<-- 202 Accepted ------------------------|                              |
       |                                        |                              |
       |                                        |-- 3. Messaging.MessageReceived -->|
       |                                        |   (includes apiAccessToken)       |
       |                                        |                              |
       |                                        |<-- 4. POST /v1/alerts/reminders --|
       |                                        |   (using apiAccessToken)          |
       |                                        |-- 201 Created ----------------->|
```

**Step-by-step:**

1. **Cron Lambda** obtains an LWA access token using the skill's `clientId` and `clientSecret` with scope `alexa:skill_messaging`.
2. **Cron Lambda** calls the Skill Messaging API: `POST /v1/skillmessages/users/{userId}` with a payload containing prayer times and scheduling instructions.
3. **Amazon** delivers the message to the Skill Lambda as a `Messaging.MessageReceived` request. This request includes a valid `apiAccessToken` in `context.System.apiAccessToken`.
4. **Skill Lambda** handler for `Messaging.MessageReceived` uses that `apiAccessToken` to call the Reminders API and CREATE reminders.

**Key advantage:** The `Messaging.MessageReceived` request provides a fresh `apiAccessToken` valid for 60 minutes, which is treated as an in-session token for API calls.

### 2.2 Requirements for This Approach

| Requirement | Detail |
|-------------|--------|
| Skill manifest | Must declare `Messaging` interface support |
| Skill permissions | Must declare `alexa::alerts:reminders:skill:readwrite` |
| LWA credentials | Need skill `clientId` + `clientSecret` (NOT user LWA tokens) for Skill Messaging auth |
| User ID | Must capture and store `context.System.user.userId` from a prior in-session interaction |
| User consent | User must grant reminder permission during skill enablement |

### 2.3 Important Caveats

1. **No delivery guarantee:** Amazon states messages are queued and delivered with exponential back-off retry, but there is no guarantee of delivery time or order. Messages expire after `expiresAfterSeconds` (max 86400 = 24 hours).

2. **Duplicate handling:** The skill must handle duplicate `Messaging.MessageReceived` deliveries idempotently.

3. **No confirmation mechanism:** There is no built-in receipt/confirmation that the message was delivered to the skill. The cron Lambda will receive `202 Accepted` immediately, which only means Amazon accepted the message for delivery.

4. **User ID dependency:** The `userId` must be captured during an initial in-session interaction (e.g., first skill launch). This is a new data requirement not in the current architecture.

---

## 3. Required Permissions and Scopes

### 3.1 For the Skill

In `skill.json` manifest:

```json
{
  "manifest": {
    "permissions": [
      {
        "name": "alexa::alerts:reminders:skill:readwrite"
      }
    ],
    "apis": {
      "custom": {
        "interfaces": [
          {
            "type": "ALEXA_PRESENTATION_APL"
          }
        ]
      }
    },
    "events": {
      "subscriptions": [
        {
          "eventName": "SKILL_MESSAGING"
        }
      ]
    }
  }
}
```

### 3.2 For the Backend (Skill Messaging)

- **Scope:** `alexa:skill_messaging`
- **Credentials:** Skill-level `clientId` and `clientSecret` (from Developer Console > Build > Permissions)
- **These are NOT user LWA tokens** — they are skill-level credentials

### 3.3 For the User

- User must **enable** the skill
- User must **grant** reminder permission (shown as a permission card)
- User must **interact** with the skill at least once so we can capture `userId`

---

## 4. Alternative Approaches

### 4.1 Proactive Events API

**Verdict: NOT VIABLE for prayer time notifications.**

The Proactive Events API supports only 8 pre-defined event schemas:
1. AMAZON.WeatherAlert.Activated
2. AMAZON.SportsEvent.Updated
3. AMAZON.MessageAlert.Activated
4. AMAZON.OrderStatus.Updated
5. AMAZON.Occasion.Updated
6. AMAZON.TrashCollectionAlert.Activated
7. AMAZON.MediaContent.Available
8. AMAZON.SocialGameInvite.Available

None of these schemas are appropriate for prayer time notifications. Custom schemas are not supported. The closest match (`AMAZON.Occasion.Updated`) is designed for appointments/reservations and would produce awkward, misleading notification text.

**Source:** [Proactive Events Schemas](https://developer.amazon.com/en-US/docs/alexa/smapi/schemas-for-proactive-events.html)

### 4.2 Daily User Voice Command (Degraded UX)

The user says "Alexa, update my athan" once daily. The skill handler computes prayer times and creates reminders for the day using the in-session `apiAccessToken`.

- **Pro:** Simple, no Skill Messaging complexity
- **Con:** Requires daily user action, defeats the purpose of "automatic" reminders
- **Verdict:** Last resort only

### 4.3 Alexa Routines

Users manually create Alexa Routines to trigger at specific times.

- **Pro:** Works without any API
- **Con:** Prayer times change daily, user must reconfigure daily, impractical
- **Verdict:** Not viable

### 4.4 Direct LWA Token Reminder Creation (Current Architecture)

As proven above, this does NOT work. Amazon blocks CREATE operations with out-of-session tokens.

- **Verdict:** NOT VIABLE — the current `dailyCron.ts` implementation will fail

---

## 5. Recommended Approach

### Use the Skill Messaging API (Section 2.1 above)

This is the only viable approach that preserves the "automatic daily reminders" user experience.

### 5.1 Architecture Changes Required

| Component | Current Design | Required Change |
|-----------|---------------|-----------------|
| **Cron Lambda** | Calls Reminders API directly with LWA token | Calls Skill Messaging API with skill credentials; sends prayer data as message payload |
| **Skill Lambda** | Only handles voice interactions | Add `Messaging.MessageReceived` handler that creates reminders using `apiAccessToken` |
| **DynamoDB** | Stores user LWA refresh token | Also store `alexaUserId` (captured from first skill interaction) |
| **Skill Manifest** | Voice-only skill | Add `SKILL_MESSAGING` event subscription |
| **iOS Sync** | Sends LWA tokens to backend | Still needed for LWA tokens (for GET/DELETE operations), but also need `alexaUserId` |

### 5.2 New Data Flow

**Initial Setup (one-time, in-session):**
1. User enables skill and grants reminder permission
2. User launches skill: "Alexa, open Athan"
3. Skill captures `context.System.user.userId` and sends it to backend via a callback or DynamoDB write
4. iOS app syncs config to backend (city, method, devices, LWA tokens)

**Daily Reminder Cycle (automated, out-of-session):**
1. CloudWatch fires cron at 02:00 UTC
2. Cron Lambda scans DynamoDB for active configs
3. For each config:
   a. Compute today's prayer times using PrayerEngine
   b. Get Skill Messaging access token (skill credentials, scope `alexa:skill_messaging`)
   c. Call `POST /v1/skillmessages/users/{alexaUserId}` with prayer times payload
4. Skill Lambda receives `Messaging.MessageReceived`:
   a. Extract prayer times from `request.message`
   b. Delete existing reminders (can use `apiAccessToken`)
   c. Create new reminders for each prayer time (using `apiAccessToken`)
   d. Respond with acknowledgment

### 5.3 Storing User LWA Tokens Is Still Needed

Even though reminder creation moves to the Skill Messaging flow, the backend still needs LWA user tokens for:
- `GET /v1/alerts/reminders` — listing existing reminders (monitoring)
- `DELETE /v1/alerts/reminders/{id}` — cleanup outside of Messaging flow
- Device discovery via Alexa API

However, the **critical path** (creating reminders) no longer depends on user LWA tokens. It uses the Skill Messaging API with skill-level credentials.

---

## 6. Rate Limits

### Reminders API
- HTTP 429 returned when rate limit exceeded
- Amazon does not publicly disclose exact TPS limits
- For Alexa Smart Properties: max 250 reminders per endpoint
- Standard skills: limit is undocumented but believed to be lower
- **Recommendation:** Implement exponential backoff with max 3 retries; add 200ms delay between reminder creations

### Skill Messaging API
- `202 Accepted` response means message was queued, not delivered
- No publicly documented rate limit
- Messages expire after `expiresAfterSeconds` (configurable, max 86400s)
- **Recommendation:** Set `expiresAfterSeconds` to 3600 (1 hour) for daily cron; if not delivered within an hour, the prayer times for the day may be stale

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Skill Messaging delivery delay causes late reminders | Medium | High | Run cron well before first prayer time (02:00 UTC); monitor delivery latency |
| Duplicate Messaging.MessageReceived deliveries | Medium | Low | Implement idempotent reminder creation (check existing before creating) |
| User never opens skill (no userId captured) | High | Critical | iOS onboarding MUST prompt user to say "Alexa, open Athan" at least once; detect missing userId and prompt |
| Amazon changes Skill Messaging API | Low | Critical | Abstract messaging layer; monitor Amazon developer announcements |
| apiAccessToken in Messaging.MessageReceived doesn't support CREATE | Low | Critical | This is the key assumption to validate with a POC; fallback to daily voice command |

---

## 8. Validation Steps (POC)

The following must be validated with a working proof-of-concept before committing to this architecture:

1. **Create test skill** with `alexa::alerts:reminders:skill:readwrite` permission and `SKILL_MESSAGING` event subscription
2. **Enable skill** on a test Alexa account, grant reminder permission
3. **Launch skill once** to capture `userId`
4. **From a Lambda/local script:**
   a. Get skill messaging access token using skill `clientId`/`clientSecret`
   b. Call `POST /v1/skillmessages/users/{userId}` with test payload
5. **Verify skill receives** `Messaging.MessageReceived` with valid `apiAccessToken`
6. **Use `apiAccessToken` to call** `POST /v1/alerts/reminders`
7. **Confirm reminder fires** on the Alexa device at the scheduled time

**If step 6 fails:** The `apiAccessToken` from `Messaging.MessageReceived` may not have reminder-creation permission. In that case, the fallback is the daily voice command approach (Section 4.2).

---

## 9. Impact on Existing Code

### Files Requiring Modification

| File | Change |
|------|--------|
| `backend/functions/scheduler/dailyCron.ts` | Replace direct Reminders API calls with Skill Messaging API calls |
| `backend/lib/alexaReminders.ts` | Keep existing functions (they'll be used by the Skill Lambda); add Skill Messaging client |
| `alexa-skill/lambda/index.ts` | Register new `MessageReceivedHandler` |
| `alexa-skill/lambda/handlers/` | Add `MessageReceivedHandler.ts` for `Messaging.MessageReceived` |
| `alexa-skill/lambda/handlers/LaunchHandler.ts` | Capture and persist `context.System.user.userId` |
| `alexa-skill/skill-package/skill.json` | Add `SKILL_MESSAGING` event subscription |
| `backend/lib/deviceStore.ts` | Add `alexaUserId` field to `DeviceConfig` interface |
| `docs/TECHNICAL_DESIGN.md` | Update architecture diagrams and data flow |

### New Files

| File | Purpose |
|------|---------|
| `backend/lib/skillMessaging.ts` | Skill Messaging API client (get token, send message) |
| `alexa-skill/lambda/handlers/MessageReceivedHandler.ts` | Handles incoming Skill Messages, creates reminders |

---

## 10. References

- [Alexa Reminders API Reference](https://developer.amazon.com/en-US/docs/alexa/smapi/alexa-reminders-api-reference.html)
- [Alexa Reminders Overview](https://developer.amazon.com/en-US/docs/alexa/smapi/alexa-reminders-overview.html)
- [Tutorial: Update a Reminder from Outside of Session](https://developer.amazon.com/en-US/docs/alexa/smapi/tutorial-update-reminder-from-outside-of-session.html)
- [Skill Messaging API Reference](https://developer.amazon.com/en-US/docs/alexa/smapi/skill-messaging-api-reference.html)
- [Receive an Event in Your Skill (Messaging.MessageReceived)](https://developer.amazon.com/en-US/docs/alexa/smapi/send-a-message-request-to-a-skill.html)
- [Messaging Interface Reference](https://developer.amazon.com/en-US/docs/alexa/custom-skills/messaging-interface-reference.html)
- [Out-of-Session Service Clients (Python SDK)](https://developer.amazon.com/en-US/docs/alexa/alexa-skills-kit-sdk-for-python/call-alexa-service-apis-out-of-session.html)
- [Proactive Events API](https://developer.amazon.com/en-US/docs/alexa/smapi/proactive-events-api.html)
- [Proactive Events Schemas](https://developer.amazon.com/en-US/docs/alexa/smapi/schemas-for-proactive-events.html)
- [Configure Service to Send Messages to Skill](https://developer.amazon.com/en-US/docs/alexa/smapi/configure-an-application-or-service-to-send-messages-to-your-skill.html)
