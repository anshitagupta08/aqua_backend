const { DataTypes, Model } = require("sequelize");
const { sequelize } = require('../../configs/sequelize');

class SourceType extends Model {}

SourceType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    source_name: {
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
    modelName: "SourceType",
    tableName: "source_type",
    timestamps: true, // createdAt, updatedAt
    underscored: true,
  }
);

module.exports = SourceType;
