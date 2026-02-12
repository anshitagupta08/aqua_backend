const { DataTypes, Model } = require("sequelize");
const { sequelize } = require('../../configs/sequelize');

class OutcomeTag extends Model {}

OutcomeTag.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tag_name: {
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
    modelName: "OutcomeTag",
    tableName: "outcome_tags",
    timestamps: true, // createdAt, updatedAt
    underscored: true,
  }
);

module.exports = OutcomeTag;
