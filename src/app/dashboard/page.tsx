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
      <main className="min-h-screen bg-[#064e3b] flex items-center justify-center">
        <a href="/auth/login" className="rounded-xl bg-emerald-500 px-6 py-3 text-white font-medium hover:bg-emerald-400 transition-colors">
          Log in
        </a>
      </main>
    );
  }

  const user = session.user;

  return (
    <main className="min-h-screen bg-[#f0fdf4] p-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {connected && (
          <div className="rounded-xl bg-emerald-100 border border-emerald-300 p-3 text-emerald-800 text-sm">
            Google Calendar connected successfully! You can now book appointments.
          </div>
        )}

        {/* Header */}
        <div className="rounded-2xl bg-[#065f46] p-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Trust Dashboard</h1>
            <p className="text-emerald-300 text-sm mt-1">
              Signed in as {user.name ?? user.email ?? user.sub}
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/approvals" className="rounded-lg bg-emerald-800 border border-emerald-600 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-700 transition-colors">
              Approvals
            </a>
            <a href="/audit" className="rounded-lg bg-emerald-800 border border-emerald-600 px-4 py-2 text-sm text-emerald-100 hover:bg-emerald-700 transition-colors">
              Audit log
            </a>
            <a href="/auth/logout" className="rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/20 transition-colors">
              Log out
            </a>
          </div>
        </div>

        {/* Trust Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Connected apps */}
          <div className="rounded-xl bg-white border border-emerald-200 p-5 shadow-sm space-y-4">
            <div>
              <h2 className="font-semibold text-sm text-emerald-900">Connected apps</h2>
              <p className="text-xs text-emerald-600 mt-0.5">Token Vault manages access</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-700">G</div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Google Calendar</p>
                    <p className="text-xs text-gray-400">calendar.events scope</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-xs text-emerald-700 font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-700">B</div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Bill Pay API</p>
                    <p className="text-xs text-gray-400">payments scope</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-xs text-emerald-700 font-medium">Active</span>
              </div>
            </div>
            <a href="/connect" className="block rounded-lg border border-dashed border-emerald-300 p-2 text-center text-xs text-emerald-600 hover:bg-emerald-50 transition-colors">
              + Connect another app
            </a>
          </div>

          {/* Caregiver permissions */}
          <div className="rounded-xl bg-white border border-emerald-200 p-5 shadow-sm space-y-4">
            <div>
              <h2 className="font-semibold text-sm text-emerald-900">Caregiver permissions</h2>
              <p className="text-xs text-emerald-600 mt-0.5">Auth0 FGA enforces these rules</p>
            </div>
            <div className="space-y-2">
              {[
                { label: "Pay bills", sublabel: "Under $200 threshold", enabled: true },
                { label: "Book appointments", sublabel: "Google Calendar access", enabled: true },
                { label: "Large payments", sublabel: "Requires CIBA approval", enabled: true },
                { label: "View medical records", sublabel: "Not granted", enabled: false },
                { label: "Transfer funds", sublabel: "Not granted", enabled: false },
              ].map((perm) => (
                <div key={perm.label} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-xs font-medium text-gray-700">{perm.label}</p>
                    <p className="text-xs text-gray-400">{perm.sublabel}</p>
                  </div>
                  <div className={`h-4 w-7 rounded-full relative ${perm.enabled ? "bg-emerald-500" : "bg-gray-200"}`}>
                    <div className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform ${perm.enabled ? "translate-x-3.5" : "translate-x-0.5"}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security settings */}
          <div className="rounded-xl bg-white border border-emerald-200 p-5 shadow-sm space-y-4">
            <div>
              <h2 className="font-semibold text-sm text-emerald-900">Security settings</h2>
              <p className="text-xs text-emerald-600 mt-0.5">CIBA step-up configuration</p>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 space-y-1">
                <p className="text-xs font-medium text-emerald-700">Approval threshold</p>
                <p className="text-xl font-bold text-emerald-900">$200</p>
                <p className="text-xs text-emerald-600">Payments above this require explicit approval</p>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 space-y-1">
                <p className="text-xs font-medium text-emerald-700">Auth model</p>
                <p className="text-sm font-semibold text-emerald-900">Token Vault + FGA</p>
                <p className="text-xs text-emerald-600">Tokens never stored in app</p>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 space-y-1">
                <p className="text-xs font-medium text-emerald-700">Session</p>
                <p className="text-sm font-semibold text-emerald-900 truncate">{user.email ?? user.sub}</p>
                <p className="text-xs text-emerald-600">Auth0 managed session</p>
              </div>
            </div>
          </div>
        </div>

        {/* Agent chat */}
        <div className="rounded-xl bg-white border border-emerald-200 p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-emerald-900">Agent chat</h2>
            <p className="text-xs text-emerald-600 mt-0.5">
              Actions governed by FGA permissions — CIBA approval required for high-stakes operations
            </p>
          </div>
          <ChatBox />
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4">
          <a href="/approvals" className="rounded-xl bg-white border border-emerald-200 p-4 shadow-sm hover:bg-emerald-50 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-emerald-900">Pending approvals</p>
                <p className="text-xs text-emerald-600 mt-0.5">Review high-stakes agent actions</p>
              </div>
              <span className="text-emerald-300 group-hover:text-emerald-600 transition-colors text-lg">→</span>
            </div>
          </a>
          <a href="/audit" className="rounded-xl bg-white border border-emerald-200 p-4 shadow-sm hover:bg-emerald-50 transition-colors group">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-emerald-900">Audit log</p>
                <p className="text-xs text-emerald-600 mt-0.5">Immutable record of all actions</p>
              </div>
              <span className="text-emerald-300 group-hover:text-emerald-600 transition-colors text-lg">→</span>
            </div>
          </a>
        </div>

      </div>
    </main>
  );
}