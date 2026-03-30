import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth0.getSession();
  if (!session?.user) redirect("/auth/login");

  const params = await searchParams;
  const error = params?.error;

  return (
    <main className="min-h-screen bg-[#f0fdf4] flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">

        {/* Header card */}
        <div className="rounded-2xl bg-[#065f46] p-6 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-700 border-2 border-emerald-400 flex items-center justify-center text-2xl mx-auto mb-4">
            🔗
          </div>
          <h1 className="text-2xl font-bold text-white">Connect Google Account</h1>
          <p className="text-emerald-300 text-sm mt-2">
            Allow the caregiver agent to book calendar events on your behalf
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
            Connection failed ({error}). Please try again.
          </div>
        )}

        {/* Connect card */}
        <div className="rounded-xl bg-white border border-emerald-200 p-6 shadow-sm space-y-4">
          <div className="space-y-2">
            {[
              "Book medical appointments on your behalf",
              "Create calendar events with your approval",
              "Never stores your raw Google credentials",
              "Revoke access at any time",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center flex-shrink-0">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                </div>
                <p className="text-sm text-gray-600">{item}</p>
              </div>
            ))}
          </div>

          <a
            href="/api/auth/connect"
            className="block rounded-xl bg-[#065f46] px-5 py-3 text-center text-white font-medium hover:bg-[#047857] transition-colors"
          >
            Connect Google Calendar
          </a>

          <a
            href="/dashboard"
            className="block text-center text-sm text-emerald-600 hover:text-emerald-800 transition-colors"
          >
            ← Back to dashboard
          </a>
        </div>

        {/* Security note */}
        <p className="text-center text-xs text-emerald-600">
          Powered by Auth0 Token Vault — your credentials are never exposed to the agent
        </p>
      </div>
    </main>
  );
}