"use client";

import { useEffect, useState } from "react";

type Approval = {
  id: string;
  action: string;
  description: string;
  amount?: number;
  requestedBy: string;
  createdAt: string;
  status: "pending" | "approved" | "denied";
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    denied: "bg-red-50 text-red-700 border-red-200",
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    approved: "Approved",
    denied: "Denied",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/approvals");
    const data = await res.json();
    setApprovals(data.approvals ?? []);
    setLoading(false);
  }

  async function decide(id: string, status: "approved" | "denied") {
    setLoadingId(id);
    await fetch(`/api/approvals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoadingId(null);
    await load();
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  const pending = approvals.filter((a) => a.status === "pending");
  const past = approvals.filter((a) => a.status !== "pending");

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Approvals</h1>
            <p className="text-sm text-gray-500 mt-1">
              High-stakes actions requiring explicit consent
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={load}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-white transition-colors"
            >
              Refresh
            </button>
            <a
              href="/dashboard"
              className="rounded-xl border px-4 py-2 text-sm hover:bg-white transition-colors"
            >
              ← Back
            </a>
          </div>
        </div>

        {/* Pending approvals */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
            Pending ({pending.length})
          </h2>

          {loading ? (
            <p className="text-center text-gray-400 py-8">Loading...</p>
          ) : pending.length === 0 ? (
            <div className="rounded-xl border bg-white p-6 text-center text-gray-400 text-sm">
              No pending approvals. Try paying a bill over $200.
            </div>
          ) : (
            pending.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border-2 border-yellow-200 bg-yellow-50 p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚠️</span>
                      <p className="font-semibold">{a.description}</p>
                      <StatusBadge status={a.status} />
                    </div>
                    {a.amount && (
                      <p className="text-sm font-medium text-gray-700">
                        Amount: ${a.amount}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Requested by {a.requestedBy} ·{" "}
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 bg-white rounded px-2 py-1 border border-yellow-200 inline-block">
                      This action exceeds the $200 threshold and requires your approval
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 min-w-fit">
                    <button
                      onClick={() => decide(a.id, "approved")}
                      disabled={loadingId === a.id}
                      className="rounded-lg bg-green-600 px-5 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      {loadingId === a.id ? "Processing..." : "Approve"}
                    </button>
                    <button
                      onClick={() => decide(a.id, "denied")}
                      disabled={loadingId === a.id}
                      className="rounded-lg bg-red-600 px-5 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Past approvals */}
        {past.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
              History ({past.length})
            </h2>
            {past.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{a.description}</p>
                      <StatusBadge status={a.status} />
                    </div>
                    {a.amount && (
                      <p className="text-xs text-gray-500">Amount: ${a.amount}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}