import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Let our custom connect callback handler run directly
  if (pathname === "/auth/connect/callback") {
    return NextResponse.next();
  }

  return await auth0.middleware(request);
}

export const config = {
  matcher: ["/(.*)",],
};