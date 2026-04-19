# SwiftyCare — Client Demo Script

Target duration: **7–9 minutes**, live walkthrough on https://demo.swifty-care.com.
Audience: hospital CMO / ED director / innovation lead.

---

## 0. Before you start (2 min checklist)

- Confirm the API is reachable: open the dashboard at `/doctor` → it should load within 3 seconds.
- Log in once so the access gate is satisfied (`swiftycare:doctorAccess` set in localStorage).
- Have two browser windows open side by side:
  1. **Patient view** (a fresh incognito window) → starts on `/`.
  2. **Doctor view** (your main window, already logged in) → `/doctor`.
- Put the language switch in EN to start; you’ll flip to Hebrew mid-demo.
- Close the DevTools — nothing should look like “a dev build.”

Optional: seed a second patient (`Miriam Cohen`) beforehand so the dashboard shows at least 2 cases.

---

## 1. Opening (45 sec) — the problem

> “A patient walks into an Israeli ED. Before the physician ever sees them, roughly 20–30 minutes are lost in paperwork, triage and redundant questions. The doctor then has to rebuild the full clinical picture from scratch, and every discharge summary has to be typed by hand. That’s exactly what SwiftyCare is designed to compress.”

Show the landing page (`/`). Point out:
- The clean patient-facing intake on tablet / phone.
- “This is what the patient uses in the waiting area.”

---

## 2. Patient journey (2 min)

In the **patient window** start a new case:

1. **Scan page** — enter `Yossi Cohen`, national ID `123456789`, hospital `Tel Aviv`.
   - Call out: “Hospital context is stored on the case, so the same installation supports multiple sites.”
   - Flip the language toggle → show the form translates instantly (RTL + Hebrew).
2. **Questionnaire step 1** — personal details. Highlight:
   - **Who is filling the form?** (patient vs. companion) — critical for elderly / cognitively impaired.
   - **Cognitive state** (intact / impaired / memory decline), functional status, chronic meds.
3. **Medical history** — pick `High blood pressure`, `Diabetes`, `Cancer history → Active → Breast`.
   - Note: “Cancer is not one checkbox — active vs. past + cancer type are separately captured, because they change differential diagnosis dramatically.”
4. **Medications** — open the diabetes and hypertension medication screens.
   - “Jardiance Duo, Janumet, Duplex — combination drugs are grouped so the patient doesn’t have to know each ingredient.”
   - Also point out: *I do not remember my medications* — a realistic option for ED intake.
5. **Current illness** — pick `Abdominal pain` + `Vomiting`.
6. **Adaptive questions** (step 2) — show that severity sliders, onset and red-flag questions are **generated from the selected symptoms**, not a static form. Drag the severity slider to 8/10.
7. Submit → patient sees a “Thank you” screen.

---

## 3. Doctor journey (3 min)

Switch to the **doctor window** and refresh the dashboard.

1. **Dashboard** — the new case appears under Open. Talk through:
   - Search, open vs. closed tabs, status badge (`open`, `in_progress`, `tests_ordered`, `closed`).
   - Logout button top-right (quick aside on session handling).
2. Click the case → **Case page**:
   - Left: patient details, intake answers, medication list, red flags.
   - Right: two AI tools.
3. **Generate AI Summary** — click the button.
   - Talk track while it streams (~15–25 s): “The model reads the entire intake — history, meds, symptoms, adaptive answers — and emits a clinical summary in the physician’s language.”
4. **Generate Diagnosis** — click it.
   - Point at the ranked differential with probabilities and supporting evidence.
   - Scroll to **Recommended Diagnostic Tests** — call out: “These are *tests*, not diagnoses. Ordered by urgency, with a one-line rationale per test.”
   - Check 2–3 tests, add an *Other (specify)* entry (e.g. `Urine culture`), and click **Order Selected Tests**.
   - “Ordering does **not** close the case — the doctor continues working while results come back.”
5. Navigate to **Discharge Report**:
   - Show the structured, 12-section output (Patient summary, Relevant history, Presenting complaint, Clinical evaluation, Investigations, Key results, Treatment, Clinical impression, Future tests, Discharge recommendations, Final disposition).
   - Edit one sentence in-place → “Everything the doctor writes is preserved. AI only augments, never overwrites.”
   - Click **Improve Medical Language** on the edited version → show the delta.
   - Click **Print / Export PDF** → browser print preview.
6. Click **Finalize Discharge** → confirm → the case status flips to `closed`.
   - Back on the dashboard: the case has moved from *Open* to *Closed*.

---

## 4. Differentiation & close (90 sec)

Open `/swiftycare-about.html` in a new tab. Walk through:
- **The problem** section (documentation burden + revenue loss).
- **Solution** (4 pillars).
- **Differentiators** table.
- **Legal & privacy** — confirm HIPAA / medical-disclaimer posture.

Closing line:

> “The MVP you just saw covers the full ED journey — intake to signed discharge — in a single, bilingual, mobile-first product. Next step is piloting in one department for 2 weeks; we handle the deployment, you give us feedback.”

---

## 5. Seeding demo data (optional)

If you want deterministic demo data, run these three requests against the API (see `apps/api/src/routes/caseRoutes.ts`):

```bash
# 1) create case
curl -X POST $API_BASE/api/cases \
  -H 'Content-Type: application/json' \
  -d '{"patientName":"Miriam Cohen","nationalId":"207654321","hospital":"Tel Aviv Sourasky Medical Center"}'
# → returns { _id: "<caseId>" }

# 2) attach a questionnaire (minimal example)
curl -X POST $API_BASE/api/cases/<caseId>/questionnaire \
  -H 'Content-Type: application/json' \
  -d @demo-data/questionnaire-miriam.json

# 3) mark it in-progress so it shows on the dashboard
curl -X PATCH $API_BASE/api/cases/<caseId>/status \
  -H 'Content-Type: application/json' \
  -d '{"status":"in_progress"}'
```

A shipped `demo-data/` folder is a good next sprint item; for today, a manual case created through the patient UI is enough.

---

## 6. Known talking points (if asked)

- **Data residency** — MongoDB Atlas EU region is supported; can be moved to an on-prem Mongo at pilot time.
- **AI model** — currently OpenAI GPT-4 class; we can swap in an on-prem LLM (e.g. Azure OpenAI EU) without changing the frontend.
- **PHI in prompts** — we only send the intake answers, never free-text patient identifiers; identifiers stay in our DB.
- **Audit log** — every AI generation is stamped with timestamp, doctor id (when auth is wired up), and the exact prompt version.
- **Roadmap next 60 days** — authentication (Auth0 / hospital SSO), audit trail UI, lab-result ingestion, nurse triage view.
