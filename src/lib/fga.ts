import { CredentialsMethod, OpenFgaClient } from "@openfga/sdk";

let fgaClient: OpenFgaClient | null = null;

function getFgaClient(): OpenFgaClient | null {
  if (fgaClient) return fgaClient;

  if (
    process.env.FGA_API_URL &&
    process.env.FGA_STORE_ID &&
    process.env.FGA_MODEL_ID &&
    process.env.FGA_CLIENT_ID &&
    process.env.FGA_CLIENT_SECRET
  ) {
    fgaClient = new OpenFgaClient({
      apiUrl: process.env.FGA_API_URL,
      storeId: process.env.FGA_STORE_ID,
      authorizationModelId: process.env.FGA_MODEL_ID,
      credentials: {
        method: CredentialsMethod.ClientCredentials,
        config: {
          apiTokenIssuer: "auth.fga.dev",
          apiAudience: process.env.FGA_AUDIENCE!,
          clientId: process.env.FGA_CLIENT_ID!,
          clientSecret: process.env.FGA_CLIENT_SECRET!,
        },
      },
    });
  }

  return fgaClient;
}

export async function checkPermission(params: {
  user: string;
  relation: string;
  object: string;
}): Promise<boolean> {
  try {
    const client = getFgaClient();
    if (!client) {
      console.warn("FGA client not initialized, using mock permissions");
      return true;
    }
    const res = await client.check({
      user: params.user,
      relation: params.relation,
      object: params.object,
    });
    console.log(`FGA check: ${params.user} ${params.relation} ${params.object} → ${res.allowed}`);
    return Boolean(res.allowed);
  } catch (error) {
    console.warn("FGA check failed, using mock permissions:", error);
    return true;
  }
}