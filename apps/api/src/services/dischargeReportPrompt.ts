// =============================================================================
// Discharge-report prompt builder
// -----------------------------------------------------------------------------
// Builds the system + user messages for the AI discharge-report endpoint.
//
// Design goals:
//   1. Make generated reports read like the *real* discharge notes from Israeli
//      ED physicians (corpus: `DischargeReportSample.docx`). That means:
//        • A tight 7-section narrative structure (background → presenting →
//          exam → labs/imaging → impression → ED treatment → disposition).
//        • Telegraphic clinical style — short clauses joined by commas, not
//          textbook paragraphs.
//        • Hebrew prose mixed with the standard English abbreviations clinicians
//          actually use (AF, IHD, CRP, GCS, CT, US, IV, SC, BPPV, NCCT…).
//        • Gendered conjugation matching the patient's gender
//          (תשתחרר/ישתחרר, בבדיקתה/בבדיקתו, נבדק/נבדקה).
//        • Inline quantitative findings (CRP עד 160, HR סביב 130-140/לדקה,
//          המוגלובין 8.7 מ"ג/ד"ל).
//        • Conventional impression + disposition phrases (לסיכום, ע"ר, כותרת
//          של, מ/ל, ישתחרר/תשתחרר במצב כללי טוב עם ההמלצות הבאות).
//   2. Achieve the style transfer with **two real few-shot examples** (one
//      admission, one discharge home) reformatted to the new section markers.
//   3. Preserve the **bold-header section contract** the frontend renderer
//      already understands (`**Section Name**` on its own line).
// =============================================================================

export type DischargeLanguage = "en" | "he";
export type DischargeAction = "generate" | "improve" | "shorten";

export interface BuildDischargeMessagesArgs {
  caseDoc: any;
  answers: any;
  language: DischargeLanguage;
  action: DischargeAction;
  existingDraft?: string;
}

export interface BuildDischargeMessagesResult {
  systemMessage: string;
  userMessage: string;
}

// ─── Section structure ─────────────────────────────────────────────────────
// The frontend renderer (`apps/web/src/pages/DischargeReportPage.tsx`) parses
// `^\*\*(.+?)\*\*\s*$` as a section header. Both arrays below are kept in sync
// with the styling map there so each heading gets a colored card.

const SECTIONS_HE = [
  "רקע ואנמנזה",
  "תלונה מציגה",
  'בדיקה גופנית במלר"ד',
  "בדיקות מעבדה והדמיה",
  "הערכה (לסיכום)",
  'טיפול במלר"ד',
  "דיספוזיציה והמלצות",
];

const SECTIONS_EN = [
  "Background & History",
  "Presenting Complaint",
  "Physical Examination on Arrival",
  "Labs & Imaging",
  "Clinical Impression",
  "ED Treatment",
  "Disposition & Recommendations",
];

// ─── Few-shot examples ─────────────────────────────────────────────────────
// Lifted from `DischargeReportSample.docx` (real notes written by your
// physicians) and reformatted with the new section markers, keeping the
// telegraphic style, abbreviations and gendered conjugation intact.

const FEW_SHOT_ADMISSION = `דוגמה 1 - אשפוז:

**רקע ואנמנזה**
בת 80, סיעודית, דמנטית, מתגוררת בבית עם מטפלת צמודה 24/7. רקע - סכרת סוג 2 עם פגיעה באברי מטרה (נוירופתיה ונפרופתיה), אי ספיקת כליות כרונית, יל"ד.

**תלונה מציגה**
פנתה למלר"ד עקב חום מוגבר מלווה בצמרמורות, ירידה במצב כללי, ופצע לחץ חדש באספקט אחורי של שוק ימין. בנוסף ממעיטה במתן שתן עם שתן מוגלתי לדברי המטפלת.

**בדיקה גופנית במלר"ד**
חולה צועקת בזמן הבדיקה, בהכרה מלאה GCS 15. לב - קולות לב סדירים. ריאות - נקיות. בטן - רכה, לא רגישה. גפיים תחתונות - בצקת ‎+2 דוצ עם סימני פצע לחץ באספקט לטרלי של השוק ובכף הרגל מימין.

**בדיקות מעבדה והדמיה**
עלייה במדדי דלקת, CRP עד 160. המוגלובין ירוד עד 8.7 מ"ג/ד"ל. בדיקת שתן פתולוגית.

**הערכה (לסיכום)**
תמונה של מחלה זיהומית - מקור אורינרי בשילוב עם פצע לחץ נגוע. אנמיה חדשה - למעקב.

**טיפול במלר"ד**
הוחל טיפול אנטיביוטי IV באמיקצין + צפזולין.

**דיספוזיציה והמלצות**
תתאשפז להמשך בירור וטיפול אנטיביוטי דרך הוריד.`;

