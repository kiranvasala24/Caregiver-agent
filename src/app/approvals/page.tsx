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

  async function load() {
    const res = await fetch("/api/approvals");
    const data = await res.json();
    setApprovals(data.approvals ?? []);
  }

  async function decide(id: string, decision: "approved" | "rejected") {
    await fetch(`/api/approvals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    await load();
  }

  useEffect(() => {
    load();
  }, []);

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
            <div key={a.id} className="rounded-2xl border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{a.type}</p>
                  <p className="text-sm text-gray-600">
                    Resource: {a.resourceId}
                  </p>
                  <p className="text-sm text-gray-600">
                    Amount: {a.amount ?? "-"}
                  </p>
                  <p className="text-sm text-gray-600">Reason: {a.reason}</p>
                  <p className="text-sm text-gray-600">Status: {a.status}</p>
                </div>
                {a.status === "pending" && (
                  <div className="space-x-2">
                    <button
                      onClick={() => decide(a.id, "approved")}
                      className="rounded-xl bg-black px-4 py-2 text-white"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decide(a.id, "rejected")}
                      className="rounded-xl border px-4 py-2"
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