/**
 * Socket.IO Event Handlers
 * Handles real-time events: chat, attendance, hand raise, recordings, etc.
 */

const Meeting = require("./models/Meeting");
const MeetingSettings = require("./models/MeetingSettings");
const ChatMessage = require("./models/ChatMessage");
const AttendanceLog = require("./models/AttendanceLog");
const MeetingEvent = require("./models/MeetingEvent");
const HandRaiseQueue = require("./models/HandRaiseQueue");
const WaitingRoomRequest = require("./models/WaitingRoomRequest");

async function resolveMeetingByCode(code) {
  if (!code) return null;
  return Meeting.findOne({
    where: { meeting_code: code },
    include: [{ model: MeetingSettings, foreignKey: "meeting_id", attributes: ["enable_waiting_room"] }],
  });
}

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`[SOCKET] Connected: ${socket.id} (user: ${socket.user?.id})`);

    // ================= MEETING ROOM MANAGEMENT =================
    socket.on("join-meeting", async (code) => {
      const meeting = await resolveMeetingByCode(code);
      if (!meeting) return socket.emit("meeting-error", { error: "Meeting not found" });

      if (meeting.MeetingSetting?.enable_waiting_room) {
        return socket.emit("meeting-waiting-room", { message: "Waiting room enabled" });
      }

      socket.join(code);
      socket.meetingCode = code;
      socket.meetingId = meeting.id;

      // Broadcast new user joined
      socket.to(code).emit("user-joined", socket.id);

      // Send existing users to new joiner
      const room = io.sockets.adapter.rooms.get(code);
      const existingUsers = room ? [...room].filter((id) => id !== socket.id) : [];
      socket.emit("meeting-users", existingUsers);

      // Log attendance
      try {
        await AttendanceLog.create({
          meeting_id: meeting.id,
          user_id: socket.user?.id,
          joined_at: new Date(),
        });
      } catch (err) {
        console.error("[ATTENDANCE] Failed to log join:", err.message);
      }

      console.log(`[MEETING] User ${socket.id} joined meeting ${code}`);
    });

    // ================= CHAT MESSAGES =================
    socket.on("chat-message", async ({ code, text, timestamp }) => {
      if (!code || !text?.trim()) return;
      const meeting = await resolveMeetingByCode(code);
      if (!meeting) return;

      try {
        // Persist to database
        const message = await ChatMessage.create({
          meeting_id: meeting.id,
          user_id: socket.user?.id,
          content: text.trim(),
        });

        // Broadcast to meeting room
        io.to(code).emit("chat-message", {
          message_id: message.id,
          sender: socket.user?.name || `User ${socket.user?.id}`,
          sender_id: socket.user?.id,
          text: text.trim(),
          timestamp: message.created_at,
        });

        // Track event
        await MeetingEvent.create({
          meeting_id: meeting.id,
          user_id: socket.user?.id,
          event_type: "message",
          event_data: { message_id: message.id },
        });
      } catch (err) {
        console.error("[CHAT] Error:", err.message);
      }
    });

    socket.on("chat-message-delete", async ({ code, message_id }) => {
      try {
        await ChatMessage.update(
          { deleted_at: new Date() },
          { where: { id: message_id, user_id: socket.user?.id } }
        );
        io.to(code).emit("chat-message-deleted", { message_id });
      } catch (err) {
        console.error("[CHAT DELETE] Error:", err.message);
      }
    });

    socket.on("chat-message-edit", async ({ code, message_id, new_content }) => {
      try {
        await ChatMessage.update(
          { content: new_content.trim(), edited_at: new Date() },
          { where: { id: message_id, user_id: socket.user?.id } }
        );
        io.to(code).emit("chat-message-edited", { message_id, new_content, edited_at: new Date() });
      } catch (err) {
        console.error("[CHAT EDIT] Error:", err.message);
      }
    });

    socket.on("user-typing", ({ code, user_name }) => {
      socket.to(code).emit("user-typing", { user_id: socket.id, user_name });
    });

    // ================= HAND RAISE QUEUE =================
    socket.on("raise-hand", async ({ code }) => {
      try {
        // Get next queue position
        const maxPosition = await HandRaiseQueue.max("queue_position", {
          where: { meeting_id: null },
        });
        const nextPosition = (maxPosition || 0) + 1;

        await HandRaiseQueue.create({
          meeting_id: null,
          user_id: socket.user?.id,
          queue_position: nextPosition,
          raised_at: new Date(),
        });

        io.to(code).emit("hand-raised", { userId: socket.id, queue_position: nextPosition });
      } catch (err) {
        console.error("[HAND RAISE] Error:", err.message);
      }
    });

    socket.on("lower-hand", ({ code }) => {
      io.to(code).emit("hand-lowered", { userId: socket.id });
    });

    socket.on("hand-raise-approve", async ({ code, user_id }) => {
      try {
        await HandRaiseQueue.update(
          { status: "approved", approved_at: new Date() },
          { where: { user_id, meeting_id: null } }
        );
        io.to(code).emit("hand-raise-approved", { user_id });
      } catch (err) {
        console.error("[HAND APPROVE] Error:", err.message);
      }
    });

    // ================= SCREEN SHARING =================
    socket.on("screen-share-started", ({ code }) => {
      socket.to(code).emit("screen-share-started", { userId: socket.id });
    });

    socket.on("screen-share-stopped", ({ code }) => {
      socket.to(code).emit("screen-share-stopped", { userId: socket.id });
    });

    // ================= REACTIONS =================
    socket.on("reaction", ({ code, emoji }) => {
      io.to(code).emit("reaction", { emoji, userId: socket.id });
      // Track event
      MeetingEvent.create({
        meeting_id: null,
        user_id: socket.user?.id,
        event_type: "reaction",
        event_data: { emoji },
      }).catch(console.error);
    });

    // ================= FILE SHARING =================
    socket.on("file-uploaded", ({ code, file_id, filename, file_size }) => {
      io.to(code).emit("file-uploaded", {
        file_id,
        filename,
        uploaded_by: socket.user?.name,
        timestamp: new Date(),
      });
    });

    // ================= SLIDES =================
    socket.on("slide-update", ({ code, slides, index }) => {
      socket.to(code).emit("slide-update", { slides, index });
    });

    socket.on("slide-navigate", ({ code, index }) => {
      socket.to(code).emit("slide-navigate", { index });
    });

    socket.on("slides-closed", ({ code }) => {
      socket.to(code).emit("slides-closed");
    });

    // ================= BREAKOUT ROOMS =================
    socket.on("create-breakout-rooms", ({ code, numRooms, duration }) => {
      const rooms = Array.from({ length: numRooms }, (_, i) => ({
        id: `${code}-room-${i + 1}`,
        name: `Room ${i + 1}`,
        members: [],
      }));
      if (!io.breakoutRooms) io.breakoutRooms = {};
      io.breakoutRooms[code] = rooms;
      io.to(code).emit("breakout-rooms-created", { rooms, duration });
    });

    socket.on("join-breakout-room", ({ code, roomId }) => {
      const rooms = io.breakoutRooms?.[code];
      if (!rooms) return;
      rooms.forEach((r) => {
        r.members = r.members.filter((m) => m !== socket.id);
      });
      const room = rooms.find((r) => r.id === roomId);
      if (room) room.members.push(socket.id);
      socket.emit("breakout-join-ack", { roomId });
      io.to(code).emit("breakout-rooms-update", { rooms });
    });

    socket.on("end-breakout-rooms", ({ code }) => {
      if (io.breakoutRooms) delete io.breakoutRooms[code];
      io.to(code).emit("breakout-ended");
    });

    // ================= WEBRTC SIGNALING =================
    socket.on("signal", ({ to, offer, answer, candidate }) => {
      if (!to) return;
      io.to(to).emit("signal", { from: socket.id, offer, answer, candidate });
    });

    // ================= RECORDING =================
    socket.on("recording-started", ({ code }) => {
      io.to(code).emit("recording-started", { timestamp: new Date() });
    });

    socket.on("recording-stopped", ({ code, duration_seconds }) => {
      io.to(code).emit("recording-stopped", { duration_seconds });
    });

    // ================= DISCONNECT =================
    socket.on("disconnecting", () => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit("user-left", socket.id);
        }
      }

      // Log attendance
      if (socket.meetingCode && socket.meetingId) {
        AttendanceLog.update(
          { left_at: new Date() },
          {
            where: {
              user_id: socket.user?.id,
              meeting_id: socket.meetingId,
              left_at: null,
            },
          }
        ).catch(console.error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[SOCKET] Disconnected: ${socket.id}`);
    });
  });
};

