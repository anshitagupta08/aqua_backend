const { DataTypes, Model, Optional } = require('sequelize');
const { sequelize } = require('../../configs/sequelize');
const SupportType = require('./SupportType');
const QueryType = require('./QueryType');
const Employee = require('../Auth/Employee');
const Call = require('../Calling/Call');
const Customer = require('../Customer/Customer');
const SourceType = require('../Master/SourceType');

class FormDetail extends Model {}

FormDetail.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Customer,
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    customerPhoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    CallId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      // references: {
      //   model: Call,
      //   key: 'CallId',
      // },
    },
    EmployeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // references: {
      //   model: Employee,
      //   key: 'EmployeeId',
      // },
    },
    callDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    callType: {
      type: DataTypes.ENUM('InBound', 'OutBound'),
      allowNull: true,
    },
    supportTypeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // references: {
      //   model: SupportType,
      //   key: 'id',
      // },
    },
    inquiryNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    queryTypeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // references: {
      //   model: QueryType,
      //   key: 'id',
      // },
    },
    sourceTypeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: SourceType,
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('open', 'closed'),
      allowNull: true,
    },
    followUpDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'form_details',
    timestamps: true,
    paranoid: true,
  }
);

FormDetail.belongsTo(QueryType, { foreignKey: 'queryTypeId' });
FormDetail.belongsTo(SupportType, { foreignKey: 'supportTypeId' });
FormDetail.belongsTo(SourceType, { foreignKey: 'sourceTypeId' });
FormDetail.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Customer.hasMany(FormDetail, { foreignKey: 'customerId', as: 'formDetails' });
FormDetail.belongsTo(Employee, {
    foreignKey: "EmployeeId",
    as: "createdByEmployee"
});



module.exports = FormDetail;
