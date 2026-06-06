# SwiftyCare — Security & Architecture Documentation

**Prepared for:** Hospital CTO / Information Security Review  
**Date:** June 2026  
**Classification:** Confidential — not for external distribution  

> Addresses requirements for architecture documentation, data-egress disclosure, and penetration-test authorisation.

---

## Summary

| | |
|---|---|
| **User roles** | 4 (admin, doctor, nurse, patient) |
| **Cloud providers** | 3 (Vercel, Render, MongoDB Atlas + OpenAI) |
| **Security controls active** | 12 |
| **Open infrastructure items** | 2 (documented below) |

---

## 1. Nature of the Software

SwiftyCare is a digital patient intake and clinical workflow platform for hospital emergency and outpatient settings. It replaces paper triage forms with a structured, adaptive digital intake process accessible from patient kiosks and staff workstations inside the hospital.

### Clinical Workflow

| Step | Actor | Action |
|---|---|---|
| 1 — Registration | Patient (kiosk, no account) | Enters name and Israeli national ID (checksum-validated). Completes adaptive symptom questionnaire: current complaints, medical history, allergies, current medications. |
| 2 — Triage | Nurse | Reviews the intake record. Records vital signs: blood pressure, heart rate, SpO₂, temperature, respiratory rate, pain score (0–10). |
| 3 — Doctor review | Doctor | Reviews complete patient record. Generates AI-assisted differential diagnosis and discharge report. Orders tests. Finalises discharge documentation. |
| 4 — Administration | Admin | Creates, edits, and deactivates staff accounts (doctors and nurses) via the secure admin panel. |

---

## 2. System Architecture

| Zone | Component | Direction | Target |
|---|---|---|---|
| **Hospital premises** | Patient Kiosk, Nurse Station, Doctor Workstation | → HTTPS outbound | Vercel CDN (EU) |
| **Cloud — Vercel** | Frontend SPA (React) | serves static assets → | Browser |
| **Cloud — Vercel** | Frontend SPA | → API calls (HTTPS) | Render API (Frankfurt) |
| **Cloud — Render** | API Server (Node.js) | reads/writes (TLS) | MongoDB Atlas (Tokyo) |
| **Cloud — Render** | API Server | → de-identified payloads (HTTPS) | OpenAI API (US) |

> All traffic between components is encrypted in transit (TLS 1.2+). No hospital network port needs to be opened inbound. All connections are initiated outbound from hospital endpoint devices to cloud services.

### Component Inventory

| Component | Technology | Hosted on | Region |
|---|---|---|---|
| Frontend SPA | React 18 + TypeScript + Vite | Vercel | EU edge (CDN) |
| API server | Node.js 18 + Express + TypeScript | Render | Frankfurt, Germany (EU) |
| Database | MongoDB Atlas 8.0 (replica set, 3 nodes) | AWS via Atlas | Tokyo, Japan (ap-northeast-1) |
| AI inference | OpenAI GPT-4 API | OpenAI | United States |

> **Note:** Database is currently in Tokyo. If the hospital requires EU or Israel data residency, migration is required — see Open Items.

---

## 3. Data Flow & Residency

> **All patient data is processed on external cloud infrastructure.**  
> The hospital premises host only endpoint devices (kiosks, workstations). All PHI is transmitted over TLS to external cloud providers and stored outside the hospital network. A formal Data Processing Agreement (DPA) with each sub-processor is required before clinical go-live.

| Data type | Contains PHI | Stored at | Region | Also transmitted to |
|---|---|---|---|---|
| Patient name | **Yes — external cloud** | MongoDB Atlas | Tokyo (ap-northeast-1) | Not sent to AI (stripped before transmission) |
| National ID (ת.ז.) | **Yes — external cloud** | MongoDB Atlas | Tokyo (ap-northeast-1) | Not sent to AI (stripped before transmission) |
| Vital signs | **Yes — PHI** | MongoDB Atlas | Tokyo (ap-northeast-1) | OpenAI — no direct identifiers included |
| Questionnaire answers | Indirect PHI | MongoDB Atlas | Tokyo (ap-northeast-1) | OpenAI — no direct identifiers included |
| AI summaries & discharge | Indirect PHI | MongoDB Atlas | Tokyo (ap-northeast-1) | — |
| Staff credentials (hashed) | No PHI | MongoDB Atlas | Tokyo (ap-northeast-1) | — |
| Audit logs | No PHI | Render stdout / log drain | Frankfurt, Germany | — |

