import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, ChatMessage, Lead } from "../lib/api";
import { renderMessageText, formatRelativeTime } from "../lib/format";

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
  const [fullPromptModal, setFullPromptModal] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [now, setNow] = useState(Date.now());

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    });
  }

  function downloadAsFile(text: string, filename: string) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function promptStats(text: string) {
    const lines = text.split("\n").length;
    const tokens = Math.round(text.length / 4);
    const sections = (text.match(/^\d+\./gm) || []).length;
    return { lines, tokens, sections };
  }

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

  // Auto-scroll to bottom on new messages (only if user is at the bottom)
  useEffect(() => {
    if (atBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, atBottom]);

  // Re-tick relative times every 30s
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Track scroll position to show/hide "jump to latest" pill
  function handleMessagesScroll() {
    const el = messagesScrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAtBottom(dist < 80);
  }

  function jumpToLatest() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setAtBottom(true);
  }

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
        reasoningContent: res.reasoningContent,
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

  const QUICK_REPLIES = [
    "hey, is the 1 bed still available?",
    "what's the pet policy?",
    "can i come see it this week?",
    "is parking included?",
  ];

  if (state === "loading") {
    return (
      <div className="container">
        <div className="card chat-card">
          <div className="chat-loading">
            <div className="chat-loading-dots">
              <span />
              <span />
              <span />
            </div>
            Spinning up a session
          </div>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="container">
        <div className="card chat-card" style={{ padding: "32px" }}>
          <div className="error">{error}</div>
          <button onClick={() => navigate("/")}>← Back to start</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card chat-card">
        <header className="chat-header">
          <div className="chat-header-row">
            <div className="chat-header-info">
              <h1 className="chat-title">
                Chatting as <span className="accent">{lead?.firstName} {lead?.lastName}</span>
              </h1>
              <div className="lead-meta">
                {teamName && <span>{teamName}</span>}
                {lead?.propertyName && (
                  <>
                    <span className="lead-meta-dot" />
                    <span>{lead.propertyName}</span>
                  </>
                )}
                {lead?.bedroomPreference && (
                  <>
                    <span className="lead-meta-dot" />
                    <span>{lead.bedroomPreference}</span>
                  </>
                )}
                {lead?.budget && (
                  <>
                    <span className="lead-meta-dot" />
                    <span>{lead.budget}</span>
                  </>
                )}
                {lead?.pets && (
                  <>
                    <span className="lead-meta-dot" />
                    <span>{lead.pets}</span>
                  </>
                )}
              </div>
              {hasToursAhead && <div className="next-tour">Next tour: {nextTour}</div>}
            </div>
            <div className="top-right">
              <span className="status-dot" />
              <span className="status-pill">Live</span>
            </div>
          </div>
        </header>

        <div className="toolbar">
          <label className={`toolbar-pill ${verbose ? "active" : ""}`}>
            <input
              type="checkbox"
              checked={verbose}
              onChange={(e) => setVerbose(e.target.checked)}
            />
            Verbose
          </label>
          <label className={`toolbar-pill ${sendAsHuman ? "active" : ""}`}>
            <input
              type="checkbox"
              checked={sendAsHuman}
              onChange={(e) => setSendAsHuman(e.target.checked)}
            />
            Send as Human
          </label>
          <span className="toolbar-spacer" />
          <button
            className="toolbar-btn danger"
            onClick={handleReset}
            disabled={resetting}
          >
            {resetting ? "Resetting…" : "Reset"}
          </button>
          <button className="toolbar-btn" onClick={handleQuit}>
            Quit
          </button>
        </div>

        <div className="messages" ref={messagesScrollRef} onScroll={handleMessagesScroll}>
          {messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-eyebrow">Empty room</div>
              <h2 className="empty-title">
                Say something <span className="accent">as the lead</span>.
              </h2>
              <p className="empty-subtitle">
                Type below, or tap a suggestion to get the conversation going.
              </p>
              <div className="empty-suggestions">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    className="empty-suggestion"
                    onClick={() => setInput(q)}
                    type="button"
                  >
                    <span className="empty-suggestion-arrow">→</span>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`message ${m.from}`}>
              <div className="message-avatar">
                {m.from === "you" && "Y"}
                {m.from === "ai" && "J"}
                {m.from === "human" && "T"}
              </div>
              <div className="message-body">
                <div className="message-header">
                  <span className="message-name">
                    {m.from === "you" && "You"}
                    {m.from === "ai" && "Jake"}
                    {m.from === "human" && "Team"}
                  </span>
                  <span className="message-time" title={new Date(m.timestamp).toLocaleString()}>
                    {formatRelativeTime(m.timestamp, now)}
                  </span>
                  {m.latencyMs !== undefined && (
                    <span className="latency">· {m.latencyMs}ms</span>
                  )}
                  {m.from !== "you" && (
                    <button
                      className="copy-btn"
                      onClick={() => copyToClipboard(m.text)}
                      title="Copy message"
                    >
                      Copy
                    </button>
                  )}
                </div>
                <div className="message-text">{renderMessageText(m.text)}</div>

                {verbose && m.reasoningContent && (
                  <details className="ai-thinking">
                    <summary>AI Thinking</summary>
                    <pre>{m.reasoningContent}</pre>
                  </details>
                )}
                {verbose && m.systemPrompt && (
                  <details className="system-prompt">
                    <summary>System Prompt</summary>
                    <div className="prompt-actions">
                      <button
                        className="prompt-action-btn"
                        onClick={() => copyToClipboard(m.systemPrompt!)}
                      >
                        Copy
                      </button>
                      <button
                        className="prompt-action-btn"
                        onClick={() => setFullPromptModal(m.systemPrompt!)}
                      >
                        View Full
                      </button>
                    </div>
                    <pre>{m.systemPrompt}</pre>
                  </details>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="message ai">
              <div className="message-avatar thinking">J</div>
              <div className="message-body">
                <div className="message-header">
                  <span className="message-name">Jake</span>
                  <span className="message-time thinking-label">
                    <span className="thinking-dot" />
                    thinking
                  </span>
                </div>
                <div className="message-text thinking-bubble">
                  <span className="typing-dots"><span /></span><span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />

          {!atBottom && messages.length > 0 && (
            <button className="jump-latest" onClick={jumpToLatest} type="button">
              <span className="jump-latest-dot" />
              Jump to latest
              <span className="jump-latest-arrow">↓</span>
            </button>
          )}
        </div>

        <form className="input-row" onSubmit={handleSend}>
          <div className="input-wrap-chat">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={sendAsHuman ? "Type a message as the team…" : "Type as the lead…"}
              disabled={sending}
              autoFocus
            />
            <span className="input-hint">⏎</span>
          </div>
          <button type="submit" disabled={sending || !input.trim()} className="send-btn">
            <span className="send-label">Send</span>
            <span className="send-arrow">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="13 6 19 12 13 18" />
              </svg>
            </span>
          </button>
        </form>
      </div>

      {fullPromptModal !== null && (
        <div className="modal-overlay" onClick={() => setFullPromptModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h2>System Prompt</h2>
                <span className="modal-stats">
                  {(() => {
                    const s = promptStats(fullPromptModal);
                    return `${s.sections} sections · ${s.lines.toLocaleString()} lines · ~${s.tokens.toLocaleString()} tokens`;
                  })()}
                </span>
              </div>
              <div className="modal-actions">
                <button
                  className="modal-btn"
                  onClick={() => copyToClipboard(fullPromptModal)}
                >
                  Copy
                </button>
                <button
                  className="modal-btn"
                  onClick={() =>
                    downloadAsFile(
                      fullPromptModal,
                      `system-prompt-${new Date().toISOString().slice(0, 10)}.txt`
                    )
                  }
                >
                  Download
                </button>
                <button
                  className="modal-close"
                  onClick={() => setFullPromptModal(null)}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <pre className="modal-pre">{fullPromptModal}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
