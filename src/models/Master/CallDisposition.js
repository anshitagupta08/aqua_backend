const { DataTypes, Model } = require("sequelize");
const { sequelize } = require('../../configs/sequelize');

class CallDisposition extends Model {}

CallDisposition.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    disposition_name: {
      type: DataTypes.STRING(150),
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
    modelName: "CallDisposition",
    tableName: "call_dispositions",
    timestamps: true, // createdAt, updatedAt
    underscored: true,
  }
);

module.exports = CallDisposition;
