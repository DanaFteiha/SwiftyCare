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
import { validateBody, createUserSchema, updateUserSchema } from "../middleware/validate.js";
import { auditLog } from "../middleware/auditLog.js";

const router = express.Router();
const adminOnly = requireStaff("admin");

// ─── List ────────────────────────────────────────────────────────────────────
router.get("/", adminOnly, async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: 1 });
    auditLog(req, "user.list");
    return res.json({ users });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Create ──────────────────────────────────────────────────────────────────
router.post("/", adminOnly, validateBody(createUserSchema), async (req, res) => {
  try {
    const { username, password, role, displayName } = req.body as {
      username: string;
      password: string;
      role: "admin" | "doctor" | "nurse" | "intake";
      displayName: string;
    };

    const passwordHash = await hashPassword(password);
    const user = new User({
      username: username.trim().toLowerCase(),
      passwordHash,
      role,
      displayName: displayName.trim(),
      active: true,
    });
    await user.save();

    auditLog(req, "user.create", String(user._id));
    const saved = user.toObject() as unknown as Record<string, unknown>;
    delete saved["passwordHash"];
    return res.status(201).json({ user: saved });
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e?.code === 11000) {
      return res.status(409).json({ error: "Conflict", message: "Username already exists" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Update ──────────────────────────────────────────────────────────────────
router.patch("/:id", adminOnly, validateBody(updateUserSchema), async (req, res) => {
  try {
    const id = req.params.id ?? "";
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Bad request", message: "Invalid user ID" });
    }

    const { displayName, role, active, password } = req.body as {
      displayName?: string;
      role?: "admin" | "doctor" | "nurse" | "intake";
      active?: boolean;
      password?: string;
    };

    const update: Record<string, unknown> = {};
    if (displayName !== undefined) update["displayName"] = displayName.trim();
    if (role !== undefined)        update["role"] = role;
    if (active !== undefined)      update["active"] = active;
    if (password !== undefined)    update["passwordHash"] = await hashPassword(password);

    const user = await User.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!user) return res.status(404).json({ error: "Not found" });

    auditLog(req, "user.update", id);
    const updated = user.toObject() as unknown as Record<string, unknown>;
    delete updated["passwordHash"];
    return res.json({ user: updated });
  } catch {
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

    auditLog(req, "user.delete", id);
    return res.json({ message: "User deleted" });
  } catch {
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
