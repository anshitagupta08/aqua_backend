const { DataTypes, Model, Optional } = require('sequelize');
const { sequelize } = require('../../configs/sequelize');
const FormDetail = require('../Form/FormDetail');

class Call extends Model {}

Call.init(
  {
    Date: {
      type: DataTypes.STRING,
    },
    Time: {
      type: DataTypes.STRING,
    },
    CallId: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    Caller_ID: {
      type: DataTypes.STRING,
    },
    Caller_Number: {
      type: DataTypes.STRING,
    },
    Destination_CLI: {
      type: DataTypes.STRING,
    },
    Destination_Number: {
      type: DataTypes.STRING,
    },
    Caller_Waiting_Time: {
      type: DataTypes.STRING,
    },
    Conversation_Duration: {
      type: DataTypes.STRING,
    },
    Overall_Call_Status: {
      type: DataTypes.STRING,
    },
    Hangup_Cause: {
      type: DataTypes.STRING,
    },
    Caller_Status: {
      type: DataTypes.STRING,
    },
    Destination_Status: {
      type: DataTypes.STRING,
    },
    Caller_Circle_Name: {
      type: DataTypes.STRING,
    },
    Caller_Operator_Name: {
      type: DataTypes.STRING,
    },
    Overall_Call_Duration: {
      type: DataTypes.STRING,
    },
    Call_Type: {
      type: DataTypes.STRING,
    },
    Destination_Name: {
      type: DataTypes.STRING,
    },
    Caller_Name: {
      type: DataTypes.STRING,
    },
    Caller_Status_Detail: {
      type: DataTypes.STRING,
    },
    DTMF_Capture: {
      type: DataTypes.STRING,
    },
    Destination_Status_Detail: {
      type: DataTypes.STRING,
    },
    Destination_Circle_Name: {
      type: DataTypes.STRING,
    },
    Destination_Operator_Name: {
      type: DataTypes.STRING,
    },
    Caller_Retry_Count: {
      type: DataTypes.STRING,
    },
    Destination_Retry_Count: {
      type: DataTypes.STRING,
    },
    Caller_Duration: {
      type: DataTypes.STRING,
    },
    Pulse_Count: {
      type: DataTypes.STRING,
    },
    Recording: {
      type: DataTypes.STRING,
    },
    c_party_number: {
      type: DataTypes.STRING,
    },
    c_party_status: {
      type: DataTypes.STRING,
    },
    extra: {
      type: DataTypes.STRING,
    },
    extra_1: {
      type: DataTypes.STRING,
    },
    extra_2: {
      type: DataTypes.STRING,
    },
    extra_3: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize,
    tableName: 'call',
    timestamps: true,
  }
);

module.exports = Call;

// {
//     "Overall_Call_Status": "Answered",
//     "Caller_ID": "18001035",
//     "Client_Correlation_Id": "Xchangeea4636ef-af9b-4f79-846d-52656c9b1abd",
//     "Caller_Operator_Name": "RIL JIO",
//     "Time": "12:35:37",
//     "Caller_Circle_Name": "MP and Chattisgarh",
//     "Destination_Circle_Name": "Maharashtra and Goa",
//     "Pulse_Count": 3,
//     "Caller_Waiting_Time": "00:00:27",
//     "Destination_Name": "Supriya Prasanjeet soge",
//     "Overall_Call_Duration": "00:01:08",
//     "Destination_Retry_Count": 1,
//     "Caller_Status": "Disconnected",
//     "Destination_Status": "Disconnected",
//     "Conversation_Duration": "00:00:39",
//     "Hangup_Cause": "Caller",
//     "Caller_Retry_Count": null,
//     "Destination_CLI": "09301196473",
//     "Missed_Destination_Number": null,
//     "Caller_Duration": "01:07",
//     "Date": "29/07/2025",
//     "Caller_Status_Detail": "16 | 699 | Normal Clearing | Disconnected",
//     "DTMF_Capture": "1 | 1",
//     "Call_Type": "INBOUND",
//     "Destination_Status_Detail": "16 | 699 | Normal Clearing | Disconnected",
//     "Caller_Name": null,
//     "Caller_Number": "09301196473",
//     "Recording": "https://openapi.airtel.in/gateway/airtel-xchange/call/recording?token=ELmnZuYHx60sgm38B+vcdg8f3U5CJmPr1pjeu+Ye1so2Cn/R6fdftRW+mJQH1YG5yk0rWtvUdeQw0YEvnRCtrSzTPgBxWxTWTiwUhngElKFK4+kxdXxCX6ogRlcDN9q8PyAnrT+GeNpKt4DGVwK2AWPVJjtZpFZ+jSr1rJ6RE+Y=",
//     "Destination_Number": "07028833343",
//     "Destination_Operator_Name": "Bharti Airtel (GSM)"
// }
