// routes/customerReport.js
const express = require('express');
const router = express.Router();
const ExcelJS = require("exceljs");
const moment = require("moment");
const { Op } = require('sequelize');
const Customer = require('../../models/Customer/Customer');
const Call = require('../../models/Calling/Call');
const CallLogs = require('../../models/Calling/CallLogs');
const FormDetail = require('../../models/Form/FormDetail');
const OutboundFormDetail = require('../../models/Form/OutboundFormDetail');
const QueryType = require('../../models/Form/QueryType');
const SupportType = require('../../models/Form/SupportType');
const SourceType = require('../../models/Master/SourceType');
const OutboundCallType = require('../../models/Master/OutboundCallType');
const CallAttemptStatus = require('../../models/Master/CallAttemptStatus');
const CallDisposition = require('../../models/Master/CallDisposition');
const FinalClosureStatus = require('../../models/Master/FinalClosureStatus');

/**
 * GET /api/customer-reports
 * Get all customers with their call and form details
 * Query params:
 * - search: Search by customer name, email, or phone
 * - startDate: Filter calls from this date
 * - endDate: Filter calls until this date
 * - isActive: Filter active/inactive customers
 */

// exports.getCallHistoryReport = async (req, res) => {
//     try {
//         const {
//             search,
//             startDate,
//             endDate,
//             isActive,
//             page = 1,
//             limit = 10,
//         } = req.query;

//         const offset = (parseInt(page) - 1) * parseInt(limit);
//         const parsedLimit = parseInt(limit);

//         // ----------------------------
//         // CUSTOMER FILTER
//         // ----------------------------
//         const customerWhere = {};

//         if (search) {
//             customerWhere[Op.or] = [
//                 { name: { [Op.like]: `%${search}%` } },
//                 { email: { [Op.like]: `%${search}%` } },
//                 { phone: { [Op.like]: `%${search}%` } },
//             ];
//         }

//         if (isActive !== undefined) {
//             customerWhere.isActive = isActive === "true";
//         }

//         // ----------------------------
//         // DATE FILTER FOR CALLS / FORMS
//         // ----------------------------
//         const callDateFilter = {};
//         if (startDate) callDateFilter[Op.gte] = new Date(startDate);
//         if (endDate) callDateFilter[Op.lte] = new Date(endDate);

//         // Count for pagination
//         const totalCustomers = await Customer.count({ where: customerWhere });


//         // ----------------------------
//         // Fetch customers with inbound forms attached
//         // ----------------------------
//         const customers = await Customer.findAll({
//             where: customerWhere,
//             include: [
//                 {
//                     model: FormDetail,
//                     as: "formDetails",
//                     required: false,
//                     include: [
//                         { model: QueryType, attributes: ["queryName"], required: false },
//                         { model: SupportType, attributes: ["supportName"], required: false },
//                         { model: SourceType, attributes: ["source_name"], required: false },
//                     ],
//                     where:
//                         startDate || endDate
//                             ? { callDateTime: callDateFilter }
//                             : undefined,
//                 },
//             ],
//             order: [["name", "ASC"]],
//             offset,
//             limit: parsedLimit,
//         });


//         // --------------------------------------------------------------------
//         // PROCESS EACH CUSTOMER
//         // --------------------------------------------------------------------
//         const customerReports = await Promise.all(
//             customers.map(async (customer) => {
//                 const phone = normalizePhone(customer.phone);
//                 const id = customer.id;

//                 // -----------------------------
//                 // FETCH CALL LOGS (Inbound + Outbound)
//                 // -----------------------------
//                 const inboundCallsWhere = {
//                     [Op.or]: [
//                         { Caller_Number: phone },
//                         { Destination_Number: phone },
//                     ],
//                     Call_Type: "INBOUND",
//                 };

//                 const outboundCallsWhere = {
//                     [Op.or]: [
//                         // { agentNumber: phone },
//                         { customerNumber: phone },
//                     ],
//                 };

//                 if (startDate || endDate) {
//                     inboundCallsWhere.createdAt = callDateFilter;
//                     outboundCallsWhere.createdAt = callDateFilter;
//                 }

//                 const [inboundCalls, outboundCalls, inboundForms, outboundForms] =
//                     await Promise.all([
//                         Call.findAll({
//                             where: inboundCallsWhere,
//                             order: [["createdAt", "DESC"]],
//                         }),
//                         CallLogs.findAll({
//                             where: outboundCallsWhere,
//                             order: [["startTime", "DESC"]],
//                         }),
//                         // All inbound forms for this customer
//                         FormDetail.findAll({
//                             where: {
//                                 [Op.or]: [
//                                     { customerPhoneNumber: phone },
//                                     { customerId: id },
//                                 ],
//                                 ...(startDate || endDate
//                                     ? { callDateTime: callDateFilter }
//                                     : {}),
//                             },
//                             include: [
//                                 { model: QueryType, attributes: ["queryName"], required: false },
//                                 { model: SupportType, attributes: ["supportName"], required: false },
//                                 { model: SourceType, attributes: ["source_name"], required: false },
//                             ],
//                             order: [["callDateTime", "ASC"]],
//                         }),
//                         // Outbound forms
//                         OutboundFormDetail.findAll({
//                             where: {
//                                 [Op.or]: [{ customerNumber: phone }, { customerId: id }],
//                                 ...(startDate || endDate
//                                     ? { callDateTime: callDateFilter }
//                                     : {}),
//                             },
//                             include: [
//                                 { model: OutboundCallType, attributes: ["type_name"] },
//                                 { model: CallAttemptStatus, attributes: ["status_name"] },
//                                 { model: CallDisposition, attributes: ["disposition_name"] },
//                                 { model: FinalClosureStatus, attributes: ["status_name"] },
//                                 { model: Customer, attributes: ["name", "phone"] },
//                             ],
//                             order: [["callDateTime", "DESC"]],
//                         }),
//                     ]);

