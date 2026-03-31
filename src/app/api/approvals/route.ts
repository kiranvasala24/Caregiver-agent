import { createApproval, listApprovals } from "@/lib/approvals";
import { logAudit } from "@/lib/audit";
import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const approvals = await listApprovals();
  return NextResponse.json({ approvals });
}

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { action, description, amount } = await req.json();
  const approval = await createApproval({
    action,
    description,
    amount,
    requestedBy: session.user.name ?? session.user.email ?? "Caregiver",
  });
  await logAudit({
    actorUserId: session.user.sub!,
    action: "create_approval",
    resourceType: "approval",
    resourceId: approval.id,
    result: "executed",
  });
  return NextResponse.json({ approval });
}