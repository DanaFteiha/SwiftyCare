# SwiftyCare — System Overview

**Date:** June 2026  
**Prepared by:** SwiftyCare Engineering Team

---

## What is SwiftyCare?

SwiftyCare is a **digital patient intake and clinical workflow platform** designed for hospital emergency and outpatient departments. It replaces paper triage forms with a structured, adaptive digital process — from the moment a patient arrives at a kiosk to the moment a doctor finalises a discharge report.

The system is built to reduce administrative friction for clinical staff, improve the speed and completeness of patient intake, and provide doctors with AI-assisted clinical decision support.

---

## The Problem It Solves

Today, most hospitals rely on paper forms or slow manual data entry during patient triage. This creates:

- **Incomplete intake data** — patients fill out forms inconsistently; key clinical information is missed.
- **Waiting time that isn't tracked** — no one knows how long a patient has actually been waiting.
- **Information silos** — nurses record vitals on paper; doctors receive incomplete handoffs.
- **No clinical support at the point of care** — doctors write discharge summaries and differential diagnoses from scratch, with no assistance.

SwiftyCare addresses all of these.

---

## How It Works

### Step 1 — Patient arrives at the kiosk (no account, no login)

The patient sits at a tablet kiosk at the entrance to the department. They enter their name and Israeli national ID number. The system validates the ID in real time.

They then answer an **adaptive questionnaire**: the questions asked depend on the symptoms they report. A patient reporting chest pain sees a different set of questions than one reporting a rash. The questionnaire covers chief complaint, medical history, current medications, allergies, and relevant red-flag symptoms.

No staff involvement is needed at this stage. The patient completes this independently.

### Step 2 — Nurse triage

The nurse sees all waiting patients in a live queue, sorted by waiting time. For each patient, they review the intake questionnaire and record vital signs: blood pressure, heart rate, oxygen saturation, temperature, respiratory rate, and pain score (0–10).

Once vitals are saved, the case automatically moves to the doctor's queue.

### Step 3 — Doctor review

The doctor sees their queue of cases ready for review. For each case, they have the full intake questionnaire and vitals in front of them. They can:

- Generate an AI-assisted **differential diagnosis** based on the patient's clinical data.
- Order tests (CBC, ECG, X-ray, etc.) with a single click.
- Generate an AI-assisted **discharge summary** in Hebrew or English, then edit and finalise it.

Finalising the discharge report closes the case and records the outcome.

### Step 4 — Administration

An admin user manages staff accounts: creating, editing, and deactivating doctor and nurse accounts through a secure admin panel. No technical knowledge is required.

---

## Who Uses It

| User | Role in SwiftyCare |
|---|---|
| Patient | Completes digital intake at kiosk. No account required. |
| Nurse | Records vitals, monitors triage queue. |
| Doctor | Reviews cases, generates AI diagnosis and discharge reports. |
| Admin | Manages staff accounts. |

---

## Key Features

- **Adaptive questionnaire** — Questions change based on symptoms. Clinically structured pathways for chest pain, abdominal pain, fever, head pain, back pain, breathing difficulty, neurological symptoms, urinary symptoms, fatigue, rash, joint pain, ear pain, and more.
- **Bilingual** — Full Hebrew and English support throughout the interface and AI outputs.
- **AI-assisted diagnosis** — GPT-4o generates a differential diagnosis from clinical data. Patient name and national ID are stripped before any data is sent to the AI.
- **AI discharge reports** — Generates, improves, and shortens discharge summaries in the doctor's preferred language.
- **Live triage queue** — Nurses see waiting time from questionnaire submission. Doctors see cases sorted by status and urgency.
- **Audit trail** — Every PHI access and clinical action is logged with actor, role, action, case ID, and timestamp.
- **Role-based access** — Nurses cannot access AI features. Doctors cannot manage staff accounts. Patients can only access their own case.

---

## What SwiftyCare Is Not (Current Version)

- It does not replace the hospital's existing EMR/HIS. It is a focused intake and triage tool.
- It does not connect to lab systems, imaging (PACS), or billing automatically — these are planned integration options (see Integration Guide).
- It is not a telemedicine platform. It is designed for in-person kiosk use inside the hospital.

---

## Deployment

SwiftyCare is a cloud-hosted web application. It runs in a browser — no software installation is required on kiosks or workstations. The hospital provides the devices (tablets/computers) and network access; SwiftyCare handles everything else.

| Component | Hosted on | Region |
|---|---|---|
| Web interface | Vercel CDN | EU edge |
| API server | Render | Frankfurt, Germany (EU) |
| Database | MongoDB Atlas | Tokyo, Japan |

> A formal Data Processing Agreement with each cloud provider is required before processing real patient data at clinical scale.

---

## Current Status

SwiftyCare is deployed and operational at:

| | |
|---|---|
| **Patient kiosk** | https://demo.swifty-care.com |
| **Staff login** | https://demo.swifty-care.com/doctor/login |
| **API** | https://swiftycare.onrender.com |

The system is available for live demonstration and security testing. Temporary staff accounts can be provided on request.

---

## Further Documentation

| Document | Contents |
|---|---|
| `docs/INTEGRATION-GUIDE.md` | Full API reference, HIS/EMR integration options and effort estimates |
| `docs/security/CTO-DOCUMENTATION.md` | Security architecture, data flows, RBAC, and known open items for the information security team |

---

*SwiftyCare · Engineering Team · June 2026*
