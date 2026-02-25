# Backend

AWS serverless backend for Athan for Alexa. Handles device configuration sync, Alexa skill fulfillment, and scheduled prayer-time cron jobs.

## Architecture

```
API Gateway
  ├── POST /sync-config     Sync device preferences from iOS
  ├── GET  /devices         List registered devices
  └── GET  /health          Health check
Lambda Functions
  ├── api/                  HTTP endpoint handlers
  ├── scheduler/            CloudWatch cron (daily prayer schedule)
  └── alexa/                Alexa skill fulfillment handler
DynamoDB
  └── devices table         Minimal device token + preferences
```

## Prerequisites

- Node.js 20+
- AWS CLI configured with appropriate credentials
- Serverless Framework (`npm install -g serverless`)

## Setup

```bash
npm install
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AWS_REGION` | AWS region for deployment | Yes |
| `DYNAMODB_TABLE` | DynamoDB table name | Yes (set by serverless.yml) |
| `STAGE` | Deployment stage (dev/prod) | Yes (set by serverless.yml) |

## Scripts

```bash
npm test                       # Run unit tests
npm run build                  # Compile TypeScript
npx serverless deploy --stage dev   # Deploy to dev
npx serverless deploy --stage prod  # Deploy to production
```

## Deployment

```bash
# From repo root
./scripts/deploy-backend.sh
```

## Project Structure

```
backend/
├── functions/
│   ├── api/           HTTP endpoint handlers
│   ├── scheduler/     CloudWatch cron handler
│   └── alexa/         Alexa skill fulfillment
├── lib/               Shared utilities
│   ├── prayerEngine.ts    Re-exports core prayer engine
│   ├── alexaReminders.ts  Alexa Reminders API client
│   └── deviceStore.ts     DynamoDB device operations
├── tests/             Unit and integration tests
├── serverless.yml     Infrastructure as code
├── tsconfig.json      TypeScript configuration
└── package.json
```
