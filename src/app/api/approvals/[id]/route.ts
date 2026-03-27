import { getApproval, updateApprovalStatus } from "@/lib/approvals";
import { logAudit } from "@/lib/audit";
import { auth0 } from "@/lib/auth0";
import { canApproveRequest } from "@/lib/authz";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth0.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { decision } = await req.json();

  const approval = getApproval(id);
  if (!approval) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowed = await canApproveRequest({
    approverUserId: session.user.sub!,
    approvalId: approval.id,
  });

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = updateApprovalStatus(id, decision);

  // 🔥 NEW: Execute action after approval
  if (decision === "approved") {
    if (approval.type === "bill_payment") {
      console.log("Executing bill payment:", approval);

      // simulate execution (replace later with real API)
      logAudit({
        actorUserId: approval.requesterUserId,
        action: "bill_payment_executed",
        resourceType: "bill",
        resourceId: approval.resourceId,
        result: "executed",
        metadata: { amount: approval.amount },
      });
    }
  }

  logAudit({
    actorUserId: session.user.sub!,
    action: "approval_decision",
    resourceType: "approval_request",
    resourceId: id,
    result: decision,
  });

  return NextResponse.json({ approval: updated });
}