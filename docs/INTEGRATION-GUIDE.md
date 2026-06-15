# SwiftyCare — Integration Guide & API Reference

**Version:** 1.0  
**Date:** June 2026  
**Audience:** Hospital IT department, integration engineers  
**Base URL (production):** `https://swiftycare.onrender.com`

---

## 1. System Overview

SwiftyCare is a digital patient intake and clinical workflow platform. It digitises the triage process from the moment a patient arrives at the kiosk through to the doctor's discharge report.

### What it does

| Phase | Who | What happens |
|---|---|---|
| **Intake** | Patient at kiosk | Enters name and national ID. Completes an adaptive symptom questionnaire (no account required). |
| **Nurse triage** | Nurse | Reviews intake. Records vital signs (BP, HR, SpO₂, temperature, respiratory rate, pain score). |
| **Clinical review** | Doctor | Reviews full case. Requests AI-assisted differential diagnosis. Writes and finalises discharge report. |
| **Administration** | Admin | Manages staff accounts (create, edit, deactivate). |

### What it does NOT do (current version)

- It does not read from or write to the hospital's existing HIS/EMR system automatically.
- It does not send lab orders to a lab information system (LIS).
- It does not connect to PACS (imaging).
- It does not bill or code (ICD / SNOMED).

These are **integration opportunities** — see Section 6.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, served via Vercel CDN |
| Backend API | Node.js 18 + Express + TypeScript, hosted on Render (Frankfurt) |
| Database | MongoDB Atlas 8.0 (replica set), hosted on AWS Tokyo |
| AI | OpenAI GPT-4o API (US) — patient name & national ID stripped before transmission |
| Auth | JWT (HS256), bcrypt password hashing |
| Transport | HTTPS (TLS 1.2+) throughout |

---

## 3. Authentication

All staff-facing API endpoints require a Bearer token in the `Authorization` header.

### 3.1 Login

```
POST /api/auth/login
Content-Type: application/json
```

**Request body:**
```json
{
  "username": "dr.cohen",
  "password": "••••••••"
}
```

**Success response `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "role": "doctor",
    "displayName": "Dr. Cohen"
  }
}
```

**Error responses:**
| Status | Meaning |
|---|---|
| `401` | Invalid credentials or inactive account |
| `503` | Database unavailable |

**Token usage:**  
Include the token in subsequent requests:
```
Authorization: Bearer <token>
```

Tokens are valid for **15 minutes of inactivity** (configurable). A new login is required after expiry.

### 3.2 Verify token

```
GET /api/auth/me
Authorization: Bearer <token>
```

**Success response `200`:**
```json
{
  "role": "doctor",
  "displayName": "Dr. Cohen"
}
```

---

## 4. API Reference

All endpoints return `Content-Type: application/json`.  
All error responses follow the shape: `{ "error": "...", "message": "..." }`.

### 4.1 Cases

#### Create case (public — no login required)

```
POST /api/cases
Content-Type: application/json
```

