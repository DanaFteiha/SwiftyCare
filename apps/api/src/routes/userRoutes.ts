// =============================================================================
// User management routes — admin only
// GET    /api/users          list all staff accounts
// POST   /api/users          create a new staff account
// PATCH  /api/users/:id      update displayName / role / active / password
// DELETE /api/users/:id      hard-delete (prevented for own account)
// =============================================================================

import express from "express";
import mongoose from "mongoose";
import { User, hashPassword } from "../models/User.js";
import { requireStaff } from "../middleware/auth.js";
import { ROLES } from "../config/auth.js";

const router = express.Router();
const adminOnly = requireStaff("admin");

// ─── List ────────────────────────────────────────────────────────────────────
router.get("/", adminOnly, async (_req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: 1 });
    return res.json({ users });
  } catch (err) {
    console.error("List users error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Create ──────────────────────────────────────────────────────────────────
router.post("/", adminOnly, async (req, res) => {
  try {
    const { username, password, role, displayName } = req.body ?? {};

    if (!username || !password || !role || !displayName) {
      return res.status(400).json({
        error: "Bad request",
        message: "username, password, role, and displayName are required",
      });
    }
    if (typeof username !== "string" || username.trim().length < 3) {
      return res.status(400).json({ error: "Bad request", message: "username must be at least 3 characters" });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "Bad request", message: "password must be at least 8 characters" });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({
        error: "Bad request",
        message: `role must be one of: ${ROLES.join(", ")}`,
      });
    }

    const passwordHash = await hashPassword(password);
    const user = new User({
      username: username.trim().toLowerCase(),
      passwordHash,
      role,
      displayName: (displayName as string).trim(),
      active: true,
    });
    await user.save();

    const saved = user.toObject() as unknown as Record<string, unknown>;
    delete saved["passwordHash"];
    return res.status(201).json({ user: saved });
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e?.code === 11000) {
      return res.status(409).json({ error: "Conflict", message: "Username already exists" });
    }
    console.error("Create user error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Update ──────────────────────────────────────────────────────────────────
router.patch("/:id", adminOnly, async (req, res) => {
  try {
    const id = req.params.id ?? "";
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Bad request", message: "Invalid user ID" });
    }

    const { displayName, role, active, password } = req.body ?? {};
    const update: Record<string, unknown> = {};

    if (typeof displayName === "string" && displayName.trim()) {
      update["displayName"] = displayName.trim();
    }
    if (role !== undefined) {
      if (!ROLES.includes(role)) {
        return res.status(400).json({
          error: "Bad request",
          message: `role must be one of: ${ROLES.join(", ")}`,
        });
      }
      update["role"] = role;
    }
    if (typeof active === "boolean") {
      update["active"] = active;
    }
    if (typeof password === "string") {
      if (password.length < 8) {
        return res.status(400).json({ error: "Bad request", message: "password must be at least 8 characters" });
      }
      update["passwordHash"] = await hashPassword(password);
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "Bad request", message: "No valid fields to update" });
    }

    const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!user) return res.status(404).json({ error: "Not found" });

    const updated = user.toObject() as unknown as Record<string, unknown>;
    delete updated["passwordHash"];
    return res.json({ user: updated });
  } catch (err) {
    console.error("Update user error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Delete ──────────────────────────────────────────────────────────────────
router.delete("/:id", adminOnly, async (req, res) => {
  try {
    const id = req.params.id ?? "";
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Bad request", message: "Invalid user ID" });
    }
    if (req.staff?.sub === id) {
      return res.status(400).json({ error: "Bad request", message: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: "Not found" });

    return res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
