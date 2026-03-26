import { approvalsDb } from "@/lib/db";
import type { ApprovalRequest } from "@/types";
import { v4 as uuid } from "uuid";

export function createApproval(
  input: Omit<ApprovalRequest, "id" | "createdAt" | "status">
): ApprovalRequest {
  const record: ApprovalRequest = {
    ...input,
    id: uuid(),
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  approvalsDb.push(record);
  return record;
}

export function listApprovals() {
  return approvalsDb;
}

export function getApproval(id: string) {
  return approvalsDb.find((a) => a.id === id) ?? null;
}

export function updateApprovalStatus(
  id: string,
  status: "approved" | "rejected"
) {
  const approval = approvalsDb.find((a) => a.id === id);
  if (!approval) return null;
  approval.status = status;
  return approval;
}