const FEW_SHOT_DISCHARGE = `דוגמה 2 - שחרור הביתה:

**רקע ואנמנזה**
בן 45, עישון פעיל, בריא בדרך כלל, ללא טיפול תרופתי קבוע.

**תלונה מציגה**
פנה למלר"ד עקב סחרחורת סיבובית מלווה בהקאות, החמרה בזמן שינוי תנוחה. ללא חום, ללא כאבי ראש.

**בדיקה גופנית במלר"ד**
חולה בהכרה מלאה, מציין סחרחורת. ניסטגמוס הוריזונטלי משמעותי בקבלתו. בדיקה נוירולוגית - הליכה תקינה, כוח גס שמור, תחושה שמורה, עצבים קרניאליים תקינים. לב - קולות סדירים. ריאות - נקיות. בטן - רכה, לא רגישה. גפיים - ללא בצקת, ללא סימני פקקת.

**בדיקות מעבדה והדמיה**
מעבדה - ללא ממצא חריג, ללא עלייה במדדי דלקת, המוגלובין יציב, ללא הפרעה אלקטרוליטית גסה.
CT ראש ללא חומר ניגוד - אין עדות לדימום מוחי, אין עדות לממצא מוקדי מוחי חריף, ללא שבר, קו האמצע שמור, חדרי המח ברוחב תקין.

**הערכה (לסיכום)**
אין עדות לדימום או לממצא מוקדי מוחי חריף. התרשמות ל-BPPV (מקור פריפרי לסחרחורת).

**טיפול במלר"ד**
טיפול תומך עם שיפור קליני.

**דיספוזיציה והמלצות**
ישתחרר במצב כללי טוב עם ההמלצות הבאות.`;

// ─── Helpers ───────────────────────────────────────────────────────────────

function activeKeys(record: Record<string, unknown> | undefined | null, skip: string[] = []): string[] {
  if (!record || typeof record !== "object") return [];
  return Object.entries(record)
    .filter(([k, v]) => v === true && !skip.includes(k))
    .map(([k]) => k);
}

function joinOrNone(items: string[], noneTextHe: string, noneTextEn: string, isHebrew: boolean): string {
  return items.length ? items.join(", ") : isHebrew ? noneTextHe : noneTextEn;
}

function formatVitalsBlock(vitals: any, isHebrew: boolean): string {
  const na = isHebrew ? "לא נרשם" : "Not recorded";
  return [
    `- ${isHebrew ? 'ל"ד' : "BP"}: ${vitals?.bp || na}`,
    `- ${isHebrew ? "דופק" : "HR"}: ${vitals?.hr != null && vitals.hr !== "" ? `${vitals.hr} bpm` : na}`,
    `- SpO₂: ${vitals?.spo2 != null && vitals.spo2 !== "" ? `${vitals.spo2}%` : na}`,
    `- ${isHebrew ? "חום" : "Temp"}: ${vitals?.temp != null && vitals.temp !== "" ? `${vitals.temp}°C` : na}`,
    `- ${isHebrew ? "קצב נשימה" : "RR"}: ${vitals?.respRate != null && vitals.respRate !== "" ? `${vitals.respRate}/min` : na}`,
    `- ${isHebrew ? "ציון כאב" : "Pain"}: ${vitals?.painScore != null && vitals.painScore !== "" ? `${vitals.painScore}/10` : na}`,
  ].join("\n");
}

