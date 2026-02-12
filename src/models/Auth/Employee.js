const { DataTypes, Model, Optional } = require('sequelize');
const { sequelize } = require('../../configs/sequelize');
const EmployeeRole = require('./EmployeeRole');

class Employee extends Model {}

Employee.init(
  {
    EmployeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    EmployeePhone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    EmployeeName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    EmployeeRoleID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: EmployeeRole,
        key: 'RoleId',
      },
    },
    EmployeePassword: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    EmployeeMailId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      set(value) {
        if (typeof value === 'string') {
          this.setDataValue('EmployeeMailId', value.trim().toLowerCase());
        } else {
          this.setDataValue('EmployeeMailId', value);
        }
      },
    },
    EmployeeRegion: {
      type: DataTypes.STRING(1500),
      allowNull: true,
    },
    fcmToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Firebase Cloud Messaging token for push notifications',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      comment: 'Indicates if the employee account is active',
    },
  },
  {
    sequelize,
    modelName: 'Employee',
    tableName: 'employee_table',
    timestamps: false,
  }
);

module.exports = Employee;
