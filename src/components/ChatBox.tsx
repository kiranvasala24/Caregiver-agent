"use client";

import { useState } from "react";

type AgentResponse = {
  reply: string;
  intent?: {
    tool: string;
    args: Record<string, unknown>;
  };
};

export default function ChatBox() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [toolResult, setToolResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    setToolResult(null);

    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = (await res.json()) as AgentResponse;
    setResponse(data);

    if (data.intent?.tool === "pay_bill") {
      const payRes = await fetch("/api/tools/bills/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.intent.args),
      });

      setToolResult(await payRes.json());
    }

    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <textarea
        className="w-full rounded-xl border p-3"
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Try: Pay Alice’s electric bill for $1000"
      />
      <button
        onClick={handleSend}
        disabled={loading}
        className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Running..." : "Run agent"}
      </button>

      {response && (
        <div className="rounded-xl border p-4">
          <h3 className="font-semibold">Agent</h3>
          <p>{response.reply}</p>
          <pre className="mt-3 overflow-auto rounded bg-gray-50 p-3 text-sm">
            {JSON.stringify(response.intent, null, 2)}
          </pre>
        </div>
      )}

  {toolResult && (
    <div className="rounded-xl border p-4">
      <h3 className="font-semibold">Tool result</h3>
      <pre className="overflow-auto rounded bg-gray-50 p-3 text-sm">
        {JSON.stringify(toolResult, null, 2)}
      </pre>
    </div>
  )}
    </div>
  );
}

  