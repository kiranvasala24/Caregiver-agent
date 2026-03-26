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
  const body = await req.json();
  const decision = body.decision as "approved" | "rejected";

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

  logAudit({
    actorUserId: session.user.sub!,
    action: "approval_decision",
    resourceType: "approval_request",
    resourceId: id,
    result: decision,
    metadata: { linkedResourceId: approval.resourceId },
  });

  return NextResponse.json({ approval: updated });
}