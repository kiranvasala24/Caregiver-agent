import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const connectCode = searchParams.get("connect_code");

  console.log("Connect callback received, connect_code:", connectCode);

  if (!connectCode) {
    return NextResponse.redirect(new URL("/connect?error=no_code", process.env.APP_BASE_URL!));
  }

  try {
    const tokenResult = await auth0.getAccessToken({
      audience: `https://${process.env.AUTH0_DOMAIN}/me/`,
      scope: "openid profile email offline_access create:me:connected_accounts",
    });

    if (!tokenResult?.token) {
      return NextResponse.redirect(new URL("/connect?error=no_token", process.env.APP_BASE_URL!));
    }

    // Exchange connect_code for connected account
    const res = await fetch(
      `https://${process.env.AUTH0_DOMAIN}/me/v1/connected-accounts/connect/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenResult.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ connect_code: connectCode }),
      }
    );

    const data = await res.json();
    console.log("Connect complete response:", JSON.stringify(data, null, 2));

    if (!res.ok) {
      console.error("Connect complete failed:", data);
      return NextResponse.redirect(new URL("/connect?error=complete_failed", process.env.APP_BASE_URL!));
    }

    // Success — Google is now connected
    return NextResponse.redirect(new URL("/dashboard?connected=true", process.env.APP_BASE_URL!));

  } catch (err) {
    console.error("Connect callback error:", err);
    return NextResponse.redirect(new URL("/connect?error=exception", process.env.APP_BASE_URL!));
  }
}