//                 // -----------------------------
//                 // SPLIT MANUAL vs CALL-LINKED FORMS
//                 // -----------------------------

//                 const inboundFormByCallId = new Map();
//                 const manualInboundForms = [];

//                 inboundForms.forEach((f) => {
//                     const callId = String(f?.CallId || "");

//                     if (callId.startsWith("MANUAL-")) {
//                         // This is a manual outbound form
//                         manualInboundForms.push(f);
//                     } else {
//                         // This is a real outbound call form
//                         inboundFormByCallId.set(callId, f);
//                     }
//                 });

//                 const outboundFormByCallId = new Map();
//                 const manualOutboundForms = [];

//                 outboundForms.forEach((f) => {
//                     const callId = String(f?.CallId || "");

//                     if (callId.startsWith("MANUAL-")) {
//                         manualOutboundForms.push(f);
//                     } else {
//                         // Store by CallId for direct matching (better than phone matching)
//                         outboundFormByCallId.set(callId, f);
//                     }
//                 });

//                 // -----------------------------
//                 // FORMAT INBOUND CALLS
//                 // -----------------------------
//                 const formattedInbound = inboundCalls.map((c) => ({
//                     id: c.Caller_ID,
//                     callId: c.CallId,
//                     callType: c.Call_Type,
//                     date: c.Date,
//                     time: c.Time,
//                     duration: c.Conversation_Duration,
//                     overallDuration: c.Overall_Call_Duration,
//                     status: c.Overall_Call_Status,
//                     callerNumber: c.Caller_Number,
//                     destinationNumber: c.Destination_Number,
//                     hangupCause: c.Hangup_Cause,
//                     recording: c.Recording,
//                     form: inboundFormByCallId.get(String(c.CallId)) || null,
//                 }));

//                 // -----------------------------
//                 // FORMAT OUTBOUND CALLS
//                 // -----------------------------
//                 const formattedOutbound = outboundCalls.map((call) => {
//                     return {
//                         id: call.id,
//                         callId: call.callerId,
//                         callType: call.callType,
//                         date: call.date,
//                         time: call.timestamp,
//                         duration: call.conversationDuration,
//                         overallDuration: call.overallCallDuration,
//                         status: call.overallCallStatus,
//                         callerNumber: call.agentNumber,
//                         destinationNumber: call.customerNumber,
//                         recording: call.recordingUrl,
//                         // Match form by CallId (more reliable than phone number)
//                         form: outboundFormByCallId.get(String(call.callerId)) || null,
//                     };
//                 });

//                 // -----------------------------
//                 // FILTER MANUAL FORMS FOR THIS CUSTOMER
//                 // -----------------------------
//                 const customerManualInboundForms = manualInboundForms.filter(
//                     (f) =>
//                         f.customerId === id ||
//                         f.customerPhoneNumber === phone
//                 );

//                 const customerManualOutboundForms = manualOutboundForms.filter(
//                     (f) => f.customerId === id || normalizePhone(f.customerNumber) === phone
//                 );

//                 // -----------------------------
//                 // SUMMARY COUNTS
//                 // -----------------------------
//                 const totalInboundForms = formattedInbound.filter((c) => c.form).length;
//                 const totalOutboundForms = formattedOutbound.filter((c) => c.form).length;

//                 const totalManualForms =
//                     customerManualInboundForms.length +
//                     customerManualOutboundForms.length;

//                 return {
//                     id,
//                     name: customer.name,
//                     email: customer.email,
//                     phone: customer.phone,
//                     address: customer.address,
//                     isActive: customer.isActive,

//                     inboundCalls: formattedInbound,
//                     outboundCalls: formattedOutbound,

//                     manualInboundForms: customerManualInboundForms,
//                     manualOutboundForms: customerManualOutboundForms,

//                     summary: {
//                         totalInboundCalls: formattedInbound.length,
//                         totalOutboundCalls: formattedOutbound.length,
//                         totalForms:
//                             totalInboundForms + totalOutboundForms + totalManualForms,
//                     },
//                 };
//             })
//         );

//         // -----------------------------
//         // RESPONSE
//         // -----------------------------
//         res.json({
//             success: true,
//             total: totalCustomers,
//             count: customerReports.length,
//             currentPage: parseInt(page),
//             totalPages: Math.ceil(totalCustomers / parsedLimit),
//             data: customerReports,
//         });
//     } catch (err) {
//         console.error("Error fetching call history report:", err);
//         res.status(500).json({
//             success: false,
//             message: "Error fetching reports",
//             error: err.message,
//         });
//     }
// };


