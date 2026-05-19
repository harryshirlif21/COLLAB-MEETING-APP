const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MeetingEvent = sequelize.define(
  "meeting_events",
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    event_type: {
      type: DataTypes.ENUM("speak", "message", "reaction", "file_share", "hand_raise"),
      allowNull: false,
    },
    event_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    underscored: true,
  }
);

module.exports = MeetingEvent;
