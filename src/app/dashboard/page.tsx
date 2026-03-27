import ChatBox from "@/components/ChatBox";
import { auth0 } from "@/lib/auth0";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string }>;
}) {
  const session = await auth0.getSession();
  const params = await searchParams;
  const connected = params?.connected === "true";

  if (!session?.user) {
    return (
      <main className="p-8">
        <a href="/auth/login" className="rounded-xl bg-black px-4 py-2 text-white">
          Log in
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* Success banner */}
        {connected && (
          <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-green-700 text-sm">
            ✅ Google Calendar connected successfully! You can now book appointments.
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trust Dashboard</h1>
            <p className="text-gray-600">
              Signed in as {session.user.name ?? session.user.email ?? session.user.sub}
            </p>
          </div>
          <div className="space-x-3">
            <a href="/connect" className="rounded-xl border px-4 py-2 text-sm">
              Connect Google
            </a>
            <a href="/approvals" className="rounded-xl border px-4 py-2 text-sm">
              View approvals
            </a>
            <a href="/audit" className="rounded-xl border px-4 py-2 text-sm">
              View audit log
            </a>
            <a href="/auth/logout" className="rounded-xl border px-4 py-2 text-sm">
              Log out
            </a>
          </div>
        </div>

        <section className="rounded-2xl border p-6">
          <h2 className="mb-3 text-xl font-semibold">Agent chat</h2>
          <ChatBox />
        </section>

      </div>
    </main>
  );
}