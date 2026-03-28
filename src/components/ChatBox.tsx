"use client";
import { useCallback, useState } from "react";

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
  requiresApproval?: boolean;
  approvalId?: string;
  status?: string;
  message?: string;
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
    paidAt?: string;
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
  const [approvalLoading, setApprovalLoading] = useState(false);

  const pollApproval = useCallback((approvalId: string, intentArgs: Record<string, unknown>) => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/approvals/${approvalId}`);
        const data = await res.json();

        if (data.approval.status === "approved") {
          clearInterval(poll);
          const finalRes = await fetch("/api/tools/bills/pay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...intentArgs, approvalId }),
          });
          setToolResult(await finalRes.json());
        } else if (data.approval.status === "denied") {
          clearInterval(poll);
          setToolResult({ error: "Payment was denied by care recipient." });
        }
      } catch {
        clearInterval(poll);
      }
    }, 3000);

    setTimeout(() => clearInterval(poll), 120000);
    return poll;
  }, []);

  async function handleApprove(approvalId: string, intentArgs: Record<string, unknown>) {
    setApprovalLoading(true);
    await fetch(`/api/approvals/${approvalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    const finalRes = await fetch("/api/tools/bills/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...intentArgs, approvalId }),
    });
    setToolResult(await finalRes.json());
    setApprovalLoading(false);
  }

  async function handleDeny(approvalId: string) {
    setApprovalLoading(true);
    await fetch(`/api/approvals/${approvalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "denied" }),
    });
    setToolResult({ error: "Payment denied by care recipient." });
    setApprovalLoading(false);
  }

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
        const result = await payRes.json();

        if (result.requiresApproval) {
          setToolResult({
            requiresApproval: true,
            approvalId: result.approvalId,
            status: result.status,
            message: result.message,
            _intentArgs: data.intent.args,
          });
          pollApproval(result.approvalId, data.intent.args);
        } else {
          setToolResult(result);
        }
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
          placeholder="Try: Pay Alice's electric bill for $1000"
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

          {/* CIBA approval pending */}
          {toolResult.requiresApproval && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center text-white text-sm font-bold">
                  !
                </div>
                <p className="font-semibold text-yellow-800 text-sm">
                  Approval Required
                </p>
              </div>
              <p className="text-sm text-gray-700">{toolResult.message as string}</p>
              <p className="text-xs text-gray-500">
                This action exceeds the $200 threshold and requires explicit approval
                from the care recipient.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() =>
                    handleApprove(
                      toolResult.approvalId as string,
                      toolResult._intentArgs as Record<string, unknown>
                    )
                  }
                  disabled={approvalLoading}
                  className="rounded-lg bg-green-600 px-5 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {approvalLoading ? "Processing..." : "Approve"}
                </button>
                <button
                  onClick={() => handleDeny(toolResult.approvalId as string)}
                  disabled={approvalLoading}
                  className="rounded-lg bg-red-600 px-5 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                >
                  Deny
                </button>
              </div>
              {!approvalLoading && (
                <p className="text-xs text-yellow-600 animate-pulse">
                  Waiting for care recipient response...
                </p>
              )}
            </div>
          )}

          {/* Calendar success */}
          {toolResult.success && toolResult.calendarEvent && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 space-y-1">
              <p className="font-semibold text-green-700 text-sm">
                Appointment booked!
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
                Bill paid successfully!
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Amount:</span> ${toolResult.bill.amount}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Status:</span> {toolResult.bill.status}
              </p>
              {toolResult.bill.paidAt && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Paid at:</span>{" "}
                  {new Date(toolResult.bill.paidAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Google not connected */}
          {toolResult.connectUrl && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 space-y-2">
              <p className="text-yellow-800 font-medium text-sm">
                Google account not connected
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
          {toolResult.error && !toolResult.connectUrl && !toolResult.requiresApproval && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-red-700 text-sm">{toolResult.error}</p>
            </div>
          )}

          {/* Fallback raw JSON */}
          {!toolResult.success &&
            !toolResult.connectUrl &&
            !toolResult.error &&
            !toolResult.requiresApproval && (
              <pre className="overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-600 border">
                {JSON.stringify(toolResult, null, 2)}
              </pre>
            )}
        </div>
      )}
    </div>
  );
}