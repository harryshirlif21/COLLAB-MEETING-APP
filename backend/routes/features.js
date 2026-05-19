const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const attendanceController = require("../controllers/attendanceController");
const analyticsController = require("../controllers/analyticsController");
const authMiddleware = require("../middleware/authMiddleware");

// Chat endpoints
router.get("/:meetingId/chat", authMiddleware, chatController.getChatHistory);
router.post("/:meetingId/chat", authMiddleware, chatController.sendMessage);
router.put("/:meetingId/chat/:messageId", authMiddleware, chatController.editMessage);
router.delete("/:meetingId/chat/:messageId", authMiddleware, chatController.deleteMessage);

// Attendance endpoints
router.get("/:meetingId/attendance", authMiddleware, attendanceController.getAttendance);

// Analytics endpoints
router.get("/:meetingId/analytics", authMiddleware, analyticsController.getMeetingAnalytics);
router.get("/:meetingId/analytics/:userId", authMiddleware, analyticsController.getParticipantAnalytics);

module.exports = router;
