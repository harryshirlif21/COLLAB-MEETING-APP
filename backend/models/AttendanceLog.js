const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AttendanceLog = sequelize.define(
  "attendance_logs",
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
    joined_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    left_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ["meeting_id", "user_id"],
      },
      {
        fields: ["meeting_id", "joined_at"],
      },
    ],
  }
);

module.exports = AttendanceLog;
