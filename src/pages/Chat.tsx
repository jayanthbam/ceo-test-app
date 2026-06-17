import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, ChatMessage, Lead } from "../lib/api";

type ChatState = "loading" | "ready" | "error";

export default function Chat() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const teamId = params.get("teamId") || "";
  const leadId = params.get("leadId") || "";
  const phone = params.get("phone") || "";

  const [state, setState] = useState<ChatState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [teamName, setTeamName] = useState("");
  const [nextTour, setNextTour] = useState("");
  const [hasToursAhead, setHasToursAhead] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [verbose, setVerbose] = useState(false);
  const [sendAsHuman, setSendAsHuman] = useState(false);
  const [resetting, setResetting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    if (!teamId || !phone) {
      setError("Missing teamId or phone. Go back to the input form.");
      setState("error");
      return;
    }
    api
      .startChat({ teamId, leadId, phone })
      .then((res) => {
        setLead(res.lead);
        setTeamName(res.teamName);
        setNextTour(res.nextTour);
        setHasToursAhead(res.hasToursAhead);
        setState("ready");
      })
      .catch((err) => {
        setError(err.message || "Failed to load lead");
        setState("error");
      });
  }, [teamId, leadId, phone]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userText = input.trim();
    setInput("");
    setSending(true);

    // Optimistic add
    const userMsg: ChatMessage = {
      id: `m-${Date.now()}-u`,
      from: "you",
      text: userText,
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);

    try {
      const res = await api.sendMessage({
        teamId,
        leadId,
        phone,
        message: userText,
        sendAsHuman,
      });
      const aiMsg: ChatMessage = {
        id: `m-${Date.now()}-a`,
        from: sendAsHuman ? "human" : "ai",
        text: res.reply,
        timestamp: Date.now(),
        systemPrompt: res.systemPrompt,
        latencyMs: res.latencyMs,
      };
      setMessages((m) => [...m, aiMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `m-${Date.now()}-e`,
        from: "ai",
        text: `[Error: ${err.message || "Failed to send"}]`,
        timestamp: Date.now(),
      };
      setMessages((m) => [...m, errMsg]);
    } finally {
      setSending(false);
    }
  }

  async function handleReset() {
    if (!confirm("Delete all chat history for this lead?")) return;
    setResetting(true);
    try {
      await api.resetHistory({ teamId, leadId, phone });
      setMessages([]);
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  }

  function handleQuit() {
    if (confirm("Quit? (chat history is saved)")) {
      navigate("/");
    }
  }

  if (state === "loading") {
    return (
      <div className="container">
        <div className="card">Loading…</div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="container">
        <div className="card">
          <div className="error">⚠️ {error}</div>
          <button onClick={() => navigate("/")}>← Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card chat-card">
        <header className="chat-header">
          <div>
            <h1>📱 Chatting as: {lead?.firstName} {lead?.lastName}</h1>
            <div className="lead-meta">
              {teamName && <span>🏢 {teamName}</span>}
              {lead?.propertyName && <span> · 🏠 {lead.propertyName}</span>}
              {lead?.pets && <span> · 🐾 {lead.pets}</span>}
              {lead?.bedroomPreference && <span> · 🛏️ {lead.bedroomPreference}</span>}
              {lead?.budget && <span> · 💰 {lead.budget}</span>}
            </div>
            {hasToursAhead && <div className="next-tour">📅 Next tour: {nextTour}</div>}
          </div>
        </header>

        <div className="toolbar">
          <label>
            <input
              type="checkbox"
              checked={verbose}
              onChange={(e) => setVerbose(e.target.checked)}
            />
            Verbose
          </label>
          <button onClick={handleReset} disabled={resetting}>
            {resetting ? "Resetting…" : "Reset History"}
          </button>
          <label>
            <input
              type="checkbox"
              checked={sendAsHuman}
              onChange={(e) => setSendAsHuman(e.target.checked)}
            />
            Send as Human
          </label>
          <button onClick={handleQuit}>Quit</button>
        </div>

        <div className="messages">
          {messages.length === 0 && (
            <div className="empty">
              <em>No messages yet. Type something to start the conversation.</em>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`message ${m.from}`}>
              <div className="message-header">
                {m.from === "you" && "You"}
                {m.from === "ai" && "🤖 Jake"}
                {m.from === "human" && "👤 Team"}
                {m.latencyMs !== undefined && (
                  <span className="latency"> · {m.latencyMs}ms</span>
                )}
              </div>
              <div className="message-text">{m.text}</div>
              {verbose && m.systemPrompt && (
                <details className="system-prompt">
                  <summary>System prompt</summary>
                  <pre>{m.systemPrompt}</pre>
                </details>
              )}
            </div>
          ))}
          {sending && (
            <div className="message ai">
              <div className="message-header">🤖 Jake</div>
              <div className="message-text"><em>typing…</em></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="input-row" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={sendAsHuman ? "Type a message as the team…" : "Type as the lead…"}
            disabled={sending}
            autoFocus
          />
          <button type="submit" disabled={sending || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
