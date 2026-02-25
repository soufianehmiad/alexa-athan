# Alexa Skill

Alexa custom skill for Islamic prayer times and athan audio playback using the ASK SDK and the `adhan` npm package.

## Features

- **LaunchHandler** - Greets user with next prayer time
- **GetPrayerTimesIntent** - Speaks all 5 daily prayer times for the user's city
- **PlayAthanIntent** - Plays athan audio via AudioPlayer directive
- **SetCityIntent** - Stores city preference in session (AMAZON.City slot)
- **AudioPlayer lifecycle** - Handles PlaybackStarted, PlaybackFinished, PlaybackStopped, PlaybackNearlyFinished, PlaybackFailed
- **Built-in intents** - Help, Stop, Cancel, SessionEnded, Error handling

## Prerequisites

- Node.js 20+
- ASK CLI (`npm install -g ask-cli`)
- An Amazon Developer account

## Setup

```bash
npm install
```

## Scripts

```bash
npm run build     # Compile TypeScript
npm test          # Run Jest tests
npm run clean     # Remove dist/
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ATHAN_AUDIO_URL` | S3/CloudFront URL for the athan audio file |

## Project Structure

```
alexa-skill/
├── lambda/
│   ├── handlers/          All request handlers
│   ├── services/          PrayerEngineService (adhan), AudioService
│   ├── models/            TypeScript types and city coordinates
│   └── index.ts           Skill entry point (Lambda handler)
├── skill-package/
│   ├── skill.json         Skill manifest (AudioPlayer + reminders)
│   └── interactionModels/ en-US interaction model
├── tests/                 Jest tests
├── package.json
└── tsconfig.json
```

## Deployment

```bash
npm run build
ask deploy
```

## Testing with the Alexa Simulator

1. Deploy the skill to your Amazon Developer account
2. Open the [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
3. Navigate to your skill and use the Test tab
4. Try: "Alexa, open Athan" or "Alexa, ask Athan for prayer times"
