import { auth0 } from "@/lib/auth0";

export async function getGoogleAccessToken(): Promise<string> {
  try {
    // Try Token Vault first (works once Early Access is enabled)
    const tokenResult = await auth0.getAccessToken({
      audience: `https://${process.env.AUTH0_DOMAIN}/me/`,
      scope: "openid profile email offline_access read:me:connected_accounts",
    });

    if (!tokenResult?.token) throw new Error("No token");

    const res = await fetch(
      `https://${process.env.AUTH0_DOMAIN}/me/v1/connected-accounts/google-oauth2/access-token`,
      {
        headers: {
          Authorization: `Bearer ${tokenResult.token}`,
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      return data.access_token;
    }
  } catch (err) {
    console.log("Token Vault not available yet, using session token:", err);
  }

  // Fallback: use the user's own Google access token from session
  // This works because the user logged in with Google
  const session = await auth0.getSession();
  const idToken = session?.tokenSet?.accessToken;

  if (idToken) {
    return idToken;
  }

  throw new Error("GOOGLE_NOT_CONNECTED");
}