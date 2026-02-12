// models/CDR.js
const { DataTypes, Model, Optional } = require('sequelize');
const { sequelize } = require('../../configs/sequelize');

class CallLogs extends Model { }

CallLogs.init(
    {
        // Core identifiers
        clientCorrelationId: DataTypes.STRING,
        sessionId: DataTypes.STRING,
        customerId: DataTypes.STRING,

        // Call info
        overallCallStatus: DataTypes.STRING,
        callType: DataTypes.STRING,
        startTime: DataTypes.BIGINT,
        endTime: DataTypes.BIGINT,
        duration: DataTypes.BIGINT,
        conversationDuration: DataTypes.BIGINT,
        billableDuration: DataTypes.STRING,
        overallCallDuration: DataTypes.STRING,
        conversationDurationFormatted: DataTypes.STRING,
        callerRetryCount: DataTypes.INTEGER,

        // Agent (From)
        agentNumber: DataTypes.STRING,
        agentStartTime: DataTypes.BIGINT,
        agentEndTime: DataTypes.BIGINT,
        agentDuration: DataTypes.BIGINT,
        agentStatus: DataTypes.STRING,
        agentHangupCause: DataTypes.STRING,

        // Customer (To)
        customerNumber: DataTypes.STRING,
        customerStartTime: DataTypes.BIGINT,
        customerEndTime: DataTypes.BIGINT,
        customerDuration: DataTypes.BIGINT,
        customerStatus: DataTypes.STRING,
        customerHangupCause: DataTypes.STRING,

        // Recording
        recordingUrl: DataTypes.TEXT,

        // Extra metadata
        callerId: DataTypes.STRING,
        callerCircle: DataTypes.STRING,
        destinationNumber: DataTypes.STRING,
        destinationOperator: DataTypes.STRING,
        timestamp: DataTypes.STRING,
        date: DataTypes.STRING,
    },
    {
        sequelize,
        tableName: 'call_logs',
        timestamps: true,
    }
);

module.exports = CallLogs;


//Response coming form Outgoing CDR (/webhook/cdr-event)
// {
//     "Overall_Call_Status": "Answered",
//     "Caller_ID": "1409766901",
//     "Customer_Name": "ABIS_PROTE_kAvtAXD5HLBa8Eq2ob2J",
//     "Client_Correlation_Id": "Xchange842d5629-3db4-4cc1-a076-1887f623e1ba",
//     "Caller_Operator_Name": "Airtel",
//     "Time": "17:31:24",
//     "Caller_Circle_Name": "MP and Chattisgarh",
//     "Destination_Circle_Name": "MP and Chattisgarh",
//     "Pulse_Count": null,
//     "callType": "OUTBOUND",
//     "Caller_Waiting_Time": "00:00:14",
//     "Destination_Name": "",
//     "duration": 43503,
//     "Billable_Duration": "00:51",
//     "conversationDuration": 18634,
//     "Overall_Call_Duration": "00:00:43",
//     "customerId": "ABIS_PROTE_kAvtAXD5HLBa8Eq2ob2J",
//     "overallCallStatus": "Answered",
//     "startTime": 1758283284573,
//     "Session_ID": "842d5629-3db4-4cc1-a076-1887f623e1ba",
//     "Destination_Retry_Count": null,
//     "Caller_Status": "Disconnected",
//     "Destination_Status": "Disconnected",
//     "timestamp": "2025-09-19 12:01:24",
//     "participants": [
//       {
//         "participantAddress": "7880164063",
//         "participantType": "From",
//         "participantNumberType": "MOBILE",
//         "participantNumberCountryCode": "+91",
//         "callerIdType": "Mobile",
//         "callerIdCircle": "Karnataka",
//         "callerIdCountryCode": "+91",
//         "callerId": "1409766901",
//         "retryCount": 1,
//         "startTime": 1758283284573,
//         "endTime": 1758283328076,
//         "callAnswerTime": 1758283294593,
//         "duration": 33483,
//         "status": "Disconnected",
//         "hangupCause": "USER_INITIATED",
//         "audios": [],
//         "participantCallType": "OUTBOUND",
//         "billableDuration": 33000,
//         "pulse": 2,
//         "requestNo": 0,
//         "participantIndex": 1,
//         "mergeType": "SEQUENTIAL",
//         "callerIdInternationalPoint": "0091",
//         "chargeType": "DOMESTIC"
//       },
//       {
//         "participantAddress": "9109902477",
//         "participantName": "",
//         "participantType": "To",
//         "participantNumberType": "MOBILE",
//         "participantNumberCountryCode": "+91",
//         "callerIdType": "Mobile",
//         "callerIdCircle": "Karnataka",
//         "callerIdCountryCode": "+91",
//         "callerId": "1409766901",
//         "startTime": 1758283294672,
//         "endTime": 1758283328108,
//         "callAnswerTime": 1758283309442,
//         "duration": 18666,
//         "status": "Disconnected",
//         "hangupCause": "SYSTEM_INITIATED",
//         "audios": [],
//         "participantCallType": "OUTBOUND",
//         "billableDuration": 18000,
//         "pulse": 1,
//         "requestNo": 1,
//         "participantIndex": 2,
//         "mergeType": "SEQUENTIAL",
//         "callerIdInternationalPoint": "0091",
//         "chargeType": "DOMESTIC"
//       }
//     ],
//     "Conversation_Duration": "00:00:18",
//     "Hangup_Cause": "Caller",
//     "Caller_Retry_Count": 1,
//     "Destination_CLI": "1409766901",
//     "Missed_Destination_Number": null,
//     "Caller_Duration": "00:33",
//     "Date": "19/09/2025",
//     "Caller_Status_Detail": null,
//     "DTMF_Capture": null,
//     "fromWaitingTime": 14849,
//     "Call_Type": "OUTBOUND",
//     "Destination_Status_Detail": null,
//     "Caller_Name": null,
//     "Caller_Number": "7880164063",
//     "audios": [],
//     "Recording": "https://openapi.airtel.in/gateway/airtel-xchange/obd/recording/download?token=62FO9GkjRPFkwCy0/iPyzA8f3U5CJmPr1pjeu+Ye1so2Cn/R6fdftRW+mJQH1YG55SwMTRTbHpe9xebui+VwRzDH/9FClVJlEJfvnchL3HI0j7j3MBDL3N10Z1jt9yUOJ2aMrndf3F5F8aNbSuasmZZoFMPMj3T68u9Cls5wi2M=",
//     "endTime": 1758283328076,
//     "Destination_Number": "9109902477",
//     "Destination_Operator_Name": "Bharti Airtel (GSM)"
//   }
  
