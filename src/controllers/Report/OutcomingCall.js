const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const CallLogs = require('../../models/Calling/CallLogs'); // adjust path if needed
const Employee = require('../../models/Auth/Employee'); // for agent details
const OutgoingFormDetail = require('../../models/Form/OutboundFormDetail'); // for customer/trader details
const { Customer } = require('../../models');
const OutcomeTag = require('../../models/Master/OutcomeTag');
const OutboundCallType = require('../../models/Master/OutboundCallType');
const CallAttemptStatus = require('../../models/Master/CallAttemptStatus');
const CallDisposition = require('../../models/Master/CallDisposition');
const FinalClosureStatus = require('../../models/Master/FinalClosureStatus');


exports.getOutcomingCallLogs = async (req, res) => {
  try {
      const {
          page = 1,
          limit = 10,
          search = '',
          status = '', // 'Connected' or 'Not Connected'
          agentNumber = '',
          startDate = '',
          endDate = '',
          employeeId = '',
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // =======================
      // Base filter for stats
      // =======================
      const baseWhere = { callType: 'OUTBOUND' };

      // Employee filter for stats
      if (employeeId) {
          const formDetails = await OutgoingFormDetail.findAll({
              where: { EmployeeId: employeeId },
              attributes: ['customerNumber']
          });
          const numbers = formDetails.map(f => f.customerNumber).filter(Boolean);
          if (numbers.length > 0) baseWhere.customerNumber = { [Op.in]: numbers };
      }

      // Date range filter for stats
      if (startDate && endDate) baseWhere.date = { [Op.between]: [startDate, endDate] };
      else if (startDate) baseWhere.date = { [Op.gte]: startDate };
      else if (endDate) baseWhere.date = { [Op.lte]: endDate };

      // =======================
      // Stats Calculation
      // =======================
      const totalCalls = await CallLogs.count({ where: baseWhere });
      const answeredCalls = await CallLogs.count({
          where: { ...baseWhere, overallCallStatus: 'Answered' }
      });
      const missedCalls = Math.max(totalCalls - answeredCalls, 0); // never negative

      // Total Talk Time
      const answeredCallRows = await CallLogs.findAll({
          where: { ...baseWhere, overallCallStatus: 'Answered' },
          attributes: ['conversationDuration']
      });
      const totalSeconds = answeredCallRows.reduce(
          (acc, call) => acc + (call.conversationDuration || 0),
          0
      );
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const totalTalkTime = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      // =======================
      // Build where clause for list
      // =======================
      const whereClause = { ...baseWhere };

      // Status filter for list
      if (status === 'true' || status === 'Connected') whereClause.overallCallStatus = 'Answered';
      else if (status === 'false' || status === 'Not Connected') whereClause.overallCallStatus = { [Op.ne]: 'Answered' };

      // Search filter
      if (search) {
          whereClause[Op.or] = [
              { callerId: { [Op.like]: `%${search}%` } },
              { customerNumber: { [Op.like]: `%${search}%` } },
              { agentNumber: { [Op.like]: `%${search}%` } },
              { callerCircle: { [Op.like]: `%${search}%` } },
          ];
      }

      // Agent filter
      if (agentNumber) whereClause.agentNumber = agentNumber;

      // Sorting
      const order = [['startTime', 'DESC']];

      // =======================
      // Fetch paginated list
      // =======================
      const { count, rows: calls } = await CallLogs.findAndCountAll({
          where: whereClause,
          limit: parseInt(limit),
          offset,
          order,
          distinct: true,
      });

      // Transform calls for frontend
      const transformedCalls = await Promise.all(
          calls.map(async (call) => {
              let formDetails = null;
              if (call.customerNumber) {
                  formDetails = await OutgoingFormDetail.findOne({
                      where: { customerNumber: call.customerNumber },
                      include: [
                          { model: OutboundCallType, attributes: ['type_name'] },
                          { model: CallAttemptStatus, attributes: ['status_name'] },
                          { model: CallDisposition, attributes: ['disposition_name'] },
                          { model: FinalClosureStatus, attributes: ['status_name'] },
                          { model: Customer, attributes: ['name', 'phone'] },
                      ]
                  });

                  if (formDetails && formDetails.outcomeTagIds) {
                      const tagIds = formDetails.outcomeTagIds.split(',').map(Number);
                      const tags = await OutcomeTag.findAll({
                          where: { id: tagIds },
                          attributes: ['tag_name']
                      });
                      formDetails.dataValues.outcomeTagNames = tags.map(t => t.tag_name);
                  }
              }

              const customerDetails = call.customerNumber
                  ? await Customer.findOne({ where: { phone: call.customerNumber } })
                  : null;

              const agentDetails = call.agentNumber
                  ? await Employee.findOne({ where: { EmployeePhone: call.agentNumber } })
                  : null;

              return {
                  id: call.clientCorrelationId,
                  callId: call.clientCorrelationId,
                  callerName: customerDetails?.name || 'Unknown',
                  callerNumber: call.customerNumber,
                  agentName: agentDetails?.EmployeeName || 'Unknown',
                  agentPhone: call.agentNumber,
                  agentId: agentDetails?.EmployeeId || null,
                  region: formDetails?.Region || call.callerCircle || 'N/A',
                  callDateTime: new Date(parseInt(call.startTime)).toISOString(),
                  duration: call.conversationDurationFormatted || '0m 0s',
                  status: call.overallCallStatus === 'Answered' ? 'answered' : 'missed',
                  ogCallStatus: call.overallCallStatus,
                  remarks: formDetails?.remarks || null,
                  voiceRecording: call.recordingUrl || 'No Voice',
                  agentDetails: agentDetails?.toJSON() || null,
                  customerDetails: customerDetails?.toJSON() || null,
                  formDetails: formDetails
                      ? {
                          callTypeName: formDetails.OutboundCallType?.type_name || null,
                          attemptStatusName: formDetails.CallAttemptStatus?.status_name || null,
                          dispositionName: formDetails.CallDisposition?.disposition_name || null,
                          closureStatusName: formDetails.FinalClosureStatus?.status_name || null,
                          customerName: formDetails.Customer?.name || null,
                          customerPhone: formDetails.Customer?.phone || null,
                          outcomeTagNames: formDetails.dataValues.outcomeTagNames || []
                      }
                      : null
              };
          })
      );

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
                  missed: missedCalls,
                  totalTalkTime
              }
          }
      });

  } catch (error) {
      console.error('Error fetching outgoing call logs:', error);
      res.status(500).json({
          success: false,
          message: 'Failed to fetch outgoing call logs',
          error: error.message
      });
  }
};


