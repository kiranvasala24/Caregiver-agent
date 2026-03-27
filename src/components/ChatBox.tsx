"use client";
import { useState } from "react";

type AgentResponse = {
  reply: string;
  intent?: {
    tool: string;
    args: Record<string, unknown>;
  };
};

type ToolResult = {
  success?: boolean;
  error?: string;
  connectUrl?: string;
  calendarEvent?: {
    id: string;
    link: string;
    title: string;
    start: string;
  };
  bill?: {
    id: string;
    amount: number;
    status: string;
  };
  [key: string]: unknown;
};

const DEMO_PROMPTS = [
  "Pay Alice's electric bill",
  "Pay Alice's electric bill for $1000",
  "Book Alice's appointment",
];

export default function ChatBox() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [toolResult, setToolResult] = useState<ToolResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSend(overrideMessage?: string) {
    const msg = overrideMessage ?? message;
    if (!msg.trim()) return;

    setLoading(true);
    setToolResult(null);
    setResponse(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
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

      if (data.intent?.tool === "book_appointment") {
        const bookRes = await fetch("/api/tools/calendar/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data.intent.args,
            recipientId: "alice",
            title: "Doctor Appointment",
          }),
        });
        setToolResult(await bookRes.json());
      }
    } catch {
      setResponse({ reply: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Input area */}
      <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
        <textarea
          className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Try: Book Alice's appointment"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading}
          className="rounded-lg bg-black px-5 py-2 text-sm text-white disabled:opacity-50 hover:bg-gray-800 transition-colors"
        >
          {loading ? "Running..." : "Run agent"}
        </button>
      </div>

      {/* Demo prompts */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          Suggested demo prompts
        </p>
        <div className="flex flex-wrap gap-2">
          {DEMO_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => {
                setMessage(prompt);
                handleSend(prompt);
              }}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Agent response */}
      {response && (
        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
            <h3 className="font-semibold text-sm">Agent</h3>
          </div>
          <p className="text-sm text-gray-700">{response.reply}</p>
          {response.intent && (
            <pre className="overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-600 border">
              {JSON.stringify(response.intent, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Tool result */}
      {toolResult && (
        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-2">
          <h3 className="font-semibold text-sm text-gray-700">Tool Result</h3>

          {/* Calendar success */}
          {toolResult.success && toolResult.calendarEvent && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 space-y-1">
              <p className="font-semibold text-green-700 text-sm">
                ✅ Appointment booked!
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Title:</span>{" "}
                {toolResult.calendarEvent.title}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Time:</span>{" "}
                {new Date(toolResult.calendarEvent.start).toLocaleString()}
              </p>
              <a
                href={toolResult.calendarEvent.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline text-sm"
              >
                View in Google Calendar →
              </a>
            </div>
          )}

          {/* Bill pay success */}
          {toolResult.success && toolResult.bill && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 space-y-1">
              <p className="font-semibold text-green-700 text-sm">
                ✅ Bill paid!
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Amount:</span> $
                {toolResult.bill.amount}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Status:</span>{" "}
                {toolResult.bill.status}
              </p>
            </div>
          )}

          {/* Google not connected */}
          {toolResult.connectUrl && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 space-y-2">
              <p className="text-yellow-800 font-medium text-sm">
                ⚠️ Google account not connected
              </p>
              <p className="text-xs text-gray-600">
                Connect your Google account to allow the agent to book calendar
                events.
              </p>
              <a
                href="/connect"
                className="inline-block rounded-lg bg-black px-4 py-2 text-xs text-white hover:bg-gray-800"
              >
                Connect Google Calendar →
              </a>
            </div>
          )}

          {/* Generic error */}
          {toolResult.error && !toolResult.connectUrl && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-red-700 text-sm">❌ {toolResult.error}</p>
            </div>
          )}

          {/* Fallback raw JSON (for denied/unexpected results) */}
          {!toolResult.success && !toolResult.connectUrl && !toolResult.error && (
            <pre className="overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-600 border">
              {JSON.stringify(toolResult, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}