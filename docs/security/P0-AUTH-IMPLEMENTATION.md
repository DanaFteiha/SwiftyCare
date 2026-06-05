# P0 — Authentication & Authorization (Implemented)

This note records the P0 security work that has landed and the **operational steps required before deploying** (without them, login will not work in production).

---

## What changed

### Backend (`apps/api`)
- **Real authentication**: `POST /api/auth/login` verifies a username + password against a **bcrypt hash** and returns a short-lived **JWT** (default 12h). `GET /api/auth/me` returns the current principal.
- **JWT secret fail-closed**: the server refuses to start in production without `JWT_SECRET` (≥16 chars). In dev it uses an ephemeral secret.
- **RBAC on every case endpoint** via `requireStaff(...roles)`:
  | Endpoint | Allowed roles |
  |---|---|
  | `GET /cases`, `GET /cases/:id/questionnaire` | doctor, nurse, admin |
  | `POST /cases` (intake) | intake, nurse, doctor, admin |
  | `POST /cases/:id/vitals`, `PATCH /cases/:id/status` | nurse, doctor, admin |
  | `POST /cases/:id/order-tests`, `summary`, `diagnosis`, `discharge-report/*` | doctor, admin |
  | `DELETE /cases/:id` | doctor, admin |
- **Patient case tokens**: creating a case returns a short-lived, case-scoped token (`patientCaseToken`) that authorises **only** submitting the questionnaire for that one case and reading a **PHI-minimised** view of it (no national ID, no clinical fields).
- **Status transition moved server-side**: completing the questionnaire sets the case to `awaiting_vitals` on the server (the patient token no longer needs status-change rights).
- New files: `config/auth.ts`, `models/User.ts`, `middleware/auth.ts`, `routes/authRoutes.ts`, `services/seedUsers.ts`.

### Frontend (`apps/web`)
- Doctor/Nurse login pages now use **username + password** → server login → JWT (no more client-side passcodes).
- New **intake/kiosk login** (`/intake/login`); patient-intake pages (`/`, `/scan`, `/patient`) are gated behind `IntakeRoute`.
- `apiFetch` automatically attaches the staff bearer token; patient flows attach the case token explicitly.
- Removed `VITE_DOCTOR_PASSCODE` / `VITE_NURSE_PASSCODE` (no credentials in the client bundle).

### Verification
End-to-end smoke test passed: unauthenticated → 401; valid login → token; doctor token → 200; wrong password → 401; nurse → doctor-only endpoint → 403; intake create → 201 + case token; patient token works for its own case only (403 for others); patient token cannot list cases. Both `apps/api` and `apps/web` type-check and build.

---

## Required BEFORE deploying (otherwise login breaks)

### 1. API environment variables (Render)
```
JWT_SECRET=<random — generate with: openssl rand -hex 48>
MONGODB_URI=<rotated Atlas connection string>
OPENAI_API_KEY=<rotated key>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<strong password, 16+ chars>
```
- Only **one admin account** is seeded from env vars. All doctors, nurses, and intake staff are added individually through the admin panel (see *Account model* below).
- In production nothing is seeded unless `ADMIN_USERNAME` + `ADMIN_PASSWORD` are provided.
- Existing accounts are never overwritten.

### 2. Remove obsolete web env vars (Vercel)
- Delete `VITE_DOCTOR_PASSCODE` and `VITE_NURSE_PASSCODE` — these no longer exist.

### 3. Operational hardening (not code — must be done by ops)
- **P0-6 (done now)**: Rotate the **OpenAI API key** and **MongoDB credentials**; store only in Render/Vercel secret stores.
- **P0-5 (deferred — free tier)**: MongoDB Atlas network access is currently `0.0.0.0/0` because Render's free tier does not provide static outbound IPs. **This must be locked down before the system goes live with real patient data.** Action: upgrade Render to a paid plan → get static outbound IPs → replace `0.0.0.0/0` in Atlas with those IPs. Tracked as a known open item.

---

## Account model (decided)

| Who | Auth method | How accounts are created |
|---|---|---|
| **Patients** | No login — 3-hour case-scoped token issued on intake | Automatic (no action needed) |
| **Admin** | Username + password (seeded from env var on first boot) | One account via `ADMIN_USERNAME`/`ADMIN_PASSWORD` |
| **Doctors / Nurses / Intake staff** | Username + password (individual accounts) | Admin creates each person one-by-one via the admin panel |
| **Future** | Hospital SSO (OIDC/SAML) | Integration with hospital identity provider (planned, not yet built) |

### Hospital SSO — planned
For a full hospital deployment, doctors and nurses should authenticate with their **existing hospital credentials** via the hospital's identity provider (OIDC or SAML). This removes the need to manage SwiftyCare-specific passwords and ensures access is automatically revoked when a staff member leaves the hospital. This is planned for the next major iteration and requires coordination with the hospital IT team. The current individual-account model is explicitly designed as an interim solution and the auth middleware is structured so SSO can be added without changing protected routes.

---

## Dev login (local only)
When no credentials are configured in development, these accounts are seeded automatically (**DO NOT use in production**):
`admin/admin12345`, `doctor/doctor12345`, `nurse/nurse12345`, `intake/intake12345`.
