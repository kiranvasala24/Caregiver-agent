export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalRequest {
  id: string;
  type: "bill_payment" | "appointment_booking";
  createdAt: string;
  recipientId: string;
  requesterUserId: string;
  amount?: number;
  reason: string;
  resourceId: string;
  status: ApprovalStatus;
}