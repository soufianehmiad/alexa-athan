# Repository Structure — Athan for Alexa

```
alexa-athan/
│
├── README.md                          # Project overview, quick start
├── LICENSE                            # Open source license (MIT or Apache 2.0)
├── CONTRIBUTING.md                    # How to contribute
├── PRIVACY.md                         # Privacy policy
├── SECURITY.md                        # Security policy and reporting
├── ROADMAP.md                         # Release roadmap
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       ├── ci-ios.yml                 # iOS build + test
│       ├── ci-backend.yml             # Backend lint + test
│       ├── ci-alexa.yml               # Alexa skill lint + test
│       └── ci-cross-platform.yml      # Prayer engine consistency
│
├── docs/
│   ├── PRD.md                         # Product Requirements Document
│   ├── TECHNICAL_DESIGN.md            # Technical Design Document
│   ├── TEST_PLAN.md                   # Test plan and test cases
│   ├── DEFINITION_OF_DONE.md          # Done criteria
│   ├── REPO_STRUCTURE.md              # This file
│   └── adr/
│       ├── ADR-000-template.md        # ADR template
│       ├── ADR-001-architecture-pattern.md
│       ├── ADR-002-prayer-engine-design.md
│       ├── ADR-003-alexa-playback-strategy.md
│       └── ADR-004-data-storage.md
│
├── core-prayer-engine/
│   ├── README.md                      # Engine overview, usage
│   ├── swift/
│   │   ├── Package.swift              # Swift Package Manager manifest
│   │   ├── Sources/
│   │   │   └── AthanPrayerEngine/
│   │   │       ├── PrayerEngine.swift         # Public interface
│   │   │       ├── CalculationMethod.swift    # Method enum
│   │   │       ├── Madhab.swift               # Madhab enum
│   │   │       ├── PrayerTimes.swift          # Result model
│   │   │       └── PrayerOffsets.swift         # Offset model
│   │   └── Tests/
│   │       └── AthanPrayerEngineTests/
│   │           ├── PrayerEngineTests.swift
│   │           ├── HighLatitudeTests.swift
│   │           └── OffsetTests.swift
│   └── typescript/
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts                       # Public exports
│       │   ├── prayerEngine.ts                # Public interface
│       │   ├── types.ts                       # Shared types
│       │   └── methods.ts                     # Calculation methods
│       └── tests/
│           ├── prayerEngine.test.ts
│           ├── highLatitude.test.ts
│           └── offsets.test.ts
│
├── ios-app/
│   ├── README.md                      # iOS app setup and development
│   ├── AthanForAlexa.xcodeproj/
│   ├── AthanForAlexa/
│   │   ├── AthanApp.swift
│   │   ├── Models/
│   │   ├── ViewModels/
│   │   ├── Views/
│   │   ├── Services/
│   │   ├── Persistence/
│   │   └── Resources/
│   └── AthanForAlexaTests/
│       ├── ViewModelTests/
│       └── ServiceTests/
│
├── alexa-skill/
│   ├── README.md                      # Skill setup, testing, deployment
│   ├── package.json
│   ├── tsconfig.json
│   ├── lambda/
│   │   ├── index.ts
│   │   ├── handlers/
│   │   ├── services/
│   │   └── models/
│   ├── skill-package/
│   │   ├── interactionModels/
│   │   │   └── custom/
│   │   │       └── en-US.json
│   │   └── skill.json
│   └── tests/
│       ├── handlers/
│       └── services/
│
├── backend/
│   ├── README.md                      # Backend setup, deployment
│   ├── package.json
│   ├── tsconfig.json
│   ├── serverless.yml                 # Infrastructure as code
│   ├── functions/
│   │   ├── api/
│   │   │   ├── syncConfig.ts
│   │   │   ├── getDevices.ts
│   │   │   └── health.ts
│   │   ├── scheduler/
│   │   │   └── dailyCron.ts
│   │   └── alexa/
│   │       └── skillHandler.ts
│   ├── lib/
│   │   ├── prayerEngine.ts            # Re-exports core engine
│   │   ├── alexaReminders.ts
│   │   └── deviceStore.ts
│   └── tests/
│       ├── api/
│       ├── scheduler/
│       └── lib/
│
├── scripts/
│   ├── setup.sh                       # One-command dev environment setup
│   ├── test-all.sh                    # Run all test suites
│   ├── deploy-backend.sh              # Deploy backend to AWS
│   ├── deploy-skill.sh                # Deploy Alexa skill
│   └── cross-platform-check.sh        # Compare Swift vs TS prayer outputs
│
└── audio/
    ├── README.md                      # Audio licensing documentation
    ├── LICENSES.md                    # Per-file license provenance
    └── athan/
        └── default.mp3               # Default public domain recording
```

## Module Dependency Graph

```
core-prayer-engine (standalone, no external dependencies beyond Adhan)
       │
       ├──────────────────┐
       ▼                  ▼
   ios-app            backend
   (imports Swift       (imports TS
    package)             package)
                          │
                          ▼
                     alexa-skill
                     (deployed as
                      Lambda via backend)
```

No circular dependencies. Each module can be built and tested independently.
