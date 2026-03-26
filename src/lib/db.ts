import type { ApprovalRequest } from "@/types";

declare global {
  // eslint-disable-next-line no-var
  var __approvals: ApprovalRequest[] | undefined;
  // eslint-disable-next-line no-var
  var __audit: Record<string, unknown>[] | undefined;
}

export const approvalsDb = global.__approvals ?? (global.__approvals = []);
export const auditDb = global.__audit ?? (global.__audit = []);