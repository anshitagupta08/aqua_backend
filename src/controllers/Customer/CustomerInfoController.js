const { AppError } = require('../../utils/AppError');
const axios = require('axios');
const { Op, literal } = require('sequelize');
const { Customer, Call } = require('../../models');


// exports.customersInfo = async (req, res, next) => {
//   try {
//     const { mobile } = req.query;

//     if (!mobile) {
//       throw new AppError("mobile number is required", 400);
//     }

//     // Clean and prepare mobile number
//     const cleanedMobile = mobile.replace(/\D/g, "");
//     const mobileForApi = cleanedMobile.replace(/^0+/, "");

//     let externalApiData = null;
//     let externalApiError = null;

//     // Step 1: Try external API
//     try {
//       // Authenticate
//       const authResponse = await axios.post(
//         "https://retailuat.abisaio.com:9001/api/Login/Post",
//         {
//           email: "xyz.com",
//           password: "APhil@1004",
//           userid: "0090000072",
//         },
//         { headers: { "Content-Type": "application/json" } }
//       );

//       const token = authResponse.data.token;
//       if (!token) throw new Error("Failed to obtain authentication token");
//       console.log(token, 'token');


//       // Prepare dates for the query (past 60 days by default)
//       const toDate = new Date();
//       const fromDate = new Date();
//       fromDate.setDate(toDate.getDate() - 60);

//       const formatDate = (d) =>
//         `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
//           d.getDate()
//         ).padStart(2, "0")}`;

//         console.log(mobileForApi);

//       const apiUrl = `https://retailuat.abisibg.com/api/v1/reportjsoncustomerbuyhistory?CusotmerId=ALL&Mobile=${mobileForApi}&fromDate=20251111&toDate=20251111`;
//    console.log(apiUrl);


//       // Fetch order history
//       const apiResponse = await axios.get(apiUrl, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//           proxy: false, // or configure your proxy settings
//       });

//       const customerData = apiResponse.data?.customerbuyhistory;
//       console.log(customerData);


//       if (Array.isArray(customerData) && customerData.length > 0) {
//         // Transform API response into a cleaner structure
//         externalApiData = customerData.map((c) => ({
//           CustID: c.Custid || "",
//           CustomerName: c.CustomerName || "",
//           Mobile: c.Mobile || "",
//           CustomerAddress:
//             c.Addresses?.[0]
//               ? `${c.Addresses[0].HouseNo || ""} ${c.Addresses[0].Building || ""}, ${c.Addresses[0].CustomerAddress || ""}, ${c.Addresses[0].CityName || ""}`
//               : "",
//           Grade: c.grade?.custGrade || "N.A",
//           Sales: c.Sale?.map((s) => ({
//             BranchId: s.BranchId,
//             SaleId: s.SaleId,
//             CreatedDate: s.CreatedDate,
//             DeliveryStatusCode: s.DeliveryStatusCode,
//             POSName: s.POSName,
//             TotalAmount: s.TotalAmount,
//             DeliveryStatus: s.DeliveryStatusName,
//             DeliveryCharge: s.DeliveryCharge,
//             SaleDetail: s.SaleDetail?.map((item) => ({
//               ItemID: item.ItemID,
//               ItemName: item.ItemName,
//               ItemFamilyID: item.ItemFamilyID,
//               UOM: item.UOM,
//               Qty: item.Qty,
//               AltQty: item.AltQty,
//               Rate: item.Rate,
//               TotalAmount: item.TotalAmount,
//             })),
//           })),
//         }));
//       } else {
//         console.log("External API returned empty or invalid data");
//       }
//     } catch (error) {
//       console.error("External API error:", error);
//       externalApiError = error;
//     }

//     // Step 2: Fallback to local DB if API failed or empty
//     if (!externalApiData) {
//       console.log("Falling back to local database search for mobile:", cleanedMobile);

//       try {
//         const localCustomer = await Customer.findOne({
//           where: {
//             phone: {
//               [Op.like]: `%${cleanedMobile}%`,
//             },
//           },
//           attributes: [
//             "id",
//             "name",
//             "email",
//             "phone",
//             "address",
//             "isActive",
//             "createdAt",
//             "updatedAt",
//           ],
//         });

