import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";

export const auth0 = new Auth0Client({
  authorizationParameters: {
    scope: "openid profile email offline_access",
    audience: `https://${process.env.AUTH0_DOMAIN}/me/`,
  },
  enableConnectAccountEndpoint: true,
  routes: {
    connectAccount: "/auth/connect",
  },
  async onCallback(err, ctx, session) {
    const appBaseUrl = process.env.APP_BASE_URL!;
    if (err) {
      console.error("onCallback error:", err.code, err.message);
      return NextResponse.redirect(new URL("/dashboard", appBaseUrl));
    }
    return NextResponse.redirect(
      new URL(ctx.returnTo ?? "/dashboard", appBaseUrl)
    );
  },
});

export const getAccessToken = async () => {
  const tokenResult = await auth0.getAccessToken();
  if (!tokenResult?.token) throw new Error("No access token found");
  return tokenResult.token;
};
