"use client";
import { useState } from "react";
import { Bot, Send, X, MessageSquareText } from "lucide-react";

export function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{role: "user" | "ai", text: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!query.trim()) return;
    const userMessage = query;
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setQuery("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/v1/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMessage })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.answer || "No response." }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "ai", text: "Error connecting to AI Copilot. Ensure Ollama is running." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-[#2563EB] p-4 text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600"
      >
        <MessageSquareText size={24} />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[500px] w-96 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0A0E14]/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-2 text-white">
              <Bot size={20} className="text-[#2563EB]" />
              <span className="font-bold">ROVIK AI Copilot</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-xs text-muted mt-10">
                Ask me about SLA breaches, historical delays, or routing optimization.
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  msg.role === "user" 
                    ? "bg-[#2563EB] text-white" 
                    : "bg-white/10 text-white border border-white/5"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl bg-white/10 px-4 py-2 text-sm text-white border border-white/5 animate-pulse">
                  Analyzing operational memory...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 bg-white/5 p-3 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask ROVIK..."
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-[#2563EB] focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={loading || !query.trim()}
              className="rounded-xl bg-[#2563EB] px-4 py-2 text-white transition hover:bg-blue-600 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
