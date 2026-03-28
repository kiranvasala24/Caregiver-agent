export type ApprovalStatus = "pending" | "approved" | "denied";

export type Approval = {
  id: string;
  action: string;
  description: string;
  amount?: number;
  requestedBy: string;
  createdAt: string;
  status: ApprovalStatus;
};

// In-memory store (resets on server restart — fine for demo)
const approvals = new Map<string, Approval>();

export function createApproval(data: Omit<Approval, "id" | "createdAt" | "status">): Approval {
  const id = `approval_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const approval: Approval = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
  approvals.set(id, approval);
  return approval;
}

export function getApproval(id: string): Approval | undefined {
  return approvals.get(id);
}

export function updateApproval(id: string, status: ApprovalStatus): Approval | undefined {
  const approval = approvals.get(id);
  if (!approval) return undefined;
  approval.status = status;
  approvals.set(id, approval);
  return approval;
}

export function listApprovals(): Approval[] {
  return Array.from(approvals.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}