import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth0.getSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f0fdf4] flex items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-8 text-center">

        {/* Logo / brand */}
        <div className="space-y-3">
          <div className="h-20 w-20 rounded-2xl bg-[#065f46] flex items-center justify-center text-4xl mx-auto">
            🤝
          </div>
          <h1 className="text-4xl font-bold text-emerald-900">
            Caregiver Agent
          </h1>
          <p className="text-emerald-700 text-lg">
            Secure AI delegation for families
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: "🔐", label: "Token Vault", sub: "No raw credentials" },
            { icon: "✅", label: "CIBA approvals", sub: "Human in the loop" },
            { icon: "🛡️", label: "FGA permissions", sub: "Least privilege" },
          ].map((f) => (
            <div key={f.label} className="rounded-xl bg-white border border-emerald-200 p-4 shadow-sm">
              <div className="text-2xl mb-2">{f.icon}</div>
              <p className="text-sm font-semibold text-emerald-900">{f.label}</p>
              <p className="text-xs text-emerald-600 mt-0.5">{f.sub}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <a
            href="/auth/login"
            className="block rounded-xl bg-[#065f46] px-6 py-4 text-white font-semibold text-lg hover:bg-[#047857] transition-colors"
          >
            Get started
          </a>
          <p className="text-xs text-emerald-600">
            Powered by Auth0 Token Vault, FGA, and CIBA
          </p>
        </div>

      </div>
    </main>
  );
}