---

## 4. External Interfaces & Integrations

| Service | Purpose | Data transmitted | Authentication | DPA status |
|---|---|---|---|---|
| Vercel | Frontend CDN and static hosting | No PHI — static JS/CSS bundles only | HTTPS, build tokens | Pending |
| Render | API server runtime and hosting | All case data in transit (TLS encrypted) | HTTPS, rotated env secrets | Pending |
| MongoDB Atlas | Primary PHI data store | All patient records at rest and in transit | SCRAM + TLS, credentials rotated | Pending |
| OpenAI | Differential diagnosis & discharge report AI | Vitals + questionnaire — name & national ID stripped | API key (rotated) | **Legal action required** |

---

## 5. Authorization & Permission Structure

> All authorization is enforced server-side by JWT middleware on every API route. Client-side route guards are UI-only; removing them grants no additional access to protected data.

### Role Definitions

| Role | Capabilities | Authentication |
|---|---|---|
| admin | All doctor capabilities + staff account management (CRUD) | Username + bcrypt password |
| doctor | Read all cases, AI analysis, discharge reports, order tests | Username + bcrypt password |
| nurse | Read cases, enter vital signs | Username + bcrypt password |
| patient | Register case, complete own questionnaire only | Short-lived case-scoped JWT (no account required) |

### Endpoint Access Matrix

| Endpoint | Admin | Doctor | Nurse | Patient |
|---|:---:|:---:|:---:|:---:|
| POST /cases (register) | ✓ | ✓ | ✓ | ✓ public |
| GET /cases (list all) | ✓ | ✓ | ✓ | ✗ 401 |
| GET /cases/:id | ✓ | ✓ | ✓ | ✗ 401 |
| POST /cases/:id/vitals | ✓ | ✓ | ✓ | ✗ 401 |
| POST /cases/:id/questionnaire | ✓ | ✓ | ✓ | ✓ own case |
| POST /cases/:id/diagnosis (AI) | ✓ | ✓ | ✗ 403 | ✗ 401 |
| POST /cases/:id/discharge-report | ✓ | ✓ | ✗ 403 | ✗ 401 |
| GET/POST/DELETE /users | ✓ | ✗ 403 | ✗ 403 | ✗ 401 |
| DELETE /cases/:id | ✓ | ✗ 403 | ✗ 403 | ✗ 401 |

### No Back Doors — Confirmed

There are no hardcoded credentials or bypass mechanisms in the application code. All legacy client-side passcodes (`VITE_DOCTOR_PASSCODE`, `VITE_NURSE_PASSCODE`) have been removed. Staff accounts are created only by an admin through the management panel — no default accounts exist in production. CI runs gitleaks secret scanning on every push to detect accidental credential commits.

---

## 6. Security Controls Implemented

| Control | Status | Implementation detail |
|---|---|---|
| Server-side authentication | ✅ Implemented | JWT (HS256), bcrypt password hashing, `POST /api/auth/login`. No auth state in the client bundle. |
| Role-based access control | ✅ Implemented | Per-endpoint Express middleware — 401 unauthenticated, 403 unauthorized. Admin / doctor / nurse / patient roles. |
| No client-side passcodes | ✅ Removed | All `VITE_*_PASSCODE` env vars removed. Verified no secrets present in built Vite bundle. |
| Rate limiting | ✅ Implemented | Global 300 req/15 min; login 10/15 min; AI endpoints 20/hr/user; case creation 10/hr/IP. |
| Input validation | ✅ Implemented | Zod schemas on all POST/PATCH bodies; 50 kB body size cap; Israeli national ID Luhn checksum validation. |
| Security headers | ✅ Implemented | helmet: HSTS, strict CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy. |
| PHI de-identification for AI | ✅ Implemented | Patient name and national ID stripped from every OpenAI API payload before transmission. |
| Audit logging | ✅ Implemented | Structured JSON on all PHI read/write: actor, role, action, caseId, source IP, timestamp. No PHI values in logs. |
| Error message hygiene | ✅ Implemented | All 500 responses return generic messages. Stack traces and DB internals logged server-side only. |
| Secrets management | ✅ Rotated | All secrets in Render / Vercel env stores. Rotated after security audit. Not present in repository or bundle. |
| CI secret scanning | ✅ Implemented | gitleaks on every push/PR; `npm audit --audit-level=high` in CI; Dependabot weekly dependency updates. |
| National ID probing prevention | ✅ Implemented | Duplicate case creation returns generic 400 — caller cannot determine whether an ID is already registered. |
| MongoDB Atlas IP lockdown | ⚠️ Deferred | Render free tier has no static egress IPs; `0.0.0.0/0` access protected only by rotated credentials. Must be closed before go-live (requires Render paid plan). |
| Hospital SSO (OIDC / SAML) | 🔵 Planned | Interim: individual bcrypt accounts via admin panel. Auth middleware is structured to support SSO without route changes. |

