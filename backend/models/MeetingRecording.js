const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MeetingRecording = sequelize.define(
  "meeting_recordings",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    meeting_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    recording_path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    duration_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    format: {
      type: DataTypes.STRING,
      defaultValue: "mp4",
    },
    status: {
      type: DataTypes.ENUM("recording", "processing", "ready", "failed"),
      defaultValue: "recording",
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    underscored: true,
  }
);

module.exports = MeetingRecording;
