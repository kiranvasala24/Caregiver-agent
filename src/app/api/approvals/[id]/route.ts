import { getApproval, updateApproval } from "@/lib/approvals";
import { logAudit } from "@/lib/audit";
import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const approval = getApproval(id);

  if (!approval) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ approval });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { status } = await req.json();

  const approval = getApproval(id);
  if (!approval) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = updateApproval(id, status);

  logAudit({
    actorUserId: session.user.sub!,
    action: "approval_decision",
    resourceType: "approval_request",
    resourceId: id,
    result: status,
  });

  return NextResponse.json({ approval: updated });
}