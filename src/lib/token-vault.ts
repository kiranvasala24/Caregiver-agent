import { auth0 } from "@/lib/auth0";

export async function getGoogleAccessToken(): Promise<string> {
  // Get session which contains the refresh token
  const session = await auth0.getSession();
  if (!session) throw new Error("GOOGLE_NOT_CONNECTED");

  console.log("Session tokenSet keys:", Object.keys(session.tokenSet ?? {}));

  const refreshToken = session.tokenSet?.refreshToken;
  console.log("Refresh token present:", !!refreshToken);

  if (!refreshToken) throw new Error("GOOGLE_NOT_CONNECTED");

  // Use refresh token exchange to get Google access token from Token Vault
  const res = await fetch(
    `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        subject_token: refreshToken,
        grant_type: "urn:auth0:params:oauth:grant-type:token-exchange:federated-connection-access-token",
        subject_token_type: "urn:ietf:params:oauth:token-type:refresh_token",
        requested_token_type: "http://auth0.com/oauth/token-type/federated-connection-access-token",
        connection: "google-oauth2",
      }),
    }
  );

  const data = await res.json();
  console.log("Token Vault exchange response:", JSON.stringify(data, null, 2));

  if (res.ok && data.access_token) {
    console.log("Token Vault success! Got real Google token.");
    return data.access_token;
  }

  console.error("Token Vault exchange failed:", data);
  throw new Error("GOOGLE_NOT_CONNECTED");
}