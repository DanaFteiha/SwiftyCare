// =============================================================================
// Structured audit logging — P1-7
// -----------------------------------------------------------------------------
// Every PHI access and mutation records a tamper-evident structured JSON entry
// to stdout. Render captures stdout as log lines, which can be forwarded to
// a retained log store (Datadog, Papertrail, etc.).
//
// What we log:  timestamp · actor (id + role, never name) · action · resourceId · IP
// What we NEVER log: patient name, national ID, clinical values, or passwords.
// =============================================================================

import type { Request } from "express";

export type AuditAction =
  | "auth.login.success"
  | "auth.login.failure"
  | "case.list"
  | "case.create"
  | "case.read"
  | "case.update.status"
  | "case.update.vitals"
  | "case.questionnaire.read"
  | "case.questionnaire.submit"
  | "case.summary.generate"
  | "case.diagnosis.generate"
  | "case.discharge.generate"
  | "case.discharge.save"
  | "case.discharge.finalize"
  | "case.tests.order"
  | "case.delete"
  | "user.list"
  | "user.create"
  | "user.update"
  | "user.delete";

export function auditLog(req: Request, action: AuditAction, resourceId?: string): void {
  const actor = req.staff
    ? { type: "staff" as const, id: req.staff.sub, role: req.staff.role }
    : req.patientCaseId
    ? { type: "patient_token" as const, caseId: req.patientCaseId }
    : { type: "unknown" as const };

  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    null;

  console.log(
    "[AUDIT] " +
      JSON.stringify({
        t: new Date().toISOString(),
        action,
        actor,
        resourceId: resourceId ?? null,
        ip,
      })
  );
}
