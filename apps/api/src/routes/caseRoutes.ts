import express from "express";
import mongoose from "mongoose";
import OpenAI from "openai";
import { Case } from "../models/Case.js";
import { Questionnaire } from "../models/Questionnaire.js";

const router = express.Router();


// ---------------- GET ALL CASES ----------------
router.get("/", async (_req, res) => {
  try {
    const cases = await Case.find({}).sort({ createdAt: -1 });
    return res.json({ count: cases.length, cases });
  } catch (error: any) {
    console.error("Error fetching cases:", error);
    return res.status(500).json({
      message: "Error fetching cases",
      error: error.message
    });
  }
});

// ---------------- CREATE CASE ----------------
router.post("/", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database unavailable",
        message: "Database is not connected. Please start MongoDB or configure MONGODB_URI."
      });
    }

    const { patientName, nationalId, hospital } = req.body;

    if (!patientName || !nationalId) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Both patientName and nationalId are required"
      });
    }

    const newCase = await Case.create({
      patientName,
      nationalId,
      ...(typeof hospital === "string" && hospital.trim() ? { hospital: hospital.trim() } : {}),
    });
    return res.status(201).json(newCase);
  } catch (error: any) {
    console.error("Error creating case:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation error",
        message: error.message
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        error: "Duplicate national ID",
        message: "A case with this national ID already exists"
      });
    }

    return res.status(500).json({ message: "Failed to create case" });
  }
});

// ---------------- GET QUESTIONNAIRE ----------------
router.get("/:id/questionnaire", async (req, res) => {
  try {
    const caseId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({
        error: "Invalid ID format",
        message: "Please provide a valid MongoDB ObjectId"
      });
    }

    // Find questionnaire
    const questionnaire = await Questionnaire.findOne({ caseId });
    
    if (!questionnaire) {
      return res.status(404).json({
        message: "Questionnaire not found"
      });
    }

    return res.status(200).json(questionnaire);
  } catch (error: any) {
    console.error("Error fetching questionnaire:", error);
    return res.status(500).json({
      message: "Error fetching questionnaire",
      error: error.message
    });
  }
});

// ---------------- CREATE QUESTIONNAIRE (PLACE BEFORE /:id) ----------------
router.post("/:id/questionnaire", async (req, res) => {
  try {
    const caseId = req.params.id;
    const { answers } = req.body;
    
    // validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({
        error: "Invalid ID format",
        message: "Please provide a valid MongoDB ObjectId"
      });
    }

    // validate answers body
    if (!answers || typeof answers !== "object") {
      return res.status(400).json({
        error: "Invalid body",
        message: "Missing or invalid 'answers' field in request body"
      });
    }

    const existingCase = await Case.findById(caseId);
    if (!existingCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    const questionnaire = await Questionnaire.create({ caseId, answers });
    if (existingCase.status !== "open") {
      existingCase.status = "open";
      await existingCase.save();
    }
    return res.status(201).json(questionnaire);
  } catch (error: any) {
    console.error("Questionnaire error:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Error saving questionnaire",
      details: error.message
    });
  }
});

// ---------------- UPDATE STATUS ----------------
router.patch("/:id/status", async (req, res) => {
  try {
    const caseId = req.params.id;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({
        error: "Invalid ID format",
        message: "Please provide a valid MongoDB ObjectId"
      });
    }

    // "closed" may only be set by the discharge-report/finalize endpoint.
    // Any other code path (e.g. the dashboard) must not be able to close a case directly.
    const allowedStatuses = ["awaiting_vitals", "open", "in_progress", "tests_ordered", "cancelled"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status",
        message: `Status must be one of: ${allowedStatuses.join(", ")}. To close a case, finalize the discharge report.`
      });
    }

    const updatedCase = await Case.findByIdAndUpdate(
      caseId,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    return res.status(200).json(updatedCase);
  } catch (error: any) {
    console.error("Status update error:", error);
    return res.status(500).json({
      message: "Error updating case status",
      error: error.message
    });
  }
});

