import express from "express";
import mongoose from "mongoose";
import OpenAI from "openai";
import { Case } from "../models/Case.js";
import { Questionnaire } from "../models/Questionnaire.js";
import { buildDiagnosisMessages } from "../services/diagnosisPrompt.js";
import { buildDischargeReportMessages } from "../services/dischargeReportPrompt.js";
import { buildSummaryMessages } from "../services/summaryPrompt.js";

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

    const questionnaire = await Questionnaire.findOne({ caseId });
    const answers = questionnaire?.answers || {};
    const vitals = existingCase.vitals || {};

    const language = (req.body?.language === "he" ? "he" : "en") as "en" | "he";

    const { systemMessage, userMessage } = buildSummaryMessages({
      answers,
      vitals: vitals as Record<string, unknown>,
      language,
    });

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: "OpenAI API key not configured",
        message: "Please set OPENAI_API_KEY environment variable"
      });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const summaryModel = process.env.OPENAI_SUMMARY_MODEL || "gpt-4o";

    const response = await client.chat.completions.create({
      model: summaryModel,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.25,
      max_tokens: 900,
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

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const language = (req.body?.language === "he" ? "he" : "en") as "en" | "he";

    // Assemble the structured prompt. The builder pulls in the adaptive Step-2
    // OPQRST answers, red flags and vital-sign alerts (none of which used to
    // reach the model) and frames the request around a Rosen's-style "anchor
    // on the chief complaint, list the must-not-miss diagnoses first" scaffold.
    const { systemMessage, userMessage } = buildDiagnosisMessages({
      caseDoc,
      answers: qAnswers,
      language,
    });

    // The differential is a high-stakes reasoning task — use a stronger model
    // by default. `OPENAI_DIAGNOSIS_MODEL` lets us dial it back per-environment
    // (e.g. to `gpt-4o-mini` in dev) without redeploying.
    const diagnosisModel = process.env.OPENAI_DIAGNOSIS_MODEL || "gpt-4o";

    const completion = await openai.chat.completions.create({
      model: diagnosisModel,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 1800,
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

    const language = (bodyLang === "he" ? "he" : "en") as "en" | "he";

    // Prefer text passed from frontend (may include manual edits) over saved draft.
    const existingDraft = currentText || caseDoc.dischargeReport?.draft || "";

    const requestedAction = action === "improve" || action === "shorten" ? action : "generate";

    // Build the prompt with the new style scaffold + few-shot examples lifted
    // from the real Israeli-ED corpus. See `services/dischargeReportPrompt.ts`.
    const { systemMessage, userMessage } = buildDischargeReportMessages({
      caseDoc,
      answers,
      language,
      action: requestedAction,
      existingDraft,
    });

    // Default to gpt-4o for `generate` (heavy synthesis with few-shots). The
    // lighter `improve` / `shorten` rewrites stay on gpt-4o-mini to keep cost
    // low. Both are env-overridable for per-environment tuning.
    const generateModel = process.env.OPENAI_DISCHARGE_MODEL || "gpt-4o";
    const rewriteModel = process.env.OPENAI_DISCHARGE_REWRITE_MODEL || "gpt-4o-mini";
    const chosenModel = requestedAction === "generate" ? generateModel : rewriteModel;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: chosenModel,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 2200,
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