# ADR-001: Architecture Pattern Selection

**Status:** Accepted
**Date:** 2026-02-24
**Deciders:** Project leads

## Context

Athan for Alexa needs to play the call to prayer on Alexa devices at the correct times daily. Prayer times change every day based on location and calculation method. Alexa does not support scheduling audio playback natively — it requires external scheduling via the Reminders API.

We evaluated three architecture patterns:
- **Pattern A: iOS-Orchestrated** — iOS app handles all scheduling.
- **Pattern B: Minimal Backend** — thin Lambda layer handles Alexa scheduling.
- **Pattern C: Server-Driven** — full backend with user profiles and orchestration.

## Decision

We adopt **Pattern B: Minimal Backend**.

A thin AWS Lambda backend handles prayer time computation and Alexa Reminder scheduling via a daily CloudWatch cron. The iOS app remains local-first for all user-facing features. The backend stores only anonymous device configuration (city, calculation method, device tokens) in DynamoDB.

## Consequences

### Positive

- Alexa reminders are scheduled reliably without depending on iOS background execution.
- Privacy is preserved: no user accounts, no GPS, no PII.
- Infrastructure cost is minimal (~$6-14/month for thousands of users).
- Easy to self-host: a single `serverless deploy` command.
- Clean upgrade path to Pattern C if needed later.

### Negative

- Requires AWS account and ongoing (minimal) infrastructure cost.
- Introduces a network dependency for Alexa integration (iOS features remain offline-capable).
- Adds operational responsibility: monitoring cron, managing LWA tokens.

### Risks

- Alexa Reminders API rate limits could affect users with many devices.
- AWS Lambda cold starts could cause latency spikes (mitigated by provisioned concurrency if needed).

## Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|---|---|---|---|
| Pattern A: iOS-Orchestrated | Maximum privacy, zero infra cost | iOS background execution is unreliable; reminders go stale if app isn't opened | Single point of failure for core feature |
| Pattern C: Server-Driven | Most reliable, richest feature set | Over-engineered for V1, higher cost, privacy concerns with stored profiles | Violates privacy-first principle for V1 scope |
