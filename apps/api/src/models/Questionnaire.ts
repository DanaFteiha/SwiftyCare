import mongoose, { Document, Schema } from "mongoose";

// TypeScript interface for Questionnaire
export interface IQuestionnaire extends Document {
  caseId: mongoose.Types.ObjectId;
  answers: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema for Questionnaire
const QuestionnaireSchema = new Schema<IQuestionnaire>({
  caseId: {
    type: Schema.Types.ObjectId,
    ref: "Case",
    required: [true, "Case ID is required"],
    index: true // Add index for better query performance
  },
  answers: {
    type: Schema.Types.Mixed,
    required: [true, "Answers are required"]
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create and export the Mongoose model
export const Questionnaire = mongoose.model<IQuestionnaire>("Questionnaire", QuestionnaireSchema);

