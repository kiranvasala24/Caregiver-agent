import { listAudit } from "@/lib/audit";
import { NextResponse } from "next/server";

export async function GET() {
  const logs = await listAudit();
  return NextResponse.json({ logs });
}