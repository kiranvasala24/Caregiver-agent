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
  { label: "Pay electric bill", prompt: "Pay Alice's electric bill", icon: "💳" },
  { label: "Pay $1000 bill", prompt: "Pay Alice's electric bill for $1000", icon: "🔐" },
  { label: "Book appointment", prompt: "Book Alice's appointment", icon: "📅" },
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
        if (result.requiresApproval && result.approvalId) {
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

      {/* Quick action prompts */}
      <div className="grid grid-cols-3 gap-2">
        {DEMO_PROMPTS.map(({ label, prompt, icon }) => (
          <button
            key={prompt}
            onClick={() => { setMessage(prompt); handleSend(prompt); }}
            disabled={loading}
            className="flex flex-col items-start gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-left hover:bg-emerald-100 hover:border-emerald-400 transition-all disabled:opacity-50 group"
          >
            <span className="text-xl">{icon}</span>
            <span className="text-xs font-semibold text-emerald-800">{label}</span>
            <span className="text-xs text-emerald-600 leading-tight">{prompt}</span>
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="relative">
        <textarea
          className="w-full rounded-xl border-2 border-emerald-200 bg-white p-4 pr-28 text-sm text-gray-900 placeholder-emerald-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none transition-all"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask the agent to pay a bill, book an appointment..."
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !message.trim()}
          className="absolute bottom-3 right-3 rounded-lg bg-[#065f46] px-4 py-2 text-xs font-semibold text-white hover:bg-[#047857] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Running
            </span>
          ) : "Send ↵"}
        </button>
      </div>

      {/* Agent response */}
      {response && (
        <div className="rounded-xl border-2 border-emerald-100 bg-white overflow-hidden">
          <div className="flex items-center gap-3 bg-emerald-50 border-b border-emerald-100 px-4 py-3">
            <div className="h-8 w-8 rounded-full bg-[#065f46] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              AI
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-900">Caregiver Agent</p>
              <p className="text-xs text-emerald-600">Powered by Auth0 Token Vault + FGA</p>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-sm text-gray-800 leading-relaxed">{response.reply}</p>
            {response.intent && (
              <details className="group">
                <summary className="cursor-pointer text-xs text-emerald-600 hover:text-emerald-800 font-medium list-none flex items-center gap-1">
                  <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                  View tool call
                </summary>
                <pre className="mt-2 overflow-auto rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                  {JSON.stringify(response.intent, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}

      {/* Tool result */}
      {toolResult && (
        <div className="space-y-2">

          {/* CIBA approval pending */}
          {toolResult.requiresApproval && (
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 overflow-hidden">
              <div className="bg-amber-100 border-b border-amber-200 px-4 py-3 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">!</div>
                <div>
                  <p className="text-sm font-bold text-amber-900">Approval Required</p>
                  <p className="text-xs text-amber-700">High-stakes action detected — CIBA step-up needed</p>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm text-amber-900 font-medium">{toolResult.message as string}</p>
                <div className="rounded-lg bg-white border border-amber-200 p-3">
                  <p className="text-xs text-amber-800">
                    This payment exceeds the <span className="font-bold">$200 approval threshold</span>.
                    Under Auth0 FGA policy, the care recipient must explicitly approve this action before it executes.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(
                      toolResult.approvalId as string,
                      toolResult._intentArgs as Record<string, unknown>
                    )}
                    disabled={approvalLoading}
                    className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                  >
                    {approvalLoading ? "Processing..." : "✓ Approve Payment"}
                  </button>
                  <button
                    onClick={() => handleDeny(toolResult.approvalId as string)}
                    disabled={approvalLoading}
                    className="flex-1 rounded-xl bg-white border-2 border-red-300 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    ✕ Deny
                  </button>
                </div>
                {!approvalLoading && (
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-xs text-amber-700">Waiting for care recipient response...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Calendar success */}
          {toolResult.success && toolResult.calendarEvent && (
            <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 overflow-hidden">
              <div className="bg-emerald-600 px-4 py-3 flex items-center gap-2">
                <span className="text-white text-lg">📅</span>
                <p className="font-bold text-white text-sm">Appointment booked via Token Vault</p>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b border-emerald-100">
                  <span className="text-xs font-medium text-emerald-700">Title</span>
                  <span className="text-xs font-bold text-emerald-900">{toolResult.calendarEvent.title}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-emerald-100">
                  <span className="text-xs font-medium text-emerald-700">Time</span>
                  <span className="text-xs font-bold text-emerald-900">{new Date(toolResult.calendarEvent.start).toLocaleString()}</span>
                </div>
                <a
                  href={toolResult.calendarEvent.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                >
                  View in Google Calendar →
                </a>
              </div>
            </div>
          )}

          {/* Bill pay success */}
          {toolResult.success && toolResult.bill && (
            <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 overflow-hidden">
              <div className="bg-emerald-600 px-4 py-3 flex items-center gap-2">
                <span className="text-white text-lg">💳</span>
                <p className="font-bold text-white text-sm">Payment executed successfully</p>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center py-1.5 border-b border-emerald-100">
                  <span className="text-xs font-medium text-emerald-700">Amount</span>
                  <span className="text-sm font-bold text-emerald-900">${toolResult.bill.amount}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-emerald-100">
                  <span className="text-xs font-medium text-emerald-700">Status</span>
                  <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-xs font-bold text-emerald-800">{toolResult.bill.status}</span>
                </div>
                {toolResult.bill.paidAt && (
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-xs font-medium text-emerald-700">Paid at</span>
                    <span className="text-xs text-emerald-900">{new Date(toolResult.bill.paidAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Google not connected */}
          {toolResult.connectUrl && (
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-900">Google Calendar not connected</p>
              <a href="/connect" className="inline-flex items-center gap-2 rounded-lg bg-[#065f46] px-4 py-2 text-xs font-bold text-white hover:bg-[#047857]">
                Connect Google Calendar →
              </a>
            </div>
          )}

          {/* Generic error */}
          {toolResult.error && !toolResult.connectUrl && !toolResult.requiresApproval && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-500 text-sm">✕</span>
                <p className="text-sm font-semibold text-red-800">Action failed</p>
              </div>
              <p className="text-xs text-red-700">{toolResult.error}</p>
            </div>
          )}

          {/* Fallback */}
          {!toolResult.success && !toolResult.connectUrl && !toolResult.error && !toolResult.requiresApproval && (
            <pre className="overflow-auto rounded-xl bg-emerald-50 border-2 border-emerald-200 p-4 text-xs text-emerald-800">
              {JSON.stringify(toolResult, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}