// controllers/callController.js
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const { sequelize } = require('../../models');
const Call = require('../../models/Calling/Call');
const FormDetail = require('../../models/Form/FormDetail');
const Employee = require('../../models/Auth/Employee'); // Assuming you have this
const { Customer, QueryType, SupportType } = require('../../models');
const SourceType = require('../../models/Master/SourceType');

/**
 * Get incoming calls with filters and pagination
 * GET /api/calls/incoming
 */
exports.getIncomingCalls = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      agentPhone = '',
      startDate = '',
      endDate = '',
      employeeId = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // -----------------------------
    // BASE WHERE CLAUSE
    // -----------------------------
    const whereClause = {
      Call_Type: 'INBOUND'
    };

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { Caller_Name: { [Op.like]: `%${search}%` } },
        { Caller_Number: { [Op.like]: `%${search}%` } },
        { Destination_Name: { [Op.like]: `%${search}%` } },
        { Destination_Number: { [Op.like]: `%${search}%` } }
      ];
    }

    // Status filter
    if (status === 'true' || status === 'Connected') {
      whereClause.Overall_Call_Status = 'Answered';
    } else if (status === 'false' || status === 'Not Connected') {
      whereClause.Overall_Call_Status = { [Op.ne]: 'Answered' };
    }

    // Agent filter
    if (agentPhone) {
      whereClause.Destination_Number = agentPhone;
    }

    // Date filter
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [
          new Date(`${startDate}T00:00:00`),
          new Date(`${endDate}T23:59:59`)
        ]
      };
    } else if (startDate) {
      whereClause.createdAt = { [Op.gte]: new Date(`${startDate}T00:00:00`) };
    } else if (endDate) {
      whereClause.createdAt = { [Op.lte]: new Date(`${endDate}T23:59:59`) };
    }

    // Employee filter (FormDetail)
    const formDetailWhere = {};
    if (employeeId) {
      formDetailWhere.EmployeeId = employeeId;
    }

    // -----------------------------
    // SORTING
    // -----------------------------
    let order = [
  [
    sequelize.literal(
      "STR_TO_DATE(CONCAT(Date, ' ', Time), '%d/%m/%Y %H:%i:%s')"
    ),
    'DESC'
  ]
];

    // =====================================================
    // 1️⃣ PAGINATED DATA QUERY (FOR TABLE)
    // =====================================================
    const { count, rows: calls } = await Call.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: FormDetail,
          as: 'formDetails',
          required: false,
          where: formDetailWhere
        }
      ],
      limit: parseInt(limit),
      offset,
      order,
      distinct: true
    });

    // Transform rows
    const transformedCalls = await Promise.all(
      calls.map(async (call) => {
        const agentDetails = call.Destination_Number
          ? await Employee.findOne({ where: { EmployeePhone: call.Destination_Number } })
          : null;

        const customerDetails = call.Caller_Number
          ? await Customer.findOne({ where: { phone: call.Caller_Number } })
          : null;

        return {
          id: call.CallId,
          callId: call.CallId,
          callerName: call.Destination_Name || 'Unknown',
          callerNumber: call.Caller_Number,
          agentName: agentDetails?.EmployeeName || 'Unknown',
          agentPhone: call.Destination_Number,
          agentId: agentDetails?.EmployeeId || null,
          region: call.Caller_Circle_Name || 'N/A',
          callDateTime: `${call.Date} ${call.Time}`,
          duration: call.Conversation_Duration || '00:00:00',
          status: call.Overall_Call_Status === 'Answered' ? 'answered' : 'missed',
          ogCallStatus: call.Overall_Call_Status,
          remarks: call.formDetails?.remarks || null,
          voiceRecording: call.Recording || null,
          agentDetails: agentDetails?.toJSON() || null,
          customerDetails: customerDetails?.toJSON() || null
        };
      })
    );

    // =====================================================
    // 2️⃣ STATS QUERY (NO PAGINATION)
    // =====================================================
    const statsRows = await Call.findAll({
      where: whereClause,
      attributes: [
        'Overall_Call_Status',
        [sequelize.fn('COUNT', sequelize.col('CallId')), 'count']
      ],
      group: ['Overall_Call_Status']
    });

    let answeredCalls = 0;
    let missedCalls = 0;

    statsRows.forEach(row => {
      const count = Number(row.get('count'));
      if (row.Overall_Call_Status === 'Answered') {
        answeredCalls += count;
      } else {
        missedCalls += count;
      }
    });

    const totalCalls = answeredCalls + missedCalls;

    // -----------------------------
    // RESPONSE
    // -----------------------------
    res.json({
      success: true,
      data: {
        calls: transformedCalls,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalRecords: count,
          perPage: parseInt(limit)
        },
        stats: {
          total: totalCalls,
          answered: answeredCalls,
          missed: missedCalls
        }
      }
    });

  } catch (error) {
    console.error('Error fetching incoming calls:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incoming calls',
      error: error.message
    });
  }
};



