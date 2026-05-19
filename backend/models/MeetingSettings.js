const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MeetingSettings = sequelize.define(
  "meeting_settings",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    meeting_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    enable_waiting_room: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    enable_lecture_mode: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    enable_recording: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    participants_can_share_screen: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    participants_can_chat: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
  }
);

module.exports = MeetingSettings;
