import ChatBox from "@/components/ChatBox";
import { auth0 } from "@/lib/auth0";

export default async function DashboardPage() {
  const session = await auth0.getSession();

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Trust Dashboard</h1>
            <p className="text-gray-600">
              Signed in as {session.user.name ?? session.user.email ?? session.user.sub}
            </p>
          </div>
          <div className="space-x-3">
            <a href="/approvals" className="rounded-xl border px-4 py-2">
              View approvals
            </a>
            <a href="/auth/logout" className="rounded-xl border px-4 py-2">
              Log out
            </a>
          </div>
        </div>

        <section className="rounded-2xl border p-6">
          <h2 className="mb-3 text-xl font-semibold">Agent chat</h2>
          <ChatBox />
        </section>

        <section className="rounded-2xl border p-6">
          <h2 className="mb-3 text-xl font-semibold">Suggested demo prompts</h2>
          <ul className="list-disc pl-6 text-sm text-gray-700">
            <li>Pay Alice’s electric bill</li>
            <li>Pay Alice’s electric bill for $1000</li>
            <li>Book Alice’s appointment</li>
          </ul>
        </section>
      </div>
    </main>
  );
}