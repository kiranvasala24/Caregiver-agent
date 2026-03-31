import { auth0 } from "@/lib/auth0";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
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
      `https://${process.env.AUTH0_DOMAIN}/me/v1/connected-accounts/connect`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenResult.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connection: "google-oauth2",
          redirect_uri: redirectUri,
          scopes: ["https://www.googleapis.com/auth/calendar.events"],
        }),
      }
    );

    const data = await res.json();
    console.log("Connect initiation response:", JSON.stringify(data, null, 2));

    if (!res.ok) {
      return NextResponse.redirect(new URL("/connect?error=initiation_failed", process.env.APP_BASE_URL!));
    }

    if (data.connect_uri && data.connect_params?.ticket) {
      const redirectUrl = new URL(data.connect_uri);
      redirectUrl.searchParams.set("ticket", data.connect_params.ticket);

      // Store auth_session in cookie for the callback
      const response = NextResponse.redirect(redirectUrl.toString());
      response.cookies.set("tv_auth_session", data.auth_session, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 300, // 5 minutes
        path: "/",
      });
      return response;
    }

    return NextResponse.redirect(new URL("/connect?error=no_auth_url", process.env.APP_BASE_URL!));
  } catch (err) {
    console.error("Connect route error:", err);
    return NextResponse.redirect(new URL("/connect?error=exception", process.env.APP_BASE_URL!));
  }
}