//         if (localCustomer) {
//           const transformedData = [
//             {
//               CustomerName: localCustomer.name,
//               CustID: localCustomer.id.toString(),
//               Mobile: localCustomer.phone,
//               email: localCustomer.email || "",
//               CustomerAddress: localCustomer.address || "",
//             },
//           ];

//           return res.json({
//             message: "customer info sent",
//             data: transformedData,
//             source: "local_database",
//             note: "Data retrieved from local database as external API was unavailable",
//           });
//         } else {
//           return res.json({
//             message: "customer info sent",
//             data: [],
//             source: "local_database",
//             note: "No customer found in local database",
//             externalApiError: externalApiError?.message || "External API unavailable",
//           });
//         }
//       } catch (localDbError) {
//         console.error("Local database search error:", localDbError);
//         throw new AppError(
//           `Both external API and local database search failed. External API: ${
//             externalApiError?.message || "Unknown error"
//           }. Local DB: ${localDbError.message}`,
//           500
//         );
//       }
//     }

//     // Step 3: Return external API data
//     res.json({
//       message: "customer info sent",
//       data: externalApiData,
//       source: "external_api",
//     });
//   } catch (error) {
//     if (error.response) {
//       next(
//         new AppError(
//           `External API error: ${
//             error.response.data?.message || error.response.statusText
//           }`,
//           error.response.status
//         )
//       );
//     } else if (error.request) {
//       next(new AppError("Failed to connect to external API", 500));
//     } else {
//       next(error);
//     }
//   }
// };


const https = require('https');
const dns = require('dns');
const { URL } = require('url');
const CallLogs = require('../../models/Calling/CallLogs');

// Set DNS resolution to prefer IPv4
dns.setDefaultResultOrder('ipv4first');

const createHttpsAgent = (url) =>
  new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true,
    servername: new URL(url).hostname,
  });

