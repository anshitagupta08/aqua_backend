const { DataTypes, Model, Optional } = require('sequelize');
const { sequelize } = require('../../configs/sequelize');
const SupportType = require('./SupportType');

class QueryType extends Model {}

QueryType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    queryName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    supportTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: SupportType,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'query_type',
    timestamps: false,
  }
);

module.exports = QueryType;