exports.getCallHistoryReport = async (req, res) => {
    try {
        const {
            search,
            startDate,
            endDate,
            isActive,
            page = 1,
            limit = 10,
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const parsedLimit = parseInt(limit);

        // ============================================
        // STEP 1: BUILD CUSTOMER FILTERS
        // ============================================
        const customerWhere = {};

        if (search) {
            customerWhere[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phone: { [Op.like]: `%${search}%` } },
            ];
        }

        if (isActive !== undefined) {
            customerWhere.isActive = isActive === "true";
        }

        // ============================================
        // STEP 2: BUILD DATE FILTERS
        // ============================================
        const dateFilter = {};
        if (startDate) dateFilter[Op.gte] = new Date(startDate);
        if (endDate) dateFilter[Op.lte] = new Date(endDate);

        const hasDateFilter = startDate || endDate;

        // ============================================
        // STEP 3: GET TOTAL COUNT FOR PAGINATION
        // ============================================
        const totalCustomers = await Customer.count({ where: customerWhere });

        // ============================================
        // STEP 4: FETCH CUSTOMERS
        // ============================================
        const customers = await Customer.findAll({
            where: customerWhere,
            attributes: ['id', 'name', 'email', 'phone', 'address', 'isActive'],
            order: [['name', 'ASC']],
            offset,
            limit: parsedLimit,
        });

        // ============================================
        // STEP 5: PROCESS EACH CUSTOMER
        // ============================================
        const customerReports = await Promise.all(
            customers.map(async (customer) => {
                const customerId = customer.id;
                const customerPhone = normalizePhone(customer.phone);

                // --------------------------------------------
                // BUILD QUERY CONDITIONS
                // --------------------------------------------
                const inboundCallWhere = {
                    [Op.or]: [
                        { Caller_Number: customerPhone },
                        { Destination_Number: customerPhone },
                    ],
                    Call_Type: 'INBOUND',
                };

                const outboundCallWhere = {
                    destinationNumber: customerPhone,
                };

                const inboundFormWhere = {
                    [Op.or]: [
                        { customerId: customerId },
                        { customerPhoneNumber: customerPhone },
                    ],
                };

                const outboundFormWhere = {
                    [Op.or]: [
                        { customerId: customerId },
                        { customerNumber: customerPhone },
                    ],
                };

                // Apply date filters if provided
                if (hasDateFilter) {
                    inboundCallWhere.createdAt = dateFilter;
                    outboundCallWhere.createdAt = dateFilter;
                    inboundFormWhere.callDateTime = dateFilter;
                    outboundFormWhere.callDateTime = dateFilter;
                }

                // --------------------------------------------
                // FETCH ALL DATA IN PARALLEL
                // --------------------------------------------
                const [inboundCalls, outboundCalls, inboundForms, outboundForms] =
                    await Promise.all([
                        // Inbound calls
                        Call.findAll({
                            where: inboundCallWhere,
                            order: [['createdAt', 'DESC']],
                            raw: true,
                        }),

                        // Outbound calls
                        CallLogs.findAll({
                            where: outboundCallWhere,
                            order: [['startTime', 'DESC']],
                            raw: true,
                        }),

                        // Inbound forms
                        FormDetail.findAll({
                            where: inboundFormWhere,
                            include: [
                                {
                                    model: QueryType,
                                    attributes: ['id', 'queryName'],
                                    required: false
                                },
                                {
                                    model: SupportType,
                                    attributes: ['id', 'supportName'],
                                    required: false
                                },
                                {
                                    model: SourceType,
                                    attributes: ['id', 'source_name'],
                                    required: false
                                },
                            ],
                            order: [['callDateTime', 'DESC']],
                        }),

                        // Outbound forms
                        OutboundFormDetail.findAll({
                            where: outboundFormWhere,
                            include: [
                                {
                                    model: OutboundCallType,
                                    attributes: ['id', 'type_name'],
                                    required: false
                                },
                                {
                                    model: CallAttemptStatus,
                                    attributes: ['id', 'status_name'],
                                    required: false
                                },
                                {
                                    model: CallDisposition,
                                    attributes: ['id', 'disposition_name'],
                                    required: false
                                },
                                {
                                    model: FinalClosureStatus,
                                    attributes: ['id', 'status_name'],
                                    required: false
                                },
                            ],
                            order: [['callDateTime', 'DESC']],
                        }),
                    ]);

                // --------------------------------------------
                // ORGANIZE FORMS BY CALL ID
                // --------------------------------------------
                const inboundFormMap = new Map();
                const manualInboundForms = [];

                inboundForms.forEach((form) => {
                    const callId = form.CallId ? String(form.CallId) : '';

                    if (!callId || callId.startsWith('MANUAL-')) {
                        manualInboundForms.push(formatInboundForm(form));
                    } else {
                        inboundFormMap.set(callId, formatInboundForm(form));
                    }
                });

                const outboundFormMap = new Map();
                const manualOutboundForms = [];

                outboundForms.forEach((form) => {
                    const callId = form.CallId ? String(form.CallId) : '';
                    const number = form.customerNumber ? String(form.customerNumber) : '';

                    if (!callId || callId.startsWith('MANUAL-')) {
                        manualOutboundForms.push(formatOutboundForm(form));
                    } else {
                        outboundFormMap.set(number, formatOutboundForm(form));
                    }
                });

                // --------------------------------------------
                // FORMAT INBOUND CALLS WITH FORMS
                // --------------------------------------------
                const formattedInboundCalls = inboundCalls.map((call) => {
                    const callId = String(call.CallId);
                    const form = inboundFormMap.get(callId) || null;

                    return {
                        callId: call.CallId,
                        callType: 'INBOUND',
                        date: call.Date,
                        time: call.Time,
                        callerNumber: call.Caller_Number,
                        destinationNumber: call.Destination_Number,
                        duration: call.Conversation_Duration,
                        overallDuration: call.Overall_Call_Duration,
                        waitingTime: call.Caller_Waiting_Time,
                        status: call.Overall_Call_Status,
                        hangupCause: call.Hangup_Cause,
                        callerStatus: call.Caller_Status,
                        destinationStatus: call.Destination_Status,
                        recording: call.Recording,
                        form: form,
                        hasForm: form !== null,
                    };
                });


                // --------------------------------------------
                // FORMAT OUTBOUND CALLS WITH FORMS
                // --------------------------------------------
                const formattedOutboundCalls = outboundCalls.map((call) => {
                    const customerNumber = String(call.destinationNumber || '');
                    const form = outboundFormMap.get(customerNumber) || null;

                    return {
                        callId: call.callerId,
                        callType: 'OUTBOUND',
                        date: call.date,
                        time: call.timestamp,
                        callerNumber: call.agentNumber,
                        destinationNumber: call.customerNumber,
                        duration: call.conversationDurationFormatted || formatDuration(call.conversationDuration),
                        overallDuration: call.overallCallDuration || formatDuration(call.duration),
                        status: call.overallCallStatus,
                        agentStatus: call.agentStatus,
                        customerStatus: call.customerStatus,
                        hangupCause: call.customerHangupCause,
                        recording: call.recordingUrl,
                        form: form,
                        hasForm: form !== null,
                    };
                });

                // --------------------------------------------
                // CALCULATE SUMMARY STATISTICS
                // --------------------------------------------
                const totalInboundCalls = formattedInboundCalls.length;
                const totalOutboundCalls = formattedOutboundCalls.length;
                const inboundCallsWithForms = formattedInboundCalls.filter(c => c.hasForm).length;
                const outboundCallsWithForms = formattedOutboundCalls.filter(c => c.hasForm).length;
                const totalManualForms = manualInboundForms.length + manualOutboundForms.length;
                const totalForms = inboundCallsWithForms + outboundCallsWithForms + totalManualForms;

                // --------------------------------------------
                // RETURN CUSTOMER REPORT
                // --------------------------------------------
                return {
                    customer: {
                        id: customer.id,
                        name: customer.name,
                        email: customer.email,
                        phone: customer.phone,
                        address: customer.address,
                        isActive: customer.isActive,
                    },
                    calls: {
                        inbound: formattedInboundCalls,
                        outbound: formattedOutboundCalls,
                    },
                    manualForms: {
                        inbound: manualInboundForms,
                        outbound: manualOutboundForms,
                    },
                    summary: {
                        totalCalls: totalInboundCalls + totalOutboundCalls,
                        totalInboundCalls,
                        totalOutboundCalls,
                        totalForms,
                        inboundCallsWithForms,
                        outboundCallsWithForms,
                        manualInboundForms: manualInboundForms.length,
                        manualOutboundForms: manualOutboundForms.length,
                    },
                };
            })
        );

        // ============================================
        // RETURN RESPONSE
        // ============================================
        res.json({
            success: true,
            data: customerReports,
            pagination: {
                total: totalCustomers,
                count: customerReports.length,
                page: parseInt(page),
                limit: parsedLimit,
                totalPages: Math.ceil(totalCustomers / parsedLimit),
            },
        });

    } catch (error) {
        console.error('Error fetching call history report:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching call history report',
            error: error.message,
        });
    }
};

