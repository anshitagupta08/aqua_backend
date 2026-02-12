// utils/mapCdrResponseToModel.js
function mapCdrResponseToModel(payload) {
    const agent = payload.participants?.find(p => p.participantType === "From") || {};
    const customer = payload.participants?.find(p => p.participantType === "To") || {};
  
    return {
      // Core identifiers
      clientCorrelationId: payload.Client_Correlation_Id || null,
      sessionId: payload.Session_ID || null,
      customerId: payload.customerId || null,
  
      // Call info
      overallCallStatus: payload.Overall_Call_Status || payload.overallCallStatus || null,
      callType: payload.callType || payload.Call_Type || null,
      startTime: payload.startTime || null,
      endTime: payload.endTime || null,
      duration: payload.duration || null,
      conversationDuration: payload.conversationDuration || null,
      billableDuration: payload.Billable_Duration || null,
      overallCallDuration: payload.Overall_Call_Duration || null,
      conversationDurationFormatted: payload.Conversation_Duration || null,
      callerRetryCount: payload.Caller_Retry_Count || null,
  
      // Agent (From)
      agentNumber: agent.participantAddress || null,
      agentStartTime: agent.startTime || null,
      agentEndTime: agent.endTime || null,
      agentDuration: agent.duration || null,
      agentStatus: agent.status || null,
      agentHangupCause: agent.hangupCause || null,
  
      // Customer (To)
      customerNumber: customer.participantAddress || null,
      customerStartTime: customer.startTime || null,
      customerEndTime: customer.endTime || null,
      customerDuration: customer.duration || null,
      customerStatus: customer.status || null,
      customerHangupCause: customer.hangupCause || null,
  
      // Recording
      recordingUrl: payload.Recording || null,
  
      // Extra metadata
      callerId: payload.Caller_ID || null,
      callerCircle: payload.Caller_Circle_Name || null,
      destinationNumber: payload.Destination_Number || null,
      destinationOperator: payload.Destination_Operator_Name || null,
      timestamp: payload.timestamp || null,
      date: payload.Date || null,
    };
  }
  
  module.exports = { mapCdrResponseToModel };
  