// ---------------- ORDER TESTS ----------------
router.post("/:id/order-tests", async (req, res) => {
  try {
    const caseId = req.params.id;
    const { tests } = req.body;

    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({
        error: "Invalid ID format",
        message: "Please provide a valid MongoDB ObjectId"
      });
    }

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({ message: "Case not found" });
    }

    if (caseDoc.status === "closed") {
      return res.status(409).json({
        error: "Case already closed",
        message: "This case has already been closed."
      });
    }

    // Ordering tests must NOT change case status.
    // Status remains open/in_progress until discharge is finalized.
    const updateFields: Record<string, unknown> = {
      orderedAt: new Date(),
    };
    if (tests && Array.isArray(tests)) {
      updateFields.orderedTests = tests;
    }

    const updatedCase = await Case.findByIdAndUpdate(caseId, updateFields, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json(updatedCase);
  } catch (error: any) {
    console.error("Order tests error:", error);
    return res.status(500).json({
      message: "Error ordering tests",
      error: error.message
    });
  }
});

// ---------------- UPDATE VITALS ----------------
router.post("/:id/vitals", async (req, res) => {
  try {
    const caseId = req.params.id;
    const vitalsData = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({
        error: "Invalid ID format",
        message: "Please provide a valid MongoDB ObjectId"
      });
    }

    // Validate that at least one vital field is provided
    const validVitalsFields = ['bp', 'hr', 'spo2', 'temp', 'respRate', 'painScore'];
    const providedFields = Object.keys(vitalsData).filter(key => 
      validVitalsFields.includes(key) && vitalsData[key] !== undefined && vitalsData[key] !== null
    );

    if (providedFields.length === 0) {
      return res.status(400).json({
        error: "Invalid request body",
        message: "At least one vital field must be provided",
        validFields: validVitalsFields
      });
    }

    // Find the case
    const existingCase = await Case.findById(caseId);
    if (!existingCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    // Update vitals - merge with existing vitals
    const currentVitals = existingCase.vitals || {};
    const updatedVitals = { ...currentVitals, ...vitalsData };

    // Triage hand-off: when the nurse records vitals on a case that was waiting
    // for triage, transition the case to "open" so it appears on the doctor's
    // dashboard. Cases that were already past triage keep their current status.
    const update: Record<string, any> = { vitals: updatedVitals };
    if (existingCase.status === "awaiting_vitals") {
      update.status = "open";
    }

    const updatedCase = await Case.findByIdAndUpdate(
      caseId,
      update,
      { new: true, runValidators: true }
    );

    return res.status(200).json(updatedCase);
  } catch (error: any) {
    console.error("Vitals update error:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation error",
        message: error.message
      });
    }

    return res.status(500).json({
      message: "Error updating vitals",
      error: error.message
    });
  }
});

