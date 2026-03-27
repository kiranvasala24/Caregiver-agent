import { auth0 } from "@/lib/auth0";

export default async function HomePage() {
  const session = await auth0.getSession();

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold">Caregiver Delegation Agent</h1>
        <p className="text-lg text-gray-600">
          Secure AI actions on behalf of a care recipient with clear permissions,
          approvals, and audit logs.
        </p>

        {!session?.user ? (
          <a
            href="/auth/login"
            className="inline-block rounded-xl bg-black px-5 py-3 text-white"
          >
            Log in
          </a>
        ) : (
          <div className="space-x-3">
            <a
              href="/dashboard"
              className="inline-block rounded-xl bg-black px-5 py-3 text-white"
            >
              Open dashboard
            </a>
            <a href="/api/auth/login" className="inline-block rounded-xl border px-5 py-3">Login</a>
            <a
              href="api/auth/logout"
              className="inline-block rounded-xl border px-5 py-3"
            >
              Log out
            </a>
          </div>
        )}
      </div>
    </main>
  );
}