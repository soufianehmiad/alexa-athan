# Architecture

## Components

- `core-prayer-engine`: Canonical prayer-time calculation interface
- `alexa-skill`: Alexa request routing and intent handlers
- `ios-app`: Native iOS integration placeholder
- `scripts`: Automation entrypoints for setup and validation

## Data Flow

1. A client (Alexa or iOS) requests prayer times.
2. Request is normalized and passed into `core-prayer-engine`.
3. Output is formatted for client response.