// ---------------- GENERATE SUMMARY ----------------
router.post("/:id/summary", async (req, res) => {
  try {
    const caseId = req.params.id;

    // Validate case ID
    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ 
        error: "Invalid case ID format",
        message: "Please provide a valid MongoDB ObjectId"
      });
    }

    // Fetch case data
    const existingCase = await Case.findById(caseId);
    if (!existingCase) {
      return res.status(404).json({ 
        error: "Case not found",
        message: "No case found with the provided ID"
      });
    }

    // Fetch questionnaire + vitals
    const questionnaire = await Questionnaire.findOne({ caseId });
    const answers = questionnaire?.answers || {};
    const vitals = existingCase.vitals || {};

    const language = (req.body?.language === "he" ? "he" : "en") as "en" | "he";
    const isHebrew = language === "he";

    // Build clinical prompt
    const prompt = isHebrew
      ? `
צור סיכום קליני באורך בינוני המתאים לרשומה רפואית אלקטרונית.
השתמש בשפה רפואית ברורה (טון מקצועי) וחשיבה מובנית.
כתוב את כל הסיכום בעברית. עבור מינוחים רפואיים נפוצים ניתן להוסיף את המקור באנגלית בסוגריים.

פרטי המטופל:
שם: ${existingCase.patientName}
תעודת זהות: ${existingCase.nationalId}
סטטוס: ${existingCase.status}

תשובות שאלון:
${JSON.stringify(answers, null, 2)}

סימנים חיוניים:
${JSON.stringify(vitals, null, 2)}

החזר רק את פסקת הסיכום הקלינית. אל תכלול הערות או מטא-נתונים.
`
      : `
Generate a medium-length clinical summary suitable for an electronic medical record.
Use clear medical language (professional tone) and structured reasoning.

Patient Details:
Name: ${existingCase.patientName}
National ID: ${existingCase.nationalId}
Status: ${existingCase.status}

Questionnaire Answers:
${JSON.stringify(answers, null, 2)}

Vital Signs:
${JSON.stringify(vitals, null, 2)}

Return only the clinical summary paragraph. Do not include any notes or metadata.
`;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: "OpenAI API key not configured",
        message: "Please set OPENAI_API_KEY environment variable"
      });
    }

    // Initialize OpenAI client
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = isHebrew
      ? "אתה עוזר רפואי הכותב הערות קליניות באורך בינוני עבור רופאים. כתוב את כל התשובה בעברית רפואית מקצועית."
      : "You are a medical assistant writing medium-length clinical notes for doctors.";

    // Call OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4
    });

    const summary = response.choices[0]?.message?.content?.trim() || "Unable to generate summary";

    // Save summary to case
    existingCase.summary = summary;
    await existingCase.save();

    return res.status(200).json({ summary });
  } catch (error: any) {
    console.error("Summary generation error:", error);
    
    // Handle specific OpenAI API errors
    if (error.status === 429) {
      return res.status(429).json({
        error: "OpenAI API quota exceeded",
        message: "You have exceeded your OpenAI API quota. Please check your billing details.",
        details: "https://platform.openai.com/docs/guides/error-codes/api-errors"
      });
    }
    
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({
        error: "OpenAI API quota exceeded",
        message: "Please check your OpenAI API billing"
      });
    }

    if (error.code === 'invalid_api_key') {
      return res.status(401).json({
        error: "Invalid OpenAI API key",
        message: "Please check your OPENAI_API_KEY environment variable"
      });
    }

    // Handle database errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: "Validation error",
        message: error.message
      });
    }

    // Generic error response
    return res.status(500).json({
      error: "Internal server error",
      message: "Error generating summary",
      details: error.message
    });
  }
});

