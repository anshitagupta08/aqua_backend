// models/Auth/EmployeeRole.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../configs/sequelize');

class EmployeeRole extends Model {}

EmployeeRole.init(
  {
    RoleId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    RoleName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'EmployeeRole',
    tableName: 'employee_role',
    timestamps: false,
  }
);

module.exports = EmployeeRole;
