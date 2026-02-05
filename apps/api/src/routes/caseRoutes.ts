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
    const { patientName, nationalId } = req.body;

    if (!patientName || !nationalId) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Both patientName and nationalId are required"
      });
    }

    const newCase = await Case.create({ patientName, nationalId });
    return res.status(201).json(newCase);
  } catch (error: any) {
    console.error("Error creating case:", error);

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
    
    console.log("Questionnaire request:", { caseId, answers, body: req.body, headers: req.headers });

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
    return res.status(201).json(questionnaire);
  } catch (error) {
    console.error("Questionnaire error:", error);
    return res.status(500).json({
      message: "Error saving questionnaire",
      error
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

    // Update the case with new vitals
    const updatedCase = await Case.findByIdAndUpdate(
      caseId,
      { vitals: updatedVitals },
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

    // Build clinical prompt
    const prompt = `
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

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OpenAI API key not configured",
        message: "Please set OPENAI_API_KEY environment variable"
      });
    }

    // Initialize OpenAI client
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Call OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a medical assistant writing medium-length clinical notes for doctors."
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
    
    // Find the case
    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({ message: "Case not found" });
    }

    // Find questionnaire data
    const questionnaire = await Questionnaire.findOne({ caseId });
    if (!questionnaire) {
      return res.status(404).json({ message: "Questionnaire not found" });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Build diagnosis prompt
    const diagnosisPrompt = `
As a medical AI assistant, analyze the following patient data and provide differential diagnoses with probability scores and test recommendations.

Patient Information:
- Name: ${caseDoc.patientName}
- Age: ${questionnaire.answers?.personalInfo?.age || 'Unknown'}
- Gender: ${questionnaire.answers?.personalInfo?.gender || 'Unknown'}

Current Symptoms:
${questionnaire.answers?.currentIllness ? Object.entries(questionnaire.answers.currentIllness)
  .filter(([key, value]) => value === true)
  .map(([key]) => `- ${key}`)
  .join('\n') : 'None reported'}

Medical History:
${questionnaire.answers?.medicalHistory ? Object.entries(questionnaire.answers.medicalHistory)
  .filter(([key, value]) => value === true && key !== 'none')
  .map(([key]) => `- ${key}`)
  .join('\n') : 'None reported'}

Vital Signs:
- Blood Pressure: ${caseDoc.vitals?.bp || 'Not recorded'}
- Heart Rate: ${caseDoc.vitals?.hr || 'Not recorded'}
- Oxygen Saturation: ${caseDoc.vitals?.spo2 || 'Not recorded'}%
- Temperature: ${caseDoc.vitals?.temp || 'Not recorded'}°C
- Pain Score: ${caseDoc.vitals?.painScore || 'Not recorded'}/10

Please provide:
1. Top 3-4 differential diagnoses with probability percentages
2. Supporting evidence for each diagnosis
3. Recommended diagnostic tests with urgency levels (high/medium/low)
4. Brief rationale for test recommendations

Format your response as structured medical analysis suitable for physician review.
`;

    // Generate AI diagnosis
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a medical AI assistant specializing in differential diagnosis and test recommendations. Provide evidence-based analysis with clear probability assessments and actionable recommendations."
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

    // Update case with AI diagnosis
    (caseDoc as any).aiDiagnosis = aiDiagnosis;
    await caseDoc.save();

    return res.json({
      diagnosis: aiDiagnosis,
      caseId: caseDoc._id
    });

  } catch (error: any) {
    console.error("Error generating AI diagnosis:", error);
    return res.status(500).json({
      message: "Error generating AI diagnosis",
      error: error.message
    });
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

export default router;