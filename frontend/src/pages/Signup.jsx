import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate  = useNavigate();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [message, setMessage]   = useState({ text: "", type: "" });
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    if (password !== confirm) {
      setMessage({ text: "Passwords do not match", type: "error" });
      return;
    }
    if (password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ text: "Account created! Redirecting to login…", type: "success" });
        setTimeout(() => navigate("/login"), 1800);
      } else {
        setMessage({ text: data.message || "Registration failed", type: "error" });
      }
    } catch {
      setMessage({ text: "Server error. Please check your connection.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = () => {
    if (!password) return null;
    if (password.length < 6) return { label: "Too short", color: "#ef4444", width: "25%" };
    if (password.length < 8) return { label: "Weak",      color: "#f59e0b", width: "50%" };
    if (password.length < 12) return { label: "Good",     color: "#10b981", width: "75%" };
    return { label: "Strong", color: "#6C63FF", width: "100%" };
  };
  const strength = pwStrength();

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input:focus { outline: 2px solid #6C63FF; border-color: transparent !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @media (max-width: 480px) {
          .signup-card { padding: 32px 24px !important; margin: 16px !important; }
        }
      `}</style>

      <div style={s.bgCircle1} />
      <div style={s.bgCircle2} />

      <div className="signup-card" style={s.card}>
        <div style={s.logoRow}>
          <span style={s.logoIcon}>⬡</span>
          <span style={s.logoText}>Collab</span>
        </div>

        <div style={s.headingGroup}>
          <h1 style={s.heading}>Create account</h1>
          <p style={s.subheading}>Get started for free today</p>
        </div>

        {message.text && (
          <div style={{ ...s.msgBox, ...(message.type === "error" ? s.errorMsg : s.successMsg) }}>
            {message.type === "error" ? "⚠" : "✓"} {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.fieldGroup}>
            <label style={s.label}>Full Name</label>
            <input type="text" placeholder="John Doe" value={name}
              onChange={(e) => setName(e.target.value)} required style={s.input} />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Email Address</label>
            <input type="email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required style={s.input} />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPw ? "text" : "password"} placeholder="Min. 6 characters"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required style={{ ...s.input, paddingRight: "44px" }} />
              <button type="button" onClick={() => setShowPw((v) => !v)} style={s.eyeBtn}>
                {showPw ? "🙈" : "👁"}
              </button>
            </div>
            {strength && (
              <div style={s.strengthBar}>
                <div style={{ ...s.strengthFill, width: strength.width, background: strength.color }} />
                <span style={{ ...s.strengthLabel, color: strength.color }}>{strength.label}</span>
              </div>
            )}
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Confirm Password</label>
            <input type="password" placeholder="Repeat password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} required style={s.input} />
            {confirm && password && (
              <span style={{ fontSize: "0.78rem", color: password === confirm ? "#10b981" : "#ef4444", marginTop: "4px" }}>
                {password === confirm ? "✓ Passwords match" : "✕ Passwords do not match"}
              </span>
            )}
          </div>

          <button type="submit" disabled={loading} style={{ ...s.submitBtn, opacity: loading ? 0.75 : 1 }}>
            {loading
              ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <span style={s.spinner} /> Creating account…
                </span>
              : "Create Account"
            }
          </button>
        </form>

        <p style={s.switchText}>
          Already have an account?{" "}
          <Link to="/login" style={s.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  root:         { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f1117", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden", padding: "20px" },
  bgCircle1:    { position: "absolute", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)", top: "-100px", right: "-100px", pointerEvents: "none" },
  bgCircle2:    { position: "absolute", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(90,84,255,0.1) 0%, transparent 70%)", bottom: "-80px", left: "-80px", pointerEvents: "none" },
  card:         { background: "#16181f", borderRadius: "20px", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "0 24px 64px rgba(0,0,0,0.4)", border: "1px solid #1e2130", animation: "fadeUp 0.4s ease", position: "relative", zIndex: 1 },
  logoRow:      { display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" },
  logoIcon:     { fontSize: "1.6rem", color: "#6C63FF" },
  logoText:     { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "#fff" },
  headingGroup: { marginBottom: "24px" },
  heading:      { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "#fff", marginBottom: "5px" },
  subheading:   { color: "#64748b", fontSize: "0.88rem" },
  msgBox:       { borderRadius: "10px", padding: "11px 16px", fontSize: "0.84rem", marginBottom: "18px", display: "flex", gap: "8px", alignItems: "center" },
  errorMsg:     { background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5" },
  successMsg:   { background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#6ee7b7" },
  form:         { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup:   { display: "flex", flexDirection: "column", gap: "7px" },
  label:        { fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", letterSpacing: "0.04em" },
  input:        { padding: "12px 16px", borderRadius: "10px", border: "1px solid #23262f", fontSize: "0.92rem", color: "#fff", background: "#1e2130", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", width: "100%" },
  eyeBtn:       { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: "4px" },
  strengthBar:  { display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" },
  strengthFill: { height: "4px", borderRadius: "2px", flex: "0 0 auto", transition: "all 0.3s" },
  strengthLabel:{ fontSize: "0.75rem", fontWeight: 600 },
  submitBtn:    { marginTop: "6px", background: "linear-gradient(135deg, #6C63FF, #5A54FF)", color: "#fff", border: "none", borderRadius: "10px", padding: "14px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif", width: "100%" },
  switchText:   { textAlign: "center", fontSize: "0.86rem", color: "#64748b", marginTop: "22px" },
  link:         { color: "#818cf8", fontWeight: 600, textDecoration: "none" },
  spinner:      { width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" },
};
