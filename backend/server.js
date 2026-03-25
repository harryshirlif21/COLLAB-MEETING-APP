require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");

const authRoutes    = require("./routes/auth");
const meetingRoutes = require("./routes/meetingRoutes");
const logsRoutes    = require("./routes/logs");
const profileRoutes = require("./routes/profile");

const User               = require("./models/User");
const Meeting            = require("./models/Meeting");
const MeetingParticipant = require("./models/MeetingParticipant");

const fs   = require("fs");
const https = require("https");
const http  = require("http");
const { Server } = require("socket.io");
const jwt  = require("jsonwebtoken");
const path = require("path");

const app = express();

/* ================= ASSOCIATIONS ================= */
User.belongsToMany(Meeting, { through: MeetingParticipant, foreignKey: "user_id" });
Meeting.belongsToMany(User, { through: MeetingParticipant, foreignKey: "meeting_id" });
Meeting.hasMany(MeetingParticipant, { as: "participants", foreignKey: "meeting_id" });
MeetingParticipant.belongsTo(Meeting, { foreignKey: "meeting_id" });

/* ================= CORS ================= */
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["https://localhost:5173", "https://DESKTOP-I80NJCN:5173", "https://10.3.17.30:5173"];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

/* ================= MIDDLEWARE ================= */
app.use(express.json({ limit: "10mb" }));

/* ================= HEALTH CHECK ================= */
app.get("/api/ping", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

/* ================= ROUTES ================= */
app.use("/api/auth",     authRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/logs",     logsRoutes);
app.use("/api/profile",  profileRoutes);

/* ================= DATABASE ================= */
sequelize.sync({ alter: true })
  .then(() => console.log("Database connected"))
  .catch((err) => console.error("DB connection error:", err));

/* ================= SERVER (HTTP or HTTPS) ================= */
let server;

if (process.env.USE_HTTP === "true") {
  server = http.createServer(app);
} else {
  const sslOptions = {
    pfx: fs.readFileSync(process.env.SSL_PFX_PATH || "C:/certs/collab-dev.pfx"),
    passphrase: process.env.SSL_PASSPHRASE || "mypassword",
  };
  server = https.createServer(sslOptions, app);
}

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
io.on("connection", (socket) => {
  console.log(`[SOCKET] Connected: ${socket.id} (user: ${socket.user?.id})`);

  socket.on("join-meeting", (code) => {
    socket.join(code);
    socket.to(code).emit("user-joined", socket.id);
    const room = io.sockets.adapter.rooms.get(code);
    const existingUsers = room ? [...room].filter((id) => id !== socket.id) : [];
    socket.emit("meeting-users", existingUsers);
  });

  socket.on("signal", ({ to, offer, answer, candidate }) => {
    if (!to) return;
    io.to(to).emit("signal", { from: socket.id, offer, answer, candidate });
  });

  socket.on("chat-message", ({ code, text, timestamp }) => {
    if (!code || !text?.trim()) return;
    io.to(code).emit("chat-message", {
      sender: socket.user?.username || socket.user?.name || `User ${socket.user?.id}`,
      text: text.trim(),
      timestamp: timestamp || new Date().toISOString(),
    });
  });

  socket.on("screen-share-started", ({ code }) => socket.to(code).emit("screen-share-started", { userId: socket.id }));
  socket.on("screen-share-stopped", ({ code }) => socket.to(code).emit("screen-share-stopped", { userId: socket.id }));

  socket.on("slide-update",   ({ code, slides, index }) => socket.to(code).emit("slide-update", { slides, index }));
  socket.on("slide-navigate", ({ code, index })         => socket.to(code).emit("slide-navigate", { index }));
  socket.on("slides-closed",  ({ code })                => socket.to(code).emit("slides-closed"));

  socket.on("raise-hand", ({ code }) => socket.to(code).emit("hand-raised", { userId: socket.id }));
  socket.on("lower-hand", ({ code }) => socket.to(code).emit("hand-lowered", { userId: socket.id }));

  socket.on("reaction", ({ code, emoji }) => io.to(code).emit("reaction", { emoji, userId: socket.id }));

  socket.on("create-breakout-rooms", ({ code, numRooms, duration }) => {
    const rooms = Array.from({ length: numRooms }, (_, i) => ({
      id: `${code}-room-${i + 1}`, name: `Room ${i + 1}`, members: [],
    }));
    if (!io.breakoutRooms) io.breakoutRooms = {};
    io.breakoutRooms[code] = rooms;
    io.to(code).emit("breakout-rooms-created", { rooms, duration });
  });

  socket.on("join-breakout-room", ({ code, roomId }) => {
    const rooms = io.breakoutRooms?.[code];
    if (!rooms) return;
    rooms.forEach((r) => { r.members = r.members.filter((m) => m !== socket.id); });
    const room = rooms.find((r) => r.id === roomId);
    if (room) room.members.push(socket.id);
    socket.emit("breakout-join-ack", { roomId });
    io.to(code).emit("breakout-rooms-update", { rooms });
  });

  socket.on("end-breakout-rooms", ({ code }) => {
    if (io.breakoutRooms) delete io.breakoutRooms[code];
    io.to(code).emit("breakout-ended");
  });

  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (room !== socket.id) socket.to(room).emit("user-left", socket.id);
    }
  });

  socket.on("disconnect", () => console.log(`[SOCKET] Disconnected: ${socket.id}`));
});

/* ================= START ================= */
server.listen(5000, "0.0.0.0", () => {
  const proto = process.env.USE_HTTP === "true" ? "http" : "https";
  console.log(`Server running on ${proto}://0.0.0.0:5000`);
});
