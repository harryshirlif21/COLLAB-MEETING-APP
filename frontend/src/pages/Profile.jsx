import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ✅ No hardcoded URL import — using relative paths via Nginx proxy

export default function Profile() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [avatar, setAvatar]     = useState(null);
  const [timezone, setTimezone] = useState("UTC");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError]     = useState("");

  const [emailPrefs, setEmailPrefs] = useState({
    meetingReminders: true,
    meetingRecaps: true,
    newParticipant: false,
    weeklyDigest: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetchProfile(token);
  }, [navigate]);

  const fetchProfile = async (token) => {
    try {
      // ✅ Relative path
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setName(data.user.name || "");
        setEmail(data.user.email || "");
        setAvatar(data.user.avatar || null);
        setTimezone(data.user.timezone || "UTC");
        setEmailPrefs(data.user.emailPrefs || emailPrefs);
      }
    } catch {}
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
  };

  const saveGeneral = async () => {
    const token = localStorage.getItem("token");
    setSaving(true);
    try {
      // ✅ Relative path
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, timezone, avatar }),
      });
      if (res.ok) showToast("Profile updated successfully");
      else showToast("Failed to update profile", "error");
    } catch { showToast("Server error", "error"); }
    finally { setSaving(false); }
  };

  const savePassword = async () => {
    setPwError("");
    if (newPw !== confirmPw) { setPwError("Passwords do not match"); return; }
    if (newPw.length < 6)    { setPwError("Password must be at least 6 characters"); return; }
    const token = localStorage.getItem("token");
    setSaving(true);
    try {
      // ✅ Relative path
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok) { showToast("Password changed successfully"); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
      else setPwError(data.message || "Failed to change password");
    } catch { setPwError("Server error"); }
    finally { setSaving(false); }
  };

  const saveEmailPrefs = async () => {
    const token = localStorage.getItem("token");
    setSaving(true);
    try {
      // ✅ Relative path
      const res = await fetch("/api/profile/email-prefs", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ emailPrefs }),
      });
      if (res.ok) showToast("Email preferences saved");
      else showToast("Failed to save preferences", "error");
    } catch { showToast("Server error", "error"); }
    finally { setSaving(false); }
  };

  const timezones = [
    "UTC", "America/New_York", "America/Chicago", "America/Denver",
    "America/Los_Angeles", "Europe/London", "Europe/Paris", "Europe/Berlin",
    "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo",
    "Australia/Sydney", "Pacific/Auckland",
  ];

  const tabs = [
    { id: "general",  label: "General",    icon: "👤" },
    { id: "password", label: "Password",   icon: "🔒" },
    { id: "email",    label: "Email Prefs", icon: "📧" },
  ];

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus { outline: 2px solid #6C63FF; border-color: transparent !important; }
        @keyframes slideIn { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {toast && <div style={{ ...s.toast, background: toast.type === "error" ? "#dc2626" : "#10b981" }}>{toast.type === "error" ? "✕" : "✓"} {toast.msg}</div>}

      <aside style={s.sidebar}>
        <div style={s.logo}>
          <span style={{ fontSize: "1.5rem", color: "#6C63FF" }}>⬡</span>
          <span style={s.logoText}>Collab</span>
        </div>
        <button onClick={() => navigate("/dashboard")} style={s.backBtn}>← Dashboard</button>
        <nav style={s.nav}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ ...s.navBtn, ...(activeTab === t.id ? s.navActive : {}) }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </nav>
      </aside>

      <main style={s.main}>
        <div style={s.pageHeader}>
          <h1 style={s.pageTitle}>Profile Settings</h1>
          <p style={s.pageSubtitle}>Manage your account preferences</p>
        </div>

        {activeTab === "general" && (
          <div style={s.card}>
            <h2 style={s.sectionTitle}>General Information</h2>
            <div style={s.avatarRow}>
              <div style={s.avatarWrap}>
                {avatar ? <img src={avatar} alt="avatar" style={s.avatarImg} /> : <div style={s.avatarFallback}>{name?.[0]?.toUpperCase() || "U"}</div>}
                <button onClick={() => fileRef.current?.click()} style={s.avatarEditBtn}>✏️</button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.95rem" }}>{name || "Your Name"}</p>
                <p style={{ color: "#94a3b8", fontSize: "0.82rem", marginTop: "3px" }}>{email}</p>
                <button onClick={() => fileRef.current?.click()} style={s.uploadHint}>Upload new photo</button>
              </div>
            </div>
            <div style={s.fieldGrid}>
              <div style={s.fieldGroup}>
                <label style={s.label}>Display Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={s.input} placeholder="Your full name" />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Email Address</label>
                <input type="email" value={email} disabled style={{ ...s.input, background: "#f1f5f9", color: "#94a3b8", cursor: "not-allowed" }} />
                <span style={s.hint}>Email cannot be changed</span>
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Time Zone</label>
                <select value={timezone} onChange={(e) => setTimezone(e.target.value)} style={s.select}>
                  {timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
            </div>
            <button onClick={saveGeneral} disabled={saving} style={s.saveBtn}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        )}

        {activeTab === "password" && (
          <div style={s.card}>
            <h2 style={s.sectionTitle}>Change Password</h2>
            <p style={s.cardDesc}>Choose a strong password with at least 6 characters.</p>
            {pwError && <div style={s.errorBox}>{pwError}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "420px" }}>
              <div style={s.fieldGroup}><label style={s.label}>Current Password</label><input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} style={s.input} placeholder="Enter current password" /></div>
              <div style={s.fieldGroup}><label style={s.label}>New Password</label><input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={s.input} placeholder="Enter new password" /></div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Confirm New Password</label>
                <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} style={s.input} placeholder="Confirm new password" />
                {newPw && confirmPw && <span style={{ fontSize: "0.78rem", color: newPw === confirmPw ? "#10b981" : "#dc2626", marginTop: "4px" }}>{newPw === confirmPw ? "✓ Passwords match" : "✕ Passwords do not match"}</span>}
              </div>
            </div>
            <button onClick={savePassword} disabled={saving || !currentPw || !newPw || !confirmPw} style={{ ...s.saveBtn, opacity: (!currentPw || !newPw || !confirmPw) ? 0.5 : 1 }}>{saving ? "Updating…" : "Update Password"}</button>
          </div>
        )}

        {activeTab === "email" && (
          <div style={s.card}>
            <h2 style={s.sectionTitle}>Email Preferences</h2>
            <p style={s.cardDesc}>Choose which emails you want to receive from Collab.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {[
                { key: "meetingReminders", label: "Meeting Reminders",      desc: "Get notified 15 minutes before a meeting starts" },
                { key: "meetingRecaps",    label: "Meeting Recaps",         desc: "Receive a summary after each meeting ends" },
                { key: "newParticipant",   label: "New Participant Alerts",  desc: "Know when someone joins your meeting" },
                { key: "weeklyDigest",     label: "Weekly Digest",          desc: "A summary of your meetings every Monday" },
              ].map((pref, i) => (
                <div key={pref.key} style={{ ...s.prefRow, borderTop: i === 0 ? "none" : "1px solid #f1f5f9" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.9rem" }}>{pref.label}</div>
                    <div style={{ color: "#94a3b8", fontSize: "0.82rem", marginTop: "2px" }}>{pref.desc}</div>
                  </div>
                  <div onClick={() => setEmailPrefs((p) => ({ ...p, [pref.key]: !p[pref.key] }))} style={{ ...s.toggle, background: emailPrefs[pref.key] ? "#6C63FF" : "#e2e8f0" }}>
                    <div style={{ ...s.toggleKnob, transform: emailPrefs[pref.key] ? "translateX(20px)" : "translateX(2px)" }} />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={saveEmailPrefs} disabled={saving} style={s.saveBtn}>{saving ? "Saving…" : "Save Preferences"}</button>
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  root:           { display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif" },
  sidebar:        { width: "220px", minHeight: "100vh", background: "#0f1117", padding: "28px 16px", position: "fixed", top: 0, left: 0, bottom: 0, display: "flex", flexDirection: "column", gap: "24px" },
  logo:           { display: "flex", alignItems: "center", gap: "10px", padding: "0 8px" },
  logoText:       { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "#fff" },
  backBtn:        { background: "none", border: "1px solid #1e293b", color: "#64748b", padding: "9px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "0.82rem", textAlign: "left", transition: "all 0.15s" },
  nav:            { display: "flex", flexDirection: "column", gap: "4px" },
  navBtn:         { display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "10px", border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: "0.88rem", fontWeight: 500, textAlign: "left", transition: "all 0.15s" },
  navActive:      { background: "rgba(108,99,255,0.15)", color: "#fff" },
  main:           { marginLeft: "220px", flex: 1, padding: "40px 48px", display: "flex", flexDirection: "column", gap: "24px" },
  pageHeader:     { marginBottom: "4px" },
  pageTitle:      { fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.7rem", color: "#0f172a" },
  pageSubtitle:   { color: "#94a3b8", fontSize: "0.88rem", marginTop: "4px" },
  card:           { background: "#fff", borderRadius: "16px", padding: "32px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: "24px", animation: "fadeUp 0.3s ease" },
  sectionTitle:   { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#0f172a" },
  cardDesc:       { color: "#94a3b8", fontSize: "0.88rem", marginTop: "-12px" },
  avatarRow:      { display: "flex", alignItems: "center", gap: "20px" },
  avatarWrap:     { position: "relative", flexShrink: 0 },
  avatarImg:      { width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", border: "3px solid #e2e8f0" },
  avatarFallback: { width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg,#6C63FF,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1.6rem" },
  avatarEditBtn:  { position: "absolute", bottom: 0, right: 0, width: "24px", height: "24px", borderRadius: "50%", background: "#fff", border: "2px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.65rem" },
  uploadHint:     { background: "none", border: "none", color: "#6C63FF", fontSize: "0.8rem", cursor: "pointer", padding: "4px 0", fontWeight: 600, marginTop: "4px", display: "block" },
  fieldGrid:      { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" },
  fieldGroup:     { display: "flex", flexDirection: "column", gap: "6px" },
  label:          { fontSize: "0.8rem", fontWeight: 600, color: "#475569", letterSpacing: "0.04em", textTransform: "uppercase" },
  input:          { padding: "11px 14px", borderRadius: "9px", border: "1px solid #e2e8f0", fontSize: "0.9rem", color: "#0f172a", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" },
  select:         { padding: "11px 14px", borderRadius: "9px", border: "1px solid #e2e8f0", fontSize: "0.9rem", color: "#0f172a", background: "#f8fafc", fontFamily: "'DM Sans', sans-serif", cursor: "pointer" },
  hint:           { fontSize: "0.75rem", color: "#94a3b8" },
  saveBtn:        { background: "#6C63FF", color: "#fff", border: "none", borderRadius: "9px", padding: "12px 28px", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", alignSelf: "flex-start", fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" },
  errorBox:       { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: "8px", padding: "10px 14px", fontSize: "0.85rem" },
  prefRow:        { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", gap: "20px" },
  toggle:         { width: "44px", height: "24px", borderRadius: "999px", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 },
  toggleKnob:     { position: "absolute", top: "2px", width: "20px", height: "20px", borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "transform 0.2s" },
  toast:          { position: "fixed", top: "24px", right: "24px", color: "#fff", padding: "12px 20px", borderRadius: "10px", fontWeight: 600, fontSize: "0.88rem", zIndex: 999, animation: "slideIn 0.3s ease", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" },
};
