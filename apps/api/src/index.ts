import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import mongoose from "mongoose";
import caseRoutes from "./routes/caseRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { seedUsers } from "./services/seedUsers.js";
import { runIndexMigrations } from "./services/migrateIndexes.js";
import { generalLimiter } from "./middleware/rateLimits.js";

dotenv.config();

// --------------- Env validation ---------------
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/swiftycare";
const PORT = process.env.PORT || 3001;

if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️  OPENAI_API_KEY is not set — AI summary and diagnosis features will be unavailable");
}
if (!process.env.MONGODB_URI) {
  console.warn("⚠️  MONGODB_URI is not set — using default: mongodb://localhost:27017/swiftycare");
}

function sanitizeUri(uri: string): string {
  try {
    const parsed = new URL(uri);
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    return uri.replace(/:([^@/]+)@/, ":***@");
  }
}

// --------------- Express app ---------------
const app = express();

// --------------- Security headers (P1-8) ---------------
// helmet sets X-Content-Type-Options, X-Frame-Options, HSTS, and more.
// CSP is minimal since the API serves only JSON (no HTML/scripts).
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    // API is JSON-only; these browser-oriented headers are still worth setting.
    crossOriginEmbedderPolicy: false,
  })
);

// --------------- Rate limiting (P1-9) ---------------
app.set("trust proxy", 1); // Render / Vercel set X-Forwarded-For
app.use(generalLimiter);

// --------------- CORS ---------------
const rawCorsOrigins = process.env.CORS_ORIGINS || "";
const corsOrigins = rawCorsOrigins
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

const extraAllowedOrigins = ["https://demo.swifty-care.com"];

const isAllowedOrigin = (origin?: string) => {
  if (!origin) return true;
  if (corsOrigins.length > 0) {
    return corsOrigins.includes(origin);
  }
  if (extraAllowedOrigins.includes(origin)) return true;
  if (origin.startsWith("http://localhost:")) return true;
  if (origin.endsWith(".trycloudflare.com")) return true;
  if (origin.endsWith(".ngrok-free.app")) return true;
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    console.warn(`[cors] rejected origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false
}));
app.options(/.*/, cors());
app.use(express.json({ limit: "50kb" })); // P1-10: body size cap

// --------------- Request logging ---------------
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    console[level](
      `[${level}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// --------------- MongoDB ---------------
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");
    await runIndexMigrations();
    try {
      await seedUsers();
    } catch (seedErr) {
      console.error("⚠️  User seeding failed:", (seedErr as Error)?.message || seedErr);
    }
  })
  .catch((err: unknown) => {
    const e = err as { name?: string; message?: string; code?: string | number };
    console.error("❌ MongoDB connection failed — database features unavailable");
    console.error(`   URI: ${sanitizeUri(MONGODB_URI)}`);
    console.error(`   Reason: ${e?.name || "Error"}: ${e?.message || err}`);
    if (e?.code) console.error(`   Code: ${e.code}`);
    if (e?.message?.includes("ENOTFOUND") || e?.message?.includes("querySrv")) {
      console.error("   Hint: the cluster hostname does not exist. Check MONGODB_URI or recreate the Atlas cluster.");
    } else if (e?.message?.includes("Authentication failed")) {
      console.error("   Hint: wrong username/password in MONGODB_URI.");
    } else if (e?.message?.includes("IP") || e?.message?.includes("not allowed")) {
      console.error("   Hint: your current IP is not in the Atlas Network Access allowlist.");
    }
  });

// --------------- Health routes ---------------
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? "healthy" : "degraded",
    database: dbConnected ? "connected" : "disconnected",
    uptime: process.uptime()
  });
});

// --------------- API Routes ---------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cases", caseRoutes);

// --------------- Start ---------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 MongoDB: ${sanitizeUri(MONGODB_URI)}`);
});
