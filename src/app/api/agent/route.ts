import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";

function parseIntent(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("pay") && lower.includes("bill")) {
    return {
      tool: "pay_bill",
      args: {
        billId: "electric_march",
        amount: lower.includes("1000") ? 1000 : 120,
        recipientId: "alice",
      },
    };
  }

  if (lower.includes("book") && lower.includes("appointment")) {
    return {
      tool: "book_appointment",
      args: {
        appointmentId: "checkup_apr_10",
      },
    };
  }

  return { tool: "unknown", args: {} };
}

export async function POST(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await req.json();
  const intent = parseIntent(message);

  return NextResponse.json({
    reply:
      intent.tool === "pay_bill"
        ? "I can try to pay that bill now."
        : intent.tool === "book_appointment"
        ? "I can try to book that appointment."
        : "I’m not sure what action to take yet.",
    intent,
  });
}