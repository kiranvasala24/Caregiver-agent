import { auth0 } from "@/lib/auth0";

export async function getGoogleAccessToken(): Promise<string> {
  const session = await auth0.getSession();
  const userId = session?.user?.sub;
  if (!userId) throw new Error("GOOGLE_NOT_CONNECTED");

  // Get M2M token with idp token read scope
  const m2mRes = await fetch(
    `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
      }),
    }
  );

  const m2mData = await m2mRes.json();
  if (!m2mRes.ok) {
    console.error("M2M token failed:", m2mData);
    throw new Error("GOOGLE_NOT_CONNECTED");
  }

  // Fetch user with IDP tokens
  const userRes = await fetch(
    `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}?fields=identities&include_fields=true`,
    {
      headers: { Authorization: `Bearer ${m2mData.access_token}` },
    }
  );

  const userData = await userRes.json();
  console.log("Identities:", JSON.stringify(
    userData.identities?.map((i: Record<string, unknown>) => ({
      connection: i.connection,
      hasToken: !!i.access_token,
      tokenStart: typeof i.access_token === "string"
        ? (i.access_token as string).substring(0, 10)
        : "none"
    })), null, 2
  ));

  const googleIdentity = userData.identities?.find(
    (i: Record<string, unknown>) => i.connection === "google-oauth2"
  );

  if (googleIdentity?.access_token) {
    console.log("Got real Google token!");
    return googleIdentity.access_token as string;
  }

  throw new Error("GOOGLE_NOT_CONNECTED");
}