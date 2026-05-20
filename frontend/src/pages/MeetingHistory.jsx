import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Video, Clock, MessageSquare, FileText, RefreshCw, Crown, User, Filter } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function MeetingHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    fetchHistory(token);
  }, [navigate]);

  const fetchHistory = async (token) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("${import.meta.env.VITE_API_URL}/api/logs/history", {
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
    { label: "Meetings Attended", value: stats.totalMeetings ?? 0, icon: Video, color: "primary" },
    { label: "Total Hours", value: stats.totalHours ?? "0h", icon: Clock, color: "accent" },
    { label: "Messages Sent", value: stats.totalMessages ?? 0, icon: MessageSquare, color: "secondary" },
    { label: "Files Shared", value: stats.totalFiles ?? 0, icon: FileText, color: "warning" },
  ];

  const filterOptions = [
    { id: "all", label: "All Meetings" },
    { id: "hosted", label: "Hosted by me" },
    { id: "joined", label: "Joined" },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-text-primary font-display mb-2">Meeting History</h1>
          <p className="text-text-secondary">Your complete meeting activity log</p>
        </div>
        <Button onClick={() => fetchHistory(localStorage.getItem("token"))} variant="ghost" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card hover className="relative overflow-hidden">
                <div className={`w-12 h-12 rounded-xl bg-${card.color}/20 flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 text-${card.color}`} />
                </div>
                <div className="text-3xl font-bold text-text-primary font-display mb-1">{card.value}</div>
                <div className="text-sm text-text-secondary font-medium">{card.label}</div>
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-${card.color}`} />
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold text-text-primary font-display flex items-center gap-3">
            {filter === "all" ? "All Meetings" : filter === "hosted" ? "Meetings I Hosted" : "Meetings I Joined"}
            <span className="bg-surface px-3 py-1 rounded-full text-text-muted text-sm font-semibold">
              {filtered.length}
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-text-muted" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {filterOptions.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading history…</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <p className="font-semibold text-text-primary mb-1">No meetings found</p>
            <p className="text-text-secondary text-sm">Your meeting history will appear here</p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Meeting</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Duration</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Messages</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Files</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Role</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">Participants</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="font-semibold text-text-primary">{m.title}</div>
                      <div className="text-xs text-text-muted font-mono">{m.meeting_code}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-text-primary">{formatDate(m.meeting_date)}</div>
                      <div className="text-xs text-text-muted">{m.start_time?.slice(0, 5)} – {m.end_time?.slice(0, 5)}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-sm font-semibold">
                        {formatDuration(m.duration_minutes)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-surface px-3 py-1 rounded-lg text-sm font-semibold text-text-primary">
                        {m.message_count ?? 0}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-surface px-3 py-1 rounded-lg text-sm font-semibold text-text-primary">
                        {m.file_count ?? 0}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        m.isHost ? 'bg-warning/20 text-warning' : 'bg-secondary/20 text-secondary'
                      }`}>
                        {m.isHost ? (
                          <><Crown className="w-3 h-3 inline mr-1" /> Host</>
                        ) : (
                          <><User className="w-3 h-3 inline mr-1" /> Member</>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-surface px-3 py-1 rounded-lg text-sm font-semibold text-text-primary">
                        {m.participant_count ?? 1}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
