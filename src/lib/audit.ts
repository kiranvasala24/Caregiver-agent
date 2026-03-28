import type { AuditEvent } from "@/lib/db";
import { auditDb } from "@/lib/db";

export type { AuditEvent };
export type AuditResult = AuditEvent["result"];

export function logAudit(event: Omit<AuditEvent, "id" | "timestamp">) {
  auditDb.push({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...event,
  });
}

export function listAudit(): AuditEvent[] {
  return auditDb.slice().reverse();
}