**Request body:**
```json
{
  "patientName": "Ahmed Al-Masri",
  "nationalId": "123456782",
  "hospital": "Rambam Medical Center"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `patientName` | string | Yes | 1–100 characters |
| `nationalId` | string | Yes | 9-digit Israeli national ID, Luhn checksum validated |
| `hospital` | string | No | 1–200 characters |

**Success response `201`:**
```json
{
  "case": {
    "_id": "6abc123...",
    "patientName": "Ahmed Al-Masri",
    "nationalId": "123456782",
    "hospital": "Rambam Medical Center",
    "status": "awaiting_vitals",
    "createdAt": "2026-06-15T10:00:00.000Z"
  },
  "patientCaseToken": "eyJ..."
}
```

> The `patientCaseToken` is a short-lived JWT scoped to this specific case. Use it in the `Authorization` header to submit the questionnaire. It grants no access to any other case or any staff endpoint.

**Error responses:**
| Status | `hint` | Meaning |
|---|---|---|
| `400` | `active_case_exists` | An open case already exists for this national ID |
| `400` | — | Validation error (invalid ID format/checksum) |
| `503` | — | Database unavailable |

---

#### List all cases

```
GET /api/cases
Authorization: Bearer <staff-token>
```

Roles allowed: `admin`, `doctor`, `nurse`

**Success response `200`:**
```json
{
  "count": 3,
  "cases": [
    {
      "_id": "6abc123...",
      "patientName": "Ahmed Al-Masri",
      "nationalId": "123456782",
      "status": "open",
      "vitals": { "bloodPressureSystolic": 120, "bloodPressureDiastolic": 80, "heartRate": 72 },
      "createdAt": "2026-06-15T10:00:00.000Z",
      "questionnaireSubmittedAt": "2026-06-15T10:05:00.000Z"
    }
  ]
}
```

---

#### Get single case

```
GET /api/cases/:id
Authorization: Bearer <staff-token or patient-case-token>
```

Roles allowed: `admin`, `doctor`, `nurse`, patient (own case only — PHI-minimised response)

**Success response `200` (staff):** Full case document including vitals, AI diagnosis, discharge report.

**Success response `200` (patient):** PHI-minimised — only `_id`, `patientName`, `hospital`, `status`.

---

#### Submit questionnaire

```
POST /api/cases/:id/questionnaire
Authorization: Bearer <patient-case-token or staff-token>
Content-Type: application/json
```

**Request body:**
```json
{
  "answers": {
    "chiefComplaint": "chest_pain",
    "painDuration": "hours",
    "painRadiates": true,
    "pastMedicalHistory": ["hypertension", "diabetes"],
    "currentMedications": "aspirin 100mg",
    "allergies": "penicillin"
  }
}
```

The `answers` object is free-form JSON — any key/value structure is accepted. Keys are determined by the frontend questionnaire logic (`symptomPathways.ts`).

**Success response `201`:** Questionnaire document. Case status is set to `awaiting_vitals`.

---

#### Read questionnaire (staff only)

```
GET /api/cases/:id/questionnaire
Authorization: Bearer <staff-token>
```

Roles allowed: `admin`, `doctor`, `nurse`

---

#### Update vitals

```
POST /api/cases/:id/vitals
Authorization: Bearer <staff-token>
Content-Type: application/json
```

Roles allowed: `admin`, `doctor`, `nurse`

**Request body (all fields optional, at least one required):**
```json
{
  "bloodPressureSystolic": 120,
  "bloodPressureDiastolic": 80,
  "heartRate": 72,
  "temperature": 37.2,
  "oxygenSaturation": 98,
  "respiratoryRate": 16,
  "painScore": 3
}
```

When vitals are saved, the case status automatically advances from `awaiting_vitals` → `open` (doctor queue).

---

#### Update case status

```
PATCH /api/cases/:id/status
Authorization: Bearer <staff-token>
Content-Type: application/json
```

Roles allowed: `admin`, `doctor`, `nurse`

**Request body:**
```json
{
  "status": "in_progress"
}
```

Allowed status values: `awaiting_vitals` | `open` | `in_progress` | `tests_ordered` | `cancelled`

> To close a case (status `closed`), use the finalize discharge report endpoint — this is the only path to closure.

---

#### Order tests

```
POST /api/cases/:id/order-tests
Authorization: Bearer <staff-token>
Content-Type: application/json
```

Roles allowed: `admin`, `doctor`

**Request body:**
```json
{
  "tests": ["CBC", "CMP", "chest X-ray", "ECG"]
}
```

---

#### Generate AI summary

```
POST /api/cases/:id/summary
Authorization: Bearer <staff-token>
Content-Type: application/json
```

Roles allowed: `admin`, `doctor`

**Request body:**
```json
{ "language": "he" }
```

`language`: `"en"` (default) or `"he"` (Hebrew)

**Success response `200`:**
```json
{ "summary": "Patient presents with chest pain..." }
```

---

#### Generate AI differential diagnosis

```
POST /api/cases/:id/diagnosis
Authorization: Bearer <staff-token>
Content-Type: application/json
```

Roles allowed: `admin`, `doctor`

**Request body:**
```json
{ "language": "he" }
```

**Success response `200`:**
```json
{
  "diagnosis": "Differential diagnosis:\n1. Acute coronary syndrome...",
  "caseId": "6abc123..."
}
```

---

#### Generate discharge report (AI)

```
POST /api/cases/:id/discharge-report/generate
Authorization: Bearer <staff-token>
Content-Type: application/json
```

Roles allowed: `admin`, `doctor`

**Request body:**
```json
{
  "language": "he",
  "action": "generate"
}
```

`action`: `"generate"` (default) | `"improve"` | `"shorten"`

**Success response `200`:**
```json
{ "report": "Discharge summary:\n\nPatient: ..." }
```

---

#### Save discharge report draft

```
PUT /api/cases/:id/discharge-report
Authorization: Bearer <staff-token>
Content-Type: application/json
```

Roles allowed: `admin`, `doctor`

**Request body:**
```json
{ "draft": "Discharge summary text edited by doctor..." }
```

---

#### Finalize discharge report

```
POST /api/cases/:id/discharge-report/finalize
Authorization: Bearer <staff-token>
Content-Type: application/json
```

Roles allowed: `admin`, `doctor`

**Request body:**
```json
{ "draft": "Final discharge summary text..." }
```

This is the **only** path to closing a case. Sets `status: "closed"` and stamps `finalizedAt`.

---

#### Delete case

```
DELETE /api/cases/:id
Authorization: Bearer <staff-token>
```

Roles allowed: `admin`, `doctor`

---

### 4.2 Staff Account Management (Admin only)

#### List staff accounts

```
GET /api/users
Authorization: Bearer <admin-token>
```

#### Create staff account

```
POST /api/users
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request body:**
```json
{
  "username": "dr.cohen",
  "password": "SecurePass123!",
  "role": "doctor",
  "displayName": "Dr. Sarah Cohen"
}
```

