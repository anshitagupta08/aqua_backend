const { Op } = require("sequelize");
const Customer = require('../../models/Customer/Customer');
const Call = require("../../models/Calling/Call");
const CallLogs = require("../../models/Calling/CallLogs");
const OutboundCallType = require("../../models/Master/OutboundCallType");
const CallAttemptStatus = require("../../models/Master/CallAttemptStatus");
const CallDisposition = require("../../models/Master/CallDisposition");
const FinalClosureStatus = require("../../models/Master/FinalClosureStatus");
const FormDetail = require("../../models/Form/FormDetail");
const OutboundFormDetail = require("../../models/Form/OutboundFormDetail");
const SupportType = require('../../models/Form/QueryType');
const QueryType = require('../../models/Form/SupportType');
const SourceType = require("../../models/Master/SourceType");

exports.getContactDirectory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;


    const { count, rows: customers } = await Customer.findAndCountAll({
      limit,
      offset,
      order: [["updatedAt", "DESC"]],
    });

    const customerNumbers = customers
      .map((cust) => cust.phone)
      .filter(Boolean);


    const callLogs = await CallLogs.findAll({
      where: {
        customerNumber: {
          [Op.in]: customerNumbers,
        },
      },
      order: [["createdAt", "DESC"]],
    });

    const formattedNumbers = customerNumbers.map((num) =>
      num.startsWith("0") ? num : `0${num}`
    );


    const call = await Call.findAll({
      where: {
        Caller_Number: {
          [Op.in]: formattedNumbers,
        },
      },
      order: [["createdAt", "DESC"]],
    });


    const customerData = await Promise.all(
      customers.map(async (cust) => {
        const phone = cust.phone;
        const formattedPhone = phone?.startsWith("0") ? phone : `0${phone}`;

        const outboundLogs = callLogs.filter(
          (log) => log.customerNumber === phone
        );

        const inboundLogs = call.filter(
          (log) => log.Caller_Number === formattedPhone
        );

        const allCalls = [
          ...outboundLogs.map((c) => ({
            ...c.toJSON(),
            callDirection: "outbound",
            createdAt: new Date(c.createdAt),
          })),
          ...inboundLogs.map((c) => ({
            ...c.toJSON(),
            callDirection: "inbound",
            createdAt: new Date(c.createdAt),
          })),
        ];

        const latestCall =
          allCalls.length > 0
            ? allCalls.reduce((latest, current) =>
              latest.createdAt > current.createdAt ? latest : current
            )
            : null;

        // Step 4: Fetch form detail for latest call (if any)
        let formDetail = null;
        if (latestCall?.CallId) {

          if (latestCall.callDirection === "inbound") {
            formDetail = await FormDetail.findOne({
              where: { CallId: latestCall.CallId },
              include: [
                { model: QueryType },
                { model: SupportType },
                { model: SourceType },
              ],
            });
          } else if (latestCall.callDirection === "outbound") {
            formDetail = await OutboundFormDetail.findOne({
              where: { CallId: latestCall.CallId },
              include: [
                { model: OutboundCallType },
                { model: CallAttemptStatus },
                { model: CallDisposition },
                { model: FinalClosureStatus },
              ],
            });
          }

        }

        // 2️⃣ Case B: No calls found, but inbound form exists
        if (!formDetail) {
          const inboundForm = await FormDetail.findOne({
            where: { customerId: cust.id },
            order: [["callDateTime", "DESC"]],
            include: [
              { model: QueryType },
              { model: SupportType },
              { model: SourceType },
            ],
          });

          if (inboundForm) {
            formDetail = inboundForm;
          }
        }

        // 3️⃣ Case C: No inbound form found, check outbound form
        if (!formDetail) {
          const outboundForm = await OutboundFormDetail.findOne({
            where: {
              [Op.or]: [
                { customerId: cust.id },
                { customerNumber: cust.phone },
              ]
            },
            order: [["callDateTime", "DESC"]],
            include: [
              { model: OutboundCallType },
              { model: CallAttemptStatus },
              { model: CallDisposition },
              { model: FinalClosureStatus },
            ],
          });

          if (outboundForm) {
            formDetail = outboundForm;
          }
        }

        return {
          ...cust.toJSON(),
          outbound: outboundLogs,
          inbound: inboundLogs,
          latestCall: latestCall,
          formDetail: formDetail || null,
        };
      })
    );

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: {
        customers: customerData,
        pagination: {
          total: count,
          page,
          limit,
          pages: totalPages,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching customers:", error);
    res.status(500).json({ error: "Failed to fetch customer data" });
  }
};