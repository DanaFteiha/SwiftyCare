import mongoose, { Document, Schema } from "mongoose";

// TypeScript interface for Case
export interface ICase extends Document {
  patientName: string;
  nationalId: string;
  status: string;
  vitals?: {
    bp?: string;
    hr?: number;
    spo2?: number;
    temp?: number;
    respRate?: number;
    painScore?: number;
  };
  summary?: string;
  aiDiagnosis?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema for Case
const CaseSchema = new Schema<ICase>({
  patientName: {
    type: String,
    required: [true, "Patient name is required"],
    trim: true,
    minlength: [2, "Patient name must be at least 2 characters long"],
    maxlength: [100, "Patient name cannot exceed 100 characters"]
  },
  nationalId: {
    type: String,
    required: [true, "National ID is required"],
    trim: true,
    unique: true,
    minlength: [5, "National ID must be at least 5 characters long"],
    maxlength: [20, "National ID cannot exceed 20 characters"]
  },
  status: {
    type: String,
    default: "open",
    enum: ["open", "in_progress", "closed", "cancelled"],
    trim: true
  },
  vitals: {
    bp: {
      type: String,
      trim: true
    },
    hr: {
      type: Number,
      min: [0, "Heart rate cannot be negative"],
      max: [300, "Heart rate seems too high"]
    },
    spo2: {
      type: Number,
      min: [0, "SpO2 cannot be negative"],
      max: [100, "SpO2 cannot exceed 100%"]
    },
    temp: {
      type: Number,
      min: [30, "Temperature seems too low"],
      max: [45, "Temperature seems too high"]
    },
    respRate: {
      type: Number,
      min: [0, "Respiratory rate cannot be negative"],
      max: [60, "Respiratory rate seems too high"]
    },
    painScore: {
      type: Number,
      min: [0, "Pain score cannot be negative"],
      max: [10, "Pain score cannot exceed 10"]
    }
  },
  summary: {
    type: String,
    trim: true
  },
  aiDiagnosis: {
    type: String,
    trim: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Create and export the Mongoose model
export const Case = mongoose.model<ICase>("Case", CaseSchema);

