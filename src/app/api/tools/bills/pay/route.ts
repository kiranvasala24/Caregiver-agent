import { createApproval, getApproval } from "@/lib/approvals";
import { logAudit } from "@/lib/audit";
import { auth0 } from "@/lib/auth0";
import { canPayBill } from "@/lib/authz";
import { NextResponse } from "next/server";

const THRESHOLD = 200;

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { billId, amount, recipientId, approvalId } = body as {
    billId: string;
    amount: number;
    recipientId: string;
    approvalId?: string;
  };

  const caregiverUserId = session.user.sub!;

  const allowed = await canPayBill({ caregiverUserId, billId });
  if (!allowed) {
    logAudit({
      actorUserId: caregiverUserId,
      action: "pay_bill",
      resourceType: "bill",
      resourceId: billId,
      result: "denied",
    });
    return NextResponse.json({ error: "Not permitted to pay this bill" }, { status: 403 });
  }

  // High-stakes: require approval for amounts over threshold
  if (amount > THRESHOLD) {
    if (approvalId) {
      const approval = getApproval(approvalId);
      if (!approval) {
        return NextResponse.json({ error: "Approval not found" }, { status: 404 });
      }
      if (approval.status === "pending") {
        return NextResponse.json({
          requiresApproval: true,
          approvalId: approval.id,
          status: "pending",
          message: "Waiting for approval...",
        });
      }
      if (approval.status === "denied") {
        logAudit({
          actorUserId: caregiverUserId,
          action: "pay_bill",
          resourceType: "bill",
          resourceId: billId,
          result: "denied",
          metadata: { reason: "approval_denied", amount },
        });
        return NextResponse.json(
          { error: "Payment was denied by care recipient" },
          { status: 403 }
        );
      }
      // Approved — fall through to execute
    } else {
      const approval = createApproval({
        action: "pay_bill",
        description: `Pay ${billId.replace(/_/g, " ")} — $${amount}`,
        amount,
        requestedBy: session.user.name ?? session.user.email ?? "Caregiver",
      });

      logAudit({
        actorUserId: caregiverUserId,
        action: "pay_bill",
        resourceType: "bill",
        resourceId: billId,
        result: "pending_approval",
        metadata: { approvalId: approval.id, amount },
      });

      return NextResponse.json({
        requiresApproval: true,
        approvalId: approval.id,
        status: "pending",
        message: `This payment of $${amount} requires approval from the care recipient.`,
      });
    }
  }

  // Execute payment
  logAudit({
    actorUserId: caregiverUserId,
    action: "pay_bill",
    resourceType: "bill",
    resourceId: billId,
    result: "executed",
    metadata: { amount },
  });

  return NextResponse.json({
    success: true,
    bill: {
      id: billId,
      amount,
      status: "paid",
      paidAt: new Date().toISOString(),
    },
  });
}