// =============================================================================
// Auth routes — POST /api/auth/login, GET /api/auth/me
// =============================================================================

import express from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { signStaffToken } from "../config/auth.js";
import { requireStaff } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimits.js";
import { validateBody, loginSchema } from "../middleware/validate.js";
import { auditLog } from "../middleware/auditLog.js";

const router = express.Router();

// ─── Login ───────────────────────────────────────────────────────────────────
router.post("/login", loginLimiter, validateBody(loginSchema), async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database unavailable" });
    }

    const { username, password } = req.body as { username: string; password: string };

    const user = await User.findOne({ username: username.trim().toLowerCase() }).select("+passwordHash");

    // Always run a comparison-shaped path so timing is consistent regardless of
    // whether the username exists — prevents user-enumeration via timing.
    const ok = user && user.active ? await user.verifyPassword(password) : false;
    if (!user || !ok || !user.active) {
      auditLog(req, "auth.login.failure");
      return res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    }

    const token = signStaffToken({
      sub: String(user._id),
      role: user.role,
      name: user.displayName,
    });

    auditLog(req, "auth.login.success", String(user._id));
    return res.json({
      token,
      user: { role: user.role, displayName: user.displayName },
    });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Me ──────────────────────────────────────────────────────────────────────
router.get("/me", requireStaff(), (req, res) => {
  return res.json({
    role: req.staff?.role,
    displayName: req.staff?.name,
  });
});

export default router;
