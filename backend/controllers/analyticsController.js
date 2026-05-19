const MeetingEvent = require("../models/MeetingEvent");
const AttendanceLog = require("../models/AttendanceLog");
const ChatMessage = require("../models/ChatMessage");
const Meeting = require("../models/Meeting");
const User = require("../models/User");

/**
 * GET /api/meetings/:id/analytics/:userId
 * Get detailed analytics for a participant
 */
exports.getParticipantAnalytics = async (req, res) => {
  const { id, userId } = req.params;
  const userIdFromToken = req.user?.id;

  try {
    const meeting = await Meeting.findOne({ where: { id } });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    // Check authorization (host only)
    if (meeting.created_by !== userIdFromToken) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get attendance
    const attendance = await AttendanceLog.findOne({
      where: { meeting_id: id, user_id: userId },
    });

    // Get events
    const events = await MeetingEvent.findAll({
      where: { meeting_id: id, user_id: userId },
    });

    // Count messages
    const messageCount = await ChatMessage.count({
      where: { meeting_id: id, user_id: userId, deleted_at: null },
    });

    // Calculate metrics
    const speakEvents = events.filter((e) => e.event_type === "speak");
    const reactionEvents = events.filter((e) => e.event_type === "reaction");
    const handRaiseEvents = events.filter((e) => e.event_type === "hand_raise");
    const fileShareEvents = events.filter((e) => e.event_type === "file_share");

    let speakingTimeSeconds = 0;
    speakEvents.forEach((e) => {
      if (e.event_data?.duration_seconds) {
        speakingTimeSeconds += e.event_data.duration_seconds;
      }
    });

    const analytics = {
      user_id: userId,
      attendance_duration_minutes: attendance
        ? (new Date(attendance.left_at || new Date()) - new Date(attendance.joined_at)) / (1000 * 60)
        : 0,
      speaking_time_seconds: speakingTimeSeconds,
      message_count: messageCount,
      hand_raises: handRaiseEvents.length,
      reactions_sent: reactionEvents.length,
      files_shared: fileShareEvents.length,
    };

    res.json({ success: true, analytics });
  } catch (err) {
    console.error("[ANALYTICS ERROR]", err.message);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/meetings/:id/analytics
 * Get aggregated analytics for all participants
 */
exports.getMeetingAnalytics = async (req, res) => {
  const { id } = req.params;
  const userIdFromToken = req.user?.id;

  try {
    const meeting = await Meeting.findOne({ where: { id } });

    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    // Check authorization (host only)
    if (meeting.created_by !== userIdFromToken) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get all attendees
    const attendances = await AttendanceLog.findAll({
      where: { meeting_id: id },
      attributes: ["user_id"],
      raw: true,
    });

    const participantIds = [...new Set(attendances.map((a) => a.user_id))];

    // Build analytics for each
    const analytics = [];

    for (const participantId of participantIds) {
      const user = await User.findOne({
        where: { id: participantId },
        attributes: ["id", "name", "email"],
      });

      const attendance = await AttendanceLog.findOne({
        where: { meeting_id: id, user_id: participantId },
      });

      const events = await MeetingEvent.findAll({
        where: { meeting_id: id, user_id: participantId },
      });

      const messageCount = await ChatMessage.count({
        where: { meeting_id: id, user_id: participantId, deleted_at: null },
      });

      analytics.push({
        user_id: participantId,
        user_name: user?.name,
        duration_minutes: attendance
          ? (new Date(attendance.left_at || new Date()) - new Date(attendance.joined_at)) / (1000 * 60)
          : 0,
        messages: messageCount,
        events: events.length,
      });
    }

    res.json({ success: true, analytics });
  } catch (err) {
    console.error("[MEETING ANALYTICS ERROR]", err.message);
    res.status(500).json({ error: err.message });
  }
};
