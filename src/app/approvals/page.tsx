"use client";

import { useEffect, useState } from "react";

type Approval = {
  id: string;
  type: string;
  status: string;
  amount?: number;
  reason: string;
  resourceId: string;
  createdAt: string;
};

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/approvals");
    const data = await res.json();
    setApprovals(data.approvals ?? []);
  }

  async function decide(id: string, decision: "approved" | "rejected") {
    setLoadingId(id);

    const res = await fetch(`/api/approvals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });

    const data = await res.json();

    if (decision === "approved") {
      alert("✅ Action approved and executed successfully!");
    } else {
      alert("❌ Action rejected.");
    }

    setLoadingId(null);
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  function getStatusUI(status: string) {
    if (status === "approved") {
      return (
        <span className="text-green-600 font-semibold">
          Approved ✅ (Executed)
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className="text-red-600 font-semibold">
          Rejected ❌
        </span>
      );
    }
    return (
      <span className="text-yellow-600 font-semibold">
        Pending ⏳
      </span>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Pending approvals</h1>
          <a href="/dashboard" className="rounded-xl border px-4 py-2">
            Back
          </a>
        </div>

        {approvals.length === 0 ? (
          <p>No approvals yet.</p>
        ) : (
          approvals.map((a) => (
            <div key={a.id} className="rounded-2xl border p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-lg">{a.type}</p>

                  <p className="text-sm text-gray-600">
                    📄 Resource: {a.resourceId}
                  </p>

                  <p className="text-sm text-gray-600">
                    💰 Amount: {a.amount ?? "-"}
                  </p>

                  <p className="text-sm text-gray-600">
                    ⚠️ Reason: {a.reason}
                  </p>

                  <p className="text-sm">
                    Status: {getStatusUI(a.status)}
                  </p>
                </div>

                {a.status === "pending" && (
                  <div className="space-x-2">
                    <button
                      onClick={() => decide(a.id, "approved")}
                      disabled={loadingId === a.id}
                      className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
                    >
                      {loadingId === a.id ? "Processing..." : "Approve"}
                    </button>

                    <button
                      onClick={() => decide(a.id, "rejected")}
                      disabled={loadingId === a.id}
                      className="rounded-xl border px-4 py-2 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}