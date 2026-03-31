import { logAudit } from "@/lib/audit";
import { auth0 } from "@/lib/auth0";
import { createInvite, listCaregivers, listInvites } from "@/lib/invites";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [invites, caregivers] = await Promise.all([
    listInvites(session.user.sub!),
    listCaregivers(session.user.sub!),
  ]);

  return NextResponse.json({ invites, caregivers });
}

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { caregiverEmail, permissions } = await req.json();

  if (!caregiverEmail || !permissions?.length) {
    return NextResponse.json({ error: "Email and permissions required" }, { status: 400 });
  }

  const invite = await createInvite({
    recipientUserId: session.user.sub!,
    caregiverEmail,
    permissions,
  });

  await logAudit({
    actorUserId: session.user.sub!,
    action: "invite_caregiver",
    resourceType: "invite",
    resourceId: invite.id,
    result: "executed",
    metadata: { caregiverEmail, permissions },
  });

  const inviteUrl = `${process.env.APP_BASE_URL}/invite/accept?id=${invite.id}`;

  return NextResponse.json({ invite, inviteUrl });
}