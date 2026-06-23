# SwiftyCare — Privacy Policy

| | |
|---|---|
| **Document owner** | SwiftyCare Engineering Lead |
| **Version** | 1.0 (Draft for ISO 27001 / ISO 27799 review) |
| **Effective date** | June 2026 |
| **Next review** | December 2026 (or after any material change) |
| **Classification** | Internal — shareable with security auditors under NDA |
| **Aligned standards** | ISO 27799:2016, GDPR principles, Israeli Privacy Protection Law (PPL) |

> This Privacy Policy describes how SwiftyCare collects, uses, protects, and shares personal and health information. It is prepared as a draft for review with the hospital's security and legal consultancy as part of the ISO 27001 + ISO 27799 certification process. The hospital, as the healthcare provider, is the **Data Controller**; SwiftyCare acts as a **Data Processor** on the hospital's behalf.

---

## 1. Roles Under Data Protection Law

| Party | Role | Responsibility |
|---|---|---|
| **Hospital** | Data Controller | Determines the purpose of processing; holds the patient relationship; responsible for lawful basis and patient notices. |
| **SwiftyCare** | Data Processor | Processes patient data only on the hospital's instructions to deliver the intake and triage service. |
| **Sub-processors** (Vercel, Render, MongoDB Atlas, OpenAI) | Sub-processors | Provide infrastructure and AI processing under contract. |

---

## 2. What Personal Data We Collect

| Category | Data | Purpose |
|---|---|---|
| **Identity** | Patient name, Israeli national ID | Identify the patient and link them to their case. |
| **Health (special-category)** | Symptoms, chief complaint, medical history, current medications, allergies, vital signs (BP, HR, SpO₂, temperature, respiratory rate, pain score) | Clinical triage, diagnosis support, and discharge documentation. |
| **Clinical output** | AI-assisted differential diagnosis, discharge reports, ordered tests | Support the treating clinician's decisions and document the encounter. |
| **Staff data** | Staff username, display name, role, hashed password | Authenticate staff and enforce access control. |
| **Technical** | IP address and timestamps in audit logs | Security, accountability, and incident investigation. |

We collect **only** the data necessary to deliver the clinical intake and triage service (data minimisation).

---

## 3. How We Use the Data

Patient data is used solely to:
1. Register the patient and create their clinical case.
2. Present the intake information and vital signs to authorised clinical staff.
3. Generate AI-assisted clinical decision support (diagnosis suggestions and discharge documentation) for the treating clinician.
4. Maintain a secure audit trail of who accessed or changed clinical data.

We do **not**:
- Use patient data for marketing.
- Sell or rent personal data to any party.
- Use patient data to train third-party AI models (see Section 5).
- Process data for any purpose beyond the clinical service instructed by the hospital.

---

## 4. Lawful Basis

Processing of health data is carried out on behalf of the hospital for the **provision of healthcare and medical treatment**. The hospital, as Data Controller, is responsible for establishing and communicating the lawful basis to patients (e.g. provision of care, and consent where required under applicable law).

---

## 5. Sharing With Third Parties (Sub-Processors)

We share data only with the infrastructure and AI sub-processors strictly necessary to run the service:

| Sub-processor | Data shared | Safeguard |
|---|---|---|
| **Render** (API hosting, EU) | All case data, in transit | TLS encryption; rotated secrets; DPA required |
| **MongoDB Atlas** (database, Tokyo) | All patient records, at rest | Encryption at rest + in transit; authenticated access; DPA required |
| **Vercel** (frontend, EU) | No PHI — serves application code only | HTTPS; DPA required |
| **OpenAI** (AI, US) | Clinical data **only** — patient name and national ID are removed before transmission | De-identification; DPA / data-retention agreement required |

> **De-identification before AI:** Before any data is sent to the AI provider, direct identifiers (patient name and national ID) are stripped. The AI receives clinical information without the means to directly identify the patient.

We do not share data with any party other than these sub-processors, except where required by law or with the hospital's explicit instruction.

---

## 6. International Data Transfers

| Data location | Region |
|---|---|
| Application frontend | EU edge (Vercel) |
| API server | Frankfurt, Germany (EU) |
| Database (primary PHI store) | Tokyo, Japan |
| AI processing (de-identified) | United States |

Because data is currently stored and processed outside Israel, appropriate transfer safeguards (Data Processing Agreements and, where relevant, standard contractual clauses) must be in place before clinical go-live. If the hospital requires data residency within the EU or Israel, the database and API can be migrated to compliant regions. **This is an open item pending the hospital's data-residency decision.**

---

## 7. Data Security

Patient data is protected by the controls described in the SwiftyCare Information Security Policy, including:
- Encryption in transit (TLS 1.2+) and at rest.
- Role-based access control enforced on every request.
- Individual, named staff accounts with hashed passwords — no shared or default accounts.
- A tamper-evident audit trail of all PHI access, containing no PHI values.
- Removal of direct identifiers before AI processing.
- Automated vulnerability and secret scanning in the development pipeline.

See `INFORMATION-SECURITY-POLICY.md` for full detail.

---

## 8. Data Retention

- Patient case data is retained for as long as necessary to provide the service and to meet the hospital's medical-record retention obligations, as instructed by the hospital (Data Controller).
- Audit logs are retained to support security and accountability.
- Upon termination of the service, or on the hospital's instruction, patient data is returned to the hospital and/or securely deleted in accordance with the Data Processing Agreement.
- Specific retention periods are set by the hospital in line with applicable medical-records regulations.

---

## 9. Patients' Rights

As the Data Controller, the hospital is responsible for handling patient requests to exercise their rights, which may include:
- **Access** — to obtain a copy of their data.
- **Rectification** — to correct inaccurate data.
- **Erasure** — subject to medical-record retention obligations.
- **Restriction / objection** — to limit certain processing.

SwiftyCare, as Data Processor, will assist the hospital in responding to such requests by providing the necessary technical means to access, correct, export, or delete the relevant records.

---

## 10. Patient Transparency

The hospital is responsible for informing patients, at or before the point of intake, that:
- A digital system is used to record their intake and clinical information.
- AI-assisted decision support is used to aid (not replace) clinical judgement.
- Their data is processed by SwiftyCare and its sub-processors as described in this policy.

SwiftyCare can provide a short patient-facing notice for display at the kiosk to support this.

---

## 11. Children's & Vulnerable Patients' Data

Where the system is used for minors or vulnerable patients, the hospital remains responsible for obtaining appropriate consent from a parent, guardian, or authorised representative in line with applicable law.

---

## 12. Breach Notification

In the event of a personal-data breach, SwiftyCare will notify the hospital's designated contact without undue delay after becoming aware of it, providing the information needed for the hospital to meet its breach-notification obligations to regulators and affected individuals. The incident process is defined in the Information Security Policy (Section 11).

---

## 13. Policy Review

This Privacy Policy is reviewed at least every six months, and after any material change to data flows, sub-processors, or applicable law. It will be refined together with the hospital's legal and security advisors as part of the certification process.

---

*SwiftyCare Privacy Policy · Draft v1.0 · June 2026 · Prepared for ISO 27001 / ISO 27799 certification review*
