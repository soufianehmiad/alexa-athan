# ADR-004: Local-First Data Storage Strategy

**Status:** Accepted
**Date:** 2026-02-24
**Deciders:** Project leads

## Context

The iOS app needs to store user preferences, Alexa device configuration, authentication tokens, and (in V1) prayer tracking records. Our privacy-first principle requires that personal data stays on-device wherever possible.

We need to decide on storage mechanisms for different data categories.

## Decision

Use a **tiered storage approach** based on data sensitivity and usage patterns:

| Data Category | Storage | Reasoning |
|---|---|---|
| **User preferences** (city, method, madhab, offsets) | UserDefaults | Small, simple key-value data. Fast access. |
| **Device configuration** (Alexa device IDs, per-prayer toggles) | UserDefaults | Small, rarely changes. |
| **Auth tokens** (LWA access/refresh tokens) | Keychain | Sensitive credentials. Hardware-encrypted. Survives app reinstall. |
| **Prayer tracking records** (V1) | SwiftData | Structured, queryable, potentially large over time. Migration-safe. |

SwiftData (successor to CoreData) is chosen over CoreData for V1 prayer tracking because:
- Modern Swift-native API with macro-based model definitions.
- Built-in support for lightweight migrations.
- Compatible with iOS 17+ (our minimum target).
- Simpler than CoreData for our use case.

## Consequences

### Positive

- All user data stays on-device. Zero cloud sync required for core features.
- Keychain protects sensitive tokens with hardware encryption.
- SwiftData provides migration support for future schema changes.
- UserDefaults is fast and simple for small preference data.

### Negative

- No cross-device sync for prayer tracking in V1.
- Data is lost if user deletes the app (except Keychain items).
- SwiftData requires iOS 17+, limiting device support.

### Risks

- SwiftData is relatively new; edge cases or bugs may exist. Mitigation: keep the data model simple, write migration tests.
- UserDefaults has no encryption. Preferences (city, method) are not sensitive, but if requirements change, we may need to move to encrypted storage.

## Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|---|---|---|---|
| CoreData for everything | Mature, well-documented | Verbose API, Objective-C heritage, complex migrations | SwiftData is simpler and sufficient |
| SQLite directly (via GRDB or similar) | Full SQL power, lightweight | More manual work for migrations, no SwiftUI integration | Over-engineering for our data model |
| Realm | Good Swift support, reactive queries | Third-party dependency, acquisition by MongoDB adds uncertainty | Unnecessary dependency |
| CloudKit for sync | Apple-native sync, free tier | Violates privacy-first principle, adds cloud dependency | Explicitly out of scope for V1 |
