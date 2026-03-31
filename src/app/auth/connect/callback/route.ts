import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const connectCode = searchParams.get("connect_code");
  const authSession = req.cookies.get("tv_auth_session")?.value;

  console.log("Connect callback received");
  console.log("connect_code:", connectCode);
  console.log("auth_session:", authSession ? "present" : "MISSING");

  if (!connectCode) {
    return NextResponse.redirect(new URL("/connect?error=no_code", process.env.APP_BASE_URL!));
  }

  if (!authSession) {
    return NextResponse.redirect(new URL("/connect?error=no_session", process.env.APP_BASE_URL!));
  }

  try {
    const tokenResult = await auth0.getAccessToken({
      audience: `https://${process.env.AUTH0_DOMAIN}/me/`,
      scope: "openid profile email offline_access create:me:connected_accounts",
    });

    if (!tokenResult?.token) {
      return NextResponse.redirect(new URL("/connect?error=no_token", process.env.APP_BASE_URL!));
    }

    const redirectUri = `${process.env.APP_BASE_URL}/auth/connect/callback`;

    const res = await fetch(
      `https://${process.env.AUTH0_DOMAIN}/me/v1/connected-accounts/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenResult.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connect_code: connectCode,
          auth_session: authSession,
          redirect_uri: redirectUri,
        }),
      }
    );

    const data = await res.json();
    console.log("Connect complete response:", JSON.stringify(data, null, 2));

    if (!res.ok) {
      console.error("Connect complete failed:", data);
      return NextResponse.redirect(new URL("/connect?error=complete_failed", process.env.APP_BASE_URL!));
    }

    // Clear the auth_session cookie
    const response = NextResponse.redirect(
      new URL("/dashboard?connected=true", process.env.APP_BASE_URL!)
    );
    response.cookies.delete("tv_auth_session");
    return response;

  } catch (err) {
    console.error("Connect callback error:", err);
    return NextResponse.redirect(new URL("/connect?error=exception", process.env.APP_BASE_URL!));
  }
}