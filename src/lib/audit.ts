import { auditDb } from "@/lib/db";

export function logAudit(event: {
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  result: "allowed" | "denied" | "approved" | "rejected" | "executed";
  metadata?: Record<string, unknown>;
}) {
  auditDb.push({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    ...event,
  });
}

export function listAudit() {
  return auditDb.slice().reverse();
}