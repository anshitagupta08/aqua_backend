const { Op } = require('sequelize');
const { sequelize, Call, SupportType, QueryType, Employee } = require('../../models');
const FormDetail = require('../../models/Form/FormDetail');
const OutboundFormDetail = require('../../models/Form/OutboundFormDetail'); // for customer/trader details
const { Customer } = require('../../models');
const CallLogs = require('../../models/Calling/CallLogs');
const SourceType = require('../../models/Master/SourceType');
const OutboundCallType = require('../../models/Master/OutboundCallType');
const CallAttemptStatus = require('../../models/Master/CallAttemptStatus');
const CallDisposition = require('../../models/Master/CallDisposition');
const FinalClosureStatus = require('../../models/Master/FinalClosureStatus');


exports.getFollowUpCalls = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            fromDate,
            toDate,
            status = "open",
            employeeId
        } = req.query;

        const offset = (page - 1) * limit;

        // DATE FILTER
        const buildDateFilter = () => {
            if (fromDate && toDate) return { [Op.between]: [new Date(fromDate), new Date(toDate)] };
            if (fromDate) return { [Op.gte]: new Date(fromDate) };
            if (toDate) return { [Op.lte]: new Date(toDate) };
            return { [Op.gte]: new Date() }; // Default = upcoming follow-ups
        };

        const whereIncoming = {
            status,
            followUpDate: buildDateFilter()
        };

        const whereOutgoing = {
            followUpRequired: true,
            followUpDate: buildDateFilter()
        };

        // FILTER BY EMPLOYEE ID
        if (employeeId) {
            whereIncoming.EmployeeId = employeeId;
            whereOutgoing.EmployeeId = employeeId;
        }

        // Incoming follow-ups
        const { rows: incomingRows } = await FormDetail.findAndCountAll({
            where: whereIncoming,
            include: [
                {
                    model: Employee,
                    as: 'createdByEmployee',
                    attributes: ["EmployeeId", "EmployeeName", "EmployeeMailId", "EmployeePhone"]
                }
            ],
            order: [["followUpDate", "ASC"]],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        // Outgoing follow-ups
        const { rows: outgoingRows } = await OutboundFormDetail.findAndCountAll({
            where: whereOutgoing,
            include: [
                {
                    model: Employee,
                    as: 'employee',
                    attributes: ["EmployeeId", "EmployeeName", "EmployeeMailId", "EmployeePhone"]
                }
            ],
            order: [["followUpDate", "ASC"]],
            limit: parseInt(limit),
            offset: parseInt(offset),
        });



        // Collect numbers to map customer names
        const customerNumbers = [
            ...incomingRows.map((f) => f.customerPhoneNumber),
            ...outgoingRows.map((f) => f.customerNumber),
        ].filter(Boolean);



        const customers = await Customer.findAll({
            where: { phone: { [Op.in]: customerNumbers } },
            attributes: ["phone", "name"],
        });

        const customerMap = customers.reduce((acc, cust) => {
            acc[cust.phone] = cust.name;
            return acc;
        }, {});



        const normalize = (number) => String(number).replace(/\D/g, "").replace(/^91/, "");

        const incomingResult = incomingRows.map((f) => {
            const phone = normalize(f.customerPhoneNumber);
            return {
                formId: f.id,
                name: customerMap[phone] || "Unknown",
                number: phone,
                time: f.followUpDate,
                status: f.status,
                remark: f.remarks,
                type: "Incoming",
                employee: f.createdByEmployee
                    ? {
                        id: f.createdByEmployee.EmployeeId,
                        name: f.createdByEmployee.EmployeeName,
                        email: f.createdByEmployee.EmployeeMailId,
                        mobile: f.createdByEmployee.EmployeePhone,
                    }
                    : null,
            };
        });

        const outgoingResult = outgoingRows.map((f) => {
            const phone = normalize(f.customerNumber);
            return {
                formId: f.CallId,
                name: customerMap[phone] || "Unknown",
                number: phone,
                time: f.followUpDate,
                status: "open",
                remark: f.remarks,
                type: "Outgoing",
                employee: f.employee
                    ? {
                        id: f.employee.EmployeeId,
                        name: f.employee.EmployeeName,
                        email: f.employee.EmployeeMailId,
                        mobile: f.employee.EmployeePhone,
                    }
                    : null,
            };
        });

        const combinedResult = [...incomingResult, ...outgoingResult].sort(
            (a, b) => new Date(b.time) - new Date(a.time)
        ); // DESC

        res.status(200).json({
            success: true,
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


exports.getHistoryByNumber = async (req, res) => {
    try {
        const { number } = req.query;
        console.log(number);
        if (!number) {
            return res.status(400).json({ message: "number is required" });
        }

        const normalized = normalize(number);


        // ========== INBOUND CALLS ==========
        const inbound = await Call.findAll({
            where: {
                Caller_Number: {
                    [Op.like]: `0${normalized}%`
                }
            }
        });

        console.log(inbound, '---------------');


        const inboundMapped = inbound.map((c) => {
            // Many inbound logs have date like "30/07/2025"
            // Convert safely:
            let timestamp;

            try {
                const [d, m, y] = c.Date.split("/");
                timestamp = new Date(`${y}-${m}-${d} ${c.Time}`);
            } catch {
                timestamp = new Date(); // fallback
            }

            return {
                type: "inbound_call",
                timestamp,
                title: "Inbound Call",
                data: c,
            };
        });

        // ========== OUTBOUND CALLS ==========
        const outbound = await CallLogs.findAll({
            where: {
                customerNumber: { [Op.like]: `%${normalized}` },
            },
        });

        const outboundMapped = outbound.map((c) => ({
            type: "outbound_call",
            timestamp: new Date(Number(c.startTime)), // Unix timestamp
            title: "Outbound Call",
            data: c,
        }));

        // ========== INBOUND FORMS ==========
        const incomingForms = await FormDetail.findAll({
            where: {
                customerPhoneNumber: { [Op.like]: `%${normalized}` },
            },
            include: [
                { model: QueryType, attributes: ['queryName'] },
                { model: SupportType, attributes: ['supportName'] },
                { model: SourceType, attributes: ['source_name'] },
            ]
        });

        const incomingFormsMapped = incomingForms.map((f) => ({
            type: "incoming_form",
            timestamp: new Date(f.createdAt),
            title: "Incoming Form Filled",
            data: f,
        }));

        // ========== OUTBOUND FORMS ==========
        const outgoingForms = await OutboundFormDetail.findAll({
            where: {
                customerNumber: { [Op.like]: `%${normalized}` },
            },
            include: [
                { model: OutboundCallType, attributes: ['type_name'] },
                { model: CallAttemptStatus, attributes: ['status_name'] },
                { model: CallDisposition, attributes: ['disposition_name'] },
                { model: FinalClosureStatus, attributes: ['status_name'] },
            ]
        });

        const outgoingFormsMapped = outgoingForms.map((f) => ({
            type: "outgoing_form",
            timestamp: new Date(f.createdAt),
            title: "Outgoing Form Filled",
            data: f,
        }));

        // ========== MERGE + SORT ==========
        const timeline = [
            ...inboundMapped,
            ...outboundMapped,
            ...incomingFormsMapped,
            ...outgoingFormsMapped,
        ].sort((a, b) => b.timestamp - a.timestamp);

        return res.status(200).json({
            success: true,
            number: normalized,
            count: timeline.length,
            timeline,
        });

    } catch (err) {
        console.error("Error in history API:", err);
        res.status(500).json({ message: "Failed to fetch history" });
    }
};


exports.updateFollowUpById = async (req, res) => {
    try {
        const id = req.params.id;
        const type = req.params.type;

        const data = req.body;

        if (type === "incoming_form") {
            const form = await FormDetail.findByPk(id);

            await form.update({
                status: data.status,
                followUpDate: data.status === 'open' ? data.followUpDate : null,
                remarks: data.remarks.trim()
            });
        } else if (type === "outgoing_form") {
            const form = await OutboundFormDetail.findByPk(id);

            await form.update({
                followUpRequired: data.followUpRequired,
                followUpDate: data.followUpRequired === true ? data.followUpDate : null,
                remarks: data.remarks.trim()
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Follow-up Updated successfully.',
        });
    } catch (error) {
        console.error('Error updating form:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update form.',
            error: error.message,
        });
    }
}

// Utility
const normalize = (num) => String(num).replace(/\D/g, "").slice(-10);
