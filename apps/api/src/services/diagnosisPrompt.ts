// =============================================================================
// Differential-diagnosis prompt builder
// -----------------------------------------------------------------------------
// Builds the system + user messages for the AI differential-diagnosis endpoint
// from a `Case` document and its associated `Questionnaire` answers.
//
// Design goals:
//   1. Surface every piece of structured patient data the AI needs — including
//      the adaptive (Step-2) OPQRST answers, red flags, location, severity and
//      vital-sign alerts — instead of dumping raw JSON.
//   2. Force structured clinical reasoning along the lines used in Rosen's
//      Emergency Medicine: anchor the differential to the chief complaint, list
//      the must-not-miss diagnoses first, apply validated decision rules where
//      relevant, and weigh demographics + red flags explicitly.
//   3. Preserve the *exact* output contract the frontend parser depends on
//      (section headers, field labels, urgency tokens). Hebrew runs change only
//      the human-language content, not the structural skeleton.
// =============================================================================

export type DiagnosisLanguage = "en" | "he";

export interface BuildDiagnosisMessagesArgs {
  caseDoc: any;
  answers: any;
  language: DiagnosisLanguage;
}

export interface BuildDiagnosisMessagesResult {
  systemMessage: string;
  userMessage: string;
  meta: {
    chiefComplaints: string[];
    pathwayIds: string[];
    overallRedFlags: string[];
    vitalAlerts: string[];
  };
}

// ─── Chief-complaint registry ──────────────────────────────────────────────
//
// Compact Rosen's-style "must-not-miss + decision rules" blocks, keyed by the
// pathway id used in the frontend (`apps/web/src/config/symptomPathways.ts`).
//
// Keep these in *English*: clinical decision rules and disease names are
// universally English in medical literature, and the output contract already
// requires Hebrew diagnoses to be paired with their English term in parens.

interface ComplaintFramework {
  display: string;
  mustNotMiss: string[];
  decisionRules: string[];
  keyConsiderations?: string[];
}

