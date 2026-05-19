const AttendanceLog = require("../models/AttendanceLog");
const Meeting = require("../models/Meeting");
const MeetingParticipant = require("../models/MeetingParticipant");
const User = require("../models/User");

/**
 * GET /api/meetings/:id/attendance
 * Get attendance report for meeting
 */
exports.getAttendance = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const meeting = await Meeting.findOne({
      where: { id },
      include: [
        {
          model: MeetingParticipant,
          as: "participants",
          attributes: ["user_id"],
        },
      ],
    });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    // Check if user is host or participant
    const isHost = meeting.created_by === userId;
    const isParticipant = meeting.participants.some((p) => p.user_id === userId);

    if (!isHost && !isParticipant) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get attendance logs
    const logs = await AttendanceLog.findAll({
      where: { meeting_id: id },
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["joined_at", "ASC"]],
    });

    const attendance = logs.map((log) => {
      const duration = log.left_at
        ? (new Date(log.left_at) - new Date(log.joined_at)) / (1000 * 60)
        : (new Date() - new Date(log.joined_at)) / (1000 * 60);

      return {
        user_id: log.user_id,
        user_name: log.user?.name,
        user_email: log.user?.email,
        joined_at: log.joined_at,
        left_at: log.left_at,
        duration_minutes: Math.round(duration),
      };
    });

    res.json({ success: true, attendance });
  } catch (err) {
    console.error("[ATTENDANCE ERROR]", err.message);
    res.status(500).json({ error: err.message });
  }
};
