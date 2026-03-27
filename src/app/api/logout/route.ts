import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.AUTH0_BASE_URL || "http://localhost:3000";

  return NextResponse.redirect(
    `https://dev-suep7glagc3mt1ua.us.auth0.com/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${baseUrl}`
  );
}