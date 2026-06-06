import express from "express";
import mongoose from "mongoose";
import OpenAI from "openai";
import { Case } from "../models/Case.js";
import { Questionnaire } from "../models/Questionnaire.js";
import { buildDiagnosisMessages } from "../services/diagnosisPrompt.js";
import { buildDischargeReportMessages } from "../services/dischargeReportPrompt.js";
import { buildSummaryMessages } from "../services/summaryPrompt.js";
import { requireStaff, requireCaseWriteAccess, requireCaseReadAccess } from "../middleware/auth.js";
import { signPatientCaseToken } from "../config/auth.js";
import { auditLog } from "../middleware/auditLog.js";
import { aiLimiter, caseCreationLimiter } from "../middleware/rateLimits.js";
import {
  validateBody,
  createCaseSchema,
  vitalsSchema,
  questionnaireSchema,
  languageBodySchema,
} from "../middleware/validate.js";

const router = express.Router();

function validId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ─── GET ALL CASES ────────────────────────────────────────────────────────────
router.get("/", requireStaff("doctor", "nurse", "admin"), async (req, res) => {
  try {
    const cases = await Case.find({}).sort({ createdAt: -1 });
    auditLog(req, "case.list");
    return res.json({ count: cases.length, cases });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── CREATE CASE ──────────────────────────────────────────────────────────────
// Public endpoint — no staff login required. Security model: the kiosk is a
// physical device inside the hospital. Rate-limited to prevent internet spam.
// The response includes a short-lived case-scoped token so the patient can
// submit the questionnaire without any further authentication.
router.post("/", caseCreationLimiter, validateBody(createCaseSchema), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        error: "Database unavailable",
        message: "Database is not connected",
      });
    }

    const { patientName, nationalId, hospital } = req.body as {
      patientName: string;
      nationalId: string;
      hospital?: string;
    };

    // Block only if an active (non-closed) case already exists for this ID.
    // A patient whose previous visit was discharged ("closed" / "cancelled")
    // is free to register again for a new visit.
    const ACTIVE_STATUSES = ["awaiting_vitals", "open", "in_progress", "tests_ordered"];
    const activeCase = await Case.findOne({ nationalId, status: { $in: ACTIVE_STATUSES } }).lean();
    if (activeCase) {
      // Return the same generic 400 shape so callers can't probe whether an
      // ID is registered (P1-12) while still carrying a machine-readable hint.
      return res.status(400).json({
        error: "Bad request",
        message: "An active case already exists for this ID. Please ask a staff member for your questionnaire link.",
        hint: "active_case_exists",
      });
    }

    const newCase = await Case.create({
      patientName,
      nationalId,
      ...(hospital ? { hospital } : {}),
    });

    const patientCaseToken = signPatientCaseToken(String(newCase._id));
    auditLog(req, "case.create", String(newCase._id));
    return res.status(201).json({ case: newCase, patientCaseToken });
  } catch (error: unknown) {
    const e = error as { name?: string; message?: string; code?: number };

    if (e?.name === "ValidationError") {
      return res.status(400).json({ error: "Validation error", message: e.message });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET QUESTIONNAIRE ────────────────────────────────────────────────────────
router.get("/:id/questionnaire", requireStaff("doctor", "nurse", "admin"), async (req, res) => {
  try {
    const caseId = req.params.id ?? "";
    if (!validId(caseId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const questionnaire = await Questionnaire.findOne({ caseId });
    if (!questionnaire) {
      return res.status(404).json({ message: "Questionnaire not found" });
    }

    auditLog(req, "case.questionnaire.read", caseId);
    return res.status(200).json(questionnaire);
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── SUBMIT QUESTIONNAIRE ─────────────────────────────────────────────────────
router.post("/:id/questionnaire", requireCaseWriteAccess, validateBody(questionnaireSchema), async (req, res) => {
  try {
    const caseId = req.params.id ?? "";
    if (!validId(caseId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const { answers } = req.body as { answers: Record<string, unknown> };

    const existingCase = await Case.findById(caseId);
    if (!existingCase) {
      return res.status(404).json({ message: "Case not found" });
    }

    const questionnaire = await Questionnaire.create({ caseId, answers });
    if (existingCase.status !== "awaiting_vitals") {
      existingCase.status = "awaiting_vitals";
      await existingCase.save();
    }

    auditLog(req, "case.questionnaire.submit", caseId);
    return res.status(201).json(questionnaire);
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── UPDATE STATUS ────────────────────────────────────────────────────────────
router.patch("/:id/status", requireStaff("nurse", "doctor", "admin"), async (req, res) => {
  try {
    const caseId = req.params.id ?? "";
    const { status } = req.body as { status?: string };

    if (!validId(caseId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const allowedStatuses = ["awaiting_vitals", "open", "in_progress", "tests_ordered", "cancelled"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status",
        message: `Status must be one of: ${allowedStatuses.join(", ")}. To close a case, finalize the discharge report.`,
      });
    }

    const updatedCase = await Case.findByIdAndUpdate(caseId, { status }, { new: true, runValidators: true });
    if (!updatedCase) return res.status(404).json({ message: "Case not found" });

    auditLog(req, "case.update.status", caseId);
    return res.status(200).json(updatedCase);
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── ORDER TESTS ──────────────────────────────────────────────────────────────
router.post("/:id/order-tests", requireStaff("doctor", "admin"), async (req, res) => {
  try {
    const caseId = req.params.id ?? "";
    const { tests } = req.body as { tests?: unknown };

    if (!validId(caseId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) return res.status(404).json({ message: "Case not found" });

    if (caseDoc.status === "closed") {
      return res.status(409).json({ error: "Case already closed" });
    }

    const updateFields: Record<string, unknown> = { orderedAt: new Date() };
    if (Array.isArray(tests)) updateFields["orderedTests"] = tests;

    const updatedCase = await Case.findByIdAndUpdate(caseId, updateFields, { new: true, runValidators: true });
    auditLog(req, "case.tests.order", caseId);
    return res.status(200).json(updatedCase);
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── UPDATE VITALS ────────────────────────────────────────────────────────────
router.post("/:id/vitals", requireStaff("nurse", "doctor", "admin"), validateBody(vitalsSchema), async (req, res) => {
  try {
    const caseId = req.params.id ?? "";
    if (!validId(caseId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const vitalsData = req.body as Record<string, unknown>;
    const defined = Object.values(vitalsData).filter(v => v !== undefined && v !== null);
    if (defined.length === 0) {
      return res.status(400).json({ error: "At least one vital field is required" });
    }

    const existingCase = await Case.findById(caseId);
    if (!existingCase) return res.status(404).json({ message: "Case not found" });

    const updatedVitals = { ...(existingCase.vitals as Record<string, unknown> ?? {}), ...vitalsData };
    const update: Record<string, unknown> = { vitals: updatedVitals };
    if (existingCase.status === "awaiting_vitals") update["status"] = "open";

    const updatedCase = await Case.findByIdAndUpdate(caseId, update, { new: true, runValidators: true });
    auditLog(req, "case.update.vitals", caseId);
    return res.status(200).json(updatedCase);
  } catch (error: unknown) {
    const e = error as { name?: string };
    if (e?.name === "ValidationError") {
      return res.status(400).json({ error: "Validation error" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GENERATE SUMMARY ─────────────────────────────────────────────────────────
router.post("/:id/summary", requireStaff("doctor", "admin"), aiLimiter, validateBody(languageBodySchema), async (req, res) => {
  try {
    const caseId = req.params.id ?? "";
    if (!validId(caseId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const existingCase = await Case.findById(caseId);
    if (!existingCase) return res.status(404).json({ message: "Case not found" });

    const questionnaire = await Questionnaire.findOne({ caseId });
    const answers = questionnaire?.answers ?? {};
    const vitals = existingCase.vitals ?? {};
    const language = ((req.body as { language?: string }).language === "he" ? "he" : "en") as "en" | "he";

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: "AI features not configured" });
    }

    const { systemMessage, userMessage } = buildSummaryMessages({
      answers,
      vitals: vitals as Record<string, unknown>,
      language,
    });

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_SUMMARY_MODEL ?? "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.25,
      max_tokens: 900,
    });

    const summary = response.choices[0]?.message?.content?.trim() ?? "Unable to generate summary";
    existingCase.summary = summary;
    await existingCase.save();

    auditLog(req, "case.summary.generate", caseId);
    return res.status(200).json({ summary });
  } catch (error: unknown) {
    const e = error as { status?: number; code?: string };
    if (e?.status === 429) return res.status(429).json({ error: "OpenAI quota exceeded" });
    if (e?.code === "invalid_api_key") return res.status(503).json({ error: "AI features not configured" });
    console.error("Summary generation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GENERATE AI DIAGNOSIS ────────────────────────────────────────────────────
router.post("/:id/diagnosis", requireStaff("doctor", "admin"), aiLimiter, validateBody(languageBodySchema), async (req, res) => {
  try {
    const caseId = req.params.id ?? "";
    if (!validId(caseId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: "AI features not configured" });
    }

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) return res.status(404).json({ message: "Case not found" });

    const questionnaire = await Questionnaire.findOne({ caseId });
    const qAnswers = questionnaire?.answers ?? {};
    const language = ((req.body as { language?: string }).language === "he" ? "he" : "en") as "en" | "he";

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { systemMessage, userMessage } = buildDiagnosisMessages({ caseDoc, answers: qAnswers, language });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_DIAGNOSIS_MODEL ?? "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 1800,
    });

    const aiDiagnosis = completion.choices[0]?.message?.content ?? "Unable to generate diagnosis";
    await Case.findByIdAndUpdate(caseId, { aiDiagnosis });

    auditLog(req, "case.diagnosis.generate", caseId);
    return res.json({ diagnosis: aiDiagnosis, caseId: caseDoc._id });
  } catch (error: unknown) {
    const e = error as { status?: number; code?: string };
    if (e?.status === 429) return res.status(429).json({ error: "OpenAI quota exceeded" });
    if (e?.code === "invalid_api_key") return res.status(503).json({ error: "AI features not configured" });
    console.error("Diagnosis generation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GENERATE DISCHARGE REPORT ────────────────────────────────────────────────
router.post("/:id/discharge-report/generate", requireStaff("doctor", "admin"), aiLimiter, validateBody(languageBodySchema), async (req, res) => {
  try {
    const caseId = req.params.id ?? "";
    if (!validId(caseId)) return res.status(400).json({ error: "Invalid ID format" });
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "AI features not configured" });

    const { action = "generate", currentText, language: bodyLang } = req.body as {
      action?: string;
      currentText?: string;
      language?: string;
    };

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) return res.status(404).json({ message: "Case not found" });

    const questionnaire = await Questionnaire.findOne({ caseId });
    const answers = questionnaire?.answers ?? {};
    const language = (bodyLang === "he" ? "he" : "en") as "en" | "he";
    const existingDraft = currentText ?? (caseDoc.dischargeReport as { draft?: string } | undefined)?.draft ?? "";
    const requestedAction = action === "improve" || action === "shorten" ? action : "generate";

    const { systemMessage, userMessage } = buildDischargeReportMessages({
      caseDoc,
      answers,
      language,
      action: requestedAction,
      existingDraft,
    });

    const generateModel = process.env.OPENAI_DISCHARGE_MODEL ?? "gpt-4o";
    const rewriteModel = process.env.OPENAI_DISCHARGE_REWRITE_MODEL ?? "gpt-4o-mini";
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

    const report = completion.choices[0]?.message?.content?.trim() ?? "";
    await Case.findByIdAndUpdate(caseId, {
      "dischargeReport.draft": report,
      "dischargeReport.finalized": false,
    });

    auditLog(req, "case.discharge.generate", caseId);
    return res.json({ report });
  } catch (error: unknown) {
    const e = error as { status?: number };
    if (e?.status === 429) return res.status(429).json({ error: "OpenAI quota exceeded" });
    console.error("Discharge report generation error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── SAVE DISCHARGE REPORT DRAFT ──────────────────────────────────────────────
router.put("/:id/discharge-report", requireStaff("doctor", "admin"), async (req, res) => {
  try {
    const caseId = req.params.id ?? "";
    const { draft } = req.body as { draft?: unknown };

    if (!validId(caseId)) return res.status(400).json({ error: "Invalid ID format" });
    if (typeof draft !== "string") return res.status(400).json({ error: "draft must be a string" });

    const updated = await Case.findByIdAndUpdate(
      caseId,
      { "dischargeReport.draft": draft, "dischargeReport.finalized": false },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Case not found" });

    auditLog(req, "case.discharge.save", caseId);
    return res.json({ dischargeReport: updated.dischargeReport });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── FINALIZE DISCHARGE REPORT ────────────────────────────────────────────────
router.post("/:id/discharge-report/finalize", requireStaff("doctor", "admin"), async (req, res) => {
  try {
    const caseId = req.params.id ?? "";
    const { draft } = req.body as { draft?: unknown };

    if (!validId(caseId)) return res.status(400).json({ error: "Invalid ID format" });

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) return res.status(404).json({ message: "Case not found" });

    const reportText = (typeof draft === "string" ? draft : null) ??
      (caseDoc.dischargeReport as { draft?: string } | undefined)?.draft;
    if (!reportText) return res.status(400).json({ error: "No discharge report to finalize" });

    const updated = await Case.findByIdAndUpdate(
      caseId,
      {
        status: "closed",
        "dischargeReport.draft": reportText,
        "dischargeReport.finalized": true,
        "dischargeReport.finalizedAt": new Date(),
      },
      { new: true }
    );

    auditLog(req, "case.discharge.finalize", caseId);
    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET CASE BY ID (keep last — catches /:id) ────────────────────────────────
router.get("/:id", requireCaseReadAccess, async (req, res) => {
  try {
    const caseId = req.params.id ?? "";
    if (!validId(caseId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) return res.status(404).json({ message: "Case not found" });

    auditLog(req, "case.read", caseId);

    // Patient (non-staff) access → PHI-minimised projection (no national ID, no clinical fields)
    if (!req.staff) {
      return res.json({
        _id: caseDoc._id,
        patientName: caseDoc.patientName,
        hospital: caseDoc.hospital,
        status: caseDoc.status,
      });
    }

    return res.json(caseDoc);
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DELETE CASE ──────────────────────────────────────────────────────────────
router.delete("/:id", requireStaff("doctor", "admin"), async (req, res) => {
  try {
    const caseId = req.params.id ?? "";
    if (!validId(caseId)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const deletedCase = await Case.findByIdAndDelete(caseId);
    await Questionnaire.deleteMany({ caseId });

    if (!deletedCase) return res.status(404).json({ message: "Case not found" });

    auditLog(req, "case.delete", caseId);
    return res.status(200).json({ message: "Case deleted" });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