const COMPLAINT_FRAMEWORKS: Record<string, ComplaintFramework> = {
  chestPain: {
    display: "Chest pain",
    mustNotMiss: [
      "Acute coronary syndrome (STEMI / NSTEMI / unstable angina)",
      "Aortic dissection",
      "Pulmonary embolism",
      "Tension pneumothorax / spontaneous pneumothorax",
      "Cardiac tamponade",
      "Esophageal rupture (Boerhaave)",
      "Acute pericarditis / myocarditis",
    ],
    decisionRules: [
      "HEART score for ACS risk stratification",
      "Wells criteria + PERC rule for PE",
      "Aortic Dissection Detection Risk Score (ADD-RS)",
    ],
    keyConsiderations: [
      "Atypical ACS presentations are common in women, diabetics and the elderly — do not discount based on character alone.",
      "Radiation to the back or sudden 'tearing' pain raises concern for aortic dissection.",
      "Pleuritic pain + dyspnea + tachycardia + risk factors → escalate PE workup.",
    ],
  },
  abdominalPain: {
    display: "Abdominal pain",
    mustNotMiss: [
      "Ruptured abdominal aortic aneurysm (AAA) — older patients, back/flank pain, hypotension",
      "Ectopic pregnancy — any female of childbearing age",
      "Mesenteric ischemia — pain out of proportion to exam, AF or vascular disease",
      "Bowel perforation / peritonitis",
      "Bowel obstruction with strangulation",
      "Acute appendicitis (atypical in elderly, pregnant, immunocompromised)",
      "Acute cholangitis (Charcot's triad / Reynolds' pentad)",
      "Testicular torsion (in males with referred pain)",
    ],
    decisionRules: [
      "Alvarado score for appendicitis",
      "Glasgow-Imrie or BISAP for pancreatitis severity",
      "Tokyo Guidelines for cholangitis / cholecystitis",
    ],
    keyConsiderations: [
      "Elderly, diabetic, immunocompromised and post-transplant patients often present without classical peritoneal signs — escalate imaging early.",
      "Always rule out pregnancy in any female of reproductive age before attributing pain to a GI cause.",
      "Pain location plus radiation pattern narrows the differential significantly (RUQ→biliary, epigastric→pancreatic/cardiac/PUD, RLQ→appendix/ovarian, flank→renal/aortic, suprapubic→GU).",
    ],
  },
  headache: {
    display: "Headache",
    mustNotMiss: [
      "Subarachnoid hemorrhage (sudden 'worst headache of life', thunderclap)",
      "Bacterial meningitis / encephalitis",
      "Cerebral venous sinus thrombosis (especially postpartum, OCP use)",
      "Acute angle-closure glaucoma",
      "Giant cell arteritis (age ≥ 50, jaw claudication, visual change)",
      "Carotid or vertebral artery dissection",
      "Idiopathic intracranial hypertension",
      "Hypertensive emergency / posterior reversible encephalopathy syndrome (PRES)",
    ],
    decisionRules: [
      "Ottawa SAH Rule for non-traumatic headache in alert adults",
      "ICHD-3 criteria for primary headache disorders (after secondary causes excluded)",
    ],
    keyConsiderations: [
      "'Thunderclap' (peak in <1 min), new headache ≥ age 50, focal neurology, fever, neck stiffness, immunocompromise or anticoagulation — all push the workup toward CT/LP.",
      "First or worst headache of life always warrants imaging.",
    ],
  },
  shortnessOfBreath: {
    display: "Shortness of breath",
    mustNotMiss: [
      "Pulmonary embolism",
      "Acute coronary syndrome (anginal equivalent)",
      "Acute pulmonary edema / decompensated heart failure",
      "Tension pneumothorax",
      "Severe asthma exacerbation / status asthmaticus",
      "Anaphylaxis",
      "Cardiac tamponade",
      "Severe pneumonia / ARDS",
    ],
    decisionRules: [
      "Wells criteria + PERC for PE",
      "PESI / sPESI for PE severity",
      "CURB-65 for community-acquired pneumonia severity",
    ],
    keyConsiderations: [
      "SpO₂ < 92% on room air, RR ≥ 24, or any work of breathing → high-acuity workup regardless of subjective severity.",
      "Acute onset dyspnea + chest pain + unilateral leg swelling → PE until proven otherwise.",
    ],
  },
  fever: {
    display: "Fever",
    mustNotMiss: [
      "Sepsis / septic shock (per Sepsis-3 / qSOFA)",
      "Meningitis / encephalitis",
      "Endocarditis (especially with murmur or IVDU)",
      "Necrotizing soft-tissue infection",
      "Neutropenic fever (in cancer / chemo patients)",
      "Toxic shock syndrome",
      "Malaria / typhoid in returning travelers",
    ],
    decisionRules: [
      "qSOFA / SOFA + lactate for sepsis",
      "Duke criteria for endocarditis",
    ],
    keyConsiderations: [
      "Immunocompromised, post-splenectomy, neutropenic, or post-transplant patients with fever are high-acuity regardless of how well they look.",
      "Always look for a focus: chest, abdomen, urine, skin/soft-tissue, CNS, lines/devices.",
    ],
  },
  dizziness: {
    display: "Dizziness",
    mustNotMiss: [
      "Posterior-circulation stroke / TIA (cerebellar, brainstem)",
      "Vertebrobasilar dissection",
      "Cardiac arrhythmia (e.g., complete heart block, VT)",
      "Acute coronary syndrome (anginal equivalent)",
      "Severe anemia or GI bleed",
      "Hypoglycemia",
      "Carbon-monoxide poisoning",
    ],
    decisionRules: [
      "HINTS exam (Head-Impulse, Nystagmus, Test of Skew) in acute continuous vertigo to differentiate central from peripheral",
      "ABCD² score is NOT validated for dizziness — clinical judgment + imaging",
    ],
    keyConsiderations: [
      "New, persistent, continuous vertigo with any central feature (gait ataxia, dysarthria, diplopia, focal neuro) → posterior-circulation stroke pathway, not 'BPPV / vestibular'.",
    ],
  },
  syncope: {
    display: "Syncope / loss of consciousness",
    mustNotMiss: [
      "Cardiac arrhythmia (long QT, Brugada, WPW, complete heart block, VT)",
      "Structural cardiac (AS, HOCM, PE)",
      "Pulmonary embolism",
      "Aortic dissection",
      "Subarachnoid hemorrhage",
      "GI bleed / occult hemorrhage",
      "Ectopic pregnancy",
      "Hypoglycemia",
    ],
    decisionRules: [
      "Canadian Syncope Risk Score",
      "San Francisco Syncope Rule",
    ],
    keyConsiderations: [
      "Syncope without prodrome, during exertion, or with chest pain/palpitations is cardiac until proven otherwise.",
      "Always obtain ECG and check for occult bleeding / pregnancy.",
    ],
  },
  changeInConsciousness: {
    display: "Altered mental status / change in consciousness",
    mustNotMiss: [
      "Hypoglycemia",
      "Hypoxia / hypercapnia",
      "Stroke / intracranial hemorrhage",
      "Meningitis / encephalitis / sepsis",
      "Toxidromes (opioid, sympathomimetic, anticholinergic, serotonin syndrome, NMS)",
      "Wernicke's encephalopathy",
      "Status epilepticus / non-convulsive status",
      "Hepatic / uremic / hypertensive encephalopathy",
    ],
    decisionRules: [
      "AEIOU-TIPS mnemonic for AMS workup",
    ],
    keyConsiderations: [
      "Always check glucose, oxygenation, temperature and consider naloxone empirically.",
      "Don't anchor on 'intoxication' until structural and metabolic causes are excluded.",
    ],
  },
  backPain: {
    display: "Back pain",
    mustNotMiss: [
      "Ruptured abdominal aortic aneurysm",
      "Aortic dissection",
      "Spinal epidural abscess",
      "Cauda equina syndrome",
      "Vertebral osteomyelitis / discitis",
      "Pathologic / malignant vertebral fracture",
      "Pyelonephritis / perinephric abscess",
    ],
    decisionRules: [
      "Red-flag screen: fever, IVDU, immunosuppression, anticoagulation, saddle anesthesia, bowel/bladder dysfunction, progressive neuro deficit, weight loss, age > 50 with new pain",
    ],
    keyConsiderations: [
      "Saddle anesthesia, urinary retention or bilateral leg weakness → urgent MRI for cauda equina.",
      "New back pain in patients > 60 with risk factors → consider AAA early.",
    ],
  },
  nauseaVomitingDiarrhea: {
    display: "Nausea / vomiting / diarrhea",
    mustNotMiss: [
      "Bowel obstruction",
      "Mesenteric ischemia",
      "Acute pancreatitis",
      "DKA / HHS",
      "Acute coronary syndrome (especially inferior MI in elderly/diabetic)",
      "Raised intracranial pressure",
      "Adrenal crisis",
      "Ectopic pregnancy",
      "Toxic ingestion / poisoning",
    ],
    decisionRules: [
      "Assess volume status, electrolytes and glucose first.",
    ],
    keyConsiderations: [
      "Persistent vomiting + abdominal distension → obstruction until proven otherwise.",
      "Don't miss inferior MI presenting as 'gastroenteritis' in elderly or diabetic patients.",
    ],
  },
  injuryTrauma: {
    display: "Injury / trauma",
    mustNotMiss: [
      "Occult intracranial hemorrhage (especially on anticoagulation / antiplatelets)",
      "Cervical-spine injury",
      "Hemothorax / pneumothorax / pulmonary contusion",
      "Intra-abdominal solid organ injury",
      "Pelvic ring injury with hemorrhage",
      "Compartment syndrome",
      "Vascular injury / limb ischemia",
    ],
    decisionRules: [
      "Canadian CT Head Rule / New Orleans criteria",
      "NEXUS / Canadian C-Spine Rule",
      "Ottawa Ankle / Knee Rules",
    ],
    keyConsiderations: [
      "Mechanism + anticoagulation status are critical — low-energy falls on warfarin/DOAC still warrant CT head.",
    ],
  },
  neckPain: {
    display: "Neck pain",
    mustNotMiss: [
      "Carotid or vertebral artery dissection",
      "Meningitis",
      "Cervical epidural abscess",
      "Cervical-spine fracture (post-traumatic, osteoporotic)",
      "Retropharyngeal abscess / deep neck-space infection",
    ],
    decisionRules: [
      "NEXUS / Canadian C-Spine Rule when mechanism warrants imaging",
    ],
  },
  eyeProblems: {
    display: "Eye problems",
    mustNotMiss: [
      "Acute angle-closure glaucoma",
      "Central retinal artery / vein occlusion",
      "Retinal detachment",
      "Optic neuritis",
      "Giant cell arteritis (in patients ≥ 50)",
      "Orbital cellulitis (vs preseptal)",
      "Globe rupture / penetrating trauma",
      "Chemical burn",
    ],
    decisionRules: [
      "Always check visual acuity, IOP (if no globe injury), pupillary reactions and red reflex.",
    ],
  },
  rash: {
    display: "Rash",
    mustNotMiss: [
      "Anaphylaxis / angioedema",
      "Stevens-Johnson syndrome / toxic epidermal necrolysis (SJS/TEN)",
      "Meningococcemia / purpura fulminans",
      "Necrotizing fasciitis",
      "DRESS syndrome (drug reaction)",
      "Rocky Mountain spotted fever / rickettsial disease",
      "Viral exanthem with meningitis risk (measles, enterovirus with meningoencephalitis)",
    ],
    decisionRules: [
      "Assess ABCs and airway first if angioedema or lip/tongue swelling.",
      "Petechiae/purpura + fever → blood cultures and empiric antibiotics without delay.",
    ],
    keyConsiderations: [
      "New rash after antibiotic or other drug → stop offending agent and consider DRESS/SJS.",
      "Fever + non-blanching rash → treat as sepsis until proven otherwise.",
    ],
  },
  cough: {
    display: "Cough",
    mustNotMiss: [
      "Pulmonary embolism",
      "Pneumonia / sepsis",
      "Acute heart failure / pulmonary edema",
      "Foreign body aspiration (especially children)",
      "Pneumothorax",
      "Pertussis",
      "Tuberculosis (consider in endemic exposure or immunocompromised)",
    ],
    decisionRules: [
      "CURB-65 for pneumonia severity when infection suspected.",
      "Wells + PERC if pleuritic pain, tachycardia, or risk factors for PE.",
    ],
    keyConsiderations: [
      "Hemoptysis, weight loss, or night sweats → chest imaging and TB workup.",
      "Cough + chest pain + dyspnea + leg swelling → PE pathway.",
    ],
  },
  jointPain: {
    display: "Joint pain",
    mustNotMiss: [
      "Septic arthritis (monoarticular hot swollen joint + fever)",
      "Gout / pseudogout flare",
      "Rheumatoid flare with systemic involvement",
      "Osteomyelitis",
      "Fracture / occult fracture (especially hip in elderly)",
      "Deep vein thrombosis (calf pain/swelling mimicking joint pain)",
      "Compartment syndrome (post-trauma)",
    ],
    decisionRules: [
      "Synovial fluid analysis when septic arthritis suspected (WBC, crystals, Gram stain/culture).",
      "Ottawa rules for ankle/knee if trauma mechanism.",
    ],
    keyConsiderations: [
      "Single hot swollen joint in febrile patient → septic arthritis until proven otherwise.",
      "Immunocompromised or prosthetic joint → lower threshold for aspiration and imaging.",
    ],
  },
  earPain: {
    display: "Ear pain (otalgia)",
    mustNotMiss: [
      "Acute otitis media / mastoiditis",
      "Malignant (necrotizing) external otitis (diabetics, immunocompromised)",
      "Temporomandibular joint dysfunction",
      "Referred pain from pharyngitis / peritonsillar abscess",
      "Referred pain from carotid dissection or ACS (rare but critical)",
      "Foreign body (especially children)",
    ],
    decisionRules: [
      "Examine TM, external canal, oropharynx, and neck for referred sources.",
    ],
    keyConsiderations: [
      "Diabetic with severe external otitis + granulation tissue → malignant otitis externa.",
      "Otalgia + neck pain + headache → consider carotid dissection.",
    ],
  },
  swellingEdema: {
    display: "Swelling / edema",
    mustNotMiss: [
      "Deep vein thrombosis / pulmonary embolism",
      "Acute heart failure / pulmonary edema",
      "Nephrotic syndrome / renal failure",
      "Hepatic decompensation / portal hypertension",
      "Cellulitis / necrotizing soft-tissue infection",
      "Compartment syndrome (post-trauma)",
      "Angioedema / anaphylaxis",
    ],
    decisionRules: [
      "Wells criteria for DVT when unilateral leg swelling.",
      "BNP/NT-proBNP when dyspnea coexists with edema.",
    ],
    keyConsiderations: [
      "Unilateral calf swelling + pain + risk factors → DVT workup before attributing to chronic venous disease.",
      "Bilateral leg edema + ascites → consider cardiac, renal, or hepatic decompensation.",
    ],
  },
};

