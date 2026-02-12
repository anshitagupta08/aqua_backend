const { Op, fn, QueryTypes } = require('sequelize');
const { sequelize, Call, Customer, FormDetail, } = require('../../models');
const CallLogs = require('../../models/Calling/CallLogs');
const OutboundFormDetail = require('../../models/Form/OutboundFormDetail');

exports.getRecentCalls = async (req, res) => {
  try {
    const { page = 1, limit = 10, fromDate, toDate, callType, Destination_Number } = req.query;
    const offset = (page - 1) * limit;

    // 📅 Common date filter
    const dateFilter = {};
    if (fromDate && toDate) {
      const startOfDay = new Date(fromDate);
      const endOfDay = new Date(toDate);
      endOfDay.setDate(endOfDay.getDate() + 1);

      dateFilter.createdAt = {
        [Op.gte]: startOfDay,
        [Op.lt]: endOfDay,
      };
    }

    // --------------------------------------
    // 📥 1️⃣ INBOUND CALLS (Call model)
    // --------------------------------------
    const inboundWhere = { ...dateFilter };
    if (callType && callType.toUpperCase() === 'INBOUND') {
      inboundWhere.Call_Type = 'INBOUND';
    }
    if (Destination_Number) {
      inboundWhere.Destination_Number = Destination_Number;
    }

    const inboundCalls = await Call.findAll({
      where: inboundWhere,
      include: [
        {
          model: Customer,
          as: 'customer',
          required: false,
          where: { isActive: true },
          attributes: ['name', 'phone'],
        },
        {
          model: FormDetail,
          as: 'formDetails',
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const formattedInbound = inboundCalls.map(call => ({
      callId: call.CallId,
      name: call.customer?.name || 'Unknown',
      number: call.Caller_Number || '',
      type: 'INBOUND',
      time: call.createdAt,
      status: call.Overall_Call_Status || '',
      conversation_duration: call.Conversation_Duration || '',
    }));

    // --------------------------------------
    // 📤 2️⃣ OUTBOUND CALLS (CallLogs model)
    // --------------------------------------
    const outboundWhere = { ...dateFilter, callType: 'OUTBOUND' };
    if (callType && callType.toUpperCase() === 'OUTBOUND') {
      outboundWhere.callType = 'OUTBOUND';
    }
    if (Destination_Number) {
      outboundWhere.customerNumber = Destination_Number;
    }

    const outboundCalls = await CallLogs.findAll({
      where: outboundWhere,
      order: [['createdAt', 'DESC']],
    });

    const formattedOutbound = outboundCalls.map(log => ({
      callId: log.clientCorrelationId || log.id,
      name: 'Unknown', // can enrich later from Customer table if needed
      number: log.customerNumber || '',
      type: 'OUTBOUND',
      time: log.createdAt, // ✅ exists because timestamps: true
      status: log.overallCallStatus || '',
      conversation_duration: log.conversationDurationFormatted || '0m 0s',
    }));

    // --------------------------------------
    // 🔗 3️⃣ Combine both
    // --------------------------------------
    const allCalls = [...formattedInbound, ...formattedOutbound];

    // Sort by time DESC (latest first)
    allCalls.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Manual pagination after merging
    const total = allCalls.length;
    const paginated = allCalls.slice(offset, offset + parseInt(limit));

    res.status(200).json({
      success: true,
      data: paginated,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('❌ Error in getRecentCalls:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent calls',
      error: err.message,
    });
  }
};

// exports.getFollowUpCalls = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, fromDate, toDate, status = 'open' } = req.query;
//     const offset = (page - 1) * limit;

//     const where = {
//       status,
//       followUpDate: {
//         [Op.gte]: new Date(),
//       },
//     };

//     if (fromDate && toDate) {
//       where.followUpDate = {
//         [Op.between]: [new Date(fromDate), new Date(toDate)],
//       };
//     }

//     const followUpForms = await FormDetail.findAndCountAll({
//       where,
//       include: [
//         {
//           model: Form,
//           as: 'form',
//           required: true,
//           attributes: ['inquiryNumber'],
//           include: [
//             {
//               model: Customer,
//               as: 'customer',
//               required: false,
//               where: { isActive: true },
//               attributes: ['name', 'phone'],
//             },
//           ],
//         },
//       ],
//       order: [['followUpDate', 'ASC']],
//       limit: parseInt(limit),
//       offset: parseInt(offset),
//     });

//     const result = followUpForms.rows.map((formDetail) => {
//       const form = formDetail.form;
//       const customer = form?.customer;

//       return {
//         formId: formDetail.id,
//         name: customer?.name ?? 'Unknown',
//         number: customer?.phone ?? form?.inquiryNumber ?? 'Unknown',
//         time: formDetail.followUpDate,
//         status: formDetail.status,
//         remark: formDetail.remarks,
//       };
//     });

//     res.status(200).json({
//       data: result,
//       meta: {
//         total: followUpForms.count,
//         page: parseInt(page),
//         limit: parseInt(limit),
//         totalPages: Math.ceil(followUpForms.count / limit),
//       },
//     });
//   } catch (err) {
//     console.error('Error fetching follow-up calls:', err);
//     res.status(500).json({ message: 'Failed to fetch follow-up calls' });
//   }
// };

exports.getFollowUpCalls = async (req, res) => {
  try {
    const { page = 1, limit = 10, fromDate, toDate, status = "open" } = req.query;
    const offset = (page - 1) * limit;

    // Helper to build date filter
    const buildDateFilter = (field) => {
      if (fromDate && toDate) return { [Op.between]: [new Date(fromDate), new Date(toDate)] };
      if (fromDate) return { [Op.gte]: new Date(fromDate) };
      if (toDate) return { [Op.lte]: new Date(toDate) };
      return { [Op.gte]: new Date() }; // default: upcoming follow-ups
    };

    // Incoming follow-ups
    const { count: countIncoming, rows: incomingRows } = await FormDetail.findAndCountAll({
      where: {
        status,
        followUpDate: buildDateFilter("followUpDate"),
      },
      order: [["followUpDate", "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Outgoing follow-ups
    const { count: countOutgoing, rows: outgoingRows } = await OutboundFormDetail.findAndCountAll({
      where: {
        followUpRequired: true,
        followUpDate: buildDateFilter("followUpDate"),
      },
      order: [["followUpDate", "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Combine inquiryNumbers / customerNumbers
    const customerNumbers = [
      ...incomingRows.map((f) => f.customerPhoneNumber),
      ...outgoingRows.map((f) => f.customerNumber),
    ].filter(Boolean);

    // Fetch customers in one query
    const customers = await Customer.findAll({
      where: { phone: { [Op.in]: customerNumbers } },
      attributes: ["phone", "name"],
    });

    const customerMap = customers.reduce((acc, cust) => {
      acc[cust.phone] = cust.name;
      return acc;
    }, {});
   

    // Format incoming results
    const incomingResult = incomingRows.map((f) => {
      const phone = normalize(f.customerPhoneNumber);

      return {
        formId: f.id,
        name: customerMap[phone] || "Unknown",
        number: phone || "Unknown",
        time: f.followUpDate,
        status: f.status,
        remark: f.remarks,
        type: "Incoming",
      };
    });

    // Format outgoing results
    const outgoingResult = outgoingRows.map((f) => ({
      formId: f.id,
      name: customerMap[f.customerNumber] || "Unknown",
      number: f.customerNumber || "Unknown",
      time: f.followUpDate,
      status: status, // or you can map differently if needed
      remark: f.remarks,
      type: "Outgoing",
    }));

    // Merge both results and sort by follow-up date
    const combinedResult = [...incomingResult, ...outgoingResult].sort(
      (a, b) => new Date(a.time) - new Date(b.time)
    );

    res.status(200).json({
      data: combinedResult,
      meta: {
        total: combinedResult.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(combinedResult.length / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching follow-up calls:", err);
    res.status(500).json({ message: "Failed to fetch follow-up calls" });
  }
};

const normalize = (number) =>
  String(number).replace(/\D/g, "").replace(/^91/, "");