const normalizePhone = (num) => {
    if (!num) return "";
    return num.replace(/\D/g, "").replace(/^0+/, ""); // remove non-digits and leading zeros
};

/**
 * Format inbound form data
 */
function formatInboundForm(form) {
    return {
        id: form.id,
        callId: form.CallId,
        customerId: form.customerId,
        customerPhone: form.customerPhoneNumber,
        employeeId: form.EmployeeId,
        callDateTime: form.callDateTime,
        callType: form.callType,
        inquiryNumber: form.inquiryNumber,
        supportType: form.SupportType ? {
            id: form.SupportType.id,
            name: form.SupportType.supportName,
        } : null,
        queryType: form.QueryType ? {
            id: form.QueryType.id,
            name: form.QueryType.queryName,
        } : null,
        sourceType: form.SourceType ? {
            id: form.SourceType.id,
            name: form.SourceType.source_name,
        } : null,
        remarks: form.remarks,
        attachments: form.attachments,
        status: form.status,
        followUpDate: form.followUpDate,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
    };
}

/**
 * Format outbound form data
 */
function formatOutboundForm(form) {
    return {
        id: form.id,
        callId: form.CallId,
        customerId: form.customerId,
        customerNumber: form.customerNumber,
        employeeId: form.EmployeeId,
        callDateTime: form.callDateTime,
        callType: form.callType,
        callTypeDetail: form.OutboundCallType ? {
            id: form.OutboundCallType.id,
            name: form.OutboundCallType.type_name,
        } : null,
        attemptStatus: form.CallAttemptStatus ? {
            id: form.CallAttemptStatus.id,
            name: form.CallAttemptStatus.status_name,
        } : null,
        disposition: form.CallDisposition ? {
            id: form.CallDisposition.id,
            name: form.CallDisposition.disposition_name,
        } : null,
        closureStatus: form.FinalClosureStatus ? {
            id: form.FinalClosureStatus.id,
            name: form.FinalClosureStatus.status_name,
        } : null,
        outcomeTagIds: form.outcomeTagIds,
        remarks: form.remarks,
        followUpRequired: form.followUpRequired,
        followUpDate: form.followUpDate,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
    };
}

