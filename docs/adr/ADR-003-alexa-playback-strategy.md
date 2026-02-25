# ADR-003: Alexa Playback Strategy

**Status:** Accepted
**Date:** 2026-02-24
**Deciders:** Project leads

## Context

Alexa does not support scheduling arbitrary audio playback at specific times. There is no "play this audio file at 5:23 AM" API. We need a strategy to get the Athan to play (or at minimum, to notify the user) at prayer times.

Available Alexa mechanisms:
- **Reminders API:** Schedule spoken/visual reminders at specific times.
- **AudioPlayer:** Stream audio files, but only on user invocation.
- **Proactive Events API:** Send notifications the user must manually check.
- **Routines:** User-configured automations (not programmable via API).

## Decision

Use a **two-tier playback strategy:**

1. **Tier 1 (Automatic):** Alexa Reminders fire at each prayer time with a spoken announcement (e.g., "It is time for Fajr prayer"). The backend schedules these daily via the Reminders API.

2. **Tier 2 (User-Initiated):** After hearing the reminder, the user can say "Alexa, open Athan" or "Alexa, play the Athan" to hear the full Athan audio via the AudioPlayer interface.

Onboarding and in-app messaging will clearly communicate this two-step experience.

## Consequences

### Positive

- Reminders are the most reliable automated notification mechanism Alexa offers.
- AudioPlayer provides high-quality audio playback for the full Athan.
- No dependency on undocumented or beta Alexa features.
- Clear user expectation: reminder notifies, voice command plays.

### Negative

- The Athan does not auto-play without user interaction after the reminder.
- User experience is two-step, not seamless.
- Users must grant Reminder permission to the skill.

### Risks

- Users may expect fully automatic audio playback and be disappointed by the two-step flow.
- Alexa may change Reminder API behavior or permissions in the future.
- Reminder rate limits could affect users with many devices and all five prayers enabled.

## Alternatives Considered

| Alternative | Pros | Cons | Why Rejected |
|---|---|---|---|
| Proactive Events only | Richer notification metadata | User must ask "What are my notifications?" — worse UX than reminders | Less visible to user |
| Alexa Routines instruction | Could auto-play audio | Not programmable via API; user must manually set up each prayer time daily | Impractical — times change daily |
| Music skill (Alexa Music Skill API) | Could enable "Alexa, play athan on [device]" | Complex certification, designed for music catalogs not single-purpose playback | Over-scoped for this use case |
| Wake-word automation (unofficial) | Full auto-play | Against Alexa ToS, unreliable, requires hardware hacks | Not viable |
