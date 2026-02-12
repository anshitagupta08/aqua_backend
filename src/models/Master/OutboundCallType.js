const { DataTypes, Model } = require("sequelize");
const { sequelize } = require('../../configs/sequelize');

class OutboundCallType extends Model {}

OutboundCallType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type_name: {
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
    modelName: "OutboundCallType",
    tableName: "outbound_call_types",
    timestamps: true, // createdAt, updatedAt,
    underscored: true,
  }
);

module.exports = OutboundCallType;
