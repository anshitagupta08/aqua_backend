const { DataTypes, Model, Optional } = require('sequelize');
const { sequelize } = require('../../configs/sequelize');

class CustomerFeedback extends Model {}

CustomerFeedback.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('open', 'close'),
      allowNull: true,
    },
    formtype: {
      type: DataTypes.ENUM('feedback', 'complaint'),
      allowNull: false,
    },
    followUpDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'CustomerFeedback',
    tableName: 'customer_feedbacks',
    timestamps: true,
  }
);

module.exports = CustomerFeedback;
