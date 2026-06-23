# SwiftyCare — Information Security Policy

| | |
|---|---|
| **Document owner** | SwiftyCare Engineering Lead |
| **Version** | 1.0 (Draft for ISO 27001 / ISO 27799 review) |
| **Effective date** | June 2026 |
| **Next review** | December 2026 (or after any material change) |
| **Classification** | Internal — shareable with security auditors under NDA |
| **Aligned standards** | ISO/IEC 27001:2022, ISO 27799:2016 (Health informatics) |

> This is a living policy document prepared as part of SwiftyCare's information-security management. It is intended to be reviewed and refined together with the hospital's security consultancy as part of the ISO 27001 + ISO 27799 certification process.

---

## 1. Purpose & Scope

### 1.1 Purpose
This policy defines how SwiftyCare protects the confidentiality, integrity, and availability of the information it processes — in particular Protected Health Information (PHI) belonging to patients — and establishes the controls, responsibilities, and processes required to maintain a secure service.

### 1.2 Scope
This policy applies to:
- The SwiftyCare application (frontend, API, and database).
- All cloud infrastructure used to run the service (Vercel, Render, MongoDB Atlas, OpenAI).
- All personnel with access to SwiftyCare systems, source code, or production data.
- All data processed by the system: patient PHI, staff credentials, audit logs, and operational data.

### 1.3 Out of scope
- The hospital's internal network, endpoint devices (kiosks, workstations), and physical premises, which remain under hospital governance.
- Third-party sub-processors' internal security programs (covered by their own certifications and the Data Processing Agreements referenced in Section 11).

---

## 2. Information Security Objectives

| # | Objective | Measure |
|---|---|---|
| O1 | Protect patient PHI from unauthorised access | 0 unauthorised-access incidents; RBAC enforced on every endpoint |
| O2 | Ensure all data is encrypted in transit and at rest | 100% TLS 1.2+; database encryption at rest enabled |
| O3 | Maintain a complete, tamper-evident audit trail of PHI access | All PHI read/write events logged |
| O4 | Minimise data shared with third parties | Direct identifiers stripped before any AI processing |
| O5 | Detect and remediate vulnerabilities promptly | Automated dependency and secret scanning on every change |
| O6 | Maintain service availability | Managed, replicated database; monitored API |

---

## 3. Roles & Responsibilities

| Role | Responsibility |
|---|---|
| **Engineering Lead (ISMS owner)** | Owns this policy, approves changes, coordinates audits and the certification process. |
| **Developers** | Follow secure coding standards (Section 7), respond to scanning alerts, never commit secrets. |
| **System Administrator (SwiftyCare admin role)** | Manages staff accounts, enforces least privilege, removes access promptly when staff leave. |
| **Hospital staff (doctor / nurse)** | Protect their credentials, use the system only for authorised clinical purposes, report suspected incidents. |
| **Hospital IT / Security** | Govern endpoint devices and network, coordinate the penetration test and certification. |

---

## 4. Asset & Data Classification

| Classification | Examples | Handling |
|---|---|---|
| **Restricted (PHI)** | Patient name, national ID, vital signs, questionnaire answers, AI diagnosis, discharge reports | Encrypted in transit and at rest. Access strictly role-based and audit-logged. Never logged in plaintext. |
| **Confidential** | Staff credentials (stored only as bcrypt hashes), JWT secrets, API keys | Hashed/encrypted. Stored only in managed secret stores. Rotated on a schedule and after any suspected exposure. |
| **Internal** | Audit logs, operational metrics | Contain no PHI values. Retained for accountability. |
| **Public** | Marketing pages, API health-check status | No protection required. |

---

## 5. Access Control (ISO 27001 A.5.15–A.5.18, A.8.2–A.8.5)

### 5.1 Principles
- **Least privilege** — each role is granted only the permissions required for its function.
- **Server-side enforcement** — all authorisation is enforced by API middleware on every request. Client-side controls are cosmetic and grant no access if bypassed.
- **No shared accounts** — every staff member has an individual, named account. No generic or shared logins.
- **No back doors** — there are no hardcoded credentials or bypass mechanisms in the codebase. No default accounts exist in production.

### 5.2 Role-based access model

| Role | Permitted actions |
|---|---|
| **Patient** | Register a case and complete *their own* questionnaire only, via a short-lived, case-scoped token. No access to any other case or any staff function. |
| **Nurse** | View cases, record vital signs. No access to AI features or account management. |
| **Doctor** | All nurse capabilities plus AI diagnosis, discharge reports, ordering tests, and case deletion. |
| **Admin** | All doctor capabilities plus staff-account management (create, edit, deactivate, delete). |

### 5.3 Authentication
- Staff authenticate with an individual username and password. Passwords are stored only as **bcrypt** hashes (never in plaintext or reversible form).
- Sessions are issued as signed **JWT (HS256)** tokens with limited validity and idle timeout.
- Login attempts are rate-limited (10 attempts / 15 minutes / IP) to resist brute-force attacks.
- Authentication is designed to be timing-consistent to prevent username enumeration.

### 5.4 Joiner / mover / leaver
- New staff accounts are created by an admin with the minimum role required.
- When a staff member changes role, the admin updates their account immediately.
- When a staff member leaves, the admin deactivates (or deletes) their account immediately, revoking all access.

### 5.5 Planned enhancement — Hospital SSO
The system is architected to support hospital Single Sign-On (OIDC / SAML) so staff can use existing hospital credentials. This will be enabled in coordination with hospital IT.

