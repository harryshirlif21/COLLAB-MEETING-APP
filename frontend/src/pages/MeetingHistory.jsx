import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ✅ No hardcoded URL import — using relative paths via Nginx proxy

export default function MeetingHistory() {
  const navigate = useNavigate();
  const [history, setHistory]   = useState([]);
  const [stats, setStats]       = useState({});
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [filter, setFilter]     = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetchHistory(token);
  }, [navigate]);

  const fetchHistory = async (token) => {
    setLoading(true);
    setError("");
    try {
      // ✅ Relative path — Nginx proxies to backend
      const res = await fetch("/api/logs/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load history");
      const data = await res.json();
      setHistory(data.history || []);
      setStats(data.stats || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = history.filter((m) => {
    if (filter === "hosted") return m.isHost;
    if (filter === "joined") return !m.isHost;
    return true;
  });

  const formatDuration = (mins) => {
    if (!mins) return "—";
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
  };

  const summaryCards = [
    { label: "Meetings Attended", value: stats.totalMeetings ?? 0,  icon: "📹", color: "#6C63FF", bg: "#ede9fe" },
    { label: "Total Hours",       value: stats.totalHours ?? "0h",  icon: "⏱",  color: "#0ea5e9", bg: "#e0f2fe" },
    { label: "Messages Sent",     value: stats.totalMessages ?? 0,  icon: "💬", color: "#10b981", bg: "#d1fae5" },
    { label: "Files Shared",      value: stats.totalFiles ?? 0,     icon: "📁", color: "#f59e0b", bg: "#fef3c7" },
  ];

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .row-hover:hover { background: #f8fafc !important; }
      `}</style>

      <aside style={s.sidebar}>
        <div style={s.logo}>
          <span style={{ fontSize: "1.5rem", color: "#6C63FF" }}>⬡</span>
          <span style={s.logoText}>Collab</span>
        </div>
        <button onClick={() => navigate("/dashboard")} style={s.backBtn}>← Dashboard</button>
        <div style={s.sideSection}>
          <div style={s.sideLabel}>FILTER</div>
          {[
            { id: "all",    label: "All Meetings" },
            { id: "hosted", label: "Hosted by me" },
            { id: "joined", label: "Joined" },
          ].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ ...s.filterBtn, ...(filter === f.id ? s.filterActive : {}) }}>
              {f.label}
              {filter === f.id && <span style={s.filterPip} />}
            </button>
          ))}
        </div>
      </aside>

      <main style={s.main}>
        <div style={s.pageHeader}>
          <h1 style={s.pageTitle}>Meeting History</h1>
          <p style={s.pageSubtitle}>Your complete meeting activity log</p>
        </div>

        <div style={s.summaryGrid}>
          {summaryCards.map((card, i) => (
            <div key={i} style={{ ...s.summaryCard, animationDelay: `${i * 0.07}s` }}>
              <div style={{ ...s.summaryIcon, background: card.bg, color: card.color }}>{card.icon}</div>
              <div style={s.summaryValue}>{card.value}</div>
              <div style={s.summaryLabel}>{card.label}</div>
            </div>
          ))}
        </div>

        <div style={s.tableCard}>
          <div style={s.tableHeader}>
            <h2 style={s.tableTitle}>
              {filter === "all" ? "All Meetings" : filter === "hosted" ? "Meetings I Hosted" : "Meetings I Joined"}
              <span style={s.countBadge}>{filtered.length}</span>
            </h2>
            <button onClick={() => fetchHistory(localStorage.getItem("token"))} style={s.refreshBtn}>↻ Refresh</button>
          </div>

          {loading && <div style={s.emptyState}><div style={{ fontSize: "2rem", marginBottom: "10px" }}>⌛</div>Loading history…</div>}
          {error   && <div style={s.errorBox}>{error}</div>}
          {!loading && !error && filtered.length === 0 && (
            <div style={s.emptyState}>
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>📭</div>
              <div style={{ fontWeight: 600, color: "#475569" }}>No meetings found</div>
              <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "4px" }}>Your meeting history will appear here</div>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Meeting</th>
                  <th style={s.th}>Date</th>
                  <th style={s.th}>Duration</th>
                  <th style={s.th}>Messages</th>
                  <th style={s.th}>Files</th>
                  <th style={s.th}>Role</th>
                  <th style={s.th}>Participants</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={i} className="row-hover" style={{ ...s.tr, animationDelay: `${i * 0.04}s` }}>
                    <td style={s.td}><div style={s.meetingName}>{m.title}</div><div style={s.meetingCode}>{m.meeting_code}</div></td>
                    <td style={s.td}><div style={s.tdMain}>{formatDate(m.meeting_date)}</div><div style={s.tdSub}>{m.start_time?.slice(0, 5)} – {m.end_time?.slice(0, 5)}</div></td>
                    <td style={s.td}><span style={s.durationChip}>{formatDuration(m.duration_minutes)}</span></td>
                    <td style={s.td}><span style={s.numChip}>{m.message_count ?? 0}</span></td>
                    <td style={s.td}><span style={s.numChip}>{m.file_count ?? 0}</span></td>
                    <td style={s.td}><span style={{ ...s.roleBadge, ...(m.isHost ? s.hostBadge : s.joinedBadge) }}>{m.isHost ? "👑 Host" : "👤 Member"}</span></td>
                    <td style={s.td}><span style={s.numChip}>{m.participant_count ?? 1}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  root:          { display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" },
  sidebar:       { width: "220px", minHeight: "100vh", background: "#0f1117", padding: "28px 16px", position: "fixed", top: 0, left: 0, bottom: 0, display: "flex", flexDirection: "column", gap: "24px" },
  logo:          { display: "flex", alignItems: "center", gap: "10px", padding: "0 8px" },
  logoText:      { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "#fff" },
  backBtn:       { background: "none", border: "1px solid #1e293b", color: "#64748b", padding: "9px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem", textAlign: "left" },
  sideSection:   { display: "flex", flexDirection: "column", gap: "4px" },
  sideLabel:     { fontSize: "0.7rem", fontWeight: 700, color: "#334155", letterSpacing: "0.08em", padding: "0 14px", marginBottom: "4px" },
  filterBtn:     { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "9px", border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: "0.88rem", fontWeight: 500, textAlign: "left", transition: "all 0.15s" },
  filterActive:  { background: "rgba(108,99,255,0.15)", color: "#fff" },
  filterPip:     { width: "6px", height: "6px", borderRadius: "50%", background: "#6C63FF" },
  main:          { marginLeft: "220px", flex: 1, padding: "40px 48px", display: "flex", flexDirection: "column", gap: "24px" },
  pageHeader:    { marginBottom: "4px" },
  pageTitle:     { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.7rem", color: "#0f172a" },
  pageSubtitle:  { color: "#94a3b8", fontSize: "0.88rem", marginTop: "4px" },
  summaryGrid:   { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" },
  summaryCard:   { background: "#fff", borderRadius: "14px", padding: "22px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "10px", animation: "fadeUp 0.4s ease both" },
  summaryIcon:   { width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" },
  summaryValue:  { fontFamily: "'Syne', sans-serif", fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", lineHeight: 1 },
  summaryLabel:  { color: "#94a3b8", fontSize: "0.78rem", fontWeight: 500 },
  tableCard:     { background: "#fff", borderRadius: "16px", padding: "28px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  tableHeader:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  tableTitle:    { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0f172a", display: "flex", alignItems: "center", gap: "10px" },
  countBadge:    { background: "#f1f5f9", color: "#64748b", borderRadius: "999px", padding: "2px 10px", fontSize: "0.78rem", fontWeight: 600 },
  refreshBtn:    { background: "none", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", color: "#64748b", fontSize: "0.82rem", fontWeight: 600 },
  table:         { width: "100%", borderCollapse: "collapse" },
  thead:         { borderBottom: "2px solid #f1f5f9" },
  th:            { padding: "10px 14px", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase" },
  tr:            { borderBottom: "1px solid #f8fafc", transition: "background 0.1s", animation: "fadeUp 0.3s ease both" },
  td:            { padding: "14px", verticalAlign: "middle" },
  meetingName:   { fontWeight: 600, color: "#0f172a", fontSize: "0.9rem" },
  meetingCode:   { fontFamily: "monospace", color: "#94a3b8", fontSize: "0.75rem", marginTop: "2px" },
  tdMain:        { color: "#0f172a", fontSize: "0.88rem", fontWeight: 500 },
  tdSub:         { color: "#94a3b8", fontSize: "0.78rem", marginTop: "2px" },
  durationChip:  { background: "#ede9fe", color: "#6C63FF", borderRadius: "6px", padding: "3px 10px", fontSize: "0.8rem", fontWeight: 600 },
  numChip:       { background: "#f1f5f9", color: "#475569", borderRadius: "6px", padding: "3px 10px", fontSize: "0.82rem", fontWeight: 600 },
  roleBadge:     { borderRadius: "999px", padding: "3px 12px", fontSize: "0.78rem", fontWeight: 700 },
  hostBadge:     { background: "#fef3c7", color: "#d97706" },
  joinedBadge:   { background: "#f0fdf4", color: "#16a34a" },
  emptyState:    { textAlign: "center", padding: "60px 20px", color: "#94a3b8" },
  errorBox:      { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "8px", padding: "12px 16px", fontSize: "0.85rem", margin: "12px 0" },
};
