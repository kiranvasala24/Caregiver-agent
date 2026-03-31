import { query } from "./db-postgres";

export type AuditResult =
  | "allowed" | "denied" | "approved"
  | "rejected" | "executed" | "pending_approval";

export type AuditEvent = {
  id: string;
  timestamp: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  result: AuditResult;
  metadata?: Record<string, unknown>;
};

export async function logAudit(event: Omit<AuditEvent, "id" | "timestamp">) {
  try {
    await query(
      `INSERT INTO audit_logs
        (actor_user_id, action, resource_type, resource_id, result, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        event.actorUserId,
        event.action,
        event.resourceType,
        event.resourceId,
        event.result,
        event.metadata ? JSON.stringify(event.metadata) : null,
      ]
    );
  } catch (err) {
    console.error("Failed to log audit event:", err);
  }
}

export async function listAudit(): Promise<AuditEvent[]> {
  try {
    const res = await query(
      `SELECT id, timestamp, actor_user_id, action, resource_type,
              resource_id, result, metadata
       FROM audit_logs
       ORDER BY timestamp DESC
       LIMIT 100`
    );
    return res.rows.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      actorUserId: row.actor_user_id,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      result: row.result,
      metadata: row.metadata,
    }));
  } catch (err) {
    console.error("Failed to list audit events:", err);
    return [];
  }
}