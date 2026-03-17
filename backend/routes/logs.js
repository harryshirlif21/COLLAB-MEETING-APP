const express  = require("express");
const router   = express.Router();
const auth     = require("../middleware/authMiddleware");
const Meeting  = require("../models/Meeting");
const MeetingParticipant = require("../models/MeetingParticipant");
const { Op }   = require("sequelize");

// ── In-memory log capture (kept from original) ───────────────
let logs = [];
if (!console._logPatched) {
  const origLog   = console.log;
  const origError = console.error;
  console.log = function (...args) {
    logs.push(`[LOG] ${args.map(String).join(" ")}`);
    if (logs.length > 100) logs.shift();
    origLog.apply(console, args);
  };
  console.error = function (...args) {
    logs.push(`[ERROR] ${args.map(String).join(" ")}`);
    if (logs.length > 100) logs.shift();
    origError.apply(console, args);
  };
  console._logPatched = true;
}

// GET /api/logs  — raw console logs (original)
router.get("/", (req, res) => {
  res.json({ logs: logs.slice(-50).reverse() });
});

// GET /api/logs/stats  — dashboard summary numbers
router.get("/stats", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    // Count meetings this user participated in
    const totalMeetings = await MeetingParticipant.count({
      where: { user_id: userId },
    });

    // Get all meetings to calculate hours
    const participations = await MeetingParticipant.findAll({
      where: { user_id: userId },
      include: [{
        model: Meeting,
        attributes: ["start_time", "end_time"],
      }],
    });

    let totalMinutes = 0;
    participations.forEach((p) => {
      if (p.meeting?.start_time && p.meeting?.end_time) {
        const [sh, sm] = p.meeting.start_time.split(":").map(Number);
        const [eh, em] = p.meeting.end_time.split(":").map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff > 0) totalMinutes += diff;
      }
    });

    res.json({
      stats: {
        meetings: totalMeetings,
        hours:    `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
        messages: 0, // extend when messages table has user_id
        files:    0, // extend when files table exists
      },
    });
  } catch (err) {
    console.error("[STATS ERROR]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logs/history  — full meeting history for the user
router.get("/history", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    // All meetings this user joined
    const participations = await MeetingParticipant.findAll({
      where: { user_id: userId },
      include: [{
        model: Meeting,
        attributes: ["id", "title", "meeting_code", "meeting_date", "start_time", "end_time", "created_by"],
      }],
      order: [[Meeting, "meeting_date", "DESC"]],
    });

    const history = participations
      .filter((p) => p.meeting) // skip orphans
      .map((p) => {
        const m = p.meeting;

        // Calculate duration in minutes
        let duration_minutes = null;
        if (m.start_time && m.end_time) {
          const [sh, sm] = m.start_time.split(":").map(Number);
          const [eh, em] = m.end_time.split(":").map(Number);
          const diff = (eh * 60 + em) - (sh * 60 + sm);
          if (diff > 0) duration_minutes = diff;
        }

        return {
          id:                m.id,
          title:             m.title,
          meeting_code:      m.meeting_code,
          meeting_date:      m.meeting_date,
          start_time:        m.start_time,
          end_time:          m.end_time,
          duration_minutes,
          isHost:            m.created_by === userId,
          participant_count: 1, // extend with a COUNT subquery when needed
          message_count:     0, // extend when messages table has meeting_id
          file_count:        0, // extend when files table exists
        };
      });

    // Summary stats
    const totalMeetings  = history.length;
    const totalMinutes   = history.reduce((acc, m) => acc + (m.duration_minutes || 0), 0);
    const totalHours     = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
    const totalMessages  = 0;
    const totalFiles     = 0;

    res.json({
      history,
      stats: { totalMeetings, totalHours, totalMessages, totalFiles },
    });
  } catch (err) {
    console.error("[HISTORY ERROR]", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;