`role`: `"admin"` | `"doctor"` | `"nurse"`

---

#### Update staff account

```
PATCH /api/users/:id
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request body (all optional):**
```json
{
  "displayName": "Dr. Sarah Cohen",
  "role": "doctor",
  "active": false,
  "password": "NewPassword456!"
}
```

Setting `active: false` deactivates the account (soft disable — login is rejected, account preserved in logs).

---

#### Delete staff account

```
DELETE /api/users/:id
Authorization: Bearer <admin-token>
```

---

### 4.3 Case Status Lifecycle

```
[Patient registers]
        ↓
  awaiting_vitals   ← Nurse queue. Questionnaire submitted.
        ↓ (nurse enters vitals)
      open          ← Doctor queue. Ready for clinical review.
        ↓ (doctor opens case)
   in_progress
        ↓ (doctor orders labs)
  tests_ordered
        ↓ (doctor finalizes discharge report)
     closed         ← Terminal. Discharge report finalized.

  cancelled         ← Admin/doctor can set at any stage.
```

---

## 5. Rate Limits

| Endpoint group | Limit |
|---|---|
| All endpoints | 300 requests / 15 min / IP |
| `POST /api/auth/login` | 10 requests / 15 min / IP |
| AI endpoints (diagnosis, discharge, summary) | 20 requests / hour / user |
| `POST /api/cases` (case creation) | 10 requests / hour / IP |

When a limit is exceeded, the API returns `429 Too Many Requests`.

---

## 6. Integration with Hospital Information System (HIS/EMR)

This section addresses the hospital's question about connecting SwiftyCare to existing hospital systems and the associated effort and cost.

### 6.1 Integration options (low → high effort)

| Option | Description | Effort | Notes |
|---|---|---|---|
| **A — No integration (current)** | SwiftyCare operates independently. Staff search for patients manually. | 0 days | Suitable for pilot phase. |
| **B — Discharge report export** | On case close, push the discharge report text to the HIS via a webhook or HL7 message. | ~3–5 days | Requires hospital to expose an HL7 or REST endpoint. |
| **C — Patient lookup** | On registration, query the HIS for patient demographics by national ID (autofill name, DOB, allergies). | ~5–8 days | Requires hospital to expose a patient demographics API (FHIR `Patient` resource or HL7 v2 `QRY^A19`). |
| **D — Lab orders** | Push ordered tests from SwiftyCare to the hospital LIS (lab information system). Receive results back. | ~10–15 days | Requires HL7 `ORM^O01` / `ORU^R01` interface with the LIS, or FHIR `ServiceRequest` / `DiagnosticReport`. |
| **E — Full bidirectional EMR sync** | Real-time sync of all case data with the EMR (admit, discharge, transfer — ADT). | ~20–30 days | Requires HL7 ADT interface or FHIR R4 full implementation. Hospital IT involvement essential. |

### 6.2 Recommended path for this hospital

**Phase 1 (pilot — 0 integration):** Run SwiftyCare standalone. Staff reference the HIS separately. Zero integration cost. Validates clinical value before committing IT resources.

**Phase 2 (Option B — discharge export, ~1 week):** After pilot sign-off, automate pushing the finalized discharge report into the HIS. This is the highest-value, lowest-effort integration. SwiftyCare already exposes the `POST /api/cases/:id/discharge-report/finalize` event which can trigger a webhook.

**Phase 3 (Option C — patient lookup, ~1–2 weeks):** Autofill patient data from HIS on registration to eliminate double entry and reduce errors.

### 6.3 What SwiftyCare needs to provide integration

SwiftyCare's API is ready for integration today. The bottleneck is typically on the hospital side:

| What is needed from the hospital | Purpose |
|---|---|
| REST or FHIR endpoint for patient demographics | Option C — patient lookup |
| REST webhook receiver or HL7 listener for discharge reports | Option B — discharge export |
| HL7 interface engine IP address / port | Options D, E — lab orders / ADT |
| Integration engine or middleware (e.g. Mirth Connect, Rhapsody) | Recommended for all HL7 options |

### 6.4 SSO / Identity integration

Currently, staff use individual username/password accounts managed in SwiftyCare's admin panel. The authentication middleware is built to support OIDC/SAML SSO without changes to any API routes. 

**To connect hospital SSO (e.g. Microsoft Azure AD, Okta, hospital IdP):**

- Effort: ~3–5 days (backend) + hospital IdP configuration
- Requires: OIDC client credentials or SAML metadata from hospital IT
- Benefit: Staff use their existing hospital credentials. No separate SwiftyCare passwords.

---

## 7. Webhook / Event Integration (Proposed)

SwiftyCare does not currently send outbound webhooks, but this can be added in ~1–2 days per event. Proposed events that the hospital system could subscribe to:

| Event | When it fires | Payload |
|---|---|---|
| `case.created` | Patient registers | `{ caseId, nationalId, createdAt }` |
| `case.vitals.updated` | Nurse enters vitals | `{ caseId, vitals, updatedAt }` |
| `case.discharge.finalized` | Doctor finalises discharge | `{ caseId, dischargeReport, finalizedAt }` |
| `case.status.changed` | Any status change | `{ caseId, oldStatus, newStatus, changedAt }` |

---

## 8. FHIR Compatibility Note

SwiftyCare uses a custom JSON data model today. A FHIR R4 adapter layer can be built to expose case data as standard FHIR resources (`Patient`, `Encounter`, `Observation`, `DiagnosticReport`, `DocumentReference`). Estimated effort: 10–15 days. This would make SwiftyCare compatible with any FHIR-capable HIS without changes to either system's core.

---

## 9. Effort & Cost Summary

| Integration scenario | Development effort | Notes |
|---|---|---|
| Standalone pilot (no integration) | 0 | Ready now |
| Hospital SSO | ~3–5 days | Requires IdP details from hospital IT |
| Discharge report export to HIS | ~3–5 days | Requires webhook endpoint from hospital |
| Patient demographics autofill | ~5–8 days | Requires demographics API from hospital |
| Lab order integration (LIS) | ~10–15 days | Requires HL7 interface from hospital |
| Full ADT / EMR sync | ~20–30 days | Full hospital IT project |
| FHIR R4 adapter layer | ~10–15 days | Enables compatibility with any FHIR HIS |

> All estimates are development days for the SwiftyCare side only. Hospital IT effort (exposing APIs, configuring interface engines, IdP setup) is separate and depends on the hospital's existing infrastructure.

---

## 10. Available Documents

| Document | Description |
|---|---|
| `docs/SYSTEM-OVERVIEW.md` | Non-technical one-pager: what SwiftyCare is and what problem it solves |
| `docs/security/CTO-DOCUMENTATION.md` | Security & architecture documentation for information security review |
| `docs/security/REMEDIATION-PLAN.md` | Security remediation plan (P0/P1/P2 items) |
| `docs/security/P0-AUTH-IMPLEMENTATION.md` | Authentication implementation details |
| `docs/INTEGRATION-GUIDE.md` | This document — API reference and HIS integration guide |

---

*SwiftyCare Integration Guide · Engineering team · June 2026*
