// =============================================================================
// Authentication configuration & token helpers
// -----------------------------------------------------------------------------
// Central place for: the JWT signing secret, token lifetimes, role definitions,
// and the sign/verify helpers used by the auth middleware and routes.
//
// Design notes (for the security review):
//   * Staff sessions are short-lived stateless JWTs (no server session store).
//   * Patient "case tokens" are separately-scoped JWTs that authorise writing
//     ONLY the questionnaire for a single case — they cannot read PHI or touch
//     any other case.
//   * The login mechanism is intentionally decoupled from token issuance, so a
//     future hospital SSO/OIDC integration can mint the same staff tokens
//     without changing the middleware or the protected routes.
// =============================================================================

import crypto from "crypto";
import jwt, { type SignOptions } from "jsonwebtoken";

// ─── Roles ───────────────────────────────────────────────────────────────────

export const ROLES = ["admin", "doctor", "nurse", "intake"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

// ─── Token lifetimes ─────────────────────────────────────────────────────────

type ExpiresIn = NonNullable<SignOptions["expiresIn"]>;

const STAFF_TOKEN_TTL: ExpiresIn =
  (process.env.STAFF_TOKEN_TTL as ExpiresIn) || "12h";
const PATIENT_CASE_TOKEN_TTL: ExpiresIn =
  (process.env.PATIENT_CASE_TOKEN_TTL as ExpiresIn) || "3h";

// ─── Signing secret ──────────────────────────────────────────────────────────
// In production a real secret MUST be supplied via JWT_SECRET; the server
// refuses to start otherwise (fail closed). In development we fall back to an
// ephemeral random secret so local work is frictionless — tokens simply become
// invalid across restarts.

function resolveSecret(): string {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv && fromEnv.trim().length >= 16) return fromEnv.trim();

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET is required in production (min 16 chars). Refusing to start."
    );
  }

  const ephemeral = crypto.randomBytes(48).toString("hex");
  console.warn(
    "⚠️  JWT_SECRET not set — using an ephemeral development secret. " +
      "Tokens will be invalidated on restart. Set JWT_SECRET for stable sessions."
  );
  return ephemeral;
}

const JWT_SECRET = resolveSecret();

// ─── Token payloads ──────────────────────────────────────────────────────────

export interface StaffTokenPayload {
  type: "staff";
  sub: string; // user id
  role: Role;
  name: string;
}

export interface PatientCaseTokenPayload {
  type: "patient_case";
  sub: string; // case id
  scope: "questionnaire";
}

export type AppTokenPayload = StaffTokenPayload | PatientCaseTokenPayload;

// ─── Sign / verify ───────────────────────────────────────────────────────────

export function signStaffToken(payload: Omit<StaffTokenPayload, "type">): string {
  return jwt.sign({ ...payload, type: "staff" }, JWT_SECRET, {
    expiresIn: STAFF_TOKEN_TTL,
  });
}

export function signPatientCaseToken(caseId: string): string {
  const payload: PatientCaseTokenPayload = {
    type: "patient_case",
    sub: caseId,
    scope: "questionnaire",
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: PATIENT_CASE_TOKEN_TTL });
}

export function verifyToken(token: string): AppTokenPayload {
  return jwt.verify(token, JWT_SECRET) as AppTokenPayload;
}
