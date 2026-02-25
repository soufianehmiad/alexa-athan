# Security Policy — Athan for Alexa

**Last Updated:** 2026-02-24

---

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public GitHub issue.**
2. Email: **[security contact to be added before release]**
3. Include: description of the vulnerability, steps to reproduce, and potential impact.
4. We will acknowledge receipt within 48 hours and provide a timeline for a fix.

We appreciate responsible disclosure and will credit reporters (with permission) in release notes.

---

## Threat Model

### Assets

| Asset | Sensitivity | Location |
|---|---|---|
| Amazon Login (LWA) refresh tokens | High | DynamoDB (encrypted), iOS Keychain |
| User city and prayer configuration | Low | DynamoDB, iOS UserDefaults |
| Prayer tracking records (V1) | Medium | iOS on-device only |
| Athan audio files | None (public domain) | S3 / CloudFront |
| Device tokens (anonymous UUIDs) | Low | DynamoDB, iOS Keychain |

### Threat Vectors

| Threat | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **LWA token theft from DynamoDB** | Low | High (access to user's Alexa devices) | AES-256 encryption at application layer; AWS IAM least-privilege; DynamoDB encryption at rest |
| **Man-in-the-middle on API calls** | Low | Medium | TLS 1.2+ enforced on all endpoints; certificate pinning on iOS (V1) |
| **Lambda function compromise** | Very Low | High | Minimal IAM permissions; no shell access; dependency scanning |
| **DynamoDB data exposure via misconfigured IAM** | Low | Medium | Infrastructure as code (serverless.yml) with reviewed IAM policies; no public access |
| **Alexa skill impersonation** | Very Low | Low | Alexa request signature validation via ASK SDK |
| **iOS app reverse engineering** | Medium | Low | No sensitive logic in app; tokens in Keychain (hardware-protected) |
| **Denial of service on API** | Medium | Medium | API Gateway throttling; CloudFront for audio; Lambda concurrency limits |
| **Supply chain attack (npm/Swift dependencies)** | Low | High | Lockfile pinning; dependabot alerts; minimal dependency tree |

---

## Security Controls

### Authentication and Authorization

- **iOS to Backend:** Anonymous device token (`X-Device-Token` header). This is not a security credential — it identifies a configuration, not a user. The API is HTTPS-only.
- **Backend to Alexa:** LWA OAuth tokens, stored AES-256 encrypted. Decrypted only in Lambda memory during execution.
- **Alexa Skill:** All incoming requests validated using ASK SDK signature verification (verifies requests come from Alexa service).
- **No user authentication.** There are no user accounts, passwords, or sessions.

### Data Protection

| Control | Implementation |
|---|---|
| Encryption in transit | TLS 1.2+ on all endpoints |
| Encryption at rest (infrastructure) | AWS-managed encryption for DynamoDB, S3 |
| Encryption at rest (application) | AES-256 for LWA tokens before DynamoDB storage |
| iOS credential storage | Keychain Services (hardware-backed on devices with Secure Enclave) |
| Automatic data expiry | DynamoDB TTL: 90 days of inactivity |
| Audio URL protection | S3 signed URLs with 1-hour expiry |

### Infrastructure Security

| Control | Implementation |
|---|---|
| Least-privilege IAM | Each Lambda has only the permissions it needs |
| No persistent servers | Serverless architecture, no SSH access, no OS to patch |
| Dependency scanning | GitHub Dependabot for npm and Swift packages |
| Infrastructure as code | All resources defined in `serverless.yml`, reviewed in PR |
| Environment separation | Separate AWS stages for dev and prod |
| Logging | CloudWatch Logs with no PII; log retention: 30 days |

### API Security

| Control | Implementation |
|---|---|
| Rate limiting | API Gateway throttling: 100 req/sec burst, 50 req/sec sustained |
| Input validation | All API inputs validated against JSON schemas |
| CORS | Restricted to iOS app origin (no web client) |
| Error handling | Generic error messages; no stack traces in production |

---

## Dependency Management

- **Minimal dependencies.** Each component has the fewest possible dependencies.
- **Lockfiles committed.** `package-lock.json` and `Package.resolved` are committed and reviewed.
- **Automated alerts.** GitHub Dependabot enabled for security advisories.
- **Update policy:** Security patches applied within 7 days. Non-security updates reviewed monthly.

---

## Incident Response

1. **Detect:** CloudWatch alarms for anomalous error rates, API abuse patterns.
2. **Assess:** Determine scope and impact. Is user data affected?
3. **Contain:** Revoke compromised credentials. Disable affected endpoints if needed.
4. **Fix:** Deploy patch. Rotate affected secrets.
5. **Notify:** If user data is affected, disclose via GitHub advisory and app update notes.
6. **Review:** Post-incident review. Update this document and threat model.

---

## Supported Versions

| Version | Security Updates |
|---|---|
| Latest release | Supported |
| Previous minor | Supported for 3 months |
| Older | Not supported |

---

## Security Checklist (Pre-Release)

- [ ] All API endpoints require HTTPS.
- [ ] LWA tokens encrypted before DynamoDB storage.
- [ ] Alexa request signature validation enabled.
- [ ] API Gateway rate limiting configured.
- [ ] IAM policies follow least-privilege.
- [ ] No hardcoded secrets in source code.
- [ ] Dependabot enabled on all repositories.
- [ ] CloudWatch alarms configured for error rate spikes.
- [ ] iOS Keychain used for all sensitive storage.
- [ ] No PII in CloudWatch Logs.
