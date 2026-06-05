// =============================================================================
// Input validation middleware — P1-10
// -----------------------------------------------------------------------------
// validateBody(schema) returns an Express middleware that runs a Zod schema
// against req.body. On success it replaces req.body with the parsed (and
// potentially coerced / stripped) value. On failure it returns 400.
// =============================================================================

import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const first = result.error.issues[0];
      return res.status(400).json({
        error: "Validation error",
        message: first?.message ?? "Invalid request body",
      });
    }
    req.body = result.data;
    return next();
  };
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  username: z.string().min(1, "username is required").max(64),
  password: z.string().min(1, "password is required").max(200),
});

export const createCaseSchema = z.object({
  patientName: z.string().min(1, "patientName is required").max(120).trim(),
  nationalId:  z.string().min(2, "nationalId is required").max(30).trim(),
  hospital:    z.string().max(200).trim().optional(),
});

export const vitalsSchema = z.object({
  bp:        z.string().max(20).optional(),
  hr:        z.number().min(0).max(400).optional(),
  spo2:      z.number().min(0).max(100).optional(),
  temp:      z.number().min(30).max(45).optional(),
  respRate:  z.number().min(0).max(100).optional(),
  painScore: z.number().min(0).max(10).optional(),
});

export const questionnaireSchema = z.object({
  answers: z.record(
    z.string(),
    z.union([
      z.string().max(500),
      z.boolean(),
      z.number(),
      z.array(z.string().max(200)),
    ])
  ),
});

export const languageBodySchema = z.object({
  language: z.enum(["en", "he"]).optional().default("en"),
}).passthrough();

export const createUserSchema = z.object({
  username:    z.string().min(3, "username must be at least 3 characters").max(64),
  password:    z.string().min(8, "password must be at least 8 characters").max(200),
  role:        z.enum(["admin", "doctor", "nurse", "intake"]),
  displayName: z.string().min(1, "displayName is required").max(100).trim(),
});

export const updateUserSchema = z
  .object({
    displayName: z.string().min(1).max(100).trim().optional(),
    role:        z.enum(["admin", "doctor", "nurse", "intake"]).optional(),
    active:      z.boolean().optional(),
    password:    z.string().min(8, "password must be at least 8 characters").max(200).optional(),
  })
  .refine(
    (v) => Object.values(v).some((f) => f !== undefined),
    { message: "No valid fields to update" }
  );