// ─── Currentlness → pathway mapping ───────────────────────────────────────
//
// `currentIllness` is a flat record of camelCase booleans. We map each
// active flag to a pathway id (when one exists) so the same frameworks above
// can be picked even when no adaptive Step-2 answers were captured.
const ILLNESS_TO_PATHWAY: Record<string, string> = {
  chestPain: "chestPain",
  headache: "headache",
  abdominalPain: "abdominalPain",
  backPain: "backPain",
  flankPain: "backPain",
  neckPain: "neckPain",
  fever: "fever",
  shortnessOfBreath: "shortnessOfBreath",
  cough: "cough",
  rash: "rash",
  jointPain: "jointPain",
  earPain: "earPain",
  painInLimbs: "injuryTrauma",
  swellingEdema: "swellingEdema",
  injectionSitePain: "injuryTrauma",
  dizziness: "dizziness",
  syncope: "syncope",
  alteredMentalStatus: "changeInConsciousness",
  changeInConsciousness: "changeInConsciousness",
  nauseaVomitingDiarrhea: "nauseaVomitingDiarrhea",
  vomiting: "nauseaVomitingDiarrhea",
  diarrhea: "nauseaVomitingDiarrhea",
  injuryTrauma: "injuryTrauma",
  headInjury: "injuryTrauma",
  eyeProblems: "eyeProblems",
};

