import { migrate } from "@/lib/migrate";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await migrate();
    return NextResponse.json({ success: true, message: "Database migrated" });
  } catch (err) {
    console.error("Migration failed:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}