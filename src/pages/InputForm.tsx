import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const DEFAULT_TEAM_ID = "5c79b633-d439-4962-a291-fde3273ff605";
const DEFAULT_PHONE = "+12102743516";

function useLocalClock() {
  const [time, setTime] = useState(() => formatNow());
  useEffect(() => {
    const tick = setInterval(() => setTime(formatNow()), 30_000);
    return () => clearInterval(tick);
  }, []);
  return time;
}

function formatNow() {
  const d = new Date();
  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

// ─── Inline SVG icons (crisp at any size, single-color) ───
const TeamIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
    <path d="M3 21V8a2 2 0 0 1 2-2h4l2-2h2l2 2h4a2 2 0 0 1 2 2v13" />
    <path d="M3 21h18" />
    <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.86 19.86 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// ─── RentBamboo monogram (custom SVG — gradient + glow) ───
const LogoMark = () => (
  <svg viewBox="0 0 40 40" width="32" height="32" aria-hidden="true">
    <defs>
      <linearGradient id="rbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5d491" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="28" height="28" rx="9" fill="url(#rbGrad)" />
    <path
      d="M14 13.5c0-0.8 0.7-1.5 1.5-1.5h9c0.8 0 1.5 0.7 1.5 1.5v13c0 0.8-0.7 1.5-1.5 1.5h-9c-0.8 0-1.5-0.7-1.5-1.5V13.5z"
      fill="#0a0a0a"
      fillOpacity="0.35"
    />
    <path
      d="M16 17h8M16 20.5h8M16 24h5"
      stroke="#0a0a0a"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// ─── Inline chat-preview mockup ───
const ChatPreview = () => (
  <div className="chat-preview">
    <div className="chat-preview-header">
      <div className="chat-preview-dot" />
      <span className="chat-preview-label">From a real session</span>
      <span className="chat-preview-meta">2:14 PM</span>
    </div>
    <div className="chat-preview-body">
      <div className="chat-bubble you">
        <div className="chat-bubble-dot">Y</div>
        <div className="chat-bubble-text">hey, is the 1 bed still available?</div>
      </div>
      <div className="chat-bubble ai">
        <div className="chat-bubble-dot ai">J</div>
        <div className="chat-bubble-text">
          yes! we've got a 1-bed at $897/mo, pet-friendly. want to come see it? we've got tours
          <span className="typing-dots"><span>.</span><span>.</span><span>.</span></span>
        </div>
      </div>
    </div>
  </div>
);

export default function InputForm() {
  const navigate = useNavigate();
  const clock = useLocalClock();
  const [teamId, setTeamId] = useState(DEFAULT_TEAM_ID);
  const [leadId, setLeadId] = useState("");
  const [phone, setPhone] = useState(DEFAULT_PHONE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.startChat({ teamId, leadId, phone });
      const params = new URLSearchParams({
        teamId,
        leadId: res.lead.id,
        phone,
      });
      navigate(`/chat?${params.toString()}`);
    } catch (err: any) {
      setError(err.message || "Failed to start chat");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        {/* ── Top bar: wordmark + status pill ── */}
        <div className="card-top">
          <div className="logo-mark">
            <LogoMark />
            <span className="name">RentBamboo</span>
          </div>
          <div className="top-right">
            <span className="status-dot" />
            <span className="status-text">
              <span className="status-pill">Staging</span>
              <span className="status-sep" />
              <span className="status-time">{clock}</span>
            </span>
          </div>
        </div>

        {/* ── 2-col body: left = hero + preview + stats, right = form ── */}
        <div className="card-body">
          <div className="card-side">
            <h1>
              Talk to your <span className="accent">AI</span>
              <br />
              before your <span className="accent">tenants do.</span>
            </h1>

            <p className="subtitle">
              Test the leasing agent you'll be shipping to real renters.
              Same prompt, same history, same speed.
            </p>

            <div className="side-eyebrow">What you'll see</div>
            <ChatPreview />

            <div className="side-trust">
              <div className="trust-item">
                <div className="trust-value">100%</div>
                <div className="trust-label">same prompt as production</div>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <div className="trust-value">&lt;2s</div>
                <div className="trust-label">response time</div>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <div className="trust-value">∞</div>
                <div className="trust-label">replays</div>
              </div>
            </div>
          </div>

          <div className="card-form">
            <div className="form-eyebrow">Start a session</div>
            <form onSubmit={handleStart}>
              <div className="form-row">
                <label>
                  <span className="input-icon-inline"><TeamIcon /></span>
                  <span>Team</span>
                </label>
                <div className="input-wrap compact">
                  <input
                    type="text"
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    placeholder="5c79b633-..."
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <label>
                  <span className="input-icon-inline"><UserIcon /></span>
                  <span>Lead <span className="hint">· or phone below</span></span>
                </label>
                <div className="input-wrap compact">
                  <input
                    type="text"
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    placeholder="e2cc3874-..."
                  />
                </div>
              </div>

              <div className="form-row">
                <label>
                  <span className="input-icon-inline"><PhoneIcon /></span>
                  <span>Phone</span>
                </label>
                <div className="input-wrap compact">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+12102743516"
                    required
                  />
                </div>
              </div>

              {error && <div className="error">{error}</div>}

              <button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    Connecting
                  </>
                ) : (
                  <>
                    Open conversation
                    <span className="arrow"><ArrowRightIcon /></span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="card-footer">
          <div className="signature">
            <svg viewBox="0 0 100 24" width="80" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 16 C 8 6, 14 6, 19 14 S 30 20, 35 12 C 40 4, 46 4, 51 14 S 62 18, 67 10" />
              <path d="M72 18 C 74 14, 78 8, 82 14 S 88 18, 92 12" />
            </svg>
            <span>— the Bamboo team</span>
          </div>
          <div className="footer-meta">
            <span>Bamboo Manager</span>
            <span className="dot" />
            <span>internal tool</span>
            <span className="dot" />
            <span>not for production tenants</span>
          </div>
        </div>
      </div>
    </div>
  );
}