/**
 * Format duration from milliseconds to readable format
 */
function formatDuration(milliseconds) {
    if (!milliseconds) return '00:00:00';

    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * GET /api/customer-reports/:id
 * Get detailed report for a single customer
 */
exports.downloadCallHistoryReportById = async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        // ---------------------------------------------
        // FETCH CUSTOMER
        // ---------------------------------------------
        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        // ---------------------------------------------
        // DATE FILTER
        // ---------------------------------------------
        let callDateFilter = null;
        if (startDate && endDate) {
            callDateFilter = { [Op.between]: [new Date(startDate), new Date(endDate)] };
        } else if (startDate) {
            callDateFilter = { [Op.gte]: new Date(startDate) };
        } else if (endDate) {
            callDateFilter = { [Op.lte]: new Date(endDate) };
        }

        // ---------------------------------------------
        // HELPERS
        // ---------------------------------------------
        const normalize = (num) =>
            num ? num.toString().replace(/\D/g, "").slice(-10) : null;

        const parseCallDateTime = (call) => {
            if (call.Date && call.Time) {
                const dt = moment(`${call.Date} ${call.Time}`, [
                    "YYYY-MM-DD HH:mm:ss",
                    "YYYY-MM-DD hh:mm:ss A",
                    "DD/MM/YYYY HH:mm:ss",
                    moment.ISO_8601,
                ]);
                if (dt.isValid()) return dt.toDate();
            }
            if (call.startTime) return new Date(call.startTime);
            if (call.createdAt) return new Date(call.createdAt);
            return new Date(0);
        };

        const parseFormDateTime = (form) => {
            if (!form) return new Date(0);
            if (form.callDateTime) return new Date(form.callDateTime);
            if (form.createdAt) return new Date(form.createdAt);
            return new Date(0);
        };

        // ---------------------------------------------
        // PREPARE EXCEL
        // ---------------------------------------------
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Call History");

        sheet.columns = [
            { header: "Customer Name", key: "customerName", width: 25 },
            { header: "Customer Phone", key: "customerPhone", width: 20 },
            { header: "Customer Email", key: "customerEmail", width: 25 },
            { header: "Call Type", key: "callType", width: 15 },
            { header: "Call ID", key: "callId", width: 20 },

            { header: "Query Type", key: "queryType", width: 20 },
            { header: "Support Type", key: "supportType", width: 20 },
            { header: "Source Type", key: "sourceType", width: 20 },

            { header: "Date", key: "date", width: 15 },
            { header: "Time", key: "time", width: 15 },
            { header: "Overall Duration", key: "overallDuration", width: 20 },
            { header: "Call Status", key: "status", width: 15 },
            { header: "Caller Number", key: "callerNumber", width: 20 },
            { header: "Destination Number", key: "destinationNumber", width: 20 },

            { header: "Remarks", key: "remarks", width: 30 },
            { header: "Follow-Up Required", key: "followUpRequired", width: 20 },
            { header: "Follow-Up Date", key: "followUpDate", width: 20 },
            { header: "Closure Status", key: "closureStatus", width: 20 },
            { header: "Attempt Status", key: "attemptStatus", width: 20 },
            { header: "Call Disposition", key: "disposition", width: 20 },
            { header: "Outbound Call Type", key: "callTypeName", width: 20 },
        ];

        // ---------------------------------------------
        // FETCH RAW DATA
        // ---------------------------------------------
        const phone = normalize(customer.phone);
        const zeroPhone = phone ? `0${phone}` : null;

        const [
            inboundCalls,
            outboundCalls,
            inboundForms,
            outboundForms
        ] = await Promise.all([
            // INBOUND CALLS
            Call.findAll({
                where: {
                    [Op.or]: [
                        { Caller_Number: { [Op.in]: [phone, zeroPhone] } },
                        { Destination_Number: { [Op.in]: [phone, zeroPhone] } }
                    ],
                    Call_Type: "INBOUND",
                    ...(callDateFilter ? { Date: callDateFilter } : {})
                },
                order: [["Date", "ASC"], ["Time", "ASC"]],
            }),

            // OUTBOUND CALLS
            CallLogs.findAll({
                where: {
                    destinationNumber: phone,
                    callType: "OUTBOUND",
                    ...(callDateFilter ? { date: callDateFilter } : {})
                },
                order: [["startTime", "ASC"]],
            }),

            // INBOUND FORMS
            FormDetail.findAll({
                where: {
                    [Op.or]: [
                        { customerPhoneNumber: customer.phone },
                        { customerId: customer.id }
                    ],
                    ...(callDateFilter ? { callDateTime: callDateFilter } : {})
                },
                include: [
                    { model: QueryType, attributes: ["queryName"], required: false },
                    { model: SupportType, attributes: ["supportName"], required: false },
                    { model: SourceType, attributes: ["source_name"], required: false }
                ],
                order: [["callDateTime", "ASC"]],
            }),

            // OUTBOUND FORMS
            OutboundFormDetail.findAll({
                where: {
                    [Op.or]: [
                        { customerNumber: customer.phone },
                        { customerId: customer.id }
                    ],
                    ...(callDateFilter ? { callDateTime: callDateFilter } : {})
                },
                include: [
                    { model: OutboundCallType, attributes: ["type_name"], required: false },
                    { model: CallAttemptStatus, attributes: ["status_name"], required: false },
                    { model: CallDisposition, attributes: ["disposition_name"], required: false },
                    { model: FinalClosureStatus, attributes: ["status_name"], required: false }
                ],
                order: [["callDateTime", "ASC"]],
            })
        ]);

        // ---------------------------------------------
        // CLEAN / ORGANIZE INBOUND FORMS (by CallId)
        // ---------------------------------------------
        const inboundMap = new Map();
        const inboundManual = [];

        inboundForms.forEach(f => {
            const cid = f.CallId ? String(f.CallId) : "";

            if (!cid || cid.startsWith("MANUAL-")) inboundManual.push(f);
            else inboundMap.set(cid, f);
        });

        // ---------------------------------------------
        // CLEAN / ORGANIZE OUTBOUND FORMS (by customerNumber ONLY)
        // ---------------------------------------------
        const outboundMap = new Map();
        const outboundManual = [];

        outboundForms.forEach(f => {
            const cid = f.CallId ? String(f.CallId) : "";
            const custNum = normalize(f.customerNumber);

            if (!cid || cid.startsWith("MANUAL-")) outboundManual.push(f);
            else outboundMap.set(custNum, f);
        });

        // ---------------------------------------------
        // ROW BUILDER
        // ---------------------------------------------
        const addRows = (customer, callsArr, formsArr, typeLabel) => {
            callsArr.sort((a, b) => parseCallDateTime(a) - parseCallDateTime(b));
            formsArr.sort((a, b) => parseFormDateTime(a) - parseFormDateTime(b));

            const max = Math.max(callsArr.length, formsArr.length);
            console.log('max', max);

            for (let i = 0; i < max; i++) {
                const call = callsArr[i] || null;
                const form = formsArr[i] || null;

                const callDate = call?.Date || "-";
                const callTime = call ? moment(parseCallDateTime(call)).format("hh:mm:ss A") : "-";
                const formFollowUp = form?.followUpDate
                    ? moment(form.followUpDate).format("DD/MM/YYYY hh:mm A")
                    : "-";

                sheet.addRow({
                    customerName: customer.name || "-",
                    customerPhone: customer.phone || "-",
                    customerEmail: customer.email || "-",

                    callType: (call || form) ? typeLabel : "-",
                    callId: (call || form) ? (call?.CallId || call?.callerId || form?.CallId || "-") : "-",

                    queryType: form?.QueryType?.queryName || "-",
                    supportType: form?.SupportType?.supportName || "-",
                    sourceType: form?.SourceType?.source_name || "-",

                    date: call ? callDate : (form ? moment(form.callDateTime).format("YYYY-MM-DD") : "-"),
                    time: call ? callTime : (form ? moment(form.callDateTime).format("hh:mm:ss A") : "-"),

                    overallDuration: call?.overallCallDuration || call?.Overall_Call_Duration || "-",
                    status: call?.overallCallStatus || call?.Overall_Call_Status || "-",

                    callerNumber: call?.Caller_Number || call?.agentNumber || "-",
                    destinationNumber: call?.Destination_Number || call?.customerNumber || form?.customerNumber || "-",

                    remarks: form?.remarks || "-",
                    followUpRequired: form?.followUpRequired ? "Yes" : "No",
                    followUpDate: formFollowUp,

                    closureStatus: form?.FinalClosureStatus?.status_name || "-",
                    attemptStatus: form?.CallAttemptStatus?.status_name || "-",
                    disposition: form?.CallDisposition?.disposition_name || "-",
                    callTypeName: form?.OutboundCallType?.type_name || "-",
                });
            }
        };

        // ---------------------------------------------
        // WRITE INBOUND + OUTBOUND
        // ---------------------------------------------
        addRows(customer, inboundCalls, inboundForms, "Inbound");
        addRows(customer, outboundCalls, outboundForms, "Outbound");

        // ---------------------------------------------
        // STYLE HEADER
        // ---------------------------------------------
        sheet.getRow(1).eachCell((c) => {
            c.font = { bold: true };
            c.alignment = { vertical: "middle", horizontal: "center" };
            c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
        });
        console.log('customer', customer.name);

        // ---------------------------------------------
        // SEND FILE
        // ---------------------------------------------
        const buffer = await workbook.xlsx.writeBuffer();
        const filename = `Customer_${customer.name}_Call_History_${moment().format("YYYYMMDD_HHmmss")}.xlsx`;

        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        return res.send(buffer);

    } catch (error) {
        console.error("Excel Report Error:", error);
        return res.status(500).json({
            success: false,
            message: "Error generating report",
            error: error.message,
        });
    }
};


