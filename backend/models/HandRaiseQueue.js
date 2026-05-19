const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const HandRaiseQueue = sequelize.define(
  "hand_raise_queues",
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
    queue_position: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    raised_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejected_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
  },
  {
    timestamps: false,
    underscored: true,
    indexes: [
      {
        fields: ["meeting_id", "queue_position"],
      },
    ],
  }
);

module.exports = HandRaiseQueue;
