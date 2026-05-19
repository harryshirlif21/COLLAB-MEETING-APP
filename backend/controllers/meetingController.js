const bcrypt = require("bcrypt");
const { Op } = require("sequelize");
const Meeting = require("../models/Meeting");
const MeetingParticipant = require("../models/MeetingParticipant");
const MeetingSettings = require("../models/MeetingSettings");

/* ─────────────────────────────────────────
   POST /api/meetings  – create a meeting
───────────────────────────────────────── */
exports.createMeeting = async (req, res) => {
  console.log("[CREATE MEETING] Request received");

  const { title, meeting_date, start_time, end_time, meeting_password, enable_waiting_room, enable_lecture_mode, description } = req.body;
  const userId = req.user?.id;

  if (!userId)
    return res.status(401).json({ error: "Authentication required" });

  if (!title?.trim() || !meeting_date || !start_time || !end_time)
    return res.status(400).json({ error: "All fields are required" });

  if (start_time >= end_time)
    return res.status(400).json({ error: "End time must be after start time" });

  try {
    let meetingCode;
    let attempts = 0;

    do {
      if (attempts >= 10)
        return res.status(500).json({ error: "Failed to generate unique meeting code" });
      meetingCode = Math.random().toString(36).substring(2, 12).toUpperCase();
      attempts++;
    } while (await Meeting.findOne({ where: { meeting_code: meetingCode } }));

    const meeting = await Meeting.create({
      title: title.trim(),
      meeting_code: meetingCode,
      meeting_date,
      start_time,
      end_time,
      created_by: userId,
    });

    await MeetingSettings.create({
      meeting_id: meeting.id,
      meeting_password: meeting_password ? await bcrypt.hash(meeting_password, 10) : null,
      enable_waiting_room: !!enable_waiting_room,
      enable_lecture_mode: !!enable_lecture_mode,
      description: description?.trim() || null,
    });

    // Creator automatically becomes a participant
    await MeetingParticipant.create({
      user_id: userId,
      meeting_id: meeting.id,
    });

    console.log("[CREATE] Meeting created → ID:", meeting.id);

    res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      meeting: {
        id: meeting.id,
        meetingCode: meeting.meeting_code,
        title: meeting.title,
        meetingDate: meeting.meeting_date,
        startTime: meeting.start_time,
        endTime: meeting.end_time,
        createdBy: meeting.created_by,
        createdAt: meeting.created_at,
      },
    });
  } catch (err) {
    console.error("[CREATE ERROR]:", err.message);
    if (err.name === "SequelizeUniqueConstraintError")
      return res.status(409).json({ error: "Meeting code conflict – please try again" });
    res.status(500).json({ error: "Failed to create meeting", message: err.message });
  }
};

/* ─────────────────────────────────────────
   GET /api/meetings  – list meetings
───────────────────────────────────────── */
exports.getMeetings = async (req, res) => {
  console.log("[GET MEETINGS] User:", req.user?.id);

  try {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentTime = now.toTimeString().slice(0, 8);

    const meetings = await Meeting.findAll({
      where: {
        [Op.or]: [
          { meeting_date: todayStr, end_time: { [Op.gt]: currentTime } },
          { meeting_date: { [Op.gt]: todayStr } },
        ],
      },
      order: [
        ["meeting_date", "ASC"],
        ["start_time", "ASC"],
      ],
      attributes: ["id", "title", "meeting_code", "meeting_date", "start_time", "end_time", "created_by", "created_at"],
      include: [
        {
          model: MeetingParticipant,
          as: "participants",
          attributes: ["user_id"],
        },
      ],
    });

    const userId = req.user?.id;

    const enhancedMeetings = meetings.map((meeting) => ({
      ...meeting.get({ plain: true }),
      isJoined: meeting.participants?.some((p) => p.user_id === userId) || false,
    }));

    res.json({ success: true, meetings: enhancedMeetings });
  } catch (err) {
    console.error("[GET MEETINGS ERROR]:", err.message);
    res.status(500).json({ error: "Failed to fetch meetings", message: err.message });
  }
};

/* ─────────────────────────────────────────
   POST /api/meetings/join/:code  – join
───────────────────────────────────────── */
exports.joinMeeting = async (req, res) => {
  const userId = req.user?.id;
  const { code } = req.params;

  console.log(`[JOIN MEETING] User ${userId} joining code: ${code}`);

  if (!userId)
    return res.status(401).json({ error: "Authentication required" });

  try {
    // 1. Find the meeting by code, include access settings
    const meeting = await Meeting.findOne({
      where: { meeting_code: code },
      include: [
        {
          model: MeetingSettings,
          foreignKey: "meeting_id",
          attributes: ["meeting_password", "enable_waiting_room", "enable_lecture_mode"],
        },
      ],
    });

    if (!meeting)
      return res.status(404).json({ error: "Meeting not found" });

    if (meeting.MeetingSetting?.meeting_password) {
      const providedPassword = req.body?.meeting_password || req.query?.meeting_password;
      if (!providedPassword || !(await bcrypt.compare(providedPassword, meeting.MeetingSetting.meeting_password))) {
        return res.status(401).json({ error: "Invalid meeting password" });
      }
    }

    if (meeting.MeetingSetting?.enable_waiting_room) {
      const existingParticipant = await MeetingParticipant.findOne({
        where: { user_id: userId, meeting_id: meeting.id },
      });
      if (!existingParticipant) {
        return res.status(403).json({ error: "Waiting room enabled. Please request access." });
      }
    }

    // 2. Check meeting is still active (not ended)
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentTime = now.toTimeString().slice(0, 8);
    const meetingDate = meeting.meeting_date;

    const isFuture = meetingDate > todayStr;
    const isToday = meetingDate === todayStr;
    const hasNotEnded = meeting.end_time > currentTime;

    if (!isFuture && !(isToday && hasNotEnded)) {
      return res.status(403).json({ error: "This meeting has already ended" });
    }

    // 3. Upsert participant — safe if already joined (unique index prevents duplicates)
    await MeetingParticipant.findOrCreate({
      where: {
        user_id: userId,
        meeting_id: meeting.id,
      },
    });

    console.log(`[JOIN] User ${userId} joined meeting ${meeting.id}`);

    res.json({
      success: true,
      meeting: {
        id: meeting.id,
        title: meeting.title,
        meetingCode: meeting.meeting_code,
        meetingDate: meeting.meeting_date,
        startTime: meeting.start_time,
        endTime: meeting.end_time,
        waitingRoomEnabled: meeting.MeetingSetting?.enable_waiting_room || false,
        lectureModeEnabled: meeting.MeetingSetting?.enable_lecture_mode || false,
        passwordProtected: !!meeting.MeetingSetting?.meeting_password,
      },
    });
  } catch (err) {
    console.error("[JOIN ERROR]:", err.message);
    res.status(500).json({ error: "Failed to join meeting", message: err.message });
  }
};