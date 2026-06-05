# SwiftyCare — Security Remediation Plan

**Status:** Draft for review
**Owner:** Engineering
**Audience:** Hospital CTO / Information Security, SwiftyCare engineering
**Purpose:** Close the security gaps that currently block information-security approval, in priority order, so the system can pass an infosec review and a penetration test.

> This plan is the *engineering backlog* that precedes the formal documentation package. It is written so each item can be tracked, implemented, and verified independently. Findings reference the architecture review of the current `main` branch.

---

## How to read this plan

**Priority levels**

| Level | Meaning | Target |
|-------|---------|--------|
| **P0 — Blocking** | The system cannot be submitted for infosec approval or pen-tested with this in place. Exposes PHI or allows unauthenticated access. | Fix before anything else |
| **P1 — High** | Required to pass a hospital infosec review; a pen test will fail/flag these. | Fix before pen test |
| **P2 — Hardening** | Defense-in-depth and best practice; expected in a mature posture. | Fix before go-live / next iteration |
| **POLICY** | Not (only) code — needs a hospital/legal/contractual decision. Must start in parallel. | Start now, runs concurrently |

**Each item lists:** the risk, where it lives in the code, the fix, and the acceptance criteria (how we prove it's done).

---

## Executive summary

The current architecture has **no server-side authentication or authorization**. Every API endpoint is publicly reachable, and `GET /api/cases` returns every patient's name and national ID to any anonymous caller. Staff "login" is a client-side passcode that only hides UI routes; it does not protect data. In addition, PHI (including name + national ID) is sent to OpenAI (US), and patient data is stored/processed across three external clouds in three regions.

Because of this, **a penetration test today would simply confirm catastrophic, already-known findings**. The work below fixes the blocking issues first so that the eventual pen test validates a hardened system — which is what the CTO is asking to see.

**Critical path:** P0 → P1 → (finalize documentation) → penetration test. POLICY items (data residency / OpenAI agreement) run in parallel starting now.

---

## Findings overview

| # | Finding | Priority | Effort |
|---|---------|:--------:|:------:|
| 1 | No authentication on any API endpoint | **P0** | L |
| 2 | No authorization / RBAC (doctor vs nurse vs patient) | **P0** | M |
| 3 | Staff auth is client-side only (passcodes in JS bundle) | **P0** | M |
| 4 | `GET /api/cases` exposes all PHI (name + national ID) unauthenticated | **P0** | S* |
| 5 | MongoDB Atlas network access `0.0.0.0/0` | **P0** | S |
| 6 | Secrets management / rotation (OpenAI key, DB creds, passcodes) | **P0** | S |
| 7 | No audit logging of PHI access/modification | **P1** | M |
| 8 | No security headers (helmet / HSTS / CSP) | **P1** | S |
| 9 | No rate limiting (AI cost abuse, enumeration, brute force) | **P1** | S |
| 10 | No request body validation / size limits on Mixed JSON | **P1** | M |
| 11 | Case access by guessable/enumerable ObjectId, no ownership check | **P1** | M |
| 12 | National-ID existence probing via 409 response | **P1** | S |
| 13 | Error responses leak internal messages/details | **P1** | S |
| 14 | TLS/HTTPS not enforced at the application layer | **P2** | S |
| 15 | No automated dependency / secret scanning in CI | **P2** | S |
| 16 | Unused `@vercel/analytics` dependency (reduce surface) | **P2** | XS |
| A | PHI sent to OpenAI (US) — name + national ID | **POLICY + P0** | M |
| B | Cross-region data residency (Frankfurt API / Tokyo DB / US AI) | **POLICY** | — |
| C | Data Processing Agreement / retention with all sub-processors | **POLICY** | — |

\* Small once auth (items 1–3) exists; until then it is part of the auth work.
Effort: XS < S < M < L (rough engineering size, not calendar time).

---

## P0 — Blocking (must fix first)

### P0-1 / P0-2 / P0-3 — Real server-side authentication & role-based authorization

**Risk:** Anyone on the internet can read, create, modify, and delete patient records. The doctor/nurse passcodes (`swiftycare`, `nurse`) are compiled into the client bundle (`VITE_*` vars) and do not protect the API. This is the single most serious gap.

**Where:**
- API has no auth middleware — `apps/api/src/index.ts`, `apps/api/src/routes/caseRoutes.ts`
- Client-side gates only — `apps/web/src/components/DoctorRoute.tsx`, `NurseRoute.tsx`, `DoctorLoginPage.tsx`, `NurseLoginPage.tsx` (passcodes from `VITE_DOCTOR_PASSCODE` / `VITE_NURSE_PASSCODE`)

**Fix:**
1. Introduce real accounts for staff (nurse, doctor, admin) with **hashed credentials** (bcrypt/argon2) stored server-side, or integrate with the **hospital identity provider (SSO/SAML/OIDC)** if available — this is the preferred option for a hospital and worth confirming with the CTO.
2. Issue short-lived **session tokens** (httpOnly, Secure cookies, or JWT with rotation) on login via a new `POST /api/auth/login`.
3. Add **auth middleware** that validates the session on every `/api/cases/*` route.
4. Add **role-based authorization**: define roles (`patient` flow vs `nurse` vs `doctor`) and enforce per-endpoint permissions (e.g. only doctors finalize discharge; only nurses enter vitals; patients can only write their own questionnaire).
5. Remove all client-side passcodes; the React route guards become *UX hints* backed by real server enforcement.

**Acceptance criteria:**
- Every `/api/cases/*` request without a valid session returns `401`.
- A nurse token cannot call doctor-only endpoints (`403`).
- No passcode or credential is present in the built client bundle (`grep` the `dist/` output).
- Login is rate-limited and credentials are hashed at rest.

---

### P0-4 — Patient list / record endpoints expose PHI

**Risk:** `GET /api/cases` returns the full list of cases including `patientName` and `nationalId` to anonymous callers. `GET /api/cases/:id` exposes a full record to anyone with the 24-char ObjectId.

**Where:** `apps/api/src/routes/caseRoutes.ts`

**Fix:** Gated by P0-1/2/3 (requires auth + role). Additionally:
- Scope list results to the caller's role/facility.
- Return only the fields each role needs (avoid sending national ID where not required).

**Acceptance criteria:** Unauthenticated calls to list/detail endpoints return `401`; authorized calls return only role-appropriate fields.

---

### P0-5 — Lock down MongoDB Atlas network access

**Risk:** Atlas network access is currently `0.0.0.0/0` (open to the entire internet). If credentials leak, the database is directly reachable from anywhere.

**Where:** Atlas project network settings (infra, not code); referenced in `DEPLOY.md`.

**Fix:**
- Restrict Atlas IP allowlist to the API host's egress IPs (Render static outbound IPs) or use **VPC peering / Private Endpoint**.
- Confirm DB user has least-privilege (read/write to the app DB only, not admin).

**Status: DEFERRED — known open item.**
Render's free tier does not provide static outbound IPs. `0.0.0.0/0` remains in place as a temporary measure protected only by the rotated MongoDB credentials. **Must be closed before the system goes live with real patient data.** Action when ready: upgrade Render to a paid plan → get static outbound IPs from Render dashboard (Settings → Networking) → replace `0.0.0.0/0` in Atlas with those IPs.

**Acceptance criteria:** Atlas access list contains no `0.0.0.0/0` entry; connection succeeds only from the API host; DB user is non-admin.

---

### P0-6 — Secrets management & rotation

**Risk:** Default passcodes are in source/`.env.example`. Operational secrets (OpenAI key, Mongo URI) must be confirmed to live only in platform secret stores, and any value ever exposed must be rotated.

**Where:** `apps/api/.env.example`, `apps/web/.env.example`, Render/Vercel env config.

**Fix:**
- Rotate the **OpenAI API key** and **MongoDB credentials** (assume exposure given broad access settings).
- Store all secrets in Render/Vercel secret stores only; never in the repo.
- Remove default passcode fallbacks from the client once real auth lands.
- Confirm `.gitignore` coverage and scan git history for any committed secret (see P2-15).

**Acceptance criteria:** No secret values in the repo or client bundle; keys rotated and documented in a secrets inventory (without the values).

---

## P1 — High (fix before the penetration test)

### P1-7 — Audit logging of PHI access and changes
**Risk:** No record of who viewed/created/modified/deleted which patient case — a baseline requirement for clinical systems.
**Fix:** Add structured, tamper-evident audit logs (actor, role, action, case id, timestamp, source IP) for all read/write on cases; ship to a retained log store. Do **not** log PHI values themselves.
**Acceptance:** Every case read/write produces an audit entry queryable by case and by user.

### P1-8 — Security headers
**Risk:** No `helmet`, HSTS, CSP, `X-Content-Type-Options`, etc.
**Where:** `apps/api/src/index.ts`.
**Fix:** Add `helmet` with a sensible CSP; enable HSTS; set secure cookie flags.
**Acceptance:** Security-header scan (e.g. securityheaders.com / ZAP) passes with no high findings.

### P1-9 — Rate limiting & abuse protection
**Risk:** No limits → brute-force on login, case enumeration, and **expensive OpenAI calls** (cost + DoS).
**Fix:** Add IP/user rate limiting (`express-rate-limit`), stricter limits on `/auth/login` and AI endpoints.
**Acceptance:** Exceeding thresholds returns `429`; AI endpoints have per-user caps.

### P1-10 — Input validation & body size limits
**Risk:** `Questionnaire.answers` is `Schema.Types.Mixed` accepted with no validation; no max body size.
**Where:** `apps/api/src/models/Questionnaire.ts`, route handlers, `express.json()` config.
**Fix:** Validate request bodies with a schema (zod/joi), whitelist fields, set `express.json({ limit })`.
**Acceptance:** Malformed/oversized payloads rejected with `400`/`413`; stored data conforms to schema.

### P1-11 — Resource-level access control (ownership)
**Risk:** Knowing a case ObjectId grants access; IDs are enumerable in practice.
**Fix:** Enforce that the authenticated user/role is permitted for that specific case (facility scoping, assignment, or patient-session binding). Consider non-sequential opaque tokens for patient-facing links with expiry.
**Acceptance:** A user cannot access a case they are not authorized for, even with a valid ID (`403`).

### P1-12 — National-ID existence probing
**Risk:** Duplicate national ID returns `409`, letting an attacker confirm whether a person has a record.
**Fix:** After auth is in place this is far less exploitable; additionally return a generic response and rate-limit creation.
**Acceptance:** Case creation does not reveal whether a national ID already exists to unauthorized callers.

### P1-13 — Error message hygiene
**Risk:** Several `500` paths return `error.message`/`details` (may leak DB/OpenAI internals).
**Fix:** Return generic client errors; log details server-side only.
**Acceptance:** No internal stack/dependency details in any HTTP response body.

---

## P2 — Hardening (before go-live / next iteration)

- **P2-14 — Enforce HTTPS at the app layer** (redirect HTTP→HTTPS, trust proxy, secure cookies) even though Vercel/Render terminate TLS.
- **P2-15 — CI security scanning**: dependency audit (`npm audit`/Dependabot), secret scanning (gitleaks), and a basic SAST step on PRs; scan git history for historical secrets.
- **P2-16 — Reduce dependency surface**: remove unused `@vercel/analytics` from root `package.json`.

---

## POLICY — Data residency & third-party processing (start now, in parallel)

These directly answer the CTO's question *"do the data leave the hospital network (e.g. to cloud)?"* — **today the answer is yes, to several clouds.** They require a hospital/legal decision, not just code, so they must start immediately and run alongside the engineering work.

### SSO — hospital identity provider (planned)
For a full hospital deployment, staff (doctors, nurses, intake) should authenticate using their **existing hospital credentials** via the hospital's identity provider (OIDC or SAML). This eliminates SwiftyCare-specific passwords and ensures access is automatically revoked when staff leave the hospital. The current interim design uses individual username/password accounts managed by an admin panel. The auth middleware is structured so SSO can be added later without changing protected routes. This requires coordination with the hospital IT team to obtain IdP configuration details.

### A — PHI sent to OpenAI (also has a P0 code component)
**Fact:** AI features send questionnaire + vitals to OpenAI; **discharge generation sends patient name + national ID**; diagnosis sends patient name.
**Options (decide with the CTO/legal):**
1. **De-identify before sending** — strip name + national ID from all OpenAI payloads (code change; reduces exposure significantly). *Recommended as a minimum and can be done now.*
2. **Sign an OpenAI DPA / use the zero-data-retention API tier** so data is not retained/trained on.
3. **Move to an in-region or self-hosted model** (e.g. EU/Israel-hosted) if cloud-US egress is unacceptable to the hospital.
**Acceptance:** A documented, approved decision; code reflects it (at minimum, no direct identifiers leave to OpenAI without an executed agreement).

### B — Cross-region data residency
**Fact:** API in Frankfurt (Render), DB in Tokyo (Atlas `ap-northeast-1`), AI in US (OpenAI).
**Action:** Confirm the hospital's permitted data-residency regions and **co-locate** components accordingly (e.g. all in EU, or in-country). Document the final residency map.

### C — Data Processing Agreements & retention
**Action:** Establish DPAs / processing terms with **all** sub-processors (Vercel, Render, MongoDB Atlas, OpenAI, Cloudflare). Define data retention and deletion policy for cases/questionnaires.

---

## Suggested sequencing (milestones)

**Milestone 1 — Stop the bleeding (P0)**
Auth + RBAC (P0-1/2/3) → gated endpoints (P0-4) → lock down Atlas (P0-5) → rotate/secure secrets (P0-6). In parallel: de-identify OpenAI payloads (POLICY-A option 1) and open the residency/DPA conversation (POLICY-B/C).

**Milestone 2 — Pen-test readiness (P1)**
Audit logging, security headers, rate limiting, input validation, ownership checks, error hygiene.

**Milestone 3 — Finalize documentation**
Write/finalize the CTO documentation package describing the **secured** system (system overview, architecture + diagram, data-flow & residency, interfaces, security controls & gap closure).

**Milestone 4 — Penetration test**
Engage testers against the hardened system; track findings back to this plan; remediate; re-test.

**Ongoing — P2 hardening** as capacity allows.

---

## Mapping to the CTO's pen-test concerns

| CTO concern | Addressed by |
|-------------|--------------|
| Permissions / authorization structure (מבנה הרשאות) | P0-1, P0-2, P0-3, P1-11 |
| Back doors | P0-3 (remove client passcodes), P0-6 (secrets), P2-15 (secret/history scan) |
| Data leaving the hospital network (ענן) | POLICY-A/B/C, P0-5 |
| General exposure | P1-8, P1-9, P1-10, P1-12, P1-13 |

---

*Next step after sign-off:* begin **Milestone 1 (P0)** implementation, starting with authentication + RBAC.