exports.exportIncomingCalls = async (req, res) => {
  try {
    const {
      search = '',
      status = '',
      agentPhone = '',
      startDate = '',
      endDate = '',
      employeeId = ''
    } = req.query;

    // Build where clause (same as getIncomingCalls)
    const whereClause = { Call_Type: 'INBOUND' };

    if (search) {
      whereClause[Op.or] = [
        { Caller_Name: { [Op.like]: `%${search}%` } },
        { Caller_Number: { [Op.like]: `%${search}%` } },
        { Destination_Name: { [Op.like]: `%${search}%` } },
        { Destination_Number: { [Op.like]: `%${search}%` } }
      ];
    }

    if (status === 'true' || status === 'Connected') {
      whereClause.Overall_Call_Status = 'Answered';
    } else if (status === 'false' || status === 'Not Connected') {
      whereClause.Overall_Call_Status = { [Op.ne]: 'Answered' };
    }

    if (agentPhone) whereClause.Destination_Number = agentPhone;

    if (startDate && endDate) whereClause.Date = { [Op.between]: [startDate, endDate] };
    else if (startDate) whereClause.Date = { [Op.gte]: startDate };
    else if (endDate) whereClause.Date = { [Op.lte]: endDate };

    // Employee filter
    const formDetailWhere = {};
    if (employeeId) {
      formDetailWhere.EmployeeId = employeeId;
    }

    // Sorting
    let order = [['callDateTime', 'DESC']];


    // Fetch all matching calls
    const calls = await Call.findAll({
      where: whereClause,
      include: [
        {
          model: FormDetail,
          as: 'formDetails',
          required: employeeId ? true : false,
          where: formDetailWhere,

        }
      ],
      order
    });

    const transformedCalls = await Promise.all(calls.map(async (call) => {
      // Fetch form details
      let formDetails = null;
      if (call.Caller_Number) {
        formDetails = await FormDetail.findOne({
          where: { inquiryNumber: call.Caller_Number },
          include: [
            { model: QueryType, attributes: ['queryName'] },
            { model: SupportType, attributes: ['supportName'] },
            { model: Customer, as: 'customer', attributes: ['name', 'phone'] }
          ]
        });
      }


      // Fetch customer details (optional, extra)
      let customerDetails = null;
      if (call.Caller_Number) {
        customerDetails = await Customer.findOne({
          where: { phone: call.Caller_Number }
        });
      }

      // Fetch agent details
      let agentDetails = null;
      if (call.Destination_Number) {
        agentDetails = await Employee.findOne({
          where: { EmployeePhone: call.Destination_Number }
        });
      }

      return {
        id: call.CallId,
        callId: call.CallId,
        callerName: customerDetails?.name || 'Unknown',
        callerNumber: call.Caller_Number,
        agentName: agentDetails?.EmployeeName || 'Unknown',
        agentPhone: call.Destination_Number,
        agentId: agentDetails?.EmployeeId || null,
        region: formDetails?.Region || call.Caller_Circle_Name || 'N/A',
        callDateTime: `${call.Date} ${call.Time}`,
        duration: call.Conversation_Duration || '0m 0s',
        status: call.Overall_Call_Status === 'Answered' ? 'answered' : 'missed',
        ogCallStatus: call.Overall_Call_Status,
        remarks: formDetails?.remarks || null,
        voiceRecording: call.Recording || 'No Voice',
        agentDetails: agentDetails?.toJSON() || null,
        customerDetails: customerDetails?.toJSON() || null,
        queryTypeName: formDetails.QueryType?.queryName || null,
        supportTypeName: formDetails.SupportType?.supportName || null,
        customerName: formDetails.customer?.name || null,
        customerPhone: formDetails.customer?.phone || null

      };
    }));

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Incoming Calls');

    // Add header row
    sheet.columns = [
      { header: 'Call ID', key: 'callId', width: 20 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Time', key: 'time', width: 10 },
      { header: 'Caller Name', key: 'callerName', width: 25 },
      { header: 'Caller Number', key: 'callerNumber', width: 15 },
      { header: 'Agent Name', key: 'agentName', width: 25 },
      { header: 'Agent Number', key: 'agentNumber', width: 15 },
      { header: 'Region', key: 'region', width: 15 },
      { header: 'Call Status', key: 'status', width: 15 },
      { header: 'Duration', key: 'duration', width: 15 },
      { header: 'Remarks', key: 'remarks', width: 30 },
      { header: 'Query Type', key: 'queryTypeName', width: 20 },
      { header: 'Support Type', key: 'supportTypeName', width: 20 },
      { header: 'Customer Name', key: 'customerName', width: 25 },
      { header: 'Customer Phone', key: 'customerPhone', width: 15 },
      { header: 'Recording Available', key: 'voiceRecording', width: 20 }
    ];

    sheet.addRows(transformedCalls);

    // Set response headers
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="IncomingCallLogs_${Date.now()}.xlsx"`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting calls:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export incoming calls',
      error: error.message
    });
  }
};


