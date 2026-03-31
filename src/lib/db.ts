import type { ApprovalRequest } from "@/types";

export type AuditEvent = {
  id: string;
  timestamp: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  result: "allowed" | "denied" | "approved" | "rejected" | "executed" | "pending_approval";
  metadata?: Record<string, unknown>;
};

declare global {
  var __approvals: ApprovalRequest[] | undefined;
}

export const approvalsDb = global.__approvals ?? (global.__approvals = []);