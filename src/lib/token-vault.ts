export interface ProviderAccessToken {
  accessToken: string;
  provider: "google" | "slack" | "github" | "mock-billing";
  expiresAt?: number;
}

/**
 * Replace this with your real Token Vault token retrieval.
 * For hackathon day 1, you can return mock tokens for mock tools.
 */
export async function getProviderTokenForUser(args: {
  auth0UserId: string;
  provider: ProviderAccessToken["provider"];
}): Promise<ProviderAccessToken> {
  // TODO:
  // 1. Call your backend integration for Auth0 Token Vault
  // 2. Retrieve the provider token for the linked account
  // 3. Return access token only to the server-side tool executor
  return {
    accessToken: `demo-token-for-${args.provider}-${args.auth0UserId}`,
    provider: args.provider,
  };
}