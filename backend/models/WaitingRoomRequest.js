const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const WaitingRoomRequest = sequelize.define(
  "waiting_room_requests",
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
    requested_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    admitted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejected_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("waiting", "admitted", "rejected"),
      defaultValue: "waiting",
    },
  },
  {
    timestamps: false,
    underscored: true,
  }
);

module.exports = WaitingRoomRequest;