// Optional plain-English labels for complaints we don't have full Rosen blocks
// for yet — keeps the chief-complaint list readable in the prompt.
const ILLNESS_LABELS: Record<string, string> = {
  chestPain: "Chest pain",
  headache: "Headache",
  abdominalPain: "Abdominal pain",
  backPain: "Back pain",
  flankPain: "Flank pain",
  neckPain: "Neck pain",
  jointPain: "Joint pain",
  painInLimbs: "Limb pain",
  earPain: "Ear pain",
  injectionSitePain: "Injection-site pain",
  fever: "Fever",
  shortnessOfBreath: "Shortness of breath",
  cough: "Cough",
  nauseaVomitingDiarrhea: "Nausea",
  vomiting: "Vomiting",
  diarrhea: "Diarrhea",
  rash: "Rash",
  dizziness: "Dizziness",
  fatigueWeakness: "General weakness / fatigue",
  syncope: "Syncope",
  alteredMentalStatus: "Altered mental status",
  changeInConsciousness: "Change in consciousness",
  swellingEdema: "Swelling / edema",
  eyeProblems: "Eye problems",
  injuryTrauma: "Injury / trauma",
  headInjury: "Head injury",
  abnormalBloodTests: "Abnormal blood tests",
};

// ─── Internal helpers ──────────────────────────────────────────────────────

function formatBool(value: unknown): string {
  return value === true ? "yes" : value === false ? "no" : "—";
}

function formatValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return formatBool(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(", ");
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // Pretty-render LocationSelection { regionIds, laterality }
    if (Array.isArray(obj.regionIds)) {
      const regions = (obj.regionIds as unknown[]).map(String).join(", ");
      const laterality = obj.laterality && obj.laterality !== "notApplicable" ? ` (${obj.laterality})` : "";
      return regions ? `${regions}${laterality}` : "—";
    }
    return JSON.stringify(value);
  }
  return String(value);
}

function activeKeys(record: Record<string, unknown> | undefined | null, skip: string[] = []): string[] {
  if (!record || typeof record !== "object") return [];
  return Object.entries(record)
    .filter(([k, v]) => v === true && !skip.includes(k))
    .map(([k]) => k);
}

function getActiveChiefComplaints(currentIllness: Record<string, unknown> | undefined): string[] {
  return activeKeys(currentIllness);
}