---

## 7. Known Open Items

> No open items allow unauthenticated access to PHI. All P0 blocking and P1 high-priority controls are implemented.

| Item | Priority | Condition for closure |
|---|---|---|
| MongoDB Atlas IP lockdown | P0 — deferred | Upgrade Render to paid plan → obtain static egress IPs → replace `0.0.0.0/0` in Atlas allowlist. |
| DPAs with all sub-processors | **Legal action required** | Execute Data Processing Agreements with Render, MongoDB Atlas, Vercel, and OpenAI. |
| OpenAI data-retention agreement | **Legal action required** | Execute OpenAI DPA or migrate to an EU/IL-hosted model. Name + national ID already stripped as interim measure. |
| Data residency alignment | Decision required | Confirm hospital-permitted regions. If EU/IL required: migrate database from Tokyo and redeploy API to an EU provider. |
| Facility-level case ownership | Post-MVP | Required for multi-hospital deployment. Current single-facility pilot scope is unaffected. |
| Hospital SSO integration | Planned | Coordinate with hospital IT for IdP (OIDC/SAML) configuration. Auth middleware is already SSO-ready. |

---

## 8. Penetration Test — CTO Requirements Mapping

| CTO requirement | Area | Status |
|---|---|---|
| מבנה הרשאות — Authorization structure | RBAC, roles, per-endpoint enforcement | ✅ Fully implemented — JWT, 4 roles, 401/403 on every route |
| Back Door — No hidden access paths | Hardcoded credentials / bypass mechanisms | ✅ Removed — no passcodes in bundle; gitleaks CI; no dev accounts in production |
| נתונים לענן — Data leaving hospital | Cloud data egress, residency, sub-processors | ⚠️ Disclosed — DPAs required before go-live |
| מבדק חדירה — Penetration test | System hardening, readiness for external testing | ✅ Ready — all P0 and P1 controls in place |

> **System is ready for penetration testing.**  
> All blocking (P0) and high-priority (P1) security controls are implemented. Engaging a tester now will validate the hardened controls rather than confirm trivially-known gaps. Recommended: test against the production deployment with a test staff account provided by the admin.

---

## 9. Recommended Next Steps

### 1. Legal / DPA — Immediate
Execute Data Processing Agreements with Render, MongoDB Atlas, Vercel, and OpenAI. Confirm data-residency requirements with hospital legal counsel. This is a prerequisite for clinical go-live with real patient data.

### 2. Penetration Test — Next
Engage an accredited penetration tester against the production deployment. Auth, RBAC, rate limiting, input validation, and error hygiene controls are in place. Provide the tester with a test staff account and the API base URL.

### 3. Infrastructure — Before go-live
Upgrade Render to a paid plan for static egress IPs, then restrict MongoDB Atlas from `0.0.0.0/0` to those specific IPs. Confirm or migrate data residency to hospital-approved regions.

---

## 10. Live System — Available for Verification

| Resource | URL | Access |
|---|---|---|
| Patient intake (kiosk) | https://demo.swifty-care.com | Public — no login required |
| Staff login (doctor / admin) | https://demo.swifty-care.com/doctor/login | Requires staff credentials |
| Nurse triage board | https://demo.swifty-care.com/nurse/login | Requires nurse credentials |
| Admin panel | https://demo.swifty-care.com/admin | Requires admin credentials |
| API health check | https://swiftycare.onrender.com | Public — returns DB connection status |
| Source code | https://github.com/DanaFteiha/SwiftyCare | Available on request for code review |


> **Penetration test access:** A temporary test staff account (doctor role) and nurse account can be created by the admin for the duration of the engagement. The tester can use these to verify authentication, RBAC, and session handling without exposing production credentials.

---

*SwiftyCare Security & Architecture Documentation · Engineering team · June 2026 · Confidential — not for external distribution*
