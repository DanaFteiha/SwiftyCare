// =============================================================================
// Authentication & authorization middleware
// -----------------------------------------------------------------------------
//   requireStaff(...roles)  → require a valid staff token; optionally restrict
//                             to specific roles (RBAC).
//   requireCaseWriteAccess  → allow either a staff member OR the patient holding
//                             the case-scoped token for THIS case (questionnaire
//                             submission).
//
// All protected routes fail closed: no/invalid token → 401, wrong role → 403.
// =============================================================================

import type { Request, Response, NextFunction } from "express";
import {
  verifyToken,
  isRole,
  type Role,
  type StaffTokenPayload,
} from "../config/auth.js";

// Augment Express' Request so handlers can read the authenticated principal.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      staff?: StaffTokenPayload;
      // Set when a request is authorised via a patient case-token (not staff).
      patientCaseId?: string;
    }
  }
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || typeof header !== "string") return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token.trim();
}

/**
 * Require a valid STAFF token. Pass one or more roles to restrict access.
 *   requireStaff()                  → any authenticated staff member
 *   requireStaff("doctor","admin")  → only doctors or admins
 */
export function requireStaff(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = extractBearer(req);
    if (!token) {
      return res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return res.status(401).json({ error: "Unauthorized", message: "Invalid or expired session" });
    }

    if (payload.type !== "staff" || !isRole(payload.role)) {
      return res.status(401).json({ error: "Unauthorized", message: "Invalid session" });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
      return res.status(403).json({ error: "Forbidden", message: "Insufficient permissions" });
    }

    req.staff = payload;
    next();
  };
}

/**
 * Allow access if EITHER:
 *   (a) the caller is staff (any role), OR
 *   (b) the caller holds a patient case-token scoped to the case in req.params.id
 *
 * Used for questionnaire submission, where the patient (kiosk/own device) writes
 * answers for their own case without holding staff credentials.
 */
export function requireCaseWriteAccess(req: Request, res: Response, next: NextFunction) {
  const token = extractBearer(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
  }

  if (payload.type === "staff" && isRole(payload.role)) {
    req.staff = payload;
    return next();
  }

  if (
    payload.type === "patient_case" &&
    payload.scope === "questionnaire" &&
    payload.sub === (req.params.id ?? "")
  ) {
    req.patientCaseId = payload.sub;
    return next();
  }

  return res.status(403).json({ error: "Forbidden", message: "Not authorized for this case" });
}

/**
 * Allow READ of a single case by staff (any role) OR by the patient holding the
 * case token for THIS case. When authorised as a patient, req.patientCaseId is
 * set so the handler can return a reduced, PHI-minimised projection.
 */
export function requireCaseReadAccess(req: Request, res: Response, next: NextFunction) {
  const token = extractBearer(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized", message: "Authentication required" });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
  }

  if (payload.type === "staff" && isRole(payload.role)) {
    req.staff = payload;
    return next();
  }

  if (payload.type === "patient_case" && payload.sub === (req.params.id ?? "")) {
    req.patientCaseId = payload.sub;
    return next();
  }

  return res.status(403).json({ error: "Forbidden", message: "Not authorized for this case" });
}
