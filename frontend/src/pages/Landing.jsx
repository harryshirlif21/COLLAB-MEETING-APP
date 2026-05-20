import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const features = [
  { icon: "??", title: "HD Video Meetings", desc: "Crystal clear video with up to 100 participants in one call." },
  { icon: "??", title: "Live Chat", desc: "Send messages, links, and files during your meeting." },
  { icon: "??", title: "Hand Raise Queue", desc: "Orderly participation with a built-in hand raise system." },
  { icon: "??", title: "Meeting History", desc: "Review past meetings, attendance logs, and recordings." },
];

const words = ["teams", "classes", "families", "colleagues"];

export default function Landing() {
  const navigate = useNavigate();
  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % words.length);
        setVisible(true);
      }, 400);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleNewMeeting = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/meeting/${code}`);
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) { setJoinError("Enter a meeting code"); return; }
    navigate(`/meeting/${code}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Google Sans', 'Segoe UI', sans-serif", color: "#202124" }}>

      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: "1px solid #e8eaed", position: "sticky", top: 0, background: "#fff", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #1a73e8, #0d47a1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>C</div>
          <span style={{ fontWeight: 600, fontSize: 20, color: "#202124" }}>Collab</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={() => navigate("/login")} style={{ padding: "8px 24px", borderRadius: 6, border: "1px solid #dadce0", background: "#fff", color: "#1a73e8", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            onMouseEnter={e => e.target.style.background = "#f1f3f4"} onMouseLeave={e => e.target.style.background = "#fff"}>Sign in</button>
          <button onClick={() => navigate("/signup")} style={{ padding: "8px 24px", borderRadius: 6, border: "none", background: "#1a73e8", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            onMouseEnter={e => e.target.style.background = "#1557b0"} onMouseLeave={e => e.target.style.background = "#1a73e8"}>Get started</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "80px 24px 60px", maxWidth: 760, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#e8f0fe", borderRadius: 100, padding: "6px 16px", marginBottom: 32, fontSize: 13, color: "#1a73e8", fontWeight: 500 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a73e8", display: "inline-block" }}></span>
          Free to use · No downloads required
        </div>

        <h1 style={{ fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 700, lineHeight: 1.15, margin: "0 0 16px", color: "#202124" }}>
          Video calls for{" "}
          <span style={{ color: "#1a73e8", display: "inline-block", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-8px)", transition: "opacity 0.3s ease, transform 0.3s ease", minWidth: 160 }}>
            {words[wordIndex]}
          </span>
        </h1>

        <p style={{ fontSize: 18, color: "#5f6368", lineHeight: 1.6, margin: "0 0 48px", maxWidth: 560 }}>
          Connect, collaborate, and celebrate from anywhere with Collab — secure, reliable video meetings for everyone.
        </p>

        {/* MEETING ACTIONS — Google Meet style */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start", width: "100%", maxWidth: 540 }}>
          <button
            onClick={handleNewMeeting}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 24px", borderRadius: 8, border: "none", background: "#1a73e8", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer", whiteSpace: "nowrap" }}
            onMouseEnter={e => e.currentTarget.style.background = "#1557b0"}
            onMouseLeave={e => e.currentTarget.style.background = "#1a73e8"}
          >
            ?? New meeting
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", gap: 0 }}>
              <input
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value); setJoinError(""); }}
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                placeholder="Enter a code or link"
                style={{ flex: 1, padding: "13px 16px", borderRadius: "8px 0 0 8px", border: "1px solid #dadce0", borderRight: "none", fontSize: 15, outline: "none", color: "#202124" }}
              />
              <button
                onClick={handleJoin}
                style={{ padding: "13px 20px", borderRadius: "0 8px 8px 0", border: "1px solid #dadce0", borderLeft: "none", background: joinCode.trim() ? "#1a73e8" : "#fff", color: joinCode.trim() ? "#fff" : "#bbb", fontWeight: 600, fontSize: 15, cursor: joinCode.trim() ? "pointer" : "default", transition: "all 0.2s" }}
              >
                Join
              </button>
            </div>
            {joinError && <span style={{ fontSize: 12, color: "#d93025", paddingLeft: 4 }}>{joinError}</span>}
          </div>
        </div>

        <p style={{ marginTop: 24, fontSize: 13, color: "#5f6368" }}>
          <span style={{ cursor: "pointer", color: "#1a73e8" }} onClick={() => navigate("/login")}>Sign in</span> to access your meetings and history
        </p>
      </section>

      {/* HERO MOCKUP */}
      <section style={{ maxWidth: 900, margin: "0 auto 80px", padding: "0 24px" }}>
        <div style={{ background: "#f1f3f4", borderRadius: 16, padding: 24, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, minHeight: 280 }}>
          {["Alex K.", "Maria S.", "James T.", "You"].map((name, i) => (
            <div key={i} style={{ background: i === 3 ? "#e8f0fe" : ["#202124", "#3c4043", "#1a73e8", "#137333"][i], borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 100, gap: 8, position: "relative" }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: i === 3 ? "#1a73e8" : "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, color: "#fff" }}>{name[0]}</div>
              <span style={{ fontSize: 13, fontWeight: 500, color: i === 3 ? "#1a73e8" : "rgba(255,255,255,0.9)" }}>{name}</span>
              {i === 0 && <div style={{ position: "absolute", bottom: 8, left: 8, background: "#ea4335", borderRadius: 4, padding: "2px 8px", fontSize: 11, color: "#fff", fontWeight: 600 }}>LIVE</div>}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 16 }}>
          {[{ icon: "??", label: "Mute" }, { icon: "??", label: "Camera" }, { icon: "???", label: "Share" }, { icon: "?", label: "Raise hand" }, { icon: "??", label: "Chat" }].map(({ icon, label }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fff", border: "1px solid #dadce0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}>{icon}</div>
              <span style={{ fontSize: 11, color: "#5f6368" }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background: "#f8f9fa", padding: "64px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 700, marginBottom: 8, color: "#202124" }}>Everything you need to meet</h2>
          <p style={{ textAlign: "center", color: "#5f6368", fontSize: 16, marginBottom: 48 }}>Built for productivity, designed for people.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24 }}>
            {features.map(({ icon, title, desc }) => (
              <div key={title} style={{ background: "#fff", borderRadius: 12, padding: "28px 24px", border: "1px solid #e8eaed", transition: "box-shadow 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px", color: "#202124" }}>{title}</h3>
                <p style={{ fontSize: 14, color: "#5f6368", margin: 0, lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "80px 24px", background: "#fff" }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16, color: "#202124" }}>Ready to meet?</h2>
        <p style={{ color: "#5f6368", fontSize: 16, marginBottom: 32 }}>Join thousands of teams already using Collab.</p>
        <button onClick={() => navigate("/signup")} style={{ padding: "14px 40px", borderRadius: 8, border: "none", background: "#1a73e8", color: "#fff", fontWeight: 600, fontSize: 16, cursor: "pointer" }}
          onMouseEnter={e => e.target.style.background = "#1557b0"} onMouseLeave={e => e.target.style.background = "#1a73e8"}>Get started for free</button>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #e8eaed", padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 13, color: "#5f6368" }}>© 2026 Collab. All rights reserved.</span>
        <div style={{ display: "flex", gap: 24 }}>
          {["Privacy", "Terms", "Help"].map(link => (
            <span key={link} style={{ fontSize: 13, color: "#5f6368", cursor: "pointer" }}
              onMouseEnter={e => e.target.style.color = "#1a73e8"} onMouseLeave={e => e.target.style.color = "#5f6368"}>{link}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
