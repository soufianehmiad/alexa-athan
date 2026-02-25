# ADR-002: Prayer Engine as Shared Module

**Status:** Accepted
**Date:** 2026-02-24
**Deciders:** Project leads

## Context

Prayer time calculation is the core domain logic. It is needed by both the iOS app (for display) and the backend Lambda (for Alexa scheduling). The calculation must be deterministic: given the same inputs (location, date, method, madhab), both platforms must produce identical results.

We need to decide how to share this logic across Swift (iOS) and TypeScript (Lambda).

## Decision

Use the **Adhan library** on both platforms — [Adhan-Swift](https://github.com/batoulapps/adhan-swift) for iOS and [Adhan-JS](https://github.com/batoulapps/adhan-js) for Lambda. Both are maintained by the same author (Batoul Apps), use the same algorithms, and produce identical output for the same inputs.

Wrap each in a thin adapter with an identical interface (`PrayerEngine.calculate(...)`) so the rest of the app depends on our interface, not on the library directly.

## Consequences

### Positive

- Battle-tested libraries with existing test suites and community usage.
- Identical algorithms across platforms ensure prayer time consistency.
- Adapter pattern allows swapping the underlying library without changing consumers.
- No need to maintain our own astronomical calculations.

### Negative

- Dependency on a third-party library (bus factor risk).
- Two separate wrapper implementations to maintain (Swift + TypeScript).
- Minor version discrepancies between Adhan-Swift and Adhan-JS could theoretically produce slightly different results.

### Risks

- If Adhan libraries are abandoned, we would need to fork or reimplement. Mitigation: the libraries are stable, and prayer time algorithms are well-documented standards.
- Cross-platform consistency must be verified with integration tests comparing outputs for the same inputs.

## Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|---|---|---|---|
| Single shared library in JS (run JS on iOS via JavaScriptCore) | One codebase | JSCore adds complexity, poor debuggability, iOS performance concerns | Over-engineering for this use case |
| Build our own prayer engine from scratch | Full control, single codebase | Astronomical calculations are non-trivial, error-prone, requires extensive validation | Unnecessary when well-tested libraries exist |
| Use a prayer time API service | No library dependency | Network dependency, privacy concern (sends location to third party), ongoing cost | Violates privacy-first and offline-first principles |
