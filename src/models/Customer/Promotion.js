const { DataTypes, Model, Optional } = require('sequelize');
const { sequelize } = require('../../configs/sequelize');

class Promotion extends Model {}

Promotion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    promotionCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    discountPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    criteria: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Last 5 orders total ≥ 2000',
    },
    validFrom: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    validTo: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Promotion',
    tableName: 'promotions',
    timestamps: true,
  }
);

module.exports = Promotion;
