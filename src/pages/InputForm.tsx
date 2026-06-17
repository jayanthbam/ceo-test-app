import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const DEFAULT_TEAM_ID = "5c79b633-d439-4962-a291-fde3273ff605";
const DEFAULT_PHONE = "+12102743516";

export default function InputForm() {
  const navigate = useNavigate();
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
        <h1>📱 AI Leasing Agent — Executive Test</h1>
        <p className="subtitle">No auth — for executive testing only</p>

        <form onSubmit={handleStart}>
          <label>
            Team ID
            <input
              type="text"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="5c79b633-d439-4962-a291-fde3273ff605"
              required
            />
          </label>

          <label>
            Lead ID <span className="hint">(optional — leave blank to look up by phone)</span>
            <input
              type="text"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              placeholder="e2cc3874-1d4a-42ae-bf64-26d7713f4ae2"
            />
          </label>

          <label>
            Lead Phone
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+12102743516"
              required
            />
          </label>

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Looking up…" : "Start Chat"}
          </button>
        </form>

        <div className="footer-tip">
          Tip: get the IDs from any lead in the dashboard URL.
        </div>
      </div>
    </div>
  );
}
