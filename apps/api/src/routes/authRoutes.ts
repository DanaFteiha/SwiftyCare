// =============================================================================
// Auth routes — POST /api/auth/login, GET /api/auth/me
// -----------------------------------------------------------------------------
// Staff log in with username + password (verified against a bcrypt hash) and
// receive a short-lived JWT. This is the ONLY place credentials are checked; a
// future SSO/OIDC integration would add an alternative login route that mints
// the same staff token via signStaffToken(), leaving the rest of the system
// untouched.
// =============================================================================

import express from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { signStaffToken } from "../config/auth.js";
import { requireStaff } from "../middleware/auth.js";

const router = express.Router();

// ---------------- LOGIN ----------------
router.post("/login", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: "Database unavailable" });
    }

    const { username, password } = req.body ?? {};
    if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
      return res.status(400).json({ error: "Bad request", message: "username and password are required" });
    }

    const user = await User.findOne({ username: username.trim().toLowerCase() }).select("+passwordHash");

    // Always run a comparison-shaped path and return a generic error to avoid
    // leaking whether a username exists or whether the account is disabled.
    const ok = user && user.active ? await user.verifyPassword(password) : false;
    if (!user || !ok || !user.active) {
      return res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    }

    const token = signStaffToken({
      sub: String(user._id),
      role: user.role,
      name: user.displayName,
    });

    return res.json({
      token,
      user: { role: user.role, displayName: user.displayName },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ---------------- ME ----------------
router.get("/me", requireStaff(), (req, res) => {
  return res.json({
    role: req.staff?.role,
    displayName: req.staff?.name,
  });
});

export default router;
