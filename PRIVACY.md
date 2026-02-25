# Privacy Policy — Athan for Alexa

**Effective Date:** 2026-02-24
**Last Updated:** 2026-02-24

---

## Our Commitment

Athan for Alexa is built on a single privacy principle: **we collect the minimum data necessary for the Athan to play on your Alexa device, and nothing more.**

We do not sell data. We do not run analytics. We do not track you.

---

## What Data We Collect

### On Your Device (iOS App)

The following data is stored **locally on your iPhone only** and is never transmitted to our servers:

| Data | Purpose | Storage |
|---|---|---|
| City name and city-center coordinates | Calculate prayer times | App preferences |
| Calculation method and madhab | Calculate prayer times | App preferences |
| Manual time offsets | Adjust prayer times | App preferences |
| Prayer tracking records (V1) | Personal prayer log | On-device database |

**We do not store your GPS coordinates.** When you select a city, we use the city center's coordinates (publicly available data). Your precise location never leaves your device.

### On Our Server (Backend)

When you connect your Alexa device, the following data is sent to our server to schedule Athan reminders:

| Data | Purpose | Retention |
|---|---|---|
| Anonymous device token (random UUID) | Identify your configuration | Deleted after 90 days of inactivity |
| City name and city-center coordinates | Calculate prayer times for Alexa scheduling | Deleted with device token |
| Calculation method and madhab | Prayer time calculation | Deleted with device token |
| Alexa device IDs | Target the correct Alexa devices | Deleted with device token |
| Amazon Login tokens (encrypted) | Authenticate with Alexa Reminders API | Deleted with device token |

**We do not store:** your name, email address, phone number, IP address, precise GPS location, usage patterns, or any other personally identifiable information.

### What Amazon Receives

When Alexa reminders are scheduled, Amazon receives:
- The reminder text (e.g., "It is time for Fajr prayer").
- The scheduled time.
- The target device ID.

This is transmitted via Amazon's Reminders API as part of normal Alexa skill operation. Amazon's handling of this data is governed by [Amazon's Alexa Privacy Policy](https://www.amazon.com/gp/help/customer/display.html?nodeId=GVP69FUJ48X9DK8V).

---

## What We Do NOT Do

- We do **not** create user accounts.
- We do **not** collect email addresses or phone numbers.
- We do **not** use analytics, telemetry, or tracking of any kind.
- We do **not** use advertising SDKs.
- We do **not** sell, share, or monetize any data.
- We do **not** store your precise GPS location. City-level granularity only.
- We do **not** log API requests with identifiable information.
- We do **not** use cookies or browser tracking (there is no web component).

---

## Data Retention

- **Device configuration** on our server is automatically deleted after **90 days of inactivity** (no config updates from the iOS app).
- **Amazon Login tokens** are encrypted at rest and deleted with the device configuration.
- **Local data** on your iPhone is deleted when you uninstall the app (except Keychain items, which can be cleared in iOS Settings).

---

## Data Security

- All data in transit is encrypted via TLS 1.2+.
- Amazon Login tokens are encrypted at rest using AES-256 before storage.
- Server infrastructure runs on AWS with encryption at rest enabled.
- See [SECURITY.md](./SECURITY.md) for our full security policy.

---

## Your Rights

- **Delete your data:** Uninstall the iOS app and your server-side configuration will be automatically deleted after 90 days. To delete immediately, use the "Disconnect Alexa" option in app settings, which sends a deletion request to our server.
- **Access your data:** All your data is visible in the iOS app settings. The server stores only what is shown in the table above.
- **Portability:** Prayer tracking data (V1) can be exported as JSON from the app settings.

---

## Children's Privacy

Athan for Alexa does not knowingly collect any data from children under 13. The app does not require or collect age information.

---

## Open Source Transparency

This project is open source. You can inspect exactly what data is collected, how it is stored, and how it is transmitted by reviewing the source code:

- iOS app: [`/ios-app`](./ios-app)
- Backend: [`/backend`](./backend)
- Alexa skill: [`/alexa-skill`](./alexa-skill)

---

## Changes to This Policy

We will update this document for any changes to data practices. Material changes will be communicated via the app's update notes and this file's commit history.

---

## Contact

For privacy questions or data deletion requests, open an issue on our GitHub repository or email: [privacy contact to be added before release].
