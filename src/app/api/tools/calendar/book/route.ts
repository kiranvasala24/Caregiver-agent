import { logAudit } from "@/lib/audit";
import { auth0 } from "@/lib/auth0";
import { canBookAppointment } from "@/lib/authz";
import { getGoogleAccessToken } from "@/lib/token-vault";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { appointmentId, title, recipientId } = body as {
    appointmentId: string;
    title?: string;
    recipientId: string;
  };

  const caregiverUserId = session.user.sub!;
  const allowed = await canBookAppointment({ caregiverUserId, appointmentId });

  if (!allowed) {
    logAudit({
      actorUserId: caregiverUserId,
      action: "book_appointment",
      resourceType: "appointment",
      resourceId: appointmentId,
      result: "denied",
    });
    return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  }

  try {
    // Get user's access token from session
    const tokenResult = await auth0.getAccessToken();
    const userToken = tokenResult?.token;

    if (!userToken) {
      return NextResponse.json({ error: "No user session token" }, { status: 401 });
    }

    // Exchange via Token Vault for Google token
    const googleToken = await getGoogleAccessToken();

    const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

    const event = {
      summary: title || "Doctor Appointment (via Caregiver Agent)",
      description: `Booked by caregiver agent. Resource: ${appointmentId}`,
      start: { dateTime: startTime.toISOString(), timeZone: "America/New_York" },
      end: { dateTime: endTime.toISOString(), timeZone: "America/New_York" },
    };

    const calRes = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    const calData = await calRes.json();

    if (!calRes.ok) {
  console.error("Google Calendar API error:", JSON.stringify(calData, null, 2));
  return NextResponse.json(
    { error: "Google Calendar API failed", details: calData },
    { status: 500 }
  );
}

    logAudit({
      actorUserId: caregiverUserId,
      action: "book_appointment",
      resourceType: "appointment",
      resourceId: appointmentId,
      result: "executed",
      metadata: { calendarEventId: calData.id, link: calData.htmlLink },
    });

    return NextResponse.json({
      success: true,
      calendarEvent: {
        id: calData.id,
        link: calData.htmlLink,
        title: calData.summary,
        start: calData.start?.dateTime,
      },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "GOOGLE_NOT_CONNECTED") {
      return NextResponse.json({
        error: "Google account not connected",
        connectUrl: "/connect",
      }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}