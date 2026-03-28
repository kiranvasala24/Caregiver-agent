import { createApproval, listApprovals } from "@/lib/approvals";
import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ approvals: listApprovals() });
}

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const approval = createApproval({
    action: body.action,
    description: body.description,
    amount: body.amount,
    requestedBy: session.user.name ?? session.user.email ?? "Agent",
  });

  return NextResponse.json({ approval });
}