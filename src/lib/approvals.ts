import { query } from "./db-postgres";

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

export async function createApproval(
  data: Omit<Approval, "id" | "createdAt" | "status">
): Promise<Approval> {
  const id = `approval_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await query(
    `INSERT INTO approvals (id, action, description, amount, requested_by, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')`,
    [id, data.action, data.description, data.amount ?? null, data.requestedBy]
  );
  const res = await query(`SELECT * FROM approvals WHERE id = $1`, [id]);
  return mapApproval(res.rows[0]);
}

export async function getApproval(id: string): Promise<Approval | undefined> {
  const res = await query(`SELECT * FROM approvals WHERE id = $1`, [id]);
  return res.rows[0] ? mapApproval(res.rows[0]) : undefined;
}

export async function updateApproval(
  id: string,
  status: ApprovalStatus
): Promise<Approval | undefined> {
  const res = await query(
    `UPDATE approvals SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return res.rows[0] ? mapApproval(res.rows[0]) : undefined;
}

export async function listApprovals(): Promise<Approval[]> {
  const res = await query(
    `SELECT * FROM approvals ORDER BY created_at DESC LIMIT 50`
  );
  return res.rows.map(mapApproval);
}

function mapApproval(row: Record<string, unknown>): Approval {
  return {
    id: row.id as string,
    action: row.action as string,
    description: row.description as string,
    amount: row.amount ? Number(row.amount) : undefined,
    requestedBy: row.requested_by as string,
    createdAt: String(row.created_at),
    status: row.status as ApprovalStatus,
  };
}