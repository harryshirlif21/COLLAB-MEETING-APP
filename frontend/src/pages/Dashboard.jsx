import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import { Video, Link as LinkIcon, Calendar, Clock, MessageSquare, FileText, Plus, ArrowRight } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";

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

    socketRef.current = io("http://localhost:5000", {
      auth: { token },
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => console.log("[SOCKET] Connected:", socketRef.current.id));
    socketRef.current.on("disconnect", () => console.log("[SOCKET] Disconnected"));

    return () => socketRef.current.disconnect();
  }, [navigate]);

  const fetchStats = async (token) => {
    try {
      const res = await fetch("http://localhost:5000/api/logs/stats", {
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
      const res = await fetch("http://localhost:5000/api/meetings", {
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

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  };

  const statCards = [
    { label: "Meetings Attended", value: stats.meetings ?? 0, icon: Video, color: "primary" },
    { label: "Hours in Meetings", value: stats.hours ?? 0, icon: Clock, color: "accent" },
    { label: "Messages Sent", value: stats.messages ?? 0, icon: MessageSquare, color: "secondary" },
    { label: "Files Shared", value: stats.files ?? 0, icon: FileText, color: "danger" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-text-primary font-display mb-2">
          Good {getGreeting()}, {user?.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="text-text-secondary">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Create Meeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card hover className="h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Video className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary font-display">New Meeting</h3>
            </div>
            <p className="text-text-secondary text-sm mb-6 flex-1">Schedule a meeting and invite participants</p>
            <Button onClick={() => setShowModal(true)} className="w-full">
              <Plus className="w-4 h-4" />
              Create Meeting
            </Button>
          </Card>
        </motion.div>

        {/* Join Meeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card hover className="h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-text-primary font-display">Join Meeting</h3>
            </div>
            <p className="text-text-secondary text-sm mb-4 flex-1">Enter a meeting code to join instantly</p>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Enter meeting code…"
                value={meetingId}
                onChange={e => setMeetingId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && joinMeeting()}
              />
              <Button 
                onClick={joinMeeting} 
                disabled={!meetingId.trim()}
                variant="accent"
                className="w-full"
              >
                Join Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* All Meetings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <Card 
            hover 
            className="h-full flex flex-col bg-gradient-to-br from-primary to-primary-hover border-0"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white font-display">All Meetings</h3>
            </div>
            <p className="text-white/75 text-sm mb-6 flex-1">View and manage all your scheduled meetings</p>
            <Button 
              onClick={() => navigate("/meetings")}
              variant="ghost"
              className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              View Meetings
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>
        </motion.div>
      </div>

      {/* Create Meeting Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setMeetingError(""); }}
        title="Create Meeting"
        size="md"
      >
        {meetingError && (
          <div className="mb-4 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm">
            {meetingError}
          </div>
        )}
        <div className="space-y-4">
          <Input
            type="text"
            label="Meeting Title"
            value={meetingTitle}
            onChange={e => setMeetingTitle(e.target.value)}
          />
          <Input
            type="date"
            label="Date"
            value={meetingDate}
            onChange={e => setMeetingDate(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="time"
              label="Start Time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
            />
            <Input
              type="time"
              label="End Time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreateMeeting} loading={creating} className="flex-1">
              {creating ? "Creating…" : "Create Meeting"}
            </Button>
            <Button 
              onClick={() => { setShowModal(false); setMeetingError(""); }}
              variant="ghost"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Dashboard;
