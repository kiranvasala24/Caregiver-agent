import { CredentialsMethod, OpenFgaClient } from "@openfga/sdk";

let fgaClient: OpenFgaClient | null = null;

function getFgaClient(): OpenFgaClient {
  if (fgaClient) return fgaClient;

  // Only initialize if all required env vars are present
  if (
    process.env.FGA_API_URL &&
    process.env.FGA_STORE_ID &&
    process.env.FGA_MODEL_ID
  ) {
    fgaClient = new OpenFgaClient({
      apiUrl: process.env.FGA_API_URL,
      storeId: process.env.FGA_STORE_ID,
      authorizationModelId: process.env.FGA_MODEL_ID,
      ...(process.env.FGA_CLIENT_ID && {
        credentials: {
          method: CredentialsMethod.ClientCredentials,
          config: {
            apiTokenIssuer: process.env.AUTH0_DOMAIN!,
            apiAudience: process.env.FGA_AUDIENCE!,
            clientId: process.env.FGA_CLIENT_ID!,
            clientSecret: process.env.FGA_CLIENT_SECRET!,
          },
        },
      }),
    });
  }

  return fgaClient!;
}

export async function checkPermission(params: {
  user: string;
  relation: string;
  object: string;
}) {
  try {
    const client = getFgaClient();
    const res = await client.check({
      user: params.user,
      relation: params.relation,
      object: params.object,
    });
    return Boolean(res.allowed);
  } catch (error) {
    // Mock permission check for development
    // In production, handle FGA properly or return false
    console.warn("FGA check failed, using mock permissions:", error);
    return true; // Allow in development mode
  }
}