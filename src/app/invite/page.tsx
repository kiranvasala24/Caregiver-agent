"use client";

import type { Caregiver, Invite } from "@/lib/invites";
import { useEffect, useState } from "react";

const PERMISSION_LABELS: Record<string, string> = {
  pay_bills: "Pay bills (under $200)",
  book_appointments: "Book appointments",
  large_payments: "Large payments (CIBA required)",
  view_audit_log: "View audit log",
};

export default function InvitePage() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState<string[]>([
    "pay_bills",
    "book_appointments",
  ]);
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/invites");
    const data = await res.json();
    setCaregivers(data.caregivers ?? []);
    setInvites(data.invites ?? []);
  }

  async function sendInvite() {
    if (!email.trim() || permissions.length === 0) return;
    setLoading(true);
    setInviteUrl(null);
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caregiverEmail: email, permissions }),
    });
    const data = await res.json();
    setInviteUrl(data.inviteUrl);
    setEmail("");
    await load();
    setLoading(false);
  }

  async function revoke(caregiverUserId: string) {
    setRevoking(caregiverUserId);
    await fetch(`/api/invites/${encodeURIComponent(caregiverUserId)}`, {
      method: "DELETE",
    });
    await load();
    setRevoking(null);
  }

  useEffect(() => {
    load();
  }, []);

  const pendingInvites = invites.filter((i) => i.status === "pending");

  return (
    <main className="min-h-screen bg-[#f0fdf4] p-8">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header */}
        <div className="rounded-2xl bg-[#065f46] p-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Manage Caregivers</h1>
            <p className="text-emerald-300 text-sm mt-1">
              Invite and manage who can act on your behalf
            </p>
          </div>
          <a
            href="/dashboard"
            className="rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/20 transition-colors"
          >
            ← Back
          </a>
        </div>

        {/* Invite form */}
        <div className="rounded-xl bg-white border border-emerald-200 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="font-semibold text-emerald-900">Invite a caregiver</h2>
            <p className="text-xs text-emerald-600 mt-0.5">
              They will receive a link to accept and gain access
            </p>
          </div>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendInvite()}
            placeholder="caregiver@email.com"
            className="w-full rounded-lg border border-emerald-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <div className="space-y-2">
            <p className="text-xs font-medium text-emerald-700">Permissions to grant:</p>
            {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={permissions.includes(key)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPermissions([...permissions, key]);
                    } else {
                      setPermissions(permissions.filter((p) => p !== key));
                    }
                  }}
                  className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-emerald-800 transition-colors">
                  {label}
                </span>
              </label>
            ))}
          </div>

          <button
            onClick={sendInvite}
            disabled={loading || !email.trim() || permissions.length === 0}
            className="rounded-lg bg-[#065f46] px-5 py-2.5 text-sm text-white hover:bg-[#047857] disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? "Sending..." : "Send invite"}
          </button>

          {/* Invite URL display */}
          {inviteUrl && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 space-y-2">
              <p className="text-xs font-medium text-emerald-700">
                Share this invite link with your caregiver:
              </p>
              <code className="block text-xs text-emerald-900 break-all bg-white rounded p-2 border border-emerald-100">
                {inviteUrl}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(inviteUrl)}
                className="rounded-lg border border-emerald-300 bg-white px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                Copy link
              </button>
            </div>
          )}
        </div>

        {/* Active caregivers */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-emerald-700 uppercase tracking-wide">
            Active caregivers ({caregivers.length})
          </h2>

          {caregivers.length === 0 ? (
            <div className="rounded-xl bg-white border border-emerald-200 p-6 text-center text-emerald-600 text-sm">
              No caregivers yet. Send an invite above.
            </div>
          ) : (
            caregivers.map((cg) => (
              <div
                key={cg.id}
                className="rounded-xl bg-white border border-emerald-200 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div>
                      <p className="font-medium text-emerald-900">
                        {cg.caregiverName ?? cg.caregiverEmail}
                      </p>
                      {cg.caregiverName && (
                        <p className="text-xs text-gray-400">{cg.caregiverEmail}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cg.permissions.map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs text-emerald-700"
                        >
                          {PERMISSION_LABELS[p] ?? p}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">
                      Added {new Date(cg.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => revoke(cg.caregiverUserId)}
                    disabled={revoking === cg.caregiverUserId}
                    className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors flex-shrink-0"
                  >
                    {revoking === cg.caregiverUserId ? "Revoking..." : "Revoke"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pending invites */}
        {pendingInvites.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-emerald-700 uppercase tracking-wide">
              Pending invites ({pendingInvites.length})
            </h2>
            {pendingInvites.map((inv) => (
              <div
                key={inv.id}
                className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    {inv.caregiverEmail}
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Sent {new Date(inv.createdAt).toLocaleString()}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {inv.permissions.map((p) => (
                      <span
                        key={p}
                        className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs text-amber-700"
                      >
                        {PERMISSION_LABELS[p] ?? p}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs text-amber-700 flex-shrink-0">
                  Pending
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Past invites */}
        {invites.filter((i) => i.status === "accepted").length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-emerald-700 uppercase tracking-wide">
              Accepted invites
            </h2>
            {invites
              .filter((i) => i.status === "accepted")
              .map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-xl bg-white border border-emerald-100 p-3 flex items-center justify-between opacity-70"
                >
                  <p className="text-xs text-gray-500">{inv.caregiverEmail}</p>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs text-emerald-600">
                    Accepted
                  </span>
                </div>
              ))}
          </div>
        )}

      </div>
    </main>
  );
}