// ---------------- GENERATE AI DIAGNOSIS ----------------
router.post("/:id/diagnosis", async (req, res) => {
  try {
    const caseId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({
        error: "Invalid ID format",
        message: "Please provide a valid MongoDB ObjectId"
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: "OpenAI API key not configured",
        message: "Please set OPENAI_API_KEY environment variable"
      });
    }

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({ message: "Case not found" });
    }

    // Questionnaire is optional — proceed with available data if not found
    const questionnaire = await Questionnaire.findOne({ caseId });
    const qAnswers = questionnaire?.answers || {};

    const activeSymptomsDx = qAnswers.currentIllness
      ? Object.entries(qAnswers.currentIllness)
          .filter(([, v]) => v === true)
          .map(([k]) => `- ${k}`)
          .join('\n') || 'None reported'
      : 'Not available';

    const activeHistoryDx = qAnswers.medicalHistory
      ? Object.entries(qAnswers.medicalHistory)
          .filter(([k, v]) => v === true && k !== 'none')
          .map(([k]) => `- ${k}`)
          .join('\n') || 'None'
      : 'Not available';

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const language = (req.body?.language === "he" ? "he" : "en") as "en" | "he";
    const isHebrew = language === "he";

    // Build diagnosis prompt.
    // IMPORTANT: When language is Hebrew, keep the structural skeleton (section
    // headers, field labels, urgency values, and English investigation
    // abbreviations) exactly as below — the frontend parses these markers.
    // Diagnosis names, supporting evidence, and rationale text should be in
    // Hebrew.
    const diagnosisPrompt = isHebrew
      ? `
כעוזר רפואי בינה מלאכותית, נתח את נתוני המטופל וספק אבחנות מבדלות עם ציוני סבירות והמלצות לבדיקות.

מידע על המטופל:
- שם: ${caseDoc.patientName}
- גיל: ${qAnswers.personalInfo?.age || 'לא ידוע'}
- מגדר: ${qAnswers.personalInfo?.gender || 'לא ידוע'}

תסמינים נוכחיים:
${activeSymptomsDx}

היסטוריה רפואית:
${activeHistoryDx}

סימנים חיוניים:
- לחץ דם: ${caseDoc.vitals?.bp || 'לא נרשם'}
- דופק: ${caseDoc.vitals?.hr || 'לא נרשם'}
- ריווי חמצן: ${caseDoc.vitals?.spo2 || 'לא נרשם'}%
- חום: ${caseDoc.vitals?.temp || 'לא נרשם'}°C
- ציון כאב: ${caseDoc.vitals?.painScore || 'לא נרשם'}/10

הנחיות פלט קריטיות:
- שמור את הכותרות והתוויות הבאות באנגלית בדיוק כפי שמופיע — כותרות הסעיפים: "## Differential Diagnoses" ו-"## Recommended Diagnostic Tests"; התוויות "Probability:", "Supporting Evidence:", "Urgency:", "Rationale:".
- ערכי הדחיפות חייבים להיות באנגלית בדיוק: high / medium / low.
- שמות הבדיקות חייבים להתחיל בקיצור או בשם הסטנדרטי באנגלית (למשל: CT Head, CBC, ECG, Chest X-ray, Troponin, Urinalysis), אופציונלית עם הסבר קצר בעברית בסוגריים.
- שמות אבחנות (Diagnosis Name), נקודות התומכות (Supporting Evidence) והנמקות (Rationale) — כתוב בעברית רפואית מקצועית. עבור שמות אבחנות, ניתן להוסיף את שם האבחנה באנגלית בסוגריים לאחר השם בעברית.

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

(חזור על כך עבור 3-4 אבחנות)

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
  Rationale: להערכת הפרעת קצב לבבית.
- Chest X-ray - Urgency: medium
  Rationale: להערכת דלקת ריאות או תפליט פלאורלי.

דוגמאות לערכים לא תקינים (אל תכלול):
- Pneumonia (זוהי אבחנה, לא בדיקה)
- Migraine (זוהי אבחנה, לא בדיקה)
- Hypertensive Crisis (זוהי אבחנה, לא בדיקה)
`
      : `
As a medical AI assistant, analyze the following patient data and provide differential diagnoses with probability scores and test recommendations.

Patient Information:
- Name: ${caseDoc.patientName}
- Age: ${qAnswers.personalInfo?.age || 'Unknown'}
- Gender: ${qAnswers.personalInfo?.gender || 'Unknown'}

Current Symptoms:
${activeSymptomsDx}

Medical History:
${activeHistoryDx}

Vital Signs:
- Blood Pressure: ${caseDoc.vitals?.bp || 'Not recorded'}
- Heart Rate: ${caseDoc.vitals?.hr || 'Not recorded'}
- Oxygen Saturation: ${caseDoc.vitals?.spo2 || 'Not recorded'}%
- Temperature: ${caseDoc.vitals?.temp || 'Not recorded'}°C
- Pain Score: ${caseDoc.vitals?.painScore || 'Not recorded'}/10

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

(repeat for 3-4 diagnoses)

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
  Rationale: Evaluate for cardiac arrhythmia.
- Chest X-ray - Urgency: medium
  Rationale: Assess for pneumonia or pleural effusion.

Examples of INVALID entries (DO NOT include these):
- Pneumonia (this is a diagnosis, not a test)
- Migraine (this is a diagnosis, not a test)
- Hypertensive Crisis (this is a diagnosis, not a test)
`;

    const dxSystemPrompt = isHebrew
      ? "אתה עוזר רפואי בינה מלאכותית המתמחה באבחנה מבדלת והמלצות לבדיקות. ספק ניתוח מבוסס ראיות עם הערכות סבירות ברורות והמלצות מעשיות. כתוב שמות אבחנות, נקודות תומכות והנמקות בעברית רפואית מקצועית, אך שמור על הכותרות, התוויות וערכי הדחיפות באנגלית כפי שצוין בהוראות."
      : "You are a medical AI assistant specializing in differential diagnosis and test recommendations. Provide evidence-based analysis with clear probability assessments and actionable recommendations.";

    // Generate AI diagnosis
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: dxSystemPrompt
        },
        {
          role: "user",
          content: diagnosisPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    const aiDiagnosis = completion.choices[0]?.message?.content || "Unable to generate diagnosis";

    await Case.findByIdAndUpdate(caseId, { aiDiagnosis });

    return res.json({
      diagnosis: aiDiagnosis,
      caseId: caseDoc._id
    });

  } catch (error: any) {
    console.error("Diagnosis generation error:", error);

    if (error.status === 429) {
      return res.status(429).json({
        error: "OpenAI API quota exceeded",
        message: "Please check your OpenAI API billing"
      });
    }
    if (error.code === "invalid_api_key") {
      return res.status(401).json({
        error: "Invalid OpenAI API key",
        message: "Please check your OPENAI_API_KEY environment variable"
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message: "Error generating AI diagnosis",
      details: error.message
    });
  }
});

