import { createApproval } from "@/lib/approvals";
import { logAudit } from "@/lib/audit";
import { auth0 } from "@/lib/auth0";
import { canPayBill } from "@/lib/authz";
import { NextResponse } from "next/server";

const THRESHOLD = Number(process.env.APPROVAL_AMOUNT_THRESHOLD ?? "200");

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { billId, amount, recipientId } = body as {
    billId: string;
    amount: number;
    recipientId: string;
  };

  const caregiverUserId = session.user.sub!;
  const allowed = await canPayBill({
    caregiverUserId,
    billId,
  });

  if (!allowed) {
    logAudit({
      actorUserId: caregiverUserId,
      action: "pay_bill",
      resourceType: "bill",
      resourceId: billId,
      result: "denied",
      metadata: { amount },
    });

    return NextResponse.json(
      { error: "Not allowed to pay this bill" },
      { status: 403 }
    );
  }

  if (amount > THRESHOLD) {
    const approval = createApproval({
      type: "bill_payment",
      recipientId,
      requesterUserId: caregiverUserId,
      amount,
      reason: `Payment exceeds threshold of $${THRESHOLD}`,
      resourceId: billId,
    });

    logAudit({
      actorUserId: caregiverUserId,
      action: "pay_bill_requires_approval",
      resourceType: "bill",
      resourceId: billId,
      result: "allowed",
      metadata: { amount, approvalId: approval.id },
    });

    return NextResponse.json({
      requiresApproval: true,
      approval,
    });
  }

  const token = await getProviderTokenForUser({
    auth0UserId: caregiverUserId,
    provider: "mock-billing",
  });

  // Replace with real billing API call
  const paymentResult = {
    ok: true,
    paidAt: new Date().toISOString(),
    provider: token.provider,
  };

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
    paymentResult,
  });
}