exports.exportOutgoingCallLogs = async (req, res) => {
    try {
      const {
        search = '',
        status = '',
        agentNumber = '',
        startDate = '',
        endDate = '',
        employeeId = '',
      } = req.query;
  
      const whereClause = { callType: 'OUTBOUND' };
  
      if (search) {
        whereClause[Op.or] = [
          { callerId: { [Op.like]: `%${search}%` } },
          { customerNumber: { [Op.like]: `%${search}%` } },
          { agentNumber: { [Op.like]: `%${search}%` } },
          { callerCircle: { [Op.like]: `%${search}%` } }
        ];
      }
  
      if (status === 'true' || status === 'Connected') {
        whereClause.overallCallStatus = 'Answered';
      } else if (status === 'false' || status === 'Not Connected') {
        whereClause.overallCallStatus = { [Op.ne]: 'Answered' };
      }
  
      if (agentNumber) {
        whereClause.agentNumber = agentNumber;
      }
  
      if (startDate && endDate) {
        whereClause.date = { [Op.between]: [startDate, endDate] };
      } else if (startDate) {
        whereClause.date = { [Op.gte]: startDate };
      } else if (endDate) {
        whereClause.date = { [Op.lte]: endDate };
      }
  
      let order = [['startTime', 'DESC']];
      
  
      let calls = await CallLogs.findAll({
        where: whereClause,
        order
      });

      if (employeeId) {
        const matchingFormDetails = await OutgoingFormDetail.findAll({
          where: { EmployeeId: employeeId },
          attributes: ['customerNumber']
        });
  
        const customerNumbers = matchingFormDetails.map(fd => fd.customerNumber);
  
        calls = calls.filter(call => customerNumbers.includes(call.customerNumber));
      }
  
      const transformedData = await Promise.all(
        calls.map(async (call) => {
          let formDetails = null;
          if (call.customerNumber) {
            formDetails = await OutgoingFormDetail.findOne({
              where: { customerNumber: call.customerNumber },
              include: [
                { model: OutboundCallType, attributes: ['type_name'] },
                { model: CallAttemptStatus, attributes: ['status_name'] },
                { model: CallDisposition, attributes: ['disposition_name'] },
                { model: FinalClosureStatus, attributes: ['status_name'] },
                { model: Customer, attributes: ['name', 'phone'] },
              ]
            });
  
            if (formDetails && formDetails.outcomeTagIds) {
              const tagIds = formDetails.outcomeTagIds.split(',').map(Number);
              const tags = await OutcomeTag.findAll({
                where: { id: tagIds },
                attributes: ['tag_name']
              });
              formDetails.dataValues.outcomeTagNames = tags.map(t => t.tag_name);
            }
          }
  
          const customerDetails = call.customerNumber
            ? await Customer.findOne({ where: { phone: call.customerNumber } })
            : null;
  
          const agentDetails = call.agentNumber
            ? await Employee.findOne({ where: { EmployeePhone: call.agentNumber } })
            : null;
  
          return {
            CallID: call.clientCorrelationId,
            CustomerName: customerDetails?.name || formDetails?.Customer?.name || 'Unknown',
            CustomerNumber: call.customerNumber || '',
            AgentName: agentDetails?.EmployeeName || 'Unknown',
            AgentPhone: call.agentNumber || '',
            CallDateTime: new Date(parseInt(call.startTime)).toLocaleString(),
            Duration: call.conversationDurationFormatted || '0m 0s',
            CallStatus: call.overallCallStatus === 'Answered' ? 'Answered' : 'Missed',
            Region: formDetails?.Region || call.callerCircle || 'N/A',
            CallType: formDetails?.OutboundCallType?.type_name || '',
            AttemptStatus: formDetails?.CallAttemptStatus?.status_name || '',
            Disposition: formDetails?.CallDisposition?.disposition_name || '',
            ClosureStatus: formDetails?.FinalClosureStatus?.status_name || '',
            OutcomeTags: formDetails?.dataValues?.outcomeTagNames?.join(', ') || '',
            Remarks: formDetails?.remarks || ''
          };
        })
      );
  
      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Outgoing Call Logs');
  
      worksheet.columns = [
        { header: 'Call ID', key: 'CallID', width: 30 },
        { header: 'Customer Name', key: 'CustomerName', width: 25 },
        { header: 'Customer Number', key: 'CustomerNumber', width: 20 },
        { header: 'Agent Name', key: 'AgentName', width: 25 },
        { header: 'Agent Phone', key: 'AgentPhone', width: 20 },
        { header: 'Call Date Time', key: 'CallDateTime', width: 25 },
        { header: 'Duration', key: 'Duration', width: 15 },
        { header: 'Call Status', key: 'CallStatus', width: 15 },
        { header: 'Region', key: 'Region', width: 25 },
        { header: 'Call Type', key: 'CallType', width: 20 },
        { header: 'Attempt Status', key: 'AttemptStatus', width: 20 },
        { header: 'Disposition', key: 'Disposition', width: 20 },
        { header: 'Closure Status', key: 'ClosureStatus', width: 20 },
        { header: 'Outcome Tags', key: 'OutcomeTags', width: 30 },
        { header: 'Remarks', key: 'Remarks', width: 30 }
      ];
      console.log(transformedData,'--------------------');
      worksheet.addRows(transformedData);
  
      // Set response headers
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="OutgoingCallLogs_${Date.now()}.xlsx"`
      );
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('❌ Error exporting call logs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export outgoing call logs',
        error: error.message
      });
    }
};


exports.getEmployeesByRole = async (req, res) => { 
  try {
    const { roleId } = req.params;

    const employees = await Employee.findAll({
      where: { EmployeeRoleID: roleId },
      attributes: ['EmployeeId', 'EmployeeName', 'EmployeePhone', 'EmployeeMailId', 'EmployeeRegion', 'is_active'],
      order: [['EmployeeName', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    console.error('Error fetching employees by role:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message,
    });
  }
};