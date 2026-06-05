// =============================================================================
// Input validation middleware — P1-10
// -----------------------------------------------------------------------------
// validateBody(schema) returns an Express middleware that runs a Zod schema
// against req.body. On success it replaces req.body with the parsed (and
// potentially coerced / stripped) value. On failure it returns 400.
// =============================================================================

import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

// Israeli national ID (ת.ז.) must be exactly 9 digits and pass the standard
// Luhn-like Ministry-of-Interior checksum.
function isValidIsraeliId(id: string): boolean {
  if (!/^\d{9}$/.test(id)) return false;
  let total = 0;
  for (let i = 0; i < 9; i++) {
    let step = parseInt(id[i] ?? "0") * (i % 2 === 0 ? 1 : 2);
    if (step > 9) step -= 9;
    total += step;
  }
  return total % 10 === 0;
}

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
  nationalId: z
    .string()
    .trim()
    .refine(isValidIsraeliId, {
      message: "Invalid national ID — must be a 9-digit Israeli ID number",
    }),
  hospital: z.string().max(200).trim().optional(),
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
