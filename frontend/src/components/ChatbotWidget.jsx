import { useState, useRef, useEffect } from "react";
import { streamPost } from "../services/api.js";
import { MessageCircle, X, Send } from "lucide-react";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "model", content: "Hi! I can help with anything about using Learnmade AI — enrolling, certificates, how features work. Ask away." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    setMessages((m) => [...m, { role: "model", content: "" }]);

    try {
      let acc = "";
      await streamPost("/ai/chatbot", { message: text }, (chunk) => {
        acc += chunk;
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "model", content: acc };
          return copy;
        });
      });
    } catch (err) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "model", content: "I couldn't connect just now — please try again." };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="w-80 h-96 mb-3 bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Help Assistant</span>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700">
              <X size={15} />
            </button>
          </div>
          <div ref={logRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`text-[13px] leading-relaxed ${m.role === "user" ? "text-slate-800" : "bg-indigo-50 rounded-lg px-2.5 py-2 text-slate-700"}`}>
                <span className={`block text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${m.role === "user" ? "text-slate-400" : "text-indigo-600"}`}>
                  {m.role === "user" ? "You" : "Assistant"}
                </span>
                {m.content || "…"}
              </div>
            ))}
          </div>
          <div className="flex gap-2 p-3 border-t border-slate-200">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask a question…"
              className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={send} className="bg-indigo-600 text-white rounded-lg w-9 flex items-center justify-center hover:bg-indigo-700 transition shrink-0">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-12 h-12 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center hover:bg-indigo-700 transition"
        aria-label="Open help assistant"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </div>
  );
}