// models/outboundFormDetail.js
const { DataTypes } = require("sequelize");
const { sequelize } = require('../../configs/sequelize');
const OutboundCallType = require("../Master/OutboundCallType");
const CallAttemptStatus = require("../Master/CallAttemptStatus");
const CallDisposition = require("../Master/CallDisposition");
const FinalClosureStatus = require("../Master/FinalClosureStatus");
const Customer = require("../Customer/Customer");
const Employee = require("../Auth/Employee");

const OutboundFormDetail = sequelize.define(
    "OutboundFormDetail",
    {
        CallId: { type: DataTypes.STRING, allowNull: false },
        EmployeeId: { type: DataTypes.INTEGER, allowNull: false },
        callDateTime: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        callType: { type: DataTypes.STRING, allowNull: false, defaultValue: "OutBound" },
        callTypeId: { type: DataTypes.INTEGER, allowNull: false },
        attemptStatusId: { type: DataTypes.INTEGER, allowNull: false },
        dispositionId: { type: DataTypes.INTEGER, allowNull: true },
        outcomeTagIds: { type: DataTypes.STRING, allowNull: true, defaultValue: "" }, // comma-separated IDs
        closureStatusId: { type: DataTypes.INTEGER, allowNull: true },
        remarks: { type: DataTypes.TEXT, allowNull: true },
        followUpRequired: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        followUpDate: { type: DataTypes.DATE, allowNull: true },
        customerNumber: { type: DataTypes.STRING, allowNull: true }, 
        customerId: { type: DataTypes.INTEGER, allowNull: true }, 
    },
    {
        tableName: "outbound_form_detail",
        timestamps: true, // createdAt, updatedAt
    }
);


OutboundFormDetail.belongsTo(OutboundCallType, { foreignKey: 'callTypeId' });
OutboundFormDetail.belongsTo(CallAttemptStatus, { foreignKey: 'attemptStatusId' });
OutboundFormDetail.belongsTo(CallDisposition, { foreignKey: 'dispositionId' });
OutboundFormDetail.belongsTo(FinalClosureStatus, { foreignKey: 'closureStatusId' });
OutboundFormDetail.belongsTo(Customer, { foreignKey: 'customerId' });
OutboundFormDetail.belongsTo(Employee, { foreignKey: "EmployeeId", as: "employee" });

module.exports = OutboundFormDetail;