---

## 6. Cryptography & Data Protection (ISO 27001 A.8.24)

- **In transit:** All communication uses HTTPS / TLS 1.2 or higher. No plaintext transport at any layer.
- **At rest:** The managed database (MongoDB Atlas) provides encryption at rest.
- **Passwords:** bcrypt with a configurable work factor.
- **Secrets:** JWT signing secrets and third-party API keys are stored only in managed environment-variable stores, never in source control. They are rotated on a schedule and after any suspected exposure.
- **De-identification:** Patient name and national ID are stripped from all payloads sent to the AI provider (OpenAI). Only clinical data with no direct identifiers leaves for AI processing.

---

## 7. Secure Development (ISO 27001 A.8.25–A.8.28)

- **Input validation** — all API request bodies are validated against strict schemas; request size is capped to prevent payload-based abuse.
- **Output hygiene** — internal errors return generic messages to clients; stack traces and database internals are logged server-side only.
- **Dependency management** — automated dependency scanning (`npm audit`) runs in CI; Dependabot proposes security updates weekly.
- **Secret scanning** — `gitleaks` runs on every commit and pull request to prevent credentials being committed.
- **Type safety** — the codebase is fully typed (TypeScript) and type-checked in CI.
- **Code review** — changes are reviewed before reaching the production branch. The source repository is available for third-party code review on request.
- **Version control** — all changes are tracked in Git with full history and attribution.

---

## 8. Logging & Monitoring (ISO 27001 A.8.15–A.8.16)

- Every access to or modification of PHI is recorded in a structured **audit log** containing: actor identity, role, action, affected case ID, source IP address, and timestamp.
- Audit logs **never** contain PHI values — only references (e.g. case IDs).
- Authentication successes and failures are logged.
- Logs are retained to support incident investigation and accountability.

---

## 9. Operations & Infrastructure Security (ISO 27001 A.8.1, A.8.9)

| Layer | Control |
|---|---|
| Network exposure | No inbound ports are opened on the hospital network. All connections are outbound from hospital devices to the cloud over HTTPS. |
| API hardening | Security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) applied via `helmet`. |
| Rate limiting | Global and per-endpoint limits protect against abuse and denial-of-service. |
| Database access | Authenticated (SCRAM) and encrypted (TLS). Network allowlist to be restricted to fixed egress IPs before clinical go-live (see Section 12). |
| Availability | Database runs as a 3-node replica set under a managed provider. |

---

## 10. Third-Party / Sub-Processor Management (ISO 27001 A.5.19–A.5.22)

SwiftyCare relies on the following sub-processors. A signed Data Processing Agreement (DPA) with each is required before processing real patient data at clinical scale.

| Sub-processor | Purpose | Region | DPA status |
|---|---|---|---|
| Vercel | Frontend hosting (no PHI) | EU edge | Pending |
| Render | API hosting (PHI in transit) | Frankfurt, Germany (EU) | Pending |
| MongoDB Atlas | Primary PHI data store | Tokyo, Japan | Pending |
| OpenAI | AI diagnosis & discharge (de-identified data only) | United States | Pending — legal action required |

---

## 11. Incident Management (ISO 27001 A.5.24–A.5.28)

1. **Detect** — via monitoring, scanning alerts, audit-log review, or a report from staff.
2. **Contain** — rotate affected credentials, revoke compromised sessions, isolate the affected component.
3. **Assess** — determine whether PHI was exposed and the scope of impact.
4. **Notify** — inform the hospital's designated security contact without undue delay if PHI may have been affected, in line with applicable breach-notification obligations.
5. **Remediate** — fix the root cause and verify.
6. **Review** — conduct a post-incident review and update controls and this policy as needed.

Any staff member or developer who suspects a security incident must report it to the Engineering Lead immediately.

---

## 12. Risk Management & Known Open Items

These items are tracked openly and form the basis of the security improvement roadmap. None permits unauthorised access to PHI.

| Item | Risk | Treatment plan |
|---|---|---|
| Database network allowlist currently open (`0.0.0.0/0`) | Medium — mitigated by authentication + TLS | Restrict to fixed egress IPs once the API host is upgraded to a plan providing static IPs. |
| DPAs not yet signed | Compliance | Execute DPAs with all sub-processors before clinical go-live. |
| Data residency in Tokyo | Compliance / data-sovereignty | Confirm hospital-approved regions; migrate database and API to EU/Israel if required. |
| OpenAI data retention | Privacy | Execute OpenAI DPA or migrate to an EU/IL-hosted model. Direct identifiers already stripped as interim control. |
| Hospital SSO not yet integrated | Operational | Integrate OIDC/SAML with hospital IdP. |

---

## 13. Compliance & Certification

- This policy is structured around **ISO/IEC 27001:2022** Annex A controls and **ISO 27799:2016** health-informatics guidance.
- SwiftyCare will undergo an external **penetration test** and, where required, a **code review** as part of the certification process.
- Findings from these assessments will be tracked to closure and reflected in subsequent versions of this policy.

---

## 14. Policy Review & Maintenance

- This policy is reviewed at least every six months and after any material change to the system, its data flows, or its sub-processors.
- The Engineering Lead owns the review. Changes are version-controlled.

---

*SwiftyCare Information Security Policy · Draft v1.0 · June 2026 · Prepared for ISO 27001 / ISO 27799 certification review*