/**
 * GET /api/customer-reports/download-all
 * Download all customer reports as JSON
 */
exports.downloadAllCallHistoryReports = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // ---------------------------
        // DATE FILTER CONFIG
        // ---------------------------
        let callDateFilter = null;
        if (startDate && endDate) {
            // strictly between startDate and endDate
            callDateFilter = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else if (startDate) {
            // only from startDate onwards
            callDateFilter = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            // only up to endDate
            callDateFilter = {
                [Op.lte]: new Date(endDate)
            };
        }

        // ---------------------------
        // FETCH CUSTOMERS
        // ---------------------------
        const customers = await Customer.findAll();
        if (!customers.length) {
            return res.status(404).json({ success: false, message: "No customers found" });
        }

        // ---------------------------
        // EXCEL SETUP
        // ---------------------------
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("All Call History");

        sheet.columns = [
            { header: "Customer Name", key: "customerName", width: 25 },
            { header: "Customer Phone", key: "customerPhone", width: 20 },
            { header: "Customer Email", key: "customerEmail", width: 25 },
            { header: "Call Type", key: "callType", width: 15 },
            { header: "Call ID", key: "callId", width: 20 },

            { header: "Query Type", key: "queryType", width: 20 },
            { header: "Support Type", key: "supportType", width: 20 },
            { header: "Source Type", key: "sourceType", width: 20 },

            { header: "Date", key: "date", width: 15 },
            { header: "Time", key: "time", width: 15 },
            { header: "Overall Duration", key: "overallDuration", width: 20 },
            { header: "Status", key: "status", width: 15 },
            { header: "Caller Number", key: "callerNumber", width: 20 },
            { header: "Destination Number", key: "destinationNumber", width: 20 },

            { header: "Remarks", key: "remarks", width: 30 },
            { header: "Follow-Up Required", key: "followUpRequired", width: 20 },
            { header: "Follow-Up Date", key: "followUpDate", width: 20 },
            { header: "Closure Status", key: "closureStatus", width: 20 },
            { header: "Attempt Status", key: "attemptStatus", width: 20 },
            { header: "Call Disposition", key: "disposition", width: 20 },
            { header: "Outbound Call Type", key: "callTypeName", width: 20 },
        ];

        // ---------------------------
        // HELPERS
        // ---------------------------
        const normalize = (num) => (num ? num.toString().replace(/\D/g, "").slice(-10) : null);

        const parseCallDateTime = (call) => {
            // Try combine Date + Time; fallbacks if missing
            if (call.Date && call.Time) {
                // handle possible formats
                const dt = moment(`${call.Date} ${call.Time}`, [
                    "YYYY-MM-DD HH:mm:ss",
                    "YYYY-MM-DD hh:mm:ss A",
                    "YYYY-MM-DD HH:mm",
                    "YYYY-MM-DD",
                    "DD/MM/YYYY HH:mm:ss",
                    "DD-MM-YYYY HH:mm:ss",
                    moment.ISO_8601,
                ], true);
                if (dt.isValid()) return dt.toDate();
            }

            // try Date only
            if (call.Date) {
                const d = moment(call.Date, [moment.ISO_8601, "YYYY-MM-DD", "DD/MM/YYYY", "DD-MM-YYYY"], true);
                if (d.isValid()) return d.toDate();
            }

            // try fields like startTime or createdAt
            if (call.startTime) {
                const d = moment(call.startTime);
                if (d.isValid()) return d.toDate();
            }
            if (call.createdAt) return new Date(call.createdAt);

            // fallback to epoch 0 so it sorts first/last consistently
            return new Date(0);
        };

        const parseFormDateTime = (form) => {
            if (!form) return new Date(0);
            if (form.callDateTime) {
                const d = moment(form.callDateTime);
                if (d.isValid()) return d.toDate();
            }
            if (form.createdAt) return new Date(form.createdAt);
            return new Date(0);
        };

        // For sequential pairing: pair call[i] with form[i]
        const sequentialPairRows = (customer, callsArr, formsArr, callTypeLabel) => {
            // callsArr and formsArr should already be filtered to relevant phone/customer
            // sort ascending
            callsArr.sort((a, b) => parseCallDateTime(a) - parseCallDateTime(b));
            formsArr.sort((a, b) => parseFormDateTime(a) - parseFormDateTime(b));

            const maxLen = Math.max(callsArr.length, formsArr.length);
            for (let i = 0; i < maxLen; i++) {
                const call = callsArr[i] || null;
                const form = formsArr[i] || null;

                // derive display fields
                const callDate = call ? (call.Date || "-") : "-";
                const callTime = call ? (() => {
                    const dt = parseCallDateTime(call);
                    return dt && dt.getTime() !== 0 ? moment(dt).format("hh:mm:ss A") : "-";
                })() : "-";

                const formFollowUpDate = form?.followUpDate ? moment(form.followUpDate).format("DD/MM/YYYY hh:mm A") : "-";

                // common mapping for query/support/source from inbound form include
                const queryType = form?.QueryType?.queryName || form?.query_type || "-";
                const supportType = form?.SupportType?.supportName || form?.support_type || "-";
                const sourceType = form?.SourceType?.source_name || form?.source_type || "-";

                // For outbound, some fields are under different names; handle gracefully below when callTypeLabel === 'Outbound'

                // Build row object with safe defaults
                sheet.addRow({
                    customerName: customer.name || "-",
                    customerPhone: customer.phone || "-",
                    customerEmail: customer.email || "-",
                    callType: call ? callTypeLabel : "-", // if form-only row, show "-"
                    callId: call ? (call.CallId || call.callerId || "-") : "-",

                    queryType,
                    supportType,
                    sourceType,

                    date: call ? callDate : (form ? (form.callDateTime ? moment(form.callDateTime).format("YYYY-MM-DD") : "-") : "-"),
                    time: call ? callTime : (form ? (form.callDateTime ? moment(form.callDateTime).format("hh:mm:ss A") : "-") : "-"),
                    overallDuration: call ? (call.Overall_Call_Duration || call.overallCallDuration || "-") : "-",
                    status: call ? (call.Overall_Call_Status || call.overallCallStatus || "-") : "-",

                    callerNumber: call ? (call.Caller_Number || call.agentNumber || "-") : "-",
                    destinationNumber: call ? (call.Destination_Number || call.customerNumber || "-") : "-",

                    remarks: form?.remarks || "-",
                    followUpRequired: form?.status === "open" || form?.followUpRequired ? "Yes" : "No",
                    followUpDate: formFollowUpDate,

                    closureStatus: form?.FinalClosureStatus?.status_name || form?.closureStatus || "-",
                    attemptStatus: form?.CallAttemptStatus?.status_name || form?.attemptStatus || "-",
                    disposition: form?.CallDisposition?.status_name || form?.disposition || "-",
                    callTypeName: form?.OutboundCallType?.type_name || "-",
                });
            }
        };

        // ---------------------------
        // PROCESS EACH CUSTOMER
        // ---------------------------
        for (const customer of customers) {
            // normalize phone forms
            const phone = normalize(customer.phone);
            const zeroPhone = phone ? "0" + phone : null;

            // fetch data in parallel
            const [
                inboundCallsRaw,
                outboundCallsRaw,
                inboundFormsRaw,
                outboundFormsRaw
            ] = await Promise.all([

                // inbound calls: match phone with or without leading zero
                Call.findAll({
                    where: {
                        [Op.or]: [
                            { Caller_Number: { [Op.in]: phone ? [phone, zeroPhone] : [customer.phone] } },
                            { Destination_Number: { [Op.in]: phone ? [phone, zeroPhone] : [customer.phone] } },
                        ],
                        Call_Type: "INBOUND",
                        ...(callDateFilter ? { Date: callDateFilter } : {}),
                    },
                    order: [["Date", "ASC"], ["Time", "ASC"]],
                }),

                // outbound calls
                CallLogs.findAll({
                    where: {
                        [Op.or]: [
                            { agentNumber: customer.phone },
                            { customerNumber: customer.phone },
                        ],
                        callType: "OUTBOUND",
                        ...(callDateFilter ? { date: callDateFilter } : {}),
                    },
                    order: [["startTime", "ASC"]],
                }),

                // inbound forms: phone OR customerId (customerId may be absent in some forms)
                FormDetail.findAll({
                    where: {
                        [Op.or]: [
                            { customerPhoneNumber: customer.phone },
                            { customerId: customer.id },
                        ],
                        ...(callDateFilter ? { callDateTime: callDateFilter } : {}),
                    },
                    include: [
                        { model: QueryType, attributes: ["queryName"], required: false },
                        { model: SupportType, attributes: ["supportName"], required: false },
                        { model: SourceType, attributes: ["source_name"], required: false },
                    ],
                    order: [["callDateTime", "ASC"]],
                }),

                // outbound forms
                OutboundFormDetail.findAll({
                    where: {
                        [Op.or]: [
                            { customerNumber: customer.phone },
                            { customerId: customer.id },
                        ],
                        ...(callDateFilter ? { callDateTime: callDateFilter } : {}),
                    },
                    include: [
                        { model: OutboundCallType, attributes: ["type_name"], required: false },
                        { model: CallAttemptStatus, attributes: ["status_name"], required: false },
                        { model: CallDisposition, attributes: ["disposition_name"], required: false },
                        { model: FinalClosureStatus, attributes: ["status_name"], required: false },
                    ],
                    order: [["callDateTime", "ASC"]],
                }),
            ]);

            // Filter forms strictly to those matching this customer's phone or id (defensive)
            const inboundForms = inboundFormsRaw.filter(f => {
                const fphone = normalize(f.customerPhoneNumber);
                return fphone === phone || fphone === zeroPhone || f.customerId === customer.id;
            });

            const outboundForms = outboundFormsRaw.filter(f => {
                const fphone = normalize(f.customerNumber);
                return fphone === phone || fphone === zeroPhone || f.customerId === customer.id;
            });

            // Now sequentially pair inbound calls & forms (one-to-one by index), showing form-only rows as well
            sequentialPairRows(customer, inboundCallsRaw, inboundForms, "Inbound");

            // Sequentially pair outbound calls & outbound forms
            sequentialPairRows(customer, outboundCallsRaw, outboundForms, "Outbound");
        }

        // ---------------------------
        // STYLE HEADER
        // ---------------------------
        sheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
            cell.alignment = { vertical: "middle", horizontal: "center" };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
        });

        // ---------------------------
        // SEND FILE
        // ---------------------------
        const buffer = await workbook.xlsx.writeBuffer();
        const filename = `All_Customers_Call_History_${moment().format("YYYYMMDD_HHmmss")}.xlsx`;

        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        return res.send(buffer);

    } catch (error) {
        console.error("❌ Error generating Excel:", error);
        return res.status(500).json({
            success: false,
            message: "Error generating report",
            error: error.message,
        });
    }
};