// ---------------- GENERATE DISCHARGE REPORT ----------------
router.post("/:id/discharge-report/generate", async (req, res) => {
  try {
    const caseId = req.params.id;
    const { action = "generate", currentText, language: bodyLang } = req.body; // "generate" | "improve" | "shorten"

    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: "OpenAI API key not configured" });
    }

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) return res.status(404).json({ message: "Case not found" });

    const questionnaire = await Questionnaire.findOne({ caseId });
    const answers = questionnaire?.answers || {};
    const personalInfo = answers.personalInfo || {};
    const medicalHistory = answers.medicalHistory || {};
    const currentIllness = answers.currentIllness || {};
    const medications = answers.medications || {};
    const adaptiveQ = answers.adaptiveQuestions || answers.symptoms || {};
    const vitals = caseDoc.vitals || {};

    const language = (bodyLang === "he" ? "he" : "en") as "en" | "he";
    const isHebrew = language === "he";

    const activeConditions = Object.entries(medicalHistory)
      .filter(([k, v]) => v === true && k !== "none")
      .map(([k]) => k)
      .join(", ") || (isHebrew ? "לא דווח" : "None reported");

    const activeSymptoms = Object.entries(currentIllness)
      .filter(([, v]) => v === true)
      .map(([k]) => k)
      .join(", ") || (isHebrew ? "לא דווח" : "None reported");

    const orderedTestsList = (caseDoc.orderedTests || []).join(", ") || (isHebrew ? "לא הוזמנו" : "None ordered");

    // Prefer text passed from frontend (may include manual edits) over saved draft
    const existingDraft = currentText || caseDoc.dischargeReport?.draft || "";

    const systemMsg = isHebrew
      ? "אתה רופא בכיר במלר\"ד המפיק רשומת שחרור קלינית פורמלית ומובנית עבור מערכת רשומה רפואית אלקטרונית (EMR). השתמש בשפה רפואית מדויקת, משפטים שלמים ומוסכמות תיעוד סטנדרטיות של מלר\"ד. כתוב את כל הרשומה בעברית רפואית מקצועית. עבור מינוחים רפואיים סטנדרטיים, ניתן לכלול את המקור באנגלית בסוגריים."
      : "You are a senior emergency department physician producing a formal, structured clinical discharge record for an electronic medical record (EMR) system. Use precise medical language, complete sentences, and standard ED documentation conventions.";
    let userMsg = "";

    if (action === "improve" && existingDraft) {
      userMsg = isHebrew
        ? `שכתב את רשומת השחרור הבאה תוך שימוש בשפה קלינית מדויקת ומקצועית יותר. שמר את כל העובדות הקליניות, כותרות הסעיפים והמבנה הכולל. שפר רק את הניסוח והמינוח הרפואי. כתוב הכל בעברית.\n\n${existingDraft}`
        : `Rewrite the following discharge record using more precise, professional clinical language. Preserve all clinical facts, section headings, and the overall structure. Only improve wording and medical terminology:\n\n${existingDraft}`;
    } else if (action === "shorten" && existingDraft) {
      userMsg = isHebrew
        ? `צור גרסה תמציתית של רשומת השחרור הזו (בערך חצי מהאורך). שמר את כל כותרות הסעיפים ועובדות קליניות קריטיות. הסר חזרות. כתוב הכל בעברית.\n\n${existingDraft}`
        : `Create a concise version of this discharge record (approximately half the length). Preserve all section headings and critical clinical facts. Remove redundancy:\n\n${existingDraft}`;
    } else {
      // Derive additional context fields
      const formFilledBy = personalInfo.formFilledBy || (isHebrew ? "לא ידוע" : "Unknown");
      const cognitiveState = personalInfo.cognitiveState || (isHebrew ? "לא נרשם" : "Not recorded");
      const functionalState = personalInfo.functionalState || (isHebrew ? "לא נרשם" : "Not recorded");
      const cancerStatus = medicalHistory.cancerStatus ? ` (${medicalHistory.cancerStatus})` : "";
      const cancerType = medicalHistory.cancerType ? `, type: ${medicalHistory.cancerType}` : "";
      const doesNotRememberMeds = medications?.doesNotRememberMedications === true;
      const selectedMedsList = Object.values(medications?.groups || {}).flat().join(", ") || (isHebrew ? "לא דווח" : "None reported");
      const medsLine = doesNotRememberMeds
        ? (isHebrew ? "המטופל אינו זוכר תרופות" : "Patient does not remember medications")
        : (selectedMedsList || (isHebrew ? "לא דווח" : "None reported"));
      const allergiesLine = medications?.allergies?.allergyDetails
        || (medications?.allergies?.hasAllergies === "yes"
              ? (isHebrew ? "כן — פרטים לא ידועים" : "Yes — details unknown")
              : (isHebrew ? "לא דווח" : "None reported"));

      userMsg = isHebrew
        ? `הפק רשומת שחרור ממלר"ד מקצועית ומלאה תוך שימוש בנתוני המקרה המובנים שלהלן.

כללי פורמט:
- השתמש בפורמט המדויק הבא לכל סעיף: **שם הסעיף** ולאחריו תוכן הפסקה.
- כתוב כל סעיף כ-2-4 משפטים קליניים מלאים.
- השתמש בשפה רפואית פורמלית לאורך כל הרשומה.
- אל תדלג על סעיפים — אם נתונים אינם זמינים, ציין זאת באופן מקצועי (למשל "לא זמינות תוצאות בעת השחרור").
- חקירות שהוזמנו חייבות להופיע במפורש לפי שמן בסעיף 6, וכל תוצאה רלוונטית בסעיף 7.
- חקירות מומלצות למעקב חייבות להופיע בסעיף 10.
- כתוב את כל הרשומה בעברית רפואית מקצועית. עבור מינוחים רפואיים סטנדרטיים, ניתן להוסיף את המקור באנגלית בסוגריים (למשל: "אק״ג (ECG)").

סעיפים נדרשים לפי הסדר:
1. **סיכום מטופל**
2. **היסטוריה רפואית רלוונטית**
3. **תלונה מציגה**
4. **הערכה קלינית**
5. **סיכום חקירות**
6. **חקירות שבוצעו / הוזמנו**
7. **ממצאים ותוצאות עיקריות**
8. **טיפול שניתן**
9. **הערכה קלינית**
10. **חקירות המלצה למעקב**
11. **המלצות שחרור**
12. **דיספוזיציה**

נתוני המקרה:

מטופל: ${caseDoc.patientName}, גיל: ${personalInfo.age || "לא ידוע"}, מגדר: ${personalInfo.gender || "לא ידוע"}, ת"ז: ${caseDoc.nationalId}
מילוי הטופס על ידי: ${formFilledBy} | מצב קוגניטיבי: ${cognitiveState} | מצב תפקודי: ${functionalState}
מצב משפחתי: ${personalInfo.maritalStatus || "לא נרשם"}

היסטוריה רפואית: ${activeConditions}${medicalHistory.cancer ? cancerStatus + cancerType : ""}
אלרגיות: ${allergiesLine}
תרופות נוכחיות: ${medsLine}

תלונה עיקרית / תסמינים מציגים: ${activeSymptoms}

שאלון תסמינים אדפטיבי (פרטים מדווחי-מטופל):
${JSON.stringify(adaptiveQ, null, 2)}

סימנים חיוניים בעת ההגעה:
- לחץ דם: ${vitals.bp || "לא נרשם"}
- דופק: ${vitals.hr ? vitals.hr + " bpm" : "לא נרשם"}
- SpO2: ${vitals.spo2 ? vitals.spo2 + "%" : "לא נרשם"}
- חום: ${vitals.temp ? vitals.temp + "°C" : "לא נרשם"}
- קצב נשימה: ${vitals.respRate ? vitals.respRate + " /min" : "לא נרשם"}
- ציון כאב: ${vitals.painScore ? vitals.painScore + "/10" : "לא נרשם"}

סיכום קליני AI:
${caseDoc.summary || "טרם נוצר"}

אבחנה מבדלת AI:
${caseDoc.aiDiagnosis || "טרם נוצר"}

חקירות שהוזמנו על ידי הרופא:
${orderedTestsList}

הערה: אם לחקירות שהוזמנו אין עדיין תוצאות מתועדות, ציין אותן כ"הוזמנו; תוצאות בהמתנה בעת השחרור" בסעיף 7. רשום אותן לפי שמן בסעיף 6.`
        : `Generate a complete, professional Emergency Department Discharge Record using the structured case data below.

FORMAT RULES:
- Use this exact section format: **Section Name** followed by the paragraph content.
- Write each section as 2-4 full clinical sentences.
- Use formal medical language throughout.
- Do NOT skip sections — if data is unavailable, state it professionally (e.g., "No results available at time of discharge").
- Ordered investigations must appear explicitly by name in section 6 and any relevant results in section 7.
- Recommended follow-up investigations must appear in section 10.

REQUIRED SECTIONS IN ORDER:
1. **Patient Summary**
2. **Relevant Medical History**
3. **Presenting Complaint**
4. **Clinical Evaluation**
5. **Investigation Summary**
6. **Investigations Performed / Ordered**
7. **Key Findings and Results**
8. **Treatment Administered**
9. **Clinical Impression**
10. **Recommended Follow-Up Investigations**
11. **Discharge Recommendations**
12. **Disposition**

CASE DATA:

Patient: ${caseDoc.patientName}, Age: ${personalInfo.age || "Unknown"}, Gender: ${personalInfo.gender || "Unknown"}, ID: ${caseDoc.nationalId}
Form filled by: ${formFilledBy} | Cognitive state: ${cognitiveState} | Functional state: ${functionalState}
Marital status: ${personalInfo.maritalStatus || "Not recorded"}

Medical History: ${activeConditions}${medicalHistory.cancer ? cancerStatus + cancerType : ""}
Allergies: ${allergiesLine}
Current Medications: ${medsLine}

Chief Complaint / Presenting Symptoms: ${activeSymptoms}

Adaptive Symptom Questionnaire (patient-reported details):
${JSON.stringify(adaptiveQ, null, 2)}

Vital Signs on Presentation:
- Blood Pressure: ${vitals.bp || "Not recorded"}
- Heart Rate: ${vitals.hr ? vitals.hr + " bpm" : "Not recorded"}
- SpO2: ${vitals.spo2 ? vitals.spo2 + "%" : "Not recorded"}
- Temperature: ${vitals.temp ? vitals.temp + "°C" : "Not recorded"}
- Respiratory Rate: ${vitals.respRate ? vitals.respRate + " /min" : "Not recorded"}
- Pain Score: ${vitals.painScore ? vitals.painScore + "/10" : "Not recorded"}

AI Clinical Summary:
${caseDoc.summary || "Not yet generated"}

AI Differential Diagnosis:
${caseDoc.aiDiagnosis || "Not yet generated"}

Investigations Ordered by Physician:
${orderedTestsList}

NOTE: If ordered investigations do not yet have results documented, state them as "ordered; results pending at time of discharge" in section 7. List them by name in section 6.`;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: userMsg }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const report = completion.choices[0]?.message?.content?.trim() || "";

    // Auto-save draft
    await Case.findByIdAndUpdate(caseId, {
      "dischargeReport.draft": report,
      "dischargeReport.finalized": false
    });

    return res.json({ report });
  } catch (error: any) {
    console.error("Discharge report generation error:", error);
    if (error.status === 429) return res.status(429).json({ error: "OpenAI quota exceeded" });
    return res.status(500).json({ error: "Internal server error", message: error.message });
  }
});

