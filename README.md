# Athan for Alexa

Prayer time computation and Athan playback across Alexa and iOS -- privacy-first, no accounts, no stored data.

## Architecture

```
┌─────────────────┐       ┌───────────────────────────┐       ┌──────────────────┐
│    iOS App       │──────>│   AWS Backend             │──────>│  Alexa Service   │
│                  │ HTTPS │                           │       │                  │
│  SwiftUI         │       │  API Gateway              │       │  Reminders API   │
│  Adhan-Swift     │       │  Lambda (Node.js/TS)      │       │  AudioPlayer     │
│  CoreData        │       │  CloudWatch Cron          │       │  Skills Kit      │
│  StoreKit 2      │       │  DynamoDB (minimal)       │       │                  │
└─────────────────┘       └───────────────────────────┘       └──────────────────┘
        │                           │
        │         ┌─────────────────┘
        │         │
        v         v
┌─────────────────────────┐
│   Core Prayer Engine    │
│                         │
│  Swift: Adhan-Swift     │
│  TS:    adhan-js        │
│  Pure computation       │
│  Zero side effects      │
└─────────────────────────┘
```

**Design Principles:**
- Compute at the edge, store nothing at rest
- Alexa is a playback terminal (thin adapter)
- iOS works with zero network (all core features local)
- Every component is replaceable
- No authentication, no accounts, no identity (device tokens only)

> **Privacy First:** This project collects no personal data. Prayer times are computed
> locally or ephemerally on Lambda. No user accounts, no tracking, no analytics.
> See [PRIVACY.md](PRIVACY.md) for the full policy.

## Repository Structure

```
alexa-athan/
├── core-prayer-engine/  Shared prayer-time calculation library
│   ├── swift/           Swift Package (iOS)
│   └── typescript/      npm package (Lambda, Alexa)
├── ios-app/             SwiftUI iOS app (iOS 17+)
├── alexa-skill/         Alexa skill runtime (ASK SDK)
├── backend/             AWS Lambda + API Gateway + DynamoDB
├── audio/               Athan audio files and licensing
├── scripts/             Setup, test, and deploy automation
└── docs/                PRD, TDD, ADRs, test plan
```

## Prerequisites

- Node.js 20+
- npm 10+
- Swift 5.9+ and Xcode 15+ (for iOS development)
- AWS CLI configured (for backend deployment)
- ASK CLI (for Alexa skill deployment)

## Quick Start

```bash
# Install all dependencies
./scripts/setup.sh

# Run all tests
./scripts/test-all.sh
```

### Core Prayer Engine (TypeScript)

```bash
cd core-prayer-engine/typescript
npm install
npm test
npm start          # prints sample prayer times
```

### Alexa Skill

```bash
cd alexa-skill
npm install
npm test
npm start          # local server at POST /alexa
```

### Backend

```bash
cd backend
npm install
npm test
./scripts/deploy-backend.sh   # deploy to AWS
```

### iOS App

```bash
cd ios-app
swift build
swift test
open AthanForAlexa.xcodeproj  # or use Xcode directly
```

## Documentation

| Document | Description |
|----------|-------------|
| [PRD](docs/PRD.md) | Product requirements |
| [Technical Design](docs/TECHNICAL_DESIGN.md) | Architecture and component design |
| [Test Plan](docs/TEST_PLAN.md) | Test strategy and cases |
| [Repo Structure](docs/REPO_STRUCTURE.md) | Detailed directory layout |
| [ADRs](docs/adr/) | Architecture decision records |
| [Contributing](CONTRIBUTING.md) | Contribution guidelines |
| [Security](SECURITY.md) | Security policy |
| [Privacy](PRIVACY.md) | Privacy policy |
| [Roadmap](ROADMAP.md) | Release roadmap |

## License

This project is licensed under the [MIT License](LICENSE). See [NOTICE](NOTICE) for third-party attributions.
