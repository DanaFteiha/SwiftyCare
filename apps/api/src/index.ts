import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import caseRoutes from "./routes/caseRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection (optional)
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/swiftycare";

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((error) => {
    console.log("⚠️  MongoDB not available - continuing without database");
    console.log("   To enable database features, install MongoDB or use MongoDB Atlas");
  });

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "API is running 🚀",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    timestamp: new Date().toISOString()
  });
});

// Health check route
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    uptime: process.uptime()
  });
});

// API Routes
app.use("/cases", caseRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 MongoDB URI: ${MONGODB_URI}`);
});