function renderAdaptiveAnswers(adaptive: any): string {
  if (!adaptive || typeof adaptive !== "object") return "";
  const lines: string[] = [];
  const pathways: any[] = Array.isArray(adaptive.completedPathways) ? adaptive.completedPathways : [];
  for (const p of pathways) {
    if (!p || typeof p !== "object") continue;
    lines.push(`Pathway: ${p.pathwayId || "unknown"}`);
    if (p.locationData) lines.push(`  Location: ${JSON.stringify(p.locationData)}`);
    if (p.severity != null) lines.push(`  Severity: ${p.severity}/10`);
    if (p.responses && typeof p.responses === "object") {
      for (const [k, v] of Object.entries(p.responses)) {
        if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
        const val =
          typeof v === "boolean" ? (v ? "yes" : "no") : Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v);
        lines.push(`  ${k}: ${val}`);
      }
    }
    if (Array.isArray(p.redFlagsTriggered) && p.redFlagsTriggered.length) {
      lines.push(`  Red flags: ${p.redFlagsTriggered.join(", ")}`);
    }
  }
  if (Array.isArray(adaptive.overallRedFlags) && adaptive.overallRedFlags.length) {
    lines.push(`Overall red flags: ${adaptive.overallRedFlags.join(", ")}`);
  }
  // Fallback: legacy free-form symptoms / extra notes
  if (typeof adaptive.mainComplaint === "string" && adaptive.mainComplaint.trim()) {
    lines.push(`Patient-described main complaint: ${adaptive.mainComplaint.trim()}`);
  }
  return lines.join("\n");
}

// ─── Style guide ───────────────────────────────────────────────────────────

function getStyleGuideHe(): string {
  return `כללי סגנון (חובה — חקה את הסגנון של רופאי המלר"ד הישראלים):
- כתוב סגנון טלגרפי קליני, פסקות קצרות עם פסיקים, לא משפטים אקדמיים מסורבלים.
- ערבב עברית רפואית עם הקיצורים האנגליים הנהוגים: AF, IHD, CHF, CRP, GCS, IV, SC, CT, US, NCCT, BPPV, DVT, DKA, HEART score וכדומה.
- שמור על נטייה מגדרית עקבית של הפעלים בהתאם למגדר המטופל (ישתחרר/תשתחרר, נבדק/נבדקה, בבדיקתו/בבדיקתה).
- ערכים מספריים כתוב inline (CRP עד 160, המוגלובין 8.7 מ"ג/ד"ל, AF סביב 130-140/לדקה).
- השתמש בקיצורים: דוצ (דו-צדדי), סג"צ (סימני גירוי צפקי), צל"ח (צילום חזה), ת. כלייתי, ע"ר (על רקע), מ/ל (מצב לאחר), כותרת של, ס"ח, ל"ד.
- כל סעיף - 1-4 משפטים. לא להאריך מעבר לנדרש.
- אם נתון חסר - דלג עליו או ציין "לא נמסר/לא ידוע" באופן תמציתי. אל תמציא מידע.
- בסעיף "דיספוזיציה והמלצות" - השתמש בנוסח: "ישתחרר/תשתחרר במצב כללי טוב עם ההמלצות הבאות" או "יתאשפז להמשך בירור וטיפול".
- שמור על מבנה הסעיפים בדיוק עם תוויות **שם הסעיף** בתחילת כל בלוק (כדי שהמערכת תצבע ותציג נכון).`;
}

function getStyleGuideEn(): string {
  return `Style requirements (mandatory):
- Write in a telegraphic clinical style — short clauses joined by commas, not full textbook sentences.
- Use standard ED abbreviations inline (AF, IHD, CHF, CRP, GCS, IV, SC, CT, US, BPPV, DVT, DKA, HEART score, etc.).
- Maintain gender-consistent verb forms throughout.
- Quote quantitative findings inline (CRP up to 160, Hb 8.7 mg/dL, AF rate 130–140/min).
- Each section: 1–4 sentences max. Be terse.
- If data is missing, skip or state "not provided" concisely. Never fabricate.
- Disposition section must end with a clear "will be discharged in good general condition with the following recommendations" or "will be admitted for further workup / treatment".
- Keep section markers exactly as **Section Name** on their own line (the frontend parses these).`;
}

// ─── Public entry point ────────────────────────────────────────────────────

