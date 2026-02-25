# Contributing to Athan for Alexa

Thank you for your interest in contributing. This project is built by and for the community.

---

## Code of Conduct

Be respectful. This is a project serving a faith community. Treat contributors and users with kindness regardless of background, skill level, or viewpoint. Harassment or discrimination of any kind will not be tolerated.

---

## How to Contribute

### Reporting Bugs

1. Search [existing issues](../../issues) to avoid duplicates.
2. Open a new issue with the `bug` label.
3. Include: what you expected, what happened, steps to reproduce, and your environment (iOS version, device, Alexa device model).
4. Screenshots or logs are helpful.

### Suggesting Features

1. Open a [Discussion](../../discussions) with the `feature-request` label.
2. Describe the **use case**, not just the feature. Why do you need this?
3. Community members vote with reactions to help prioritize.

### Security Vulnerabilities

**Do NOT open a public issue.** See [SECURITY.md](./SECURITY.md) for responsible disclosure instructions.

---

## Development Setup

### Prerequisites

- **iOS app:** macOS, Xcode 16+, iOS 17+ device or simulator.
- **Alexa skill / backend:** Node.js 20+, npm 10+, AWS CLI configured.
- **General:** Git, a text editor.

### Repository Structure

```
alexa-athan/
├── core-prayer-engine/    # Shared prayer calculation logic
│   ├── swift/             # Swift package (Adhan-Swift wrapper)
│   └── typescript/        # TypeScript package (Adhan-JS wrapper)
├── ios-app/               # SwiftUI iOS application
├── alexa-skill/           # Alexa skill (ASK SDK, Node.js)
├── backend/               # AWS Lambda backend
├── scripts/               # Build, test, deploy scripts
└── docs/                  # Documentation (PRD, TDD, ADRs, etc.)
```

### Getting Started

```bash
# Clone the repository
git clone https://github.com/[org]/alexa-athan.git
cd alexa-athan

# Install backend + Alexa skill dependencies
cd backend && npm install && cd ..
cd alexa-skill && npm install && cd ..

# Run tests
cd core-prayer-engine/typescript && npm test && cd ../..
cd alexa-skill && npm test && cd ..
cd backend && npm test && cd ..

# iOS: open ios-app/AthanForAlexa.xcodeproj in Xcode
```

---

## Pull Request Process

### Before You Start

1. Check if an issue or discussion already exists for what you want to work on.
2. For non-trivial changes, open an issue first to discuss the approach.
3. Fork the repository and create a branch from `main`.

### Branch Naming

```
feat/short-description     # New features
fix/short-description      # Bug fixes
docs/short-description     # Documentation changes
refactor/short-description # Code refactoring
```

### Making Changes

1. Keep changes focused. One PR per feature or fix.
2. Follow existing code style and patterns.
3. Add or update tests for any changed behavior.
4. Update documentation if needed.
5. Ensure all tests pass locally before pushing.

### Submitting

1. Push your branch to your fork.
2. Open a PR against `main`.
3. Fill out the PR template (description, testing done, screenshots if UI change).
4. Link the related issue.
5. Wait for review. Address feedback promptly.

### PR Review Criteria

- [ ] Tests pass (CI green).
- [ ] Code follows existing patterns and style.
- [ ] No unnecessary dependencies added.
- [ ] Privacy principles respected (no new data collection without discussion).
- [ ] Documentation updated if behavior changes.
- [ ] Commit messages are clear and descriptive.

---

## Coding Standards

### General

- Write clear, readable code. Favor clarity over cleverness.
- Keep functions small and focused.
- Name things descriptively.
- No commented-out code in PRs.

### Swift (iOS)

- Follow [Swift API Design Guidelines](https://www.swift.org/documentation/api-design-guidelines/).
- Use SwiftUI idioms (view composition, environment, bindings).
- Format with `swift-format` or Xcode defaults.

### TypeScript (Alexa Skill, Backend)

- Strict mode enabled (`"strict": true` in tsconfig).
- Use `const` by default, `let` when mutation is needed.
- No `any` types — use proper typing.
- Format with Prettier (config in repo).
- Lint with ESLint (config in repo).

---

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add Hanafi Asr calculation option
fix: correct DST handling for spring-forward dates
docs: update privacy policy with V1 data practices
test: add cross-platform consistency tests for Mecca
refactor: extract reminder scheduling into service class
```

Prefix with: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`.

---

## Audio Contributions

If you want to contribute Athan recordings:

1. The recording must be **public domain** or licensed under **CC0 (Creative Commons Zero)**.
2. You must have the legal right to release the recording under that license.
3. Include a `LICENSE` file with the recording stating the license.
4. Provide metadata: reciter name (if applicable), recording location, date, format.
5. Audio format: MP3, 128kbps minimum, mono or stereo.

We cannot accept recordings with unclear licensing, even if the reciter is unknown.

---

## Localization

To add a new language:

1. Open an issue with the `localization` label stating which language.
2. We will provide the string keys and English source text.
3. Submit translations as a PR.
4. Native speakers review translations before merge.

Currently supported: English (MVP), Arabic, French (V1).

---

## Questions?

Open a [Discussion](../../discussions) with the `question` label. We are happy to help.