// ---------------- SAVE DISCHARGE REPORT DRAFT ----------------
router.put("/:id/discharge-report", async (req, res) => {
  try {
    const caseId = req.params.id;
    const { draft } = req.body;

    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    if (typeof draft !== "string") {
      return res.status(400).json({ error: "draft must be a string" });
    }

    const updated = await Case.findByIdAndUpdate(
      caseId,
      { "dischargeReport.draft": draft, "dischargeReport.finalized": false },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Case not found" });

    return res.json({ dischargeReport: updated.dischargeReport });
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error", message: error.message });
  }
});

// ---------------- FINALIZE DISCHARGE REPORT ----------------
router.post("/:id/discharge-report/finalize", async (req, res) => {
  try {
    const caseId = req.params.id;
    const { draft } = req.body;

    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) return res.status(404).json({ message: "Case not found" });

    const reportText = draft || caseDoc.dischargeReport?.draft;
    if (!reportText) {
      return res.status(400).json({ error: "No discharge report to finalize" });
    }

    const updated = await Case.findByIdAndUpdate(
      caseId,
      {
        status: "closed",
        "dischargeReport.draft": reportText,
        "dischargeReport.finalized": true,
        "dischargeReport.finalizedAt": new Date()
      },
      { new: true }
    );

    return res.json(updated);
  } catch (error: any) {
    console.error("Finalize discharge error:", error);
    return res.status(500).json({ error: "Internal server error", message: error.message });
  }
});

// ---------------- GET CASE BY ID (KEEP LAST) ----------------
router.get("/:id", async (req, res) => {
  try {
    const caseId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({
        error: "Invalid ID format",
        message: "Please provide a valid MongoDB ObjectId"
      });
    }

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({ message: "Case not found" });
    }

    return res.json(caseDoc);
  } catch (error: any) {
    console.error("Error fetching case:", error);
    return res.status(500).json({
      message: "Error fetching case",
      error: error.message
    });
  }
});

// ---------------- DELETE CASE ----------------
router.delete("/:id", async (req, res) => {
  try {
    const caseId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(caseId)) {
      return res.status(400).json({
        error: "Invalid ID format",
        message: "Please provide a valid MongoDB ObjectId"
      });
    }

    const deletedCase = await Case.findByIdAndDelete(caseId);
    await Questionnaire.deleteMany({ caseId });

    if (!deletedCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    return res.status(200).json({ message: "Case deleted" });
  } catch (error: any) {
    console.error("Error deleting case:", error);
    return res.status(500).json({
      message: "Error deleting case",
      error: error.message
    });
  }
});

export default router;