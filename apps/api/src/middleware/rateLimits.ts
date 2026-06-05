// =============================================================================
// Rate limiting — P1-9
// -----------------------------------------------------------------------------
//   generalLimiter  → applied globally to every route (DDoS / enumeration)
//   loginLimiter    → strict limit on /api/auth/login (brute-force protection)
//   aiLimiter       → per-user cap on OpenAI-backed endpoints (cost + DoS)
// =============================================================================

import rateLimit from "express-rate-limit";
import type { Request } from "express";

function msg(message: string) {
  return { error: "Too many requests", message };
}

/** 300 req / 15 min per IP — applied globally. */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg("Too many requests. Please try again in 15 minutes."),
});

/** 10 req / 15 min per IP — only on the login route. */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg("Too many login attempts. Please try again in 15 minutes."),
});

/**
 * 20 new cases / hour per IP — on the public POST /cases endpoint.
 * Prevents spam registration from the internet while keeping the kiosk
 * experience friction-free for real patients.
 */
export const caseCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg("Too many registrations from this device. Please try again later."),
});

/**
 * 20 req / hour per authenticated user — applied to OpenAI-backed endpoints.
 * Keyed by JWT sub (set by requireStaff which runs before this limiter).
 * Falls back to IP in case the key is somehow missing.
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: msg("AI request limit reached for this hour. Please wait before generating more."),
  keyGenerator: (req: Request) => req.staff?.sub ?? req.ip ?? "unknown",
});
