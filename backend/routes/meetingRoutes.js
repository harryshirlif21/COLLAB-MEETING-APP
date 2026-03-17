const express = require("express");
const router = express.Router();
const meetingController = require("../controllers/meetingController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, meetingController.createMeeting);
router.get("/", authMiddleware, meetingController.getMeetings);

// ✅ ADDED: missing join route the frontend POSTs to
router.post("/join/:code", authMiddleware, meetingController.joinMeeting);

module.exports = router;