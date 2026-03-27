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

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  async function load() {
    const res = await fetch("/api/audit");
    const data = await res.json();
    setLogs(data.logs ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Audit Log</h1>
          <a href="/dashboard" className="rounded-xl border px-4 py-2">
            Back
          </a>
        </div>

        {logs.length === 0 ? (
          <p>No activity yet.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="rounded-xl border p-4">
              <p className="font-semibold">{log.action}</p>

              <p className="text-sm text-gray-600">
                👤 User: {log.actorUserId}
              </p>

              <p className="text-sm text-gray-600">
                📄 Resource: {log.resourceType} ({log.resourceId})
              </p>

              <p className="text-sm text-gray-600">
                📅 {new Date(log.timestamp).toLocaleString()}
              </p>

              <p className="text-sm">
                Result:{" "}
                <span
                  className={
                    log.result === "executed"
                      ? "text-green-600"
                      : log.result === "denied"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }
                >
                  {log.result}
                </span>
              </p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}