export function buildDischargeReportMessages(
  args: BuildDischargeMessagesArgs,
): BuildDischargeMessagesResult {
  const { caseDoc, answers, language, action, existingDraft } = args;
  const isHebrew = language === "he";

  // ── System message ──
  // Kept stable across all requests so OpenAI's prefix caching can kick in.
  const systemMessage = isHebrew
    ? `אתה רופא בכיר במלר"ד ישראלי המתעד רשומות שחרור.
הסגנון שלך חייב להידמות לתיעוד אמיתי של רופאי מלר"ד ישראלים: טלגרפי, ענייני, עם קיצורים סטנדרטיים, ערכים מספריים inline ונטייה מגדרית של הפעלים. אל תכתוב סגנון ספר-לימוד.
לעולם אל תמציא נתונים, ערכים מספריים או ממצאים שלא סופקו. אם מידע חסר - דלג עליו או ציין שלא נמסר.`
    : `You are a senior ED physician documenting a discharge record in the standard Israeli ED style.
Write tersely and clinically — short clauses, inline quantitative findings, standard ED abbreviations. Do not produce textbook prose.
Never fabricate values, findings or facts that were not provided. If data is missing, skip it or state it is not available.`;

  // ── Branch on action ──
  if (action === "improve" && existingDraft) {
    const userMessage = isHebrew
      ? `שכתב את רשומת השחרור הבאה בעברית רפואית מקצועית בסגנון של רופאי מלר"ד ישראלים. שמור על כל העובדות הקליניות, על כותרות הסעיפים (**שם הסעיף**) ועל מבנה הרשומה הכולל. שפר רק את הניסוח והמינוח הרפואי.

${getStyleGuideHe()}

הרשומה לשכתוב:

${existingDraft}`
      : `Rewrite the following discharge record in the Israeli-ED clinical style described below. Preserve all clinical facts, section headers (**Section Name**) and the overall structure. Only improve wording and medical terminology.

${getStyleGuideEn()}

Record to rewrite:

${existingDraft}`;
    return { systemMessage, userMessage };
  }

  if (action === "shorten" && existingDraft) {
    const userMessage = isHebrew
      ? `צור גרסה תמציתית של רשומת השחרור הזו (בערך חצי מהאורך) בסגנון של רופאי מלר"ד ישראלים. שמר את כל כותרות הסעיפים (**שם הסעיף**) ועובדות קליניות קריטיות. הסר חזרות וטקסט מילולי שאינו תורם.

${getStyleGuideHe()}

הרשומה לתמצות:

${existingDraft}`
      : `Produce a condensed version of this discharge record (approximately half the length) in the Israeli-ED clinical style described below. Preserve every section header (**Section Name**) and all critical clinical facts. Remove redundancy and filler.

${getStyleGuideEn()}

Record to condense:

${existingDraft}`;
    return { systemMessage, userMessage };
  }

  // ── action === "generate" (default) ──

  const personalInfo = answers?.personalInfo || {};
  const medicalHistory = answers?.medicalHistory || {};
  const currentIllness = answers?.currentIllness || {};
  const medications = answers?.medications || {};
  const adaptive = answers?.adaptiveQuestions || answers?.symptoms || {};
  const vitals = caseDoc?.vitals || {};

  const ageStr = personalInfo.age ? String(personalInfo.age) : isHebrew ? "לא ידוע" : "Unknown";
  const genderRaw = personalInfo.gender ? String(personalInfo.gender) : "";
  const genderStr = genderRaw || (isHebrew ? "לא ידוע" : "Unknown");

  const activeConditions = activeKeys(medicalHistory, [
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
  const historyLine = joinOrNone(activeConditions, "לא דווח", "None reported", isHebrew) + cancerNote;

  const activeSymptoms = activeKeys(currentIllness);
  const symptomsLine = joinOrNone(activeSymptoms, "לא דווח", "None reported", isHebrew);

  const medGroups = (medications?.groups || {}) as Record<string, unknown>;
  const medList = (Object.values(medGroups).flat().filter(Boolean) as string[]);
  const doesNotRememberMeds = medications?.doesNotRememberMedications === true;
  const medsLine = doesNotRememberMeds
    ? isHebrew
      ? "המטופל אינו זוכר תרופות"
      : "Patient does not remember medications"
    : medList.length
      ? medList.join(", ")
      : isHebrew
        ? "לא דווח"
        : "None reported";

  const allergiesObj = medications?.allergies || {};
  const allergiesLine =
    allergiesObj.allergyDetails ||
    (allergiesObj.hasAllergies === "yes"
      ? isHebrew
        ? "כן — פרטים לא ידועים"
        : "Yes — details unknown"
      : allergiesObj.hasAllergies === "no"
        ? isHebrew
          ? "ללא ידועות"
          : "None known"
        : isHebrew
          ? "לא דווח"
          : "Not reported");

  const orderedTestsList =
    (caseDoc?.orderedTests || []).join(", ") || (isHebrew ? "לא הוזמנו" : "None ordered");

  const adaptiveBlock = renderAdaptiveAnswers(adaptive);
  const adaptiveSection = adaptiveBlock
    ? `${isHebrew ? "שאלון תסמינים אדפטיבי (פרטים מדווחי-מטופל):" : "Adaptive symptom questionnaire (patient-reported):"}\n${adaptiveBlock}`
    : `${isHebrew ? "שאלון תסמינים אדפטיבי:" : "Adaptive symptom questionnaire:"} ${isHebrew ? "לא הושלם" : "not completed"}`;

  const formFilledBy = personalInfo.formFilledBy || (isHebrew ? "לא ידוע" : "Unknown");
  const cognitiveState = personalInfo.cognitiveState || (isHebrew ? "לא נרשם" : "Not recorded");
  const functionalState = personalInfo.functionalState || (isHebrew ? "לא נרשם" : "Not recorded");
  const maritalStatus = personalInfo.maritalStatus || (isHebrew ? "לא נרשם" : "Not recorded");

  const sectionList = isHebrew ? SECTIONS_HE : SECTIONS_EN;
  const sectionListBlock = sectionList.map((s, i) => `${i + 1}. **${s}**`).join("\n");

  // Few-shot examples (Hebrew only — we don't yet have an English corpus).
  const fewShotBlock = isHebrew ? `${FEW_SHOT_ADMISSION}\n\n${FEW_SHOT_DISCHARGE}` : "";

  // ── User message ──
  // Layout: style guide → section list → few-shot examples → case data → final
  // instruction. Stable parts go first to maximize prompt-cache hit rate.

  const userMessage = isHebrew
    ? `${getStyleGuideHe()}

הסעיפים הנדרשים בדיוק לפי הסדר הבא:
${sectionListBlock}

חובה לציין את כל הסעיפים — אם מידע חסר בסעיף, כתוב משפט אחד תמציתי המציין זאת (למשל: "לא בוצעו בדיקות הדמיה במלר\"ד").

הסגנון המבוקש — דוגמאות אמיתיות שעליך לחקות (אל תעתיק תוכן, רק סגנון ומבנה):

${fewShotBlock}

==============================
נתוני המקרה הנוכחי שיש לתעד:
==============================

מטופל: ${caseDoc?.patientName || "—"}, גיל: ${ageStr}, מגדר: ${genderStr}, ת"ז: ${caseDoc?.nationalId || "—"}
מילוי הטופס על ידי: ${formFilledBy} | מצב קוגניטיבי: ${cognitiveState} | מצב תפקודי: ${functionalState}
מצב משפחתי: ${maritalStatus}

היסטוריה רפואית: ${historyLine}
אלרגיות: ${allergiesLine}
תרופות נוכחיות: ${medsLine}

תלונה עיקרית / תסמינים מציגים: ${symptomsLine}

${adaptiveSection}

סימנים חיוניים בעת ההגעה:
${formatVitalsBlock(vitals, true)}

חקירות שהוזמנו על ידי הרופא: ${orderedTestsList}

==============================
הקשר עזר (אל תצטט מילולית):
==============================

סיכום קליני AI: ${caseDoc?.summary || "טרם נוצר"}

אבחנה מבדלת AI: ${caseDoc?.aiDiagnosis || "טרם נוצר"}

==============================

הפק כעת את רשומת השחרור בסגנון הדוגמאות שלמעלה, עם כותרות **שם הסעיף** בדיוק כמתבקש. שמור על נטייה מגדרית עקבית בהתאם למגדר המטופל ("${genderStr}").`
    : `${getStyleGuideEn()}

Required sections, in this exact order:
${sectionListBlock}

Every section must appear. If data is missing for a section, write one short sentence stating that (e.g., "No imaging performed in the ED").

==============================
Current case data to document:
==============================

Patient: ${caseDoc?.patientName || "—"}, Age: ${ageStr}, Gender: ${genderStr}, ID: ${caseDoc?.nationalId || "—"}
Form filled by: ${formFilledBy} | Cognitive state: ${cognitiveState} | Functional state: ${functionalState}
Marital status: ${maritalStatus}

Medical history: ${historyLine}
Allergies: ${allergiesLine}
Current medications: ${medsLine}

Chief complaint / presenting symptoms: ${symptomsLine}

${adaptiveSection}

Vital signs on arrival:
${formatVitalsBlock(vitals, false)}

Investigations ordered by physician: ${orderedTestsList}

==============================
Supporting context (do not quote verbatim):
==============================

AI clinical summary: ${caseDoc?.summary || "Not yet generated"}

AI differential diagnosis: ${caseDoc?.aiDiagnosis || "Not yet generated"}

==============================

Now produce the discharge record with **Section Name** headers exactly as listed. Keep gender-consistent verb forms throughout.`;

  return { systemMessage, userMessage };
}
