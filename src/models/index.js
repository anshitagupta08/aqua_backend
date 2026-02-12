const { sequelize } = require('../configs/sequelize');

const EmployeeRole = require('./Auth/EmployeeRole');
const Employee = require('./Auth/Employee');

const FormDetail = require('./Form/FormDetail');
const QueryType = require('./Form/QueryType');
const SupportType = require('./Form/SupportType');

const Call = require('./Calling/Call');

const Customer = require('./Customer/Customer');
const Order = require('./Customer/Order');
const OrderItem = require('./Customer/OrderItem');
const Product = require('./Customer/Product');
const Feedback = require('./Customer/Feedback');
const Enquiry = require('./Customer/Enquiry');
const Promotion = require('./Customer/Promotion');
const CustomerFeedback = require('./Customer/CustomerFeedback');
const CallLogs = require('../models/Calling/CallLogs');
const OutboundCallType = require('../models/Master/OutboundCallType');
const CallAttemptStatus = require('../models/Master/CallAttemptStatus');
const CallDisposition = require('../models/Master/CallDisposition');
const OutcomeTag = require('../models/Master/OutcomeTag');
const FinalClosureStatus = require('../models/Master/FinalClosureStatus');
const OutboundFormDetail = require('../models/Form/OutboundFormDetail');
const SourceType = require('../models/Master/SourceType');

// CallLogs.sync({ alter: true });

// ---------------------
// Associations
// ---------------------

// Employee → Role
Employee.belongsTo(EmployeeRole, {
  foreignKey: 'EmployeeRoleID',
  as: 'role',
});
EmployeeRole.hasMany(Employee, {
  foreignKey: 'EmployeeRoleID',
  as: 'employees',
});

// FormDetail → Call / Employee / SupportType / QueryType

FormDetail.belongsTo(Call, {
  foreignKey: 'CallId',
  as: 'call',
});
FormDetail.belongsTo(Employee, {
  foreignKey: 'EmployeeId',
  as: 'employee',
});
FormDetail.belongsTo(SupportType, {
  foreignKey: 'supportTypeId',
  as: 'supportType',
});
FormDetail.belongsTo(QueryType, {
  foreignKey: 'queryTypeId',
  as: 'queryType',
});

// Call → FormDetails
Call.hasMany(FormDetail, {
  foreignKey: 'CallId',
  as: 'formDetails',
});

// Call → Customer (via phone number)
Call.belongsTo(Customer, { foreignKey: 'Caller_Number', targetKey: 'phone', as: 'customer' });
Customer.hasMany(Call, { foreignKey: 'Caller_Number', sourceKey: 'phone', as: 'calls' });

// Employee → FormDetails
Employee.hasMany(FormDetail, {
  foreignKey: 'EmployeeId',
  as: 'formDetails',
});

// SupportType → FormDetails / QueryTypes
SupportType.hasMany(FormDetail, {
  foreignKey: 'supportTypeId',
  as: 'formDetails',
});
SupportType.hasMany(QueryType, {
  foreignKey: 'supportTypeId',
  as: 'queryTypes',
});

// QueryType → FormDetails
QueryType.hasMany(FormDetail, {
  foreignKey: 'queryTypeId',
  as: 'formDetails',
});

// QueryType → SupportType
QueryType.belongsTo(SupportType, {
  foreignKey: 'supportTypeId',
  as: 'supportType',
});

// Customer → Order
Customer.hasMany(Order, { foreignKey: 'customerId' });
Order.belongsTo(Customer, { foreignKey: 'customerId' });

// Order → OrderItem
Order.hasMany(OrderItem, { foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// Product → OrderItem
Product.hasMany(OrderItem, { foreignKey: 'productId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

// Customer → Feedback
Customer.hasMany(Feedback, { foreignKey: 'customerId' });
Feedback.belongsTo(Customer, { foreignKey: 'customerId' });

// Order → Feedback
Order.hasOne(Feedback, { foreignKey: 'orderId' });
Feedback.belongsTo(Order, { foreignKey: 'orderId' });

// Customer → Enquiry
Customer.hasMany(Enquiry, { foreignKey: 'customerId' });
Enquiry.belongsTo(Customer, { foreignKey: 'customerId' });

// Employee → Enquiry (assigned)
Employee.hasMany(Enquiry, { foreignKey: 'assignedTo', as: 'assignedEnquiries' });
Enquiry.belongsTo(Employee, { foreignKey: 'assignedTo', as: 'assignedUser' });

// Customer → Promotion
Customer.hasMany(Promotion, { foreignKey: 'customerId' });
Promotion.belongsTo(Customer, { foreignKey: 'customerId' });

// CustomerFeedback
CustomerFeedback.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
CustomerFeedback.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Order.hasMany(CustomerFeedback, { foreignKey: 'orderId', as: 'feedbacks' });

// ---------------------
// Export
// ---------------------
module.exports = {
  sequelize,
  Employee,
  EmployeeRole,
  FormDetail,
  Call,
  QueryType,
  SupportType,
  Customer,
  Order,
  OrderItem,
  Product,
  Feedback,
  Enquiry,
  Promotion,
  CustomerFeedback,
};
