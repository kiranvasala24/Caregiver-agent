export const auth0 = {
  async getSession() {
    // Mock implementation for development
    // In production, replace with proper Auth0 integration
    return {
      user: {
        sub: "dev-user-123",
        email: "dev@example.com",
        name: "Dev User",
      },
    };
  },
};