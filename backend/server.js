require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");

const authRoutes    = require("./routes/auth");
const meetingRoutes = require("./routes/meetingRoutes");
const logsRoutes    = require("./routes/logs");
const profileRoutes = require("./routes/profile");
const featuresRoutes = require("./routes/features");

const User               = require("./models/User");
const Meeting            = require("./models/Meeting");
const MeetingParticipant = require("./models/MeetingParticipant");
const ChatMessage        = require("./models/ChatMessage");
const AttendanceLog      = require("./models/AttendanceLog");
const MeetingEvent       = require("./models/MeetingEvent");
const MeetingRecording   = require("./models/MeetingRecording");
const MeetingSettings    = require("./models/MeetingSettings");
const HandRaiseQueue     = require("./models/HandRaiseQueue");
const WaitingRoomRequest = require("./models/WaitingRoomRequest");

const http = require("http");
const { Server } = require("socket.io");
const jwt  = require("jsonwebtoken");

const app = express();

/* ================= ASSOCIATIONS ================= */
User.belongsToMany(Meeting, { through: MeetingParticipant, foreignKey: "user_id" });
Meeting.belongsToMany(User, { through: MeetingParticipant, foreignKey: "meeting_id" });
Meeting.hasMany(MeetingParticipant, { as: "participants", foreignKey: "meeting_id" });
MeetingParticipant.belongsTo(Meeting, { foreignKey: "meeting_id" });

Meeting.hasMany(ChatMessage, { foreignKey: "meeting_id" });
ChatMessage.belongsTo(User, { foreignKey: "user_id" });
ChatMessage.belongsTo(Meeting, { foreignKey: "meeting_id" });

Meeting.hasMany(AttendanceLog, { foreignKey: "meeting_id" });
AttendanceLog.belongsTo(User, { foreignKey: "user_id" });
AttendanceLog.belongsTo(Meeting, { foreignKey: "meeting_id" });

Meeting.hasMany(MeetingEvent, { foreignKey: "meeting_id" });
MeetingEvent.belongsTo(User, { foreignKey: "user_id" });
MeetingEvent.belongsTo(Meeting, { foreignKey: "meeting_id" });

Meeting.hasMany(MeetingRecording, { foreignKey: "meeting_id" });
MeetingRecording.belongsTo(Meeting, { foreignKey: "meeting_id" });

Meeting.hasOne(MeetingSettings, { foreignKey: "meeting_id" });
MeetingSettings.belongsTo(Meeting, { foreignKey: "meeting_id" });

Meeting.hasMany(HandRaiseQueue, { foreignKey: "meeting_id" });
HandRaiseQueue.belongsTo(User, { foreignKey: "user_id" });
HandRaiseQueue.belongsTo(Meeting, { foreignKey: "meeting_id" });

Meeting.hasMany(WaitingRoomRequest, { foreignKey: "meeting_id" });
WaitingRoomRequest.belongsTo(User, { foreignKey: "user_id" });
WaitingRoomRequest.belongsTo(Meeting, { foreignKey: "meeting_id" });

/* ================= CORS ================= */
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
      "http://localhost:9090",
    ];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

/* ================= MIDDLEWARE ================= */
app.use(express.json({ limit: "10mb" }));

/* ================= HEALTH CHECK ================= */
app.get("/api/ping", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

/* ================= ROUTES ================= */
app.use("/api/auth",     authRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/meetings", featuresRoutes);
app.use("/api/logs",     logsRoutes);
app.use("/api/profile",  profileRoutes);

/* ================= DATABASE (with retry) ================= */
const connectWithRetry = async (retries = 10, delay = 3000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await sequelize.authenticate();
      console.log("DB authenticated successfully");
      await sequelize.sync({ alter: true });
      console.log("DB synced successfully");
      return;
    } catch (err) {
      console.error(`DB connection attempt ${i}/${retries} failed:`, err.message);
      if (i === retries) {
        console.error("Could not connect to DB after all retries. Exiting.");
        process.exit(1);
      }
      console.log(`Retrying in ${delay / 1000}s...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

connectWithRetry();

/* ================= SERVER ================= */
const server = http.createServer(app);

/* ================= SOCKET.IO ================= */
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[SOCKET CORS] Blocked origin: ${origin}`);
        callback(new Error(`CORS policy: origin ${origin} not allowed`));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

/* ================= SOCKET.IO AUTH ================= */
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

/* ================= SOCKET.IO EVENTS ================= */
const setupSocketHandlers = require("./socketHandlers");
setupSocketHandlers(io);

/* ================= START ================= */
server.listen(5000, "0.0.0.0", () => {
  console.log("Server running on http://0.0.0.0:5000");
});