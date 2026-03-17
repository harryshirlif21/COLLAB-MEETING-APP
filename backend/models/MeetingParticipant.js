const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MeetingParticipant = sequelize.define(
  "meeting_participants",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    meeting_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: false,         // join tables usually don't need timestamps
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "meeting_id"], // prevent duplicates
      },
    ],
  }
);

module.exports = MeetingParticipant;