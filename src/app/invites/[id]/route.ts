import { logAudit } from "@/lib/audit";
import { auth0 } from "@/lib/auth0";
import { acceptInvite, getInvite, revokeCaregiver } from "@/lib/invites";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const invite = await getInvite(id);
  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ invite });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth0.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await acceptInvite(
    id,
    session.user.sub!,
    session.user.name ?? session.user.email ?? "Caregiver"
  );

  await logAudit({
    actorUserId: session.user.sub!,
    action: "accept_invite",
    resourceType: "invite",
    resourceId: id,
    result: "executed",
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth0.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: caregiverUserId } = await params;
  await revokeCaregiver(session.user.sub!, caregiverUserId);

  return NextResponse.json({ success: true });
}