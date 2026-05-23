// =============================================================================
// Clinical summary prompt builder (AI summary on the doctor case page)
// -----------------------------------------------------------------------------
// Produces terse Israeli-ED-style intake summaries — NOT textbook paragraphs.
// Template validated with clinical partners; every summary follows the same
// paragraph scaffold.
// =============================================================================

export type SummaryLanguage = "en" | "he";

export interface BuildSummaryMessagesArgs {
  answers: Record<string, unknown>;
  vitals: Record<string, unknown>;
  language: SummaryLanguage;
}

export interface BuildSummaryMessagesResult {
  systemMessage: string;
  userMessage: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function activeKeys(record: Record<string, unknown> | undefined | null, skip: string[] = []): string[] {
  if (!record || typeof record !== "object") return [];
  return Object.entries(record)
    .filter(([k, v]) => v === true && !skip.includes(k))
    .map(([k]) => k);
}

const HISTORY_LABELS_HE: Record<string, string> = {
  diabetes: "סכרת",
  hypertension: "יתר לחץ דם",
  dyslipidemia: "יתר שומנים בדם",
  asthma: "אסטמה",
  ischemicHeartDisease: 'מחלת לב איסכמית',
  heartFailure: "אי ספיקת לב",
  atrialFibrillation: "פרפור פרוזדורים",
  cancer: "סרטן",
  previousStroke: "שבץ מוחי בעבר",
  hypothyroidism: "תת-פעילות בלוטת התריס",
  copd: "COPD",
  renalFailure: "א.ס. כליות",
  smoking: "עישון",
  immunocompromised: "מדוכא חיסון",
  previousSurgeries: "ניתוחים בעבר",
  otherDiseases: "מחלות נוספות",
};

const HISTORY_LABELS_EN: Record<string, string> = {
  diabetes: "diabetes",
  hypertension: "hypertension",
  dyslipidemia: "dyslipidemia",
  asthma: "asthma",
  ischemicHeartDisease: "ischemic heart disease",
  heartFailure: "heart failure",
  atrialFibrillation: "atrial fibrillation",
  cancer: "cancer",
  previousStroke: "previous stroke",
  hypothyroidism: "hypothyroidism",
  copd: "COPD",
  renalFailure: "chronic renal failure",
  smoking: "smoking",
  immunocompromised: "immunocompromised",
  previousSurgeries: "previous surgeries",
  otherDiseases: "other diseases",
};

function renderAdaptiveBlock(adaptive: unknown): string {
  if (!adaptive || typeof adaptive !== "object") return "";
  const lines: string[] = [];
  const obj = adaptive as Record<string, unknown>;
  const pathways = Array.isArray(obj.completedPathways) ? obj.completedPathways : [];
  for (const p of pathways) {
    if (!p || typeof p !== "object") continue;
    const entry = p as Record<string, unknown>;
    lines.push(`Pathway: ${entry.pathwayId || "unknown"}`);
    if (entry.locationData) lines.push(`  Location: ${JSON.stringify(entry.locationData)}`);
    if (entry.severity != null) lines.push(`  Severity: ${entry.severity}/10`);
    const responses = entry.responses && typeof entry.responses === "object" ? (entry.responses as Record<string, unknown>) : {};
    for (const [k, v] of Object.entries(responses)) {
      if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
      const val =
        typeof v === "boolean" ? (v ? "yes" : "no") : Array.isArray(v) ? v.join(", ") : String(v);
      lines.push(`  ${k}: ${val}`);
    }
    if (Array.isArray(entry.redFlagsTriggered) && entry.redFlagsTriggered.length) {
      lines.push(`  Red flags: ${entry.redFlagsTriggered.join(", ")}`);
    }
  }
  if (Array.isArray(obj.overallRedFlags) && obj.overallRedFlags.length) {
    lines.push(`Overall red flags: ${obj.overallRedFlags.join(", ")}`);
  }
  return lines.join("\n");
}

function formatChiefComplaints(currentIllness: Record<string, unknown>, isHebrew: boolean): string {
  const keys = activeKeys(currentIllness);
  if (!keys.length) return isHebrew ? "לא דווח" : "None reported";
  return keys.join(", ");
}

// ─── Few-shot examples (Hebrew) ─────────────────────────────────────────────

const FEW_SHOT_CHEST_PAIN = `דוגמה — כאב בחזה:

בן 35, נשוי, צלול ועצמאי.
בריא בד"כ.
התקבל למיון עקב כאב בחזה מזה 3 ימים, פתאומי, לסירוגין, נמשך כמספר דקות ולאחר מזה חולף, לא קשור למאמץ או נשימה, ללא הקרנה, מתגבר בשינוי תנוחה, אירוע ראשון בחיים ללא אירוע דומה בעבר.
ללא קושי בנשימה, ללא חום, ללא כאב בבטן, ללא הקאות או שלשולים, ללא שיעול.`;

const FEW_SHOT_WITH_MEDS = `דוגמה — רקע + תרופות + מחלה נוכחית:

בת 45, נשואה, במצב קוגניטיבי שמור, תפקוד עצמאי.
ברקע: יתר לחץ דם, מחלת לב איסכמית.
תרופות קבועות: Diovan, Tritace, Plavix, Procor.
התקבל למיון עקב כאב בחזה לוחץ, 3/10, פתאומי, עם הקרנה לזרוע שמאל. בנוסף שיעול.
ללא חום, ללא קוצר נשימה.`;

// ─── Public entry point ─────────────────────────────────────────────────────

export function buildSummaryMessages(args: BuildSummaryMessagesArgs): BuildSummaryMessagesResult {
  const { answers, vitals, language } = args;
  const isHebrew = language === "he";

  const personalInfo = (answers.personalInfo || {}) as Record<string, unknown>;
  const medicalHistory = (answers.medicalHistory || {}) as Record<string, unknown>;
  const currentIllness = (answers.currentIllness || {}) as Record<string, unknown>;
  const medications = (answers.medications || {}) as Record<string, unknown>;
  const adaptive = answers.adaptiveQuestions || answers.symptoms || {};

  const age = personalInfo.age ? String(personalInfo.age) : "";
  const gender = personalInfo.gender ? String(personalInfo.gender) : "";
  const maritalStatus = personalInfo.maritalStatus ? String(personalInfo.maritalStatus) : "";
  const cognitiveState = personalInfo.cognitiveState ? String(personalInfo.cognitiveState) : "";
  const functionalState = personalInfo.functionalState ? String(personalInfo.functionalState) : "";

  const historyKeys = activeKeys(medicalHistory, ["none", "cancerStatus", "cancerType", "otherDiseasesText"]);
  const historyLabels = isHebrew ? HISTORY_LABELS_HE : HISTORY_LABELS_EN;
  const historyList = historyKeys.map((k) => historyLabels[k] || k);
  const cancerNote =
    medicalHistory.cancer === true
      ? `${isHebrew ? "סרטן" : "cancer"}${medicalHistory.cancerStatus ? ` (${medicalHistory.cancerStatus}${medicalHistory.cancerType ? `, ${medicalHistory.cancerType}` : ""})` : ""}`
      : "";
  if (medicalHistory.cancer === true && !historyKeys.includes("cancer")) {
    historyList.push(cancerNote);
  } else if (medicalHistory.cancer === true) {
    const idx = historyList.findIndex((h) => h.includes("סרטן") || h.includes("cancer"));
    if (idx >= 0 && cancerNote) historyList[idx] = cancerNote;
  }

  const medGroups = (medications.groups || {}) as Record<string, unknown>;
  const medList = Object.values(medGroups).flat().filter(Boolean) as string[];
  const doesNotRememberMeds = medications.doesNotRememberMedications === true;

  const allergiesObj = (medications.allergies || {}) as Record<string, unknown>;
  const allergiesLine =
    allergiesObj.allergyDetails ||
    (allergiesObj.hasAllergies === "yes"
      ? isHebrew ? "רגישות לתרופות — פרטים לא ידועים" : "Drug allergy — details unknown"
      : allergiesObj.hasAllergies === "no"
        ? isHebrew ? "ללא רגישות ידועה לתרופות" : "No known drug allergies"
        : "");

  const adaptiveBlock = renderAdaptiveBlock(adaptive);
  const complaintsLine = formatChiefComplaints(currentIllness, isHebrew);

  const vitalsBlock = [
    `BP: ${vitals.bp || "—"}`,
    `HR: ${vitals.hr ?? "—"}`,
    `SpO2: ${vitals.spo2 ?? "—"}%`,
    `Temp: ${vitals.temp ?? "—"}°C`,
    `Pain: ${vitals.painScore ?? "—"}/10`,
  ].join(", ");

  const systemMessage = isHebrew
    ? `אתה רופא במלר"ד ישראלי הכותב תקציר קליני קצר לרופא המקבל.
כתוב בסגנון טלגרפי כמו בדוגמאות — לא סגנון ספר לימוד ולא פסקה אקדמית ארוכה.
אל תמציא נתונים שלא סופקו.`
    : `You are an Israeli ED physician writing a brief handoff summary for the receiving doctor.
Write in a telegraphic ED style matching the examples — not textbook prose.
Never fabricate data that was not provided.`;

  if (isHebrew) {
    const userMessage = `כללי כתיבה — חובה לכל מטופל:

1. **שורת פתיחה** — בלבד:
   - התחל ב-{בן/בת} {גיל} — ללא שם מטופל, ללא המילים "גבר" או "אישה".
   - הוסף מצב משפחתי אם ידוע (נשוי/נשואה/רווק/גרוש וכו').
   - מצב קוגניטיבי: "צלול" או "במצב קוגניטיבי שמור" (לא "עצמאי" למצב קוגניטיבי!).
   - מצב תפקודי: "עצמאי" או "תפקוד עצמאי" (לא לערבב עם קוגניטיבי).
   - אפשר לשלב: "צלול ועצמאי" כשמתאים.

2. **ברקע** — שורה נפרדת:
   - כתוב "ברקע:" ואז רק מחלות פעילות מהשאלון.
   - אם אין מחלות (או נבחר "none"): כתוב "בריא בדרך כלל" או "בריא בד\"כ".
   - **אסור** לרשום מה המטופל *אינו* סובל ממנו (לא "אינו סובל מ...", לא רשימת שלילות של מחלות).

3. **תרופות** — שורה נפרדת מיד אחרי הרקע (אם יש):
   - כתוב "תרופות קבועות:" ואז רשימת התרופות.
   - **אסור** "המטופל נוטל תרופות".
   - אם המטופל לא זוכר תרופות — כתוב "המטופל אינו זוכר תרופות".
   - אם אין תרופות — דלג על שורה זו.
   - אלרגיות: שורה נפרדת "רגישות:" רק אם יש רגישות ידועה.

4. **מחלה נוכחית** — פסקה/פסקאות נפרדות:
   - התחל ב-"התקבל למיון עקב …" ותאר את התלונה/ות בגוף שלישי קצר (סובל מ… / התקבל עקב…).
   - השתמש בנתוני שאלון Step-2 (OPQRST): אופי, התחלה, משך, חומרה, הקרנה, גורמים מחמירים/מקלים.
   - אם יש יותר מתלונה אחת — "בנוסף …" (למשל: בנוסף שיעול).
   - **אל** תכתוב "מוגדר כ…", "המטופל מציג", "תלונה עיקרית של".
   - הוסף שורות "ללא …" רק לתסמינים שליליים רלוונטיים שלא קיימים (קוצר נשימה, חום, בחילות, וכו').

5. **אסור לחלוטין:**
   - שם מטופל, ת"ז, גבר/אישה, כותרת "היסטוריה רפואית".
   - סיכום, המלצות, "יש לשקול", "בעקבות התסמינים".
   - תרגום באנגלית בסוגריים (למשל לא "(pressing)" — כתוב "לוחץ").
   - פסקת מסקנה או 2–3 שורות אחרונות של המלצות.

6. סימנים חיוניים — רק אם רלוונטיים, שורה קצרה בסוף (לא חובה): "סימנים חיוניים: …"

דוגמאות לסגנון (חקה מבנה, לא תוכן):

${FEW_SHOT_CHEST_PAIN}

${FEW_SHOT_WITH_MEDS}

══════════════════════════════
נתוני המקרה הנוכחי:
══════════════════════════════

גיל: ${age || "לא ידוע"}
מגדר (לבחירת בן/בת בלבד): ${gender || "לא ידוע"}
מצב משפחתי: ${maritalStatus || "לא נרשם"}
מצב קוגניטיבי (raw): ${cognitiveState || "לא נרשם"}
מצב תפקודי (raw): ${functionalState || "לא נרשם"}

מחלות פעילות: ${historyList.length ? historyList.join(", ") : "none"}
תרופות: ${doesNotRememberMeds ? "לא זוכר" : medList.length ? medList.join(", ") : "none"}
רגישויות: ${allergiesLine || "none"}

תלונות שנבחרו (Step 1): ${complaintsLine}

שאלון אדפטיבי Step-2:
${adaptiveBlock || "לא הושלם"}

סימנים חיוניים: ${vitalsBlock}

══════════════════════════════

הפק כעת את התקציר הקליני בעברית בלבד, לפי המבנה לעיל.`;

    return { systemMessage, userMessage };
  }

  // English fallback — same structure
  const userMessage = `Writing rules — apply to every patient:

1. **Opening line**: {Age}-year-old, marital status if known, cognitive status, functional status.
   - Do NOT include patient name or the words "male"/"female" as labels — use age only.
2. **Background**: "Background:" + active conditions only, OR "Generally healthy" if none.
   - Do NOT list conditions the patient does NOT have.
3. **Medications** (if any): "Regular medications:" + list. Skip if none. Do NOT write "patient takes medications".
4. **Present illness**: "Presented to ED with …" — telegraphic OPQRST from Step-2 data. Pertinent negatives as "No …" lines.
5. **Do NOT** include conclusions, recommendations, or "consider further workup".

Examples:

${FEW_SHOT_CHEST_PAIN}

Case data:
Age: ${age || "unknown"}, Gender: ${gender || "unknown"}, Marital: ${maritalStatus || "—"}
Cognitive: ${cognitiveState || "—"}, Functional: ${functionalState || "—"}
Active conditions: ${historyList.length ? historyList.join(", ") : "none"}
Medications: ${doesNotRememberMeds ? "does not remember" : medList.length ? medList.join(", ") : "none"}
Allergies: ${allergiesLine || "none"}
Chief complaints: ${complaintsLine}
Adaptive Step-2:
${adaptiveBlock || "not completed"}
Vitals: ${vitalsBlock}

Produce the clinical summary now.`;

  return { systemMessage, userMessage };
}
