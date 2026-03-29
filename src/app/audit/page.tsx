"use client";

import { useEffect, useState } from "react";

type AuditLog = {
  id: string;
  timestamp: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  result: string;
  metadata?: Record<string, unknown>;
};

function ResultBadge({ result }: { result: string }) {
  const styles: Record<string, string> = {
    executed: "bg-green-50 text-green-700 border-green-200",
    allowed: "bg-green-50 text-green-700 border-green-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    denied: "bg-red-50 text-red-700 border-red-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    pending_approval: "bg-yellow-50 text-yellow-700 border-yellow-200",
  };
  const style = styles[result] ?? "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${style}`}>
      {result.replace(/_/g, " ")}
    </span>
  );
}

function ActionIcon({ action }: { action: string }) {
  if (action.includes("bill") || action.includes("pay")) return <>💳</>;
  if (action.includes("appointment") || action.includes("book")) return <>📅</>;
  if (action.includes("approval")) return <>✅</>;
  return <>🔧</>;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/audit");
    const data = await res.json();
    setLogs(data.logs ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Audit Log</h1>
            <p className="text-sm text-gray-500 mt-1">
              Immutable record of all agent actions
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Total actions",
              value: logs.length,
              color: "text-gray-900",
            },
            {
              label: "Executed",
              value: logs.filter((l) =>
                ["executed", "allowed", "approved"].includes(l.result)
              ).length,
              color: "text-green-600",
            },
            {
              label: "Denied",
              value: logs.filter((l) =>
                ["denied", "rejected"].includes(l.result)
              ).length,
              color: "text-red-600",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border bg-white p-4 shadow-sm text-center"
            >
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Log entries */}
        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading...</p>
        ) : logs.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-gray-400">
            No activity yet. Try paying a bill or booking an appointment.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">
                      <ActionIcon action={log.action} />
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">
                          {log.action.replace(/_/g, " ")}
                        </p>
                        <ResultBadge result={log.result} />
                      </div>
                      <p className="text-xs text-gray-500">
                        {log.resourceType} · {log.resourceId}
                      </p>
                      <p className="text-xs text-gray-400">
                        Actor: {log.actorUserId}
                      </p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <p className="text-xs text-gray-400">
                          {JSON.stringify(log.metadata)}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}