exports.customersInfo = async (req, res, next) => {
  try {
    const { mobile } = req.query;
    if (!mobile) throw new AppError("mobile number is required", 400);

    const normalize = (number) => String(number).replace(/\D/g, "").replace(/^91/, "");

    const cleanedMobile = mobile.replace(/\D/g, "");
    const mobileForApi = normalize(mobile);

    let externalApiData = [];
    let localDbData = [];
    let callHistory = { inbound: [], outbound: [] };
    let externalApiError = null;

    // ---------- STEP 1: EXTERNAL API ----------
    try {
      console.log("🔹 Authenticating external API...");

      const authResponse = await axios.post(
        "https://ibretailapi.abisaio.com/api/Login/Post",
        {
          email: "xyz.com",
          password: "APhil@1004",
          userid: "0090000072",
        },
        {
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          timeout: 120000,
          httpsAgent: createHttpsAgent("https://ibretailapi.abisaio.com"),
        }
      );

      const token = authResponse.data?.token;
      if (!token) throw new Error("Failed to obtain authentication token");

      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(toDate.getDate() - 60);

      const formatDate = (d) =>
        `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
          d.getDate()
        ).padStart(2, "0")}`;

      const apiUrl = `https://tpapi.abisaio.com:3060/api/v1/reportjsoncustomerbuyhistory?CusotmerId=ALL&Mobile=${mobileForApi}&fromDate=${formatDate(
        fromDate
      )}&toDate=${formatDate(toDate)}`;

      console.log("🔹 Fetching customer data from external API...");

      const apiResponse = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 120000,
        httpsAgent: createHttpsAgent(apiUrl),
      });

      const customerData = apiResponse.data?.customerbuyhistory;

      if (Array.isArray(customerData) && customerData.length > 0) {
        externalApiData = customerData.map((c) => ({
          CustID: c.Custid || "",
          CustomerName: c.CustomerName || "",
          Mobile: c.Mobile || "",
          CustomerAddress: c.Addresses?.[0]
            ? `${c.Addresses[0].HouseNo || ""} ${c.Addresses[0].Building || ""}, ${c.Addresses[0].CustomerAddress || ""
            }, ${c.Addresses[0].CityName || ""}`
            : "",
          Grade: c.Grade || "N.A",
          Sales: c.Sale?.map((s) => ({
            BranchId: s.BranchId,
            SaleId: s.SaleId,
            CreatedDate: s.CreatedDate,
            DeliveryStatusCode: s.DeliveryStatusCode,
            POSName: s.POSName,
            TotalAmount: s.TotalAmount,
            DeliveryStatus: s.DeliveryStatusName,
            DeliveryCharge: s.DeliveryCharge,
            SaleDetail: s.SaleDetail?.map((item) => ({
              ItemID: item.ItemID,
              ItemName: item.ItemName,
              UOM: item.UOM,
              Qty: item.Qty,
              Rate: item.Rate,
              TotalAmount: item.TotalAmount,
            })),
          })),
        }));
      } else {
        console.warn("⚠️ External API returned empty or invalid data");
      }
    } catch (error) {
      console.error("❌ External API Error:", error?.response?.data || error.message);
      externalApiError = error;
    }

    // ---------- STEP 2: LOCAL DATABASE ----------
    try {
      console.log("🔹 Searching in local database...");
      const localCustomer = await Customer.findOne({
        where: { phone: { [Op.like]: `%${cleanedMobile}%` } },
        attributes: ["id", "name", "email", "phone", "address"],
      });

      if (localCustomer) {
        localDbData.push({
          CustomerName: localCustomer.name,
          CustID: localCustomer.id.toString(),
          Mobile: localCustomer.phone,
          Email: localCustomer.email || "",
          CustomerAddress: localCustomer.address || "",
        });
      }
    } catch (localDbError) {
      console.error("❌ Local DB Error:", localDbError.message);
    }

    // ---------- STEP 3: CALL HISTORY ----------
    try {
      console.log("🔹 Fetching call history...");

      // Inbound calls
      const inboundCalls = await Call.findAll({
        where: {
          [Op.or]: [
            { Caller_Number: { [Op.like]: `%${cleanedMobile}%` } },
            { Destination_Number: { [Op.like]: `%${cleanedMobile}%` } },
          ],
        },
        order: [["createdAt", "DESC"]],
        limit: 20,
      });

      callHistory.inbound = inboundCalls.map((call) => ({
        type: "Inbound",
        date: call.Date,
        time: call.Time,
        callerNumber: call.Caller_Number,
        destinationNumber: call.Destination_Number,
        status: call.Overall_Call_Status,
        duration: call.Conversation_Duration,
        recording: call.Recording,
        hangupCause: call.Hangup_Cause,
      }));

      // Outbound calls
      const outboundCalls = await CallLogs.findAll({
        where: {
          [Op.or]: [
            { customerNumber: { [Op.like]: `%${cleanedMobile}%` } },
            { agentNumber: { [Op.like]: `%${cleanedMobile}%` } },
          ],
        },
        order: [["createdAt", "DESC"]],
        limit: 20,
      });

      callHistory.outbound = outboundCalls.map((call) => ({
        type: "Outbound",
        date: call.date,
        startTime: call.startTime,
        endTime: call.endTime,
        duration: call.conversationDurationFormatted || call.duration,
        status: call.overallCallStatus === "Missed" ? "Not Connected" : call.overallCallStatus,
        customerNumber: call.customerNumber,
        agentNumber: call.agentNumber,
        recording: call.recordingUrl,
      }));
    } catch (callError) {
      console.error("❌ Call History Fetch Error:", callError.message);
    }

    // ---------- STEP 4: COMBINE & RESPOND ----------
    const combinedData = [...externalApiData, ...localDbData];

    if (combinedData.length > 0 || callHistory.inbound.length > 0 || callHistory.outbound.length > 0) {
      const sources = [];
      if (externalApiData.length) sources.push("external_api");
      if (localDbData.length) sources.push("local_database");
      if (callHistory.inbound.length || callHistory.outbound.length) sources.push("call_history");

      return res.json({
        message: "Customer info retrieved successfully",
        data: combinedData,
        callHistory,
        source: sources.join(" + "),
      });
    }

    // If all fail
    return res.json({
      message: "No customer data or call history found",
      data: [],
      callHistory,
      note:
        externalApiError?.message ||
        "Neither external API, local database, nor call logs returned results",
    });
  } catch (error) {
    console.error("❌ Controller Error:", error);
    next(new AppError(error.message || "Server error", 500));
  }
};
