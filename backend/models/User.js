// backend/models/User.js  — add avatar, timezone, emailPrefs columns
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // ── New profile fields ──────────────────────────
  avatar: {
    type: DataTypes.TEXT,   // stores base64 image string
    allowNull: true,
    defaultValue: null,
  },
  timezone: {
    type: DataTypes.STRING(64),
    allowNull: true,
    defaultValue: "UTC",
  },
  emailPrefs: {
    type: DataTypes.JSON,   // stores { meetingReminders, meetingRecaps, ... }
    allowNull: true,
    defaultValue: {
      meetingReminders: true,
      meetingRecaps:    true,
      newParticipant:   false,
      weeklyDigest:     true,
    },
  },
}, {
  timestamps: true,
});

module.exports = User;