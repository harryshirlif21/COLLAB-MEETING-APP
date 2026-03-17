const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Meeting = sequelize.define(
  "meetings",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    meeting_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    meeting_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,          // your table has no updated_at
    underscored: true,
  }
);

module.exports = Meeting;