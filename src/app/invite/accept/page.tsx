"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type Invite = {
  id: string;
  caregiverEmail: string;
  permissions: string[];
  status: string;
};

const PERMISSION_LABELS: Record<string, string> = {
  pay_bills: "Pay bills (under $200)",
  book_appointments: "Book appointments",
  large_payments: "Large payments (requires your approval)",
  view_audit_log: "View audit log",
};

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [invite, setInvite] = useState<Invite | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "accepted" | "error" | "login">("loading");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/invites/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setInvite(d.invite);
        setStatus(d.invite?.status === "pending" ? "ready" : "error");
      });
  }, [id]);

  async function accept() {
    const res = await fetch(`/api/invites/${id}`, { method: "POST" });
    if (res.status === 401) {
      // Not logged in — redirect to login then come back
      window.location.href = `/auth/login?returnTo=/invite/accept?id=${id}`;
      return;
    }
    if (res.ok) setStatus("accepted");
    else setStatus("error");
  }

  if (status === "loading") return (
    <p className="text-emerald-600 text-center py-8">Loading invite...</p>
  );

  if (status === "accepted") return (
    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center space-y-3">
      <p className="text-4xl">✅</p>
      <p className="font-semibold text-emerald-900 text-lg">Invite accepted!</p>
      <p className="text-sm text-emerald-600">You now have caregiver access.</p>
      <a href="/dashboard" className="inline-block rounded-lg bg-[#065f46] px-5 py-2 text-sm text-white hover:bg-[#047857]">
        Go to dashboard
      </a>
    </div>
  );

  if (!invite || status === "error") return (
    <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center space-y-2">
      <p className="text-2xl">❌</p>
      <p className="text-red-700 font-medium">This invite is invalid or has already been used.</p>
    </div>
  );

  return (
    <div className="rounded-xl bg-white border border-emerald-200 p-6 shadow-sm space-y-4">
      <div className="space-y-1">
        <h2 className="font-semibold text-emerald-900 text-lg">You have been invited as a caregiver</h2>
        <p className="text-sm text-gray-500">For: {invite.caregiverEmail}</p>
      </div>
      <p className="text-sm text-gray-600">
        You will be able to perform the following actions on behalf of the care recipient:
      </p>
      <div className="space-y-2 rounded-lg bg-emerald-50 border border-emerald-100 p-3">
        {invite.permissions.map((p) => (
          <div key={p} className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center flex-shrink-0">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            </div>
            <p className="text-sm text-gray-700">{PERMISSION_LABELS[p] ?? p}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">
        You must be logged in to accept. You will be redirected to log in if needed.
      </p>
      <button
        onClick={accept}
        className="block w-full rounded-xl bg-[#065f46] px-5 py-3 text-center text-white font-medium hover:bg-[#047857] transition-colors"
      >
        Accept and become caregiver
      </button>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <main className="min-h-screen bg-[#f0fdf4] flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-2xl bg-[#065f46] p-6 text-center">
          <h1 className="text-2xl font-bold text-white">Caregiver Invitation</h1>
          <p className="text-emerald-300 text-sm mt-1">Review and accept your caregiver access</p>
        </div>
        <Suspense fallback={<p className="text-center text-emerald-600">Loading...</p>}>
          <AcceptInviteContent />
        </Suspense>
      </div>
    </main>
  );
}