const { DataTypes, Model } = require("sequelize");
const { sequelize } = require('../../configs/sequelize');

class CallAttemptStatus extends Model {}

CallAttemptStatus.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    status_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "CallAttemptStatus",
    tableName: "call_attempt_statuses",
    timestamps: true, // createdAt, updatedAt
    underscored: true,
  }
);

module.exports = CallAttemptStatus;
