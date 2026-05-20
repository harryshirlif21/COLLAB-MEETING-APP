import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Lock, Mail, Camera, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Tabs from "../components/ui/Tabs";

export default function Profile() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [timezone, setTimezone] = useState("UTC");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");

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
      const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api/profile", {
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
      const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api/profile", {
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
    if (newPw.length < 6) { setPwError("Password must be at least 6 characters"); return; }
    const token = localStorage.getItem("token");
    setSaving(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api/profile/password", {
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
      const res = await fetch((import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api/profile/email-prefs", {
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

  const tabData = [
    { id: "general", label: "General", icon: <User className="w-4 h-4" /> },
    { id: "password", label: "Password", icon: <Lock className="w-4 h-4" /> },
    { id: "email", label: "Email Prefs", icon: <Mail className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 px-4 py-3 rounded-xl text-white font-semibold text-sm z-50 ${
              toast.type === "error" ? "bg-danger" : "bg-secondary"
            }`}
          >
            {toast.type === "error" ? <AlertCircle className="w-4 h-4 inline mr-2" /> : <CheckCircle2 className="w-4 h-4 inline mr-2" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-text-primary font-display mb-2">Profile Settings</h1>
        <p className="text-text-secondary">Manage your account preferences</p>
      </motion.div>

      <Tabs tabs={tabData} activeTab={activeTab} onTabChange={setActiveTab} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {activeTab === "general" && (
          <Card>
            <h2 className="text-xl font-semibold text-text-primary font-display mb-6">General Information</h2>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="relative">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="w-20 h-20 rounded-full object-cover border-4 border-white/10" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-2xl">
                    {name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center border-2 border-background hover:bg-primary-hover transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-lg">{name || "Your Name"}</p>
                <p className="text-text-secondary text-sm">{email}</p>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="text-primary text-sm font-semibold mt-2 hover:text-primary-hover transition-colors"
                >
                  Upload new photo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Input
                type="text"
                label="Display Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
              <div>
                <Input
                  type="email"
                  label="Email Address"
                  value={email}
                  disabled
                  className="bg-surface/50 cursor-not-allowed"
                />
                <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2 block">Time Zone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                >
                  {timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
            </div>

            <Button onClick={saveGeneral} loading={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </Card>
        )}

        {activeTab === "password" && (
          <Card>
            <h2 className="text-xl font-semibold text-text-primary font-display mb-2">Change Password</h2>
            <p className="text-text-secondary text-sm mb-6">Choose a strong password with at least 6 characters.</p>
            
            {pwError && (
              <div className="mb-4 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {pwError}
              </div>
            )}

            <div className="space-y-4 max-w-md mb-6">
              <Input
                type="password"
                label="Current Password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Enter current password"
              />
              <Input
                type="password"
                label="New Password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Enter new password"
              />
              <Input
                type="password"
                label="Confirm New Password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Confirm new password"
                error={newPw && confirmPw && newPw !== confirmPw ? "Passwords do not match" : ""}
              />
            </div>

            <Button
              onClick={savePassword}
              loading={saving}
              disabled={!currentPw || !newPw || !confirmPw}
            >
              {saving ? "Updating…" : "Update Password"}
            </Button>
          </Card>
        )}

        {activeTab === "email" && (
          <Card>
            <h2 className="text-xl font-semibold text-text-primary font-display mb-2">Email Preferences</h2>
            <p className="text-text-secondary text-sm mb-6">Choose which emails you want to receive from Collab.</p>
            
            <div className="space-y-0">
              {[
                { key: "meetingReminders", label: "Meeting Reminders", desc: "Get notified 15 minutes before a meeting starts" },
                { key: "meetingRecaps", label: "Meeting Recaps", desc: "Receive a summary after each meeting ends" },
                { key: "newParticipant", label: "New Participant Alerts", desc: "Know when someone joins your meeting" },
                { key: "weeklyDigest", label: "Weekly Digest", desc: "A summary of your meetings every Monday" },
              ].map((pref, i) => (
                <div
                  key={pref.key}
                  className={`flex items-center justify-between py-4 gap-4 ${i !== 0 ? 'border-t border-white/10' : ''}`}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-text-primary">{pref.label}</div>
                    <div className="text-text-secondary text-sm">{pref.desc}</div>
                  </div>
                  <button
                    onClick={() => setEmailPrefs((p) => ({ ...p, [pref.key]: !p[pref.key] }))}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      emailPrefs[pref.key] ? 'bg-primary' : 'bg-surface'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        emailPrefs[pref.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <Button onClick={saveEmailPrefs} loading={saving} className="mt-6">
              {saving ? "Saving…" : "Save Preferences"}
            </Button>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
