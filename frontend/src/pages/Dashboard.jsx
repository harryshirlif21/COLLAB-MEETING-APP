import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

// ✅ No hardcoded URL — socket connects to same origin, Nginx proxies /socket.io/
function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [meetingId, setMeetingId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [meetingError, setMeetingError] = useState("");
  const [creating, setCreating] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
  const [stats, setStats] = useState({ meetings: 0, hours: 0, messages: 0, files: 0 });
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
    } catch {}

    fetchStats(token);

    // ✅ Connect to same origin — Nginx proxies /socket.io/ to backend
    socketRef.current = io({
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => console.log("[SOCKET] Connected:", socketRef.current.id));
    socketRef.current.on("disconnect", () => console.log("[SOCKET] Disconnected"));

    return () => socketRef.current.disconnect();
  }, [navigate]);

  const fetchStats = async (token) => {
    try {
      // ✅ Relative path — Nginx proxies /api/* to backend
      const res = await fetch("/api/logs/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || {});
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleCreateMeeting = async () => {
    if (!meetingTitle || !meetingDate || !startTime || !endTime) {
      setMeetingError("Please fill in all fields");
      return;
    }

    const token = localStorage.getItem("token");
    setCreating(true);
    setMeetingError("");

    try {
      // ✅ Relative path
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: meetingTitle,
          meeting_date: meetingDate,
          start_time: startTime,
          end_time: endTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setMeetingError(data.error || "Failed to create meeting"); return; }

      setShowModal(false);
      setMeetingTitle(""); setMeetingDate(""); setStartTime(""); setEndTime("");
      navigate("/meetings");
    } catch (err) {
      setMeetingError("Server error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const joinMeeting = () => {
    if (!meetingId.trim()) return;
    navigate(`/meeting/${meetingId.trim()}`);
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    { id: "home",     icon: "⊞", label: "Dashboard"   },
    { id: "meetings", icon: "📹", label: "Meetings",    action: () => navigate("/meetings") },
    { id: "history",  icon: "📋", label: "History",     action: () => navigate("/history")  },
    { id: "profile",  icon: "👤", label: "Profile",     action: () => navigate("/profile")  },
  ];

  const statCards = [
    { label: "Meetings Attended", value: stats.meetings ?? 0,  icon: "📹", color: "#6C63FF" },
    { label: "Hours in Meetings", value: stats.hours ?? 0,     icon: "⏱",  color: "#0ea5e9" },
    { label: "Messages Sent",     value: stats.messages ?? 0,  icon: "💬", color: "#10b981" },
    { label: "Files Shared",      value: stats.files ?? 0,     icon: "📁", color: "#f59e0b" },
  ];

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .card-hover { transition: transform 0.2s, box-shadow 0.2s; }
        .card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(108,99,255,0.13) !important; }
        input:focus { outline: 2px solid #6C63FF; border-color: transparent !important; }
      `}</style>

      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        <div style={s.sideTop}>
          <div style={s.logo}><span style={s.logoIcon}>⬡</span><span style={s.logoText}>Collab</span></div>
          <nav style={s.nav}>
            {navItems.map(item => (
              <button key={item.id} className="nav-btn"
                onClick={() => { setActiveNav(item.id); item.action?.(); }}
                style={{ ...s.navBtn, ...(activeNav === item.id ? s.navBtnActive : {}) }}>
                <span style={s.navIcon}>{item.icon}</span>
                <span style={s.navLabel}>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div style={s.sideBottom}>
          <div style={s.userChip}>
            <div style={s.avatar}>{user?.name?.[0]?.toUpperCase() || "U"}</div>
            <div style={s.userInfo}>
              <div style={s.userName}>{user?.name || "User"}</div>
              <div style={s.userRole}>Member</div>
            </div>
          </div>
          <button onClick={logout} style={s.logoutBtn}>↩ Sign out</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={s.main}>
        <header style={s.header}>
          <div>
            <h1 style={s.heading}>Good {getGreeting()}, {user?.name?.split(" ")[0] || "there"} 👋</h1>
            <p style={s.subheading}>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
        </header>

        {/* Stats */}
        <section style={s.statsGrid}>
          {statCards.map((card, i) => (
            <div key={i} className="card-hover" style={{ ...s.statCard, animationDelay: `${i * 0.07}s` }}>
              <div style={{ ...s.statIcon, background: card.color + "18" }}>{card.icon}</div>
              <div style={s.statValue}>{card.value}</div>
              <div style={s.statLabel}>{card.label}</div>
              <div style={{ ...s.statAccent, background: card.color }} />
            </div>
          ))}
        </section>

        {/* Actions */}
        <section style={s.actionsRow}>
          <div className="card-hover" style={s.actionCard}>
            <div style={s.actionCardHeader}><span style={{ fontSize: "2rem" }}>📹</span><h3 style={s.actionTitle}>New Meeting</h3></div>
            <p style={s.actionDesc}>Schedule a meeting and invite participants</p>
            <button className="action-btn" onClick={() => setShowModal(true)} style={s.primaryBtn}>Create Meeting</button>
          </div>

          <div className="card-hover" style={s.actionCard}>
            <div style={s.actionCardHeader}><span style={{ fontSize: "2rem" }}>🔗</span><h3 style={s.actionTitle}>Join Meeting</h3></div>
            <p style={s.actionDesc}>Enter a meeting code to join instantly</p>
            <input type="text" placeholder="Enter meeting code…" value={meetingId}
              onChange={e => setMeetingId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && joinMeeting()}
              style={s.input} />
            <button className="action-btn" onClick={joinMeeting} disabled={!meetingId.trim()}
              style={{ ...s.primaryBtn, opacity: meetingId.trim() ? 1 : 0.45, cursor: meetingId.trim() ? "pointer" : "not-allowed" }}>
              Join Now
            </button>
          </div>

          <div className="card-hover" style={{ ...s.actionCard, background: "linear-gradient(135deg, #6C63FF 0%, #5A54FF 100%)" }}>
            <div style={s.actionCardHeader}><span style={{ fontSize: "2rem" }}>📅</span><h3 style={{ ...s.actionTitle, color: "#fff" }}>All Meetings</h3></div>
            <p style={{ ...s.actionDesc, color: "rgba(255,255,255,0.75)" }}>View and manage all your scheduled meetings</p>
            <button className="action-btn" onClick={() => navigate("/meetings")}
              style={{ ...s.primaryBtn, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", marginTop: "auto", border: "1px solid rgba(255,255,255,0.3)" }}>
              View Meetings
            </button>
          </div>
        </section>
      </main>

      {/* ── Create Meeting Modal ── */}
      {showModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Create Meeting</h2>
              <button onClick={() => { setShowModal(false); setMeetingError(""); }} style={s.closeBtn}>✕</button>
            </div>
            {meetingError && <div style={s.errorBox}>{meetingError}</div>}
            <div style={s.fieldGroup}><label style={s.label}>Meeting Title</label>
              <input type="text" value={meetingTitle} onChange={e => setMeetingTitle(e.target.value)} style={s.input} />
            </div>
            <div style={s.fieldGroup}><label style={s.label}>Date</label>
              <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} style={s.input} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={s.fieldGroup}><label style={s.label}>Start Time</label><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={s.input} /></div>
              <div style={s.fieldGroup}><label style={s.label}>End Time</label><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={s.input} /></div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button onClick={handleCreateMeeting} disabled={creating} style={{ ...s.primaryBtn, flex: 1, opacity: creating ? 0.7 : 1 }}>{creating ? "Creating…" : "Create Meeting"}</button>
              <button onClick={() => { setShowModal(false); setMeetingError(""); }} style={{ ...s.ghostBtn, flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const s = {
  root: { display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" },
  sidebar: { width: "240px", minHeight: "100vh", background: "#0f1117", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "28px 16px", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 10 },
  sideTop: { display: "flex", flexDirection: "column", gap: "36px" },
  logo: { display: "flex", alignItems: "center", gap: "10px", padding: "0 8px" },
  logoIcon: { fontSize: "1.6rem", color: "#6C63FF" },
  logoText: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "#fff" },
  nav: { display: "flex", flexDirection: "column", gap: "4px" },
  navBtn: { display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "10px", border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: "0.9rem", fontWeight: 500, width: "100%", textAlign: "left", position: "relative" },
  navBtnActive: { background: "rgba(108,99,255,0.15)", color: "#fff" },
  navIcon: { fontSize: "1rem", width: "20px", textAlign: "center" },
  navLabel: { flex: 1 },
  sideBottom: { display: "flex", flexDirection: "column", gap: "12px" },
  userChip: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "rgba(255,255,255,0.05)", borderRadius: "10px" },
  avatar: { width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg,#6C63FF,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "0.9rem" },
  userInfo: { overflow: "hidden" },
  userName: { color: "#fff", fontWeight: 600, fontSize: "0.85rem" },
  userRole: { color: "#64748b", fontSize: "0.75rem" },
  logoutBtn: { background: "none", border: "1px solid #1e293b", color: "#64748b", padding: "9px", borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem" },
  main: { marginLeft: "240px", flex: 1, padding: "36px 40px", display: "flex", flexDirection: "column", gap: "28px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  heading: { fontFamily: "'Syne', sans-serif", fontSize: "1.7rem", fontWeight: 800, color: "#0f172a" },
  subheading: { color: "#94a3b8", fontSize: "0.88rem", marginTop: "4px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" },
  statCard: { background: "#fff", borderRadius: "14px", padding: "22px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", position: "relative", animation: "fadeUp 0.4s ease both" },
  statIcon: { width: "44px", height: "44px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" },
  statValue: { fontFamily: "'Syne', sans-serif", fontSize: "2rem", fontWeight: 800, color: "#0f172a", lineHeight: 1 },
  statLabel: { color: "#94a3b8", fontSize: "0.8rem", marginTop: "6px", fontWeight: 500 },
  statAccent: { position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", borderRadius: "0 0 14px 14px" },
  actionsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" },
  actionCard: { background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "10px", minHeight: "220px" },
  actionCardHeader: { display: "flex", alignItems: "center", gap: "12px" },
  actionTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0f172a" },
  actionDesc: { color: "#94a3b8", fontSize: "0.84rem", lineHeight: 1.5 },
  input: { width: "100%", padding: "11px 14px", borderRadius: "9px", border: "1px solid #e2e8f0", fontSize: "0.9rem", color: "#0f172a", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" },
  overlay: { position: "fixed", inset: 0, background: "rgba(15,17,23,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { background: "#fff", borderRadius: "18px", padding: "32px", width: "440px", maxWidth: "95vw", display: "flex", flexDirection: "column", gap: "16px" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.25rem", color: "#0f172a" },
  closeBtn: { background: "none", border: "none", fontSize: "1.1rem", cursor: "pointer", color: "#94a3b8", padding: "4px 8px", borderRadius: "6px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "0.82rem", fontWeight: 600, color: "#475569" },
  errorBox: { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "8px", padding: "10px 14px", fontSize: "0.85rem" },
  primaryBtn: { background: "#6C63FF", color: "#fff", border: "none", borderRadius: "9px", padding: "12px 20px", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" },
  ghostBtn: { background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: "9px", padding: "12px 20px", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer" },
};

export default Dashboard;
