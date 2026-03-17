import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      let data;
      try { data = await response.json(); }
      catch { throw new Error("Invalid server response. Please try again."); }
      if (!response.ok) throw new Error(data?.message || "Login failed");
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input:focus { outline: 2px solid #6C63FF; border-color: transparent !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width: 480px) {
          .login-card { padding: 32px 24px !important; margin: 16px !important; }
        }
      `}</style>

      {/* Background decoration */}
      <div style={s.bgCircle1} />
      <div style={s.bgCircle2} />

      <div className="login-card" style={s.card}>
        {/* Logo */}
        <div style={s.logoRow}>
          <span style={s.logoIcon}>⬡</span>
          <span style={s.logoText}>Collab</span>
        </div>

        <div style={s.headingGroup}>
          <h1 style={s.heading}>Welcome back</h1>
          <p style={s.subheading}>Sign in to your account</p>
        </div>

        {error && (
          <div style={s.errorBox}>
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.fieldGroup}>
            <label style={s.label}>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={s.input}
            />
          </div>

          <div style={s.fieldGroup}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={s.label}>Password</label>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ ...s.input, paddingRight: "44px" }}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                style={s.eyeBtn}>{showPw ? "🙈" : "👁"}</button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ ...s.submitBtn, opacity: loading ? 0.75 : 1 }}>
            {loading
              ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <span style={s.spinner} /> Signing in…
                </span>
              : "Sign In"
            }
          </button>
        </form>

        <p style={s.switchText}>
          Don't have an account?{" "}
          <Link to="/signup" style={s.link}>Create one</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  root:         { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f1117", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden", padding: "20px" },
  bgCircle1:    { position: "absolute", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)", top: "-100px", right: "-100px", pointerEvents: "none" },
  bgCircle2:    { position: "absolute", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(90,84,255,0.1) 0%, transparent 70%)", bottom: "-80px", left: "-80px", pointerEvents: "none" },
  card:         { background: "#16181f", borderRadius: "20px", padding: "44px 40px", width: "100%", maxWidth: "420px", boxShadow: "0 24px 64px rgba(0,0,0,0.4)", border: "1px solid #1e2130", animation: "fadeUp 0.4s ease", position: "relative", zIndex: 1 },
  logoRow:      { display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" },
  logoIcon:     { fontSize: "1.6rem", color: "#6C63FF" },
  logoText:     { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "#fff" },
  headingGroup: { marginBottom: "28px" },
  heading:      { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "#fff", marginBottom: "6px" },
  subheading:   { color: "#64748b", fontSize: "0.9rem" },
  errorBox:     { background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5", borderRadius: "10px", padding: "12px 16px", fontSize: "0.85rem", marginBottom: "20px", display: "flex", gap: "8px", alignItems: "center" },
  form:         { display: "flex", flexDirection: "column", gap: "18px" },
  fieldGroup:   { display: "flex", flexDirection: "column", gap: "7px" },
  label:        { fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", letterSpacing: "0.04em" },
  input:        { padding: "12px 16px", borderRadius: "10px", border: "1px solid #23262f", fontSize: "0.92rem", color: "#fff", background: "#1e2130", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s", width: "100%" },
  eyeBtn:       { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: "4px" },
  submitBtn:    { marginTop: "8px", background: "linear-gradient(135deg, #6C63FF, #5A54FF)", color: "#fff", border: "none", borderRadius: "10px", padding: "14px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif", width: "100%" },
  switchText:   { textAlign: "center", fontSize: "0.86rem", color: "#64748b", marginTop: "24px" },
  link:         { color: "#818cf8", fontWeight: 600, textDecoration: "none" },
  spinner:      { width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" },
};