function pickPathwayFrameworks(chiefComplaints: string[], pathwayIds: string[]): ComplaintFramework[] {
  const ids = new Set<string>();
  for (const id of pathwayIds) {
    if (COMPLAINT_FRAMEWORKS[id]) ids.add(id);
  }
  for (const complaint of chiefComplaints) {
    const mapped = ILLNESS_TO_PATHWAY[complaint];
    if (mapped && COMPLAINT_FRAMEWORKS[mapped]) ids.add(mapped);
  }
  const result: ComplaintFramework[] = [];
  for (const id of ids) {
    const fw = COMPLAINT_FRAMEWORKS[id];
    if (fw) result.push(fw);
  }
  return result;
}

interface VitalAlertInput {
  bp?: string;
  hr?: number | string;
  spo2?: number | string;
  temp?: number | string;
  respRate?: number | string;
  painScore?: number | string;
}

function detectVitalAlerts(vitals: VitalAlertInput | undefined): string[] {
  if (!vitals) return [];
  const alerts: string[] = [];
  const num = (v: unknown): number | null => {
    if (v == null || v === "") return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const hr = num(vitals.hr);
  if (hr != null) {
    if (hr >= 130) alerts.push(`Severe tachycardia (HR ${hr})`);
    else if (hr >= 110) alerts.push(`Tachycardia (HR ${hr})`);
    else if (hr <= 45) alerts.push(`Severe bradycardia (HR ${hr})`);
    else if (hr <= 55) alerts.push(`Bradycardia (HR ${hr})`);
  }

  const spo2 = num(vitals.spo2);
  if (spo2 != null) {
    if (spo2 < 90) alerts.push(`Severe hypoxia (SpO₂ ${spo2}%)`);
    else if (spo2 < 94) alerts.push(`Hypoxia (SpO₂ ${spo2}%)`);
  }

  const temp = num(vitals.temp);
  if (temp != null) {
    if (temp >= 39) alerts.push(`High fever (T ${temp}°C)`);
    else if (temp >= 38) alerts.push(`Fever (T ${temp}°C)`);
    else if (temp <= 35) alerts.push(`Hypothermia (T ${temp}°C)`);
  }

  const rr = num(vitals.respRate);
  if (rr != null) {
    if (rr >= 28) alerts.push(`Severe tachypnea (RR ${rr})`);
    else if (rr >= 22) alerts.push(`Tachypnea (RR ${rr})`);
    else if (rr <= 8) alerts.push(`Bradypnea (RR ${rr})`);
  }

  if (typeof vitals.bp === "string" && vitals.bp.includes("/")) {
    const [sysStr, diaStr] = vitals.bp.split("/");
    const sys = num(sysStr?.trim());
    const dia = num(diaStr?.trim());
    if (sys != null) {
      if (sys < 90) alerts.push(`Hypotension (BP ${vitals.bp})`);
      else if (sys >= 180) alerts.push(`Severe hypertension (BP ${vitals.bp})`);
      else if (sys >= 160) alerts.push(`Hypertension (BP ${vitals.bp})`);
    }
    if (dia != null && dia >= 120) {
      alerts.push(`Hypertensive emergency range diastolic (BP ${vitals.bp})`);
    }
  }

  const pain = num(vitals.painScore);
  if (pain != null && pain >= 8) alerts.push(`Severe pain reported (${pain}/10)`);

  return alerts;
}

function renderPathwayBlock(entry: any): string {
  if (!entry || typeof entry !== "object") return "";
  const pathwayId: string = entry.pathwayId || "unknown";
  const fw = COMPLAINT_FRAMEWORKS[pathwayId];
  const heading = fw ? fw.display : pathwayId;
  const lines: string[] = [`### ${heading} (pathway: ${pathwayId})`];

  if (entry.locationData) {
    lines.push(`- Location: ${formatValue(entry.locationData)}`);
  }
  if (entry.severity != null && entry.severity !== "") {
    lines.push(`- Severity: ${entry.severity}/10`);
  }

  const responses: Record<string, unknown> = entry.responses && typeof entry.responses === "object" ? entry.responses : {};
  const detailKeys = Object.keys(responses).filter((k) => {
    const v = responses[k];
    if (v == null || v === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    // Skip the location and severity values that we've already surfaced.
    if (entry.locationData && v === entry.locationData) return false;
    if (entry.severity != null && v === entry.severity) return false;
    return true;
  });

  if (detailKeys.length) {
    lines.push("- Adaptive responses:");
    for (const k of detailKeys) {
      lines.push(`    • ${k}: ${formatValue(responses[k])}`);
    }
  }

  const redFlags: string[] = Array.isArray(entry.redFlagsTriggered) ? entry.redFlagsTriggered : [];
  if (redFlags.length) {
    lines.push(`- Red flags triggered: ${redFlags.join(", ")}`);
  }
  if (entry._additionalDetails && typeof entry._additionalDetails === "string") {
    lines.push(`- Free-text notes: ${entry._additionalDetails.trim()}`);
  } else if (typeof responses._additionalDetails === "string" && responses._additionalDetails.trim()) {
    lines.push(`- Free-text notes: ${(responses._additionalDetails as string).trim()}`);
  }

  return lines.join("\n");
}

function renderFrameworksBlock(frameworks: ComplaintFramework[]): string {
  if (!frameworks.length) {
    return [
      "### Generic emergency-medicine reasoning",
      "- Apply a structured ED differential: rule out the most immediately life-threatening cause first, then the most likely.",
      "- Cross-check vital-sign alerts, demographics and red flags against the differential.",
    ].join("\n");
  }
  return frameworks
    .map((fw) => {
      const lines: string[] = [`### ${fw.display}`];
      lines.push("Must-not-miss diagnoses (consider all of these explicitly before settling on a benign cause):");
      for (const dx of fw.mustNotMiss) lines.push(`  - ${dx}`);
      if (fw.decisionRules.length) {
        lines.push("Relevant decision rules / scoring tools:");
        for (const r of fw.decisionRules) lines.push(`  - ${r}`);
      }
      if (fw.keyConsiderations && fw.keyConsiderations.length) {
        lines.push("Key clinical considerations:");
        for (const c of fw.keyConsiderations) lines.push(`  - ${c}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

function getOutputContract(language: DiagnosisLanguage): string {
  const isHebrew = language === "he";
  if (isHebrew) {
    return `הנחיות פלט קריטיות (אסור לסטות):
- כותרות הסעיפים חייבות להישאר באנגלית בדיוק: "## Differential Diagnoses" ו-"## Recommended Diagnostic Tests".
- התוויות חייבות להישאר באנגלית בדיוק: "Probability:", "Supporting Evidence:", "Urgency:", "Rationale:".
- ערכי הדחיפות חייבים להיות באנגלית בדיוק: high / medium / low.
- שמות הבדיקות חייבים להתחיל בקיצור או בשם הסטנדרטי באנגלית (למשל: CT Head, CBC, ECG, Chest X-ray, Troponin, Urinalysis). אופציונלית הוסף הסבר קצר בעברית בסוגריים.
- שמות אבחנות (Diagnosis Name), נקודות תומכות (Supporting Evidence) והנמקות (Rationale) — כתוב בעברית רפואית מקצועית. עבור שמות אבחנות, כלול את שם האבחנה באנגלית בסוגריים אחרי השם בעברית.

ענה בדיוק במבנה הבא:

## Differential Diagnoses

1. [שם האבחנה בעברית (English Name)] - [XX]%
Probability: [XX]%
Supporting Evidence:
- [נקודה תומכת בעברית]
- [נקודה תומכת בעברית]

2. [שם האבחנה בעברית (English Name)] - [XX]%
Probability: [XX]%
Supporting Evidence:
- [נקודה תומכת בעברית]

(חזור על כך עבור 3-5 אבחנות. כלול תמיד את האבחנות שאסור לפספס שאי-אפשר לשלול קלינית, גם אם הסבירות נמוכה — במקרה כזה ציין במפורש את הסבירות הנמוכה.)

## Recommended Diagnostic Tests

כלל קריטי: סעיף זה חייב להכיל רק חקירות אבחנתיות שרופא היה מזמין במלר"ד.
אל תרשום מחלות, מצבים או אבחנות כאן — אלו שייכים לסעיף שלמעלה.
כלול רק פריטים כגון: בדיקות דם, הדמיה, ECG, בדיקת שתן, תרביות, ביופסיות וחקירות אחרות.

רשום כל בדיקה בפורמט:
- [Test Name in English] - Urgency: [high/medium/low]
  Rationale: [משפט אחד בעברית]

דוגמאות לערכים תקינים:
- CT Head without contrast - Urgency: high
  Rationale: לשלילת דימום תוך-מוחי או נגע תופס מקום.
- CBC + CRP - Urgency: high
  Rationale: להערכת זיהום או תהליך דלקתי.
- ECG - Urgency: high
  Rationale: להערכת הפרעת קצב לבבית או איסכמיה.
- Troponin (high-sensitivity) - Urgency: high
  Rationale: לשלילת אוטם שריר הלב.
- Chest X-ray - Urgency: medium
  Rationale: להערכת דלקת ריאות או תפליט פלאורלי.

דוגמאות לערכים לא תקינים (אל תכלול):
- Pneumonia (זוהי אבחנה, לא בדיקה)
- Migraine (זוהי אבחנה, לא בדיקה)
- Hypertensive Crisis (זוהי אבחנה, לא בדיקה)`;
  }
  return `CRITICAL OUTPUT REQUIREMENTS (do not deviate):
- Section headers must remain in English exactly: "## Differential Diagnoses" and "## Recommended Diagnostic Tests".
- Field labels must remain in English exactly: "Probability:", "Supporting Evidence:", "Urgency:", "Rationale:".
- Urgency values must be exactly one of: high / medium / low.
- Each test name must start with the standard English abbreviation or full name (e.g. CT Head, CBC, ECG, Chest X-ray, Troponin, Urinalysis).

Respond using EXACTLY this structure:

## Differential Diagnoses

1. [Diagnosis Name] - [XX]%
Probability: [XX]%
Supporting Evidence:
- [evidence point]
- [evidence point]

2. [Diagnosis Name] - [XX]%
Probability: [XX]%
Supporting Evidence:
- [evidence point]

(Repeat for 3-5 diagnoses. ALWAYS include any must-not-miss diagnosis that cannot be clinically excluded, even at a low probability — state the low probability explicitly when applicable.)

## Recommended Diagnostic Tests

CRITICAL RULE: This section must contain ONLY diagnostic investigations a physician would order in an ED.
Do NOT list diseases, conditions, or diagnoses here — those belong in the section above.
Only include items such as: blood tests, imaging, ECG, urinalysis, cultures, biopsies, and other investigations.

List each test as:
- [Test Name] - Urgency: [high/medium/low]
  Rationale: [one sentence]

Examples of VALID entries:
- CT Head without contrast - Urgency: high
  Rationale: Rule out intracranial hemorrhage or mass lesion.
- CBC + CRP - Urgency: high
  Rationale: Assess for infection or inflammatory process.
- ECG - Urgency: high
  Rationale: Evaluate for cardiac arrhythmia or ischemia.
- Troponin (high-sensitivity) - Urgency: high
  Rationale: Rule out myocardial infarction.
- Chest X-ray - Urgency: medium
  Rationale: Assess for pneumonia or pleural effusion.

Examples of INVALID entries (DO NOT include these):
- Pneumonia (this is a diagnosis, not a test)
- Migraine (this is a diagnosis, not a test)
- Hypertensive Crisis (this is a diagnosis, not a test)`;
}

// ─── Public entry point ────────────────────────────────────────────────────

export function buildDiagnosisMessages(
  args: BuildDiagnosisMessagesArgs,
): BuildDiagnosisMessagesResult {
  const { caseDoc, answers, language } = args;
  const isHebrew = language === "he";

  const personalInfo = answers?.personalInfo || {};
  const medicalHistory = answers?.medicalHistory || {};
  const currentIllness = answers?.currentIllness || {};
  const medications = answers?.medications || {};
  const adaptive = answers?.adaptiveQuestions || {};
  const vitals = (caseDoc?.vitals || {}) as VitalAlertInput;

  // Chief complaints — prefer adaptive pathway ids when present, fall back to
  // currentIllness booleans.
  const completedPathways: any[] = Array.isArray(adaptive?.completedPathways)
    ? adaptive.completedPathways
    : [];
  const pathwayIds = completedPathways.map((p) => String(p?.pathwayId)).filter(Boolean);
  const activeIllnesses = getActiveChiefComplaints(currentIllness);
  const chiefComplaintLabels = activeIllnesses.map((k) => ILLNESS_LABELS[k] || k);

  // Demographics
  const ageStr = personalInfo.age ? String(personalInfo.age) : (isHebrew ? "לא ידוע" : "Unknown");
  const genderStr = personalInfo.gender ? String(personalInfo.gender) : (isHebrew ? "לא ידוע" : "Unknown");

  // Medical history
  const historyConditions = activeKeys(medicalHistory, [
    "none",
    "cancerStatus",
    "cancerType",
    "otherDiseasesText",
  ]);
  const cancerNote =
    medicalHistory?.cancer === true
      ? ` (cancer status: ${medicalHistory.cancerStatus || "unspecified"}${
          medicalHistory.cancerType ? `, type: ${medicalHistory.cancerType}` : ""
        })`
      : "";

  // Medications + allergies
  const medGroups = (medications?.groups || {}) as Record<string, unknown>;
  const medList = Object.values(medGroups).flat().filter(Boolean) as string[];
  const doesNotRememberMeds = medications?.doesNotRememberMedications === true;
  const medsLine = doesNotRememberMeds
    ? "Patient does not remember medications"
    : medList.length
      ? medList.join(", ")
      : "None reported";
  const allergiesObj = medications?.allergies || {};
  const allergiesLine =
    allergiesObj.allergyDetails ||
    (allergiesObj.hasAllergies === "yes"
      ? "Yes — details unknown"
      : allergiesObj.hasAllergies === "no"
        ? "None reported"
        : "Not reported");

  // Vitals
  const vitalAlerts = detectVitalAlerts(vitals);

  // Red flags (questionnaire-level)
  const overallRedFlags: string[] = Array.isArray(adaptive?.overallRedFlags)
    ? adaptive.overallRedFlags.map(String)
    : [];

  // Pathway-level adaptive blocks
  const pathwayBlocks = completedPathways
    .map(renderPathwayBlock)
    .filter((b) => b && b.trim().length > 0)
    .join("\n\n");

  // Pick frameworks
  const frameworks = pickPathwayFrameworks(activeIllnesses, pathwayIds);
  const frameworksBlock = renderFrameworksBlock(frameworks);

  // ── System message ───────────────────────────────────────────────────────
  const systemMessage = isHebrew
    ? `אתה רופא בכיר במחלקת מלר"ד עם ניסיון רב באבחנה מבדלת.
המסגרת הקלינית שלך נשענת על העקרונות של Rosen's Emergency Medicine: התחל מהתלונה העיקרית, רשום קודם את האבחנות שאסור לפספס ("must-not-miss"), שקלל סימני אזהרה ("red flags") ודמוגרפיה, השתמש בכללי החלטה תקפים, ושקלל את הסבירות בהתבסס על שילוב של אנמנזה, בדיקה גופנית, מדדים חיוניים ושאלון מותאם (OPQRST).
ספק ניתוח מבוסס ראיות עם הערכות סבירות ברורות והמלצות מעשיות.
כתוב שמות אבחנות, נקודות תומכות והנמקות בעברית רפואית מקצועית, אך שמור על הכותרות, התוויות וערכי הדחיפות באנגלית בדיוק כפי שצוין בהוראות.`
    : `You are a senior emergency-medicine physician with extensive experience in differential diagnosis.
Your clinical reasoning follows the principles in Rosen's Emergency Medicine: anchor the differential to the chief complaint, list the must-not-miss diagnoses first, explicitly weigh red flags and demographics, apply validated decision rules where relevant, and calibrate probability using the combined history, exam, vital signs and adaptive questionnaire (OPQRST) findings.
Provide evidence-based analysis with clear probability assessments and actionable test recommendations.`;

  // ── User message ─────────────────────────────────────────────────────────
  const heading = isHebrew
    ? `נתח את נתוני המטופל הבאים והפק אבחנה מבדלת מובנית בסגנון מלר"ד.`
    : `Analyze the following patient data and produce a structured ED differential diagnosis.`;

  const patientSection = isHebrew
    ? `Patient
- Name: ${caseDoc?.patientName || "—"}
- Age: ${ageStr}
- Gender: ${genderStr}`
    : `Patient
- Name: ${caseDoc?.patientName || "—"}
- Age: ${ageStr}
- Gender: ${genderStr}`;

  const complaintsLine = chiefComplaintLabels.length
    ? chiefComplaintLabels.join(", ")
    : "None explicitly reported";

  const historyLine = historyConditions.length
    ? historyConditions.join(", ") + cancerNote
    : "None reported";

  const vitalsBlock = [
    `- BP: ${vitals.bp || "Not recorded"}`,
    `- HR: ${vitals.hr != null && vitals.hr !== "" ? `${vitals.hr} bpm` : "Not recorded"}`,
    `- SpO₂: ${vitals.spo2 != null && vitals.spo2 !== "" ? `${vitals.spo2}%` : "Not recorded"}`,
    `- Temp: ${vitals.temp != null && vitals.temp !== "" ? `${vitals.temp}°C` : "Not recorded"}`,
    `- RR: ${vitals.respRate != null && vitals.respRate !== "" ? `${vitals.respRate}/min` : "Not recorded"}`,
    `- Pain score: ${vitals.painScore != null && vitals.painScore !== "" ? `${vitals.painScore}/10` : "Not recorded"}`,
  ].join("\n");

  const vitalAlertsBlock = vitalAlerts.length
    ? `Vital-sign alerts:\n${vitalAlerts.map((a) => `- ${a}`).join("\n")}`
    : `Vital-sign alerts: none triggered by current thresholds.`;

  const redFlagsBlock = overallRedFlags.length
    ? `Questionnaire-level red flags triggered: ${overallRedFlags.join(", ")}`
    : `Questionnaire-level red flags triggered: none reported.`;

  const adaptiveBlock = pathwayBlocks
    ? `Adaptive Step-2 (OPQRST) findings:\n\n${pathwayBlocks}`
    : `Adaptive Step-2 (OPQRST) findings: not completed.`;

  const reasoningInstructions = isHebrew
    ? `הנחיות חשיבה (פנימיות — אל תשכפל אותן בתשובה):
- אל תעגן את התחשיב בתלונה היחידה — שקלל את כל התלונות הפעילות יחד.
- עבור כל תלונה עיקרית, בדוק במפורש את כל האבחנות שאסור לפספס לפני שתסתפק בסיבה שפירה.
- שקלל סימני אזהרה ומדדים חיוניים — חריגות במדדים מצדיקות העלאת סבירות לאבחנות חריפות.
- שקלל גיל, מגדר, הריון, היסטוריה אונקולוגית, דיכוי חיסוני ונוגדי קרישה כפי שמשפיעים על הסיכון.
- כאשר רלוונטי, ציין במפורש את כלל ההחלטה (HEART, Wells/PERC, Ottawa, Alvarado, HINTS, וכו') בנקודות התומכות או בהנמקה לבדיקות.
- שמור על אבחנה אחת לכל פריט; אל תאחד שתי אבחנות נפרדות בשורה אחת.`
    : `Reasoning instructions (internal — do not reproduce in the answer):
- Do not anchor on a single complaint — weigh all active complaints together.
- For each chief complaint, explicitly check the must-not-miss list before settling on a benign cause.
- Weigh red flags and vital-sign alerts: abnormal vitals raise the probability of acute / dangerous diagnoses.
- Factor in age, gender, pregnancy, oncologic history, immunosuppression and anticoagulation as they shift risk.
- Where relevant, cite the decision rule by name (HEART, Wells/PERC, Ottawa SAH, Alvarado, HINTS, etc.) in the supporting evidence or rationale.
- One diagnosis per item; never combine two distinct diagnoses on a single line.`;

  const userMessage = [
    heading,
    "",
    patientSection,
    "",
    `Chief complaints: ${complaintsLine}`,
    `Medical history: ${historyLine}`,
    `Current medications: ${medsLine}`,
    `Allergies: ${allergiesLine}`,
    "",
    `Vital signs on arrival:\n${vitalsBlock}`,
    "",
    vitalAlertsBlock,
    "",
    redFlagsBlock,
    "",
    adaptiveBlock,
    "",
    "Clinical-reasoning scaffold (Rosen's-style frameworks for the active chief complaints):",
    "",
    frameworksBlock,
    "",
    reasoningInstructions,
    "",
    getOutputContract(language),
  ].join("\n");

  return {
    systemMessage,
    userMessage,
    meta: {
      chiefComplaints: chiefComplaintLabels,
      pathwayIds,
      overallRedFlags,
      vitalAlerts,
    },
  };
}
