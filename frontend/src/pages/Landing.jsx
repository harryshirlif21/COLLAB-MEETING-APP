import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const words = ["teams", "classes", "families", "colleagues"];

function NewMeetingModal({ onClose }) {
  const navigate = useNavigate();
  const [code] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [guestName, setGuestName] = useState("");
  const [copied, setCopied] = useState(false);
  const [nameError, setNameError] = useState("");
  const meetingLink = `${window.location.origin}/meeting/${code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Join my Collab meeting!\nCode: ${code}\nLink: ${meetingLink}`)}`);
  };

  const handleEmail = () => {
    window.open(`mailto:?subject=Join my Collab meeting&body=${encodeURIComponent(`Hi,\n\nJoin my Collab meeting!\n\nMeeting Code: ${code}\nMeeting Link: ${meetingLink}\n\nSee you there!`)}`);
  };

  const handleStart = () => {
    if (!guestName.trim()) { setNameError("Enter your name to continue"); return; }
    sessionStorage.setItem(`guest_name_${code}`, guestName.trim());
    navigate(`/meeting/${code}`);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: "100%", maxWidth: 480, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#202124" }}>Your meeting is ready</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#5f6368", padding: 4 }}>&#x2715;</button>
        </div>

        {/* Meeting code */}
        <div style={{ background: "#f1f3f4", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#5f6368", marginBottom: 4 }}>Meeting code</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4, color: "#1a73e8" }}>{code}</span>
            <button onClick={handleCopy} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #dadce0", background: copied ? "#e6f4ea" : "#fff", color: copied ? "#34a853" : "#1a73e8", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Meeting link */}
        <div style={{ background: "#f1f3f4", borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#5f6368", wordBreak: "break-all" }}>
          {meetingLink}
        </div>

        {/* Share buttons */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <button onClick={handleCopy} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #dadce0", background: "#fff", color: "#202124", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy link
          </button>
          <button onClick={handleWhatsApp} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #25d366", background: "#fff", color: "#25d366", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
            WhatsApp
          </button>
          <button onClick={handleEmail} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #ea4335", background: "#fff", color: "#ea4335", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Email
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "#e8eaed" }}></div>
          <span style={{ fontSize: 12, color: "#5f6368" }}>Join as guest</span>
          <div style={{ flex: 1, height: 1, background: "#e8eaed" }}></div>
        </div>

        {/* Guest name input */}
        <div style={{ marginBottom: 16 }}>
          <input
            value={guestName}
            onChange={e => { setGuestName(e.target.value); setNameError(""); }}
            onKeyDown={e => e.key === "Enter" && handleStart()}
            placeholder="Your name"
            style={{ width: "100%", padding: "12px 16px", borderRadius: 8, border: nameError ? "1px solid #d93025" : "1px solid #dadce0", fontSize: 15, outline: "none", boxSizing: "border-box", color: "#202124" }}
          />
          {nameError && <div style={{ fontSize: 12, color: "#d93025", marginTop: 4 }}>{nameError}</div>}
        </div>

        <button onClick={handleStart} style={{ width: "100%", padding: "13px", borderRadius: 8, border: "none", background: "#1a73e8", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
          onMouseEnter={e => e.target.style.background = "#1557b0"} onMouseLeave={e => e.target.style.background = "#1a73e8"}>
          Start meeting
        </button>

        {/* Login link */}
        <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#5f6368" }}>
          Have an account?{" "}
          <span style={{ color: "#1a73e8", cursor: "pointer", fontWeight: 600 }} onClick={() => navigate("/login")}>Sign in</span>
          {" "}for full features & history
        </p>
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [showModal, setShowModal] = useState(false);

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

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) { setJoinError("Enter a meeting code"); return; }
    navigate(`/meeting/${code}`);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Google Sans', 'Segoe UI', sans-serif", color: "#202124" }}>

      {showModal && <NewMeetingModal onClose={() => setShowModal(false)} />}

      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: "1px solid #e8eaed", position: "sticky", top: 0, background: "#fff", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#1a73e8", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>C</div>
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
          Free to use &middot; No downloads required
        </div>

        <h1 style={{ fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 700, lineHeight: 1.15, margin: "0 0 16px", color: "#202124" }}>
          Video calls for{" "}
          <span style={{ color: "#1a73e8", display: "inline-block", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-8px)", transition: "opacity 0.3s ease, transform 0.3s ease", minWidth: 160 }}>
            {words[wordIndex]}
          </span>
        </h1>

        <p style={{ fontSize: 18, color: "#5f6368", lineHeight: 1.6, margin: "0 0 48px", maxWidth: 560 }}>
          Connect, collaborate, and celebrate from anywhere with Collab &mdash; secure, reliable video meetings for everyone.
        </p>

        {/* MEETING ACTIONS */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", alignItems: "flex-start", width: "100%", maxWidth: 540 }}>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 24px", borderRadius: 8, border: "none", background: "#1a73e8", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer", whiteSpace: "nowrap" }}
            onMouseEnter={e => e.currentTarget.style.background = "#1557b0"}
            onMouseLeave={e => e.currentTarget.style.background = "#1a73e8"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
            New meeting
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex" }}>
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
          {[
            { label: "Mute", path: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" },
            { label: "Camera", path: "M23 7l-7 5 7 5V7zM1 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" },
            { label: "Share", path: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" },
            { label: "Hand", path: "M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8M6 14l-.09.13A2 2 0 0 0 6 16v2a6 6 0 0 0 6 6h2a6 6 0 0 0 6-6v-5a2 2 0 0 0-2-2 2 2 0 0 0-2 2" },
            { label: "Chat", path: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
          ].map(({ label, path }) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fff", border: "1px solid #dadce0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={path}></path></svg>
              </div>
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
            {[
              { color: "#1a73e8", title: "HD Video Meetings", desc: "Crystal clear video with up to 100 participants in one call.", path: "M23 7l-7 5 7 5V7zM1 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" },
              { color: "#34a853", title: "Live Chat", desc: "Send messages, links, and files during your meeting.", path: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
              { color: "#fbbc04", title: "Hand Raise Queue", desc: "Orderly participation with a built-in hand raise system.", path: "M18 11V6a2 2 0 0 0-4 0M14 10V4a2 2 0 0 0-4 0v2M10 10.5V6a2 2 0 0 0-4 0v8M6 14l-.09.13A2 2 0 0 0 6 16v2a6 6 0 0 0 6 6h2a6 6 0 0 0 6-6v-5a2 2 0 0 0-4 0" },
              { color: "#ea4335", title: "Meeting History", desc: "Review past meetings, attendance logs, and recordings.", path: "M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" },
            ].map(({ color, title, desc, path }) => (
              <div key={title} style={{ background: "#fff", borderRadius: 12, padding: "28px 24px", border: "1px solid #e8eaed", transition: "box-shadow 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: color + "1a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={path}></path></svg>
                </div>
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
        <span style={{ fontSize: 13, color: "#5f6368" }}>&copy; 2026 Collab. All rights reserved.</span>
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
