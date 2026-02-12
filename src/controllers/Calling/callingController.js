const express = require('express');
const axios = require('axios');
const router = express.Router();
const { Employee, Call } = require('../../models/index');
const { Op } = require('sequelize');
const CryptoJS = require("crypto-js");
const CallLogs = require("../../models/Calling/CallLogs");
const { mapCdrResponseToModel } = require("../../utils/mapCdrResponseToModel");

// Session storage for call data (in-memory for now, could be Redis in production)
const callSessions = new Map();

// Helper function to store/retrieve session data
const getSessionData = (sessionId) => {
  return callSessions.get(sessionId) || {};
};

const updateSessionData = (sessionId, data) => {
  const existing = callSessions.get(sessionId) || {};
  const updated = { ...existing, ...data, lastUpdated: Date.now() };
  callSessions.set(sessionId, updated);
  console.log(`💾 Session ${sessionId} updated:`, updated);
  return updated;
};

// Cleanup old sessions (run periodically)
const cleanupOldSessions = () => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes

  for (const [sessionId, data] of callSessions.entries()) {
    if (now - (data.lastUpdated || 0) > maxAge) {
      callSessions.delete(sessionId);
      console.log(`🗑️ Cleaned up old session: ${sessionId}`);
    }
  }
};

// Run cleanup every 10 minutes
setInterval(cleanupOldSessions, 10 * 60 * 1000);

// Enhanced webhook handler with session management
// router.post('/webhook/event', async (req, res) => {
//   try {
//     console.log('=== INBOUND WEBHOOK EVENT RECEIVED ===');
//     console.log('Received inbound webhook data:', JSON.stringify(req.body, null, 2));
//     console.log('==============================');

//     const data = req.body;
//     const employeeNumbers = await getAllEmployeePhoneNumbers();

//     // Process call events only
//     const processCallEvent = (eventData) => {
//       const { eventType, event, participantAddress, vmSessionId, metaData } = eventData;

//       // Handle MEDIA/Played to store customer number early
//       if (eventType === 'MEDIA' && event === 'Played') {
//         const existingSession = getSessionData(vmSessionId);
//         const displayCli = metaData?.displayCli;
//         const numberToSave = displayCli || participantAddress;

//         if (numberToSave) {
//           updateSessionData(vmSessionId, {
//             customerPhoneNumber: numberToSave,
//             events: [
//               ...(existingSession.events || []),
//               {
//                 event: `${eventType}/${event}`,
//                 timestamp: metaData?.timestamp,
//                 participantAddress,
//               },
//             ],
//           });
//           console.log(`📌 Stored customerPhoneNumber from MEDIA/Played: ${numberToSave}`);
//         }

//         // Do not continue with normal processing for MEDIA events
//         return null;
//       }

//       // Only process specific call events
//       const allowedEvents = ['Ringing', 'Answer', 'Disconnected'];
//       if (!allowedEvents.includes(event)) {
//         console.log(`📡 Skipping irrelevant CALL event: ${event}`);
//         return null;
//       }

//       console.log(`📡 Processing: ${eventType}/${event} for participant: ${participantAddress}`);
//       console.log(`📋 Available employee numbers:`, employeeNumbers);

//       // Get existing session data
//       const sessionData = getSessionData(vmSessionId);
//       console.log(`💾 Existing session data for ${vmSessionId}:`, sessionData);

//       // Identify participant type
//       const isParticipantAgent = employeeNumbers.includes(participantAddress);
//       let customerNumber = metaData?.displayCli || sessionData.customerPhoneNumber || null;
//       let agentNumber = null;

//       // Determine agent and customer numbers based on event type
//       if (event === 'Ringing') {
//         // For ringing: participantAddress is agent, displayCli is customer
//         agentNumber = participantAddress;
//         customerNumber = metaData?.displayCli;

//         if (!isParticipantAgent) {
//           console.log(
//             `⚠️ Warning: Ringing event participant ${participantAddress} is not a known agent`
//           );
//         }

//         // Store session data for future events
//         updateSessionData(vmSessionId, {
//           agentPhoneNumber: agentNumber,
//           customerPhoneNumber: customerNumber,
//           callStarted: true,
//           events: [
//             ...(sessionData.events || []),
//             { event, timestamp: metaData?.timestamp, participantAddress },
//           ],
//         });
//       } else if (event === 'Answer') {
//         // For answer: participantAddress should be agent
//         agentNumber = participantAddress;

//         // Get customer number from session data (preserved from Ringing event)
//         customerNumber = customerNumber || sessionData.customerPhoneNumber;

//         if (!isParticipantAgent) {
//           console.log(
//             `⚠️ Warning: Answer event participant ${participantAddress} is not a known agent`
//           );
//         }

//         // Update session data
//         updateSessionData(vmSessionId, {
//           agentPhoneNumber: agentNumber,
//           customerPhoneNumber: customerNumber,
//           callAnswered: true,
//           answerTime: metaData?.timestamp,
//           events: [
//             ...(sessionData.events || []),
//             { event, timestamp: metaData?.timestamp, participantAddress },
//           ],
//         });
//       } else if (event === 'Disconnected') {
//         // For disconnect: determine who disconnected
//         if (isParticipantAgent) {
//           agentNumber = participantAddress;
//         } else {
//           // Customer disconnected, get agent from session
//           agentNumber = sessionData.agentPhoneNumber;
//         }

//         // Always use session data for customer number
//         customerNumber = customerNumber || sessionData.customerPhoneNumber;

//         // Update session data with disconnect info
//         updateSessionData(vmSessionId, {
//           agentPhoneNumber: agentNumber,
//           customerPhoneNumber: customerNumber,
//           callEnded: true,
//           endTime: metaData?.timestamp,
//           disconnectedBy: isParticipantAgent ? 'agent' : 'customer',
//           causeCode: metaData?.causeCode,
//           causeDescription: metaData?.causeCodeDescription,
//           events: [
//             ...(sessionData.events || []),
//             { event, timestamp: metaData?.timestamp, participantAddress },
//           ],
//         });
//       }

//       // Validate that we have both agent and customer numbers
//       if (!agentNumber) {
//         console.log(`⚠️ Warning: Could not determine agent number for ${event} event`);
//         agentNumber = sessionData.agentPhoneNumber || null;
//       }

//       if (!customerNumber) {
//         console.log(`⚠️ Warning: Could not determine customer number for ${event} event`);
//         customerNumber = sessionData.customerPhoneNumber || null;
//       }

//       // Create formatted event data
//       const formattedEvent = {
//         // Basic event info
//         eventType: event.toLowerCase(), // 'ringing', 'answer', 'disconnected'
//         callId: vmSessionId,
//         sessionId: vmSessionId,
//         timestamp: metaData?.timestamp || Date.now(),

//         // Participant info (now preserved across events)
//         agentPhoneNumber: agentNumber,
//         customerPhoneNumber: customerNumber,

//         // Event-specific data
//         eventDetails: {
//           participantAddress,
//           participantType: isParticipantAgent ? 'agent' : 'customer',
//           originalEvent: `${eventType}/${event}`,
//         },

//         // Disconnect-specific info
//         ...(event === 'Disconnected' && {
//           disconnectedBy: isParticipantAgent ? 'agent' : 'customer',
//           causeCode: metaData?.causeCode,
//           causeDescription: metaData?.causeCodeDescription,
//           sipCode: metaData?.sipCode,
//         }),

//         // Session context
//         sessionData: {
//           callStarted: sessionData.callStarted || false,
//           callAnswered: sessionData.callAnswered || false,
//           callEnded: sessionData.callEnded || false,
//           eventCount: (sessionData.events || []).length + 1,
//         },

//         // Additional metadata
//         metadata: {
//           asteriskId: metaData?.asteriskId,
//           clientCorrelationId: eventData.clientCorrelationId,
//           originalTimestamp: metaData?.timestamp,
//           processedAt: Date.now(),
//         },
//       };

//       console.log(`🔍 Formatted event:`, formattedEvent);
//       return formattedEvent;
//     };

//     // Process the webhook event
//     const processedEvent = processCallEvent(data);

//     if (!processedEvent) {
//       return res.status(200).json({
//         success: true,
//         message: 'Event not relevant for call processing',
//         eventType: data.eventType,
//         event: data.event,
//       });
//     }

//     // Send formatted event to agent
//     const sendEventToAgent = (eventData) => {
//       const { agentPhoneNumber, eventType, callId, customerPhoneNumber } = eventData;

//       if (!agentPhoneNumber) {
//         console.log(`⚠️ No agent phone number identified for event ${eventType}`);
//         return false;
//       }

//       // Determine socket event type based on call event
//       let socketEventType;
//       let eventPayload = {
//         ...eventData,
//         timestamp: new Date().toISOString(),
//       };

//       switch (eventType) {
//         case 'ringing':
//           socketEventType = 'incoming-call-ringing';
//           eventPayload = {
//             ...eventPayload,
//             message: `Incoming call from ${customerPhoneNumber || 'Unknown'}`,
//             callStatus: 'ringing',
//           };
//           break;

//         case 'answer':
//           socketEventType = 'call-answered';
//           eventPayload = {
//             ...eventPayload,
//             message: `Call answered with ${customerPhoneNumber || 'Unknown'}`,
//             callStatus: 'active',
//           };
//           break;

//         case 'disconnected':
//           socketEventType = 'call-disconnected';
//           eventPayload = {
//             ...eventPayload,
//             message: `Call with ${customerPhoneNumber || 'Unknown'} ended`,
//             callStatus: 'ended',
//           };
//           break;

//         default:
//           console.log(`❌ Unknown event type: ${eventType}`);
//           return false;
//       }

//       // Send to specific agent
//       const sent = req.socketManager.sendToAgent(agentPhoneNumber, socketEventType, eventPayload);

//       if (sent) {
//         console.log(`📡 Sent '${socketEventType}' to agent ${agentPhoneNumber}`);
//         console.log(
//           `📞 Call: ${customerPhoneNumber || 'Unknown'} → ${agentPhoneNumber} (${eventType})`
//         );
//       } else {
//         console.log(`📡 Failed to send event to agent ${agentPhoneNumber} - no active connections`);
//       }

//       // Also broadcast general event for monitoring/debugging
//       // req.socketManager.broadcast
//       req.io.emit('call-event-monitor', {
//         ...eventPayload,
//         broadcastType: 'monitor',
//       });

//       return sent;
//     };

//     // Send the processed event
//     const eventSent = sendEventToAgent(processedEvent);

//     // Log call flow
//     const { eventType, agentPhoneNumber, customerPhoneNumber, callId } = processedEvent;
//     console.log(
//       `📋 Call Flow: ${customerPhoneNumber || 'Unknown'} ↔ ${agentPhoneNumber} | ${eventType.toUpperCase()} | Session: ${callId}`
//     );

//     // Clean up session if call ended
//     if (eventType === 'disconnected') {
//       setTimeout(
//         () => {
//           callSessions.delete(callId);
//           console.log(`🗑️ Session ${callId} cleaned up after call end`);
//         },
//         5 * 60 * 1000
//       ); // Clean up after 5 minutes
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Call event processed successfully',
//       data: {
//         eventType: processedEvent.eventType,
//         callId: processedEvent.callId,
//         agentPhoneNumber: processedEvent.agentPhoneNumber,
//         customerPhoneNumber: processedEvent.customerPhoneNumber,
//         timestamp: processedEvent.timestamp,
//         eventSent,
//         sessionContext: processedEvent.sessionData,
//       },
//     });
//   } catch (error) {
//     console.error('❌ Error processing webhook event:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error processing webhook event',
//       error: error.message,
//     });
//   }
// });

router.post('/webhook/event', async (req, res) => {
  try {
    console.log('=== INBOUND WEBHOOK EVENT RECEIVED ===');
    console.log('Received inbound webhook data:', JSON.stringify(req.body, null, 2));
    console.log('==============================');

    const data = req.body;
    const employeeNumbers = await getAllEmployeePhoneNumbers();
    
    console.log(`📋 Employee numbers loaded: [${employeeNumbers.join(', ')}]`);
    console.log(`📋 Employee numbers types: [${employeeNumbers.map(n => typeof n).join(', ')}]`);

    // Normalize phone number helper
    const normalizePhone = (phone) => {
      if (!phone) return '';
      return String(phone).replace(/\D/g, ''); // Remove all non-digits
    };

    const isEmployeeNumber = (phone) => {
      const normalized = normalizePhone(phone);
      return employeeNumbers.some(empNum => {
        const empNormalized = normalizePhone(empNum);
        // Check exact match or last 10 digits match (handles country codes)
        return empNormalized === normalized || 
               empNormalized.slice(-10) === normalized.slice(-10);
      });
    };

    const processCallEvent = (eventData) => {
      const { eventType, event, participantAddress, vmSessionId, metaData } = eventData;
    
      // Fetch existing session or create new
      const sessionData = getSessionData(vmSessionId) || { 
        events: [],
        participantNumbers: [],
        bothParticipantsIdentified: false
      };
    
      if (!Array.isArray(sessionData.events)) sessionData.events = [];
      if (!Array.isArray(sessionData.participantNumbers)) sessionData.participantNumbers = [];
      
      // Convert to Set for easier manipulation, then back to array
      const participantSet = new Set(sessionData.participantNumbers);
      const previousParticipantCount = participantSet.size;
      participantSet.add(participantAddress);
      sessionData.participantNumbers = Array.from(participantSet);
    
      const isAgent = employeeNumbers.includes(participantAddress);
      const wasAgentIdentifiedBefore = !!sessionData.agentPhoneNumber;
      
      console.log(`🔎 Checking participant: ${participantAddress}, isAgent: ${isAgent}, employeeNumbers: [${employeeNumbers.join(', ')}]`);
    
      // Update agent/customer number - PRESERVE both once identified
      if (isAgent && !sessionData.agentPhoneNumber) {
        sessionData.agentPhoneNumber = participantAddress;
        console.log(`✅ Agent identified: ${participantAddress}`);
      } else if (!isAgent && !sessionData.customerPhoneNumber) {
        sessionData.customerPhoneNumber = participantAddress;
        console.log(`✅ Customer identified: ${participantAddress}`);
      } else if (isAgent && sessionData.agentPhoneNumber) {
        console.log(`ℹ️ Agent already set to: ${sessionData.agentPhoneNumber}`);
      } else if (!isAgent && sessionData.customerPhoneNumber) {
        console.log(`ℹ️ Customer already set to: ${sessionData.customerPhoneNumber}`);
      }
      
      // If we have multiple participants but haven't identified agent yet, check all
      if (!sessionData.agentPhoneNumber && sessionData.participantNumbers.length > 1) {
        console.log(`🔍 Checking ${sessionData.participantNumbers.length} participants for agent match...`);
        for (const num of sessionData.participantNumbers) {
          console.log(`   Checking ${num} against employee list...`);
          if (employeeNumbers.includes(num)) {
            sessionData.agentPhoneNumber = num;
            console.log(`✅ Agent identified from participants: ${num}`);
            break;
          }
        }
        if (!sessionData.agentPhoneNumber) {
          console.log(`⚠️ No agent found in participants. Trying string comparison...`);
          // Try with string conversion in case of type mismatch
          for (const num of sessionData.participantNumbers) {
            for (const empNum of employeeNumbers) {
              if (String(num) === String(empNum)) {
                sessionData.agentPhoneNumber = num;
                console.log(`✅ Agent identified via string match: ${num}`);
                break;
              }
            }
            if (sessionData.agentPhoneNumber) break;
          }
        }
      }
      
      // If we have agent identified, the other number must be customer
      if (sessionData.agentPhoneNumber && sessionData.participantNumbers.length > 1 && !sessionData.customerPhoneNumber) {
        for (const num of sessionData.participantNumbers) {
          if (num !== sessionData.agentPhoneNumber) {
            sessionData.customerPhoneNumber = num;
            console.log(`✅ Customer identified from history: ${num}`);
            break;
          }
        }
      }

      // Check if both participants are now identified
      const bothIdentifiedNow = !!(sessionData.agentPhoneNumber && sessionData.customerPhoneNumber);
      const justIdentifiedBoth = bothIdentifiedNow && !sessionData.bothParticipantsIdentified;
      
      if (justIdentifiedBoth) {
        sessionData.bothParticipantsIdentified = true;
        console.log(`🎯 BOTH PARTICIPANTS NOW IDENTIFIED - Agent: ${sessionData.agentPhoneNumber}, Customer: ${sessionData.customerPhoneNumber}`);
      }
    
      // Update session flags
      if (event === 'Ringing') {
        sessionData.callStarted = true;
        sessionData.ringingTime = metaData?.timestamp;
      }
      if (event === 'Answer') {
        sessionData.callAnswered = true;
        sessionData.answerTime = metaData?.timestamp;
      }
      if (event === 'Disconnected') {
        sessionData.callEnded = true;
        sessionData.endTime = metaData?.timestamp;
        sessionData.disconnectedBy = isAgent ? 'agent' : 'customer';
        sessionData.causeCode = metaData?.causeCode;
        sessionData.causeDescription = metaData?.causeCodeDescription;
      }
    
      // Save event
      sessionData.events.push({ 
        event, 
        timestamp: metaData?.timestamp, 
        participantAddress,
        participantType: isAgent ? 'agent' : 'customer'
      });
      
      updateSessionData(vmSessionId, sessionData);
      
      console.log(`🔍 Session ${vmSessionId} - Agent: ${sessionData.agentPhoneNumber || 'NOT SET'}, Customer: ${sessionData.customerPhoneNumber || 'NOT SET'}, All participants: ${sessionData.participantNumbers.join(', ')}`);
    
      // Prepare formatted event
      return {
        eventType: event.toLowerCase(),
        callId: vmSessionId,
        agentPhoneNumber: sessionData.agentPhoneNumber || null,
        customerPhoneNumber: sessionData.customerPhoneNumber || null,
        timestamp: metaData?.timestamp || Date.now(),
        eventDetails: { 
          participantAddress, 
          participantType: isAgent ? 'agent' : 'customer', 
          originalEvent: `${eventType}/${event}` 
        },
        sessionData: {
          callStarted: sessionData.callStarted || false,
          callAnswered: sessionData.callAnswered || false,
          callEnded: sessionData.callEnded || false,
          eventCount: sessionData.events.length,
          allParticipants: sessionData.participantNumbers,
          bothParticipantsIdentified: sessionData.bothParticipantsIdentified
        },
        justIdentifiedBoth, // Flag to trigger retroactive events
        wasAgentIdentifiedBefore
      };
    };
    

    const processedEvent = processCallEvent(data);

    if (!processedEvent) {
      return res.status(200).json({
        success: true,
        message: 'Event not relevant for call processing',
        eventType: data.eventType,
        event: data.event,
      });
    }

    const sendEventToAgent = (eventData, eventType = null, forceEmit = false) => {
      const { agentPhoneNumber, customerPhoneNumber } = eventData;
      const actualEventType = eventType || eventData.eventType;

      if (!agentPhoneNumber) {
        console.log(`⚠️ No agent phone number identified for event ${actualEventType} - waiting for more events to identify agent`);
        return false;
      }

      let socketEventType, message, callStatus;
      switch (actualEventType) {
        case 'ringing':
        case 'callednumber':
          socketEventType = 'incoming-call-ringing';
          message = `Incoming call from ${customerPhoneNumber || 'Unknown'}`;
          callStatus = 'ringing';
          break;
        case 'answer':
          socketEventType = 'call-answered';
          message = `Call answered with ${customerPhoneNumber || 'Unknown'}`;
          callStatus = 'active';
          break;
        case 'disconnected':
          socketEventType = 'call-disconnected';
          message = `Call with ${customerPhoneNumber || 'Unknown'} ended`;
          callStatus = 'ended';
          break;
        default:
          console.log(`❌ Unknown event type: ${actualEventType}`);
          return false;
      }

      const eventPayload = { 
        ...eventData, 
        message, 
        callStatus, 
        timestamp: new Date().toISOString(),
        eventType: actualEventType
      };

      const sent = req.socketManager.sendToAgent(agentPhoneNumber, socketEventType, eventPayload);
      if (sent) console.log(`📡 Sent '${socketEventType}' to agent ${agentPhoneNumber}`);
      else console.log(`📡 Failed to send event to agent ${agentPhoneNumber} - no active connections`);

      // Broadcast for monitoring
      if (socketEventType) {
        req.io.emit(socketEventType, eventPayload);
        console.log(`📡 Emitted '${socketEventType}'`, eventPayload);
      }

      return sent;
    };

    // Handle retroactive event emissions when both participants are just identified
    if (processedEvent.justIdentifiedBoth) {
      console.log(`🔄 RETROACTIVE EMISSION: Both participants just identified, sending missed events...`);
      
      // Get the session to check previous events
      const sessionData = getSessionData(processedEvent.callId);
      
      if (sessionData && sessionData.events) {
        // Check if we had a ringing or answer event before agent was identified
        const hadRingingEvent = sessionData.events.some(e => 
          e.event === 'Ringing' || e.event === 'CalledNumber'
        );
        const hadAnswerEvent = sessionData.events.some(e => e.event === 'Answer');
        
        // Emit ringing event if it happened before
        if (hadRingingEvent && !processedEvent.wasAgentIdentifiedBefore) {
          console.log(`📢 Retroactively emitting RINGING event`);
          sendEventToAgent(processedEvent, 'ringing', true);
        }
        
        // Emit answer event if it happened before (but only if not the current event)
        if (hadAnswerEvent && processedEvent.eventType !== 'answer') {
          console.log(`📢 Retroactively emitting ANSWER event`);
          sendEventToAgent(processedEvent, 'answer', true);
        }
      }
    }

    // Send current event normally (only if both participants are identified)
    let eventSent = false;
    if (processedEvent.sessionData.bothParticipantsIdentified) {
      eventSent = sendEventToAgent(processedEvent);
    } else {
      console.log(`⏳ Skipping event emission - waiting for both participants to be identified`);
    }

    console.log(
      `📋 Call Flow: ${processedEvent.customerPhoneNumber || 'Unknown'} ↔ ${processedEvent.agentPhoneNumber || 'Pending'} | ${processedEvent.eventType.toUpperCase()} | Session: ${processedEvent.callId}`
    );

    // Clean up session after disconnect
    if (processedEvent.eventType === 'disconnected') {
      setTimeout(() => {
        callSessions.delete(processedEvent.callId);
        console.log(`🗑️ Session ${processedEvent.callId} cleaned up after call end`);
      }, 5 * 60 * 1000);
    }

    return res.status(200).json({
      success: true,
      message: 'Call event processed successfully',
      data: {
        eventType: processedEvent.eventType,
        callId: processedEvent.callId,
        agentPhoneNumber: processedEvent.agentPhoneNumber,
        customerPhoneNumber: processedEvent.customerPhoneNumber,
        timestamp: processedEvent.timestamp,
        eventSent,
        bothParticipantsIdentified: processedEvent.sessionData.bothParticipantsIdentified,
        sessionContext: processedEvent.sessionData,
      },
    });
  } catch (error) {
    console.error('❌ Error processing webhook event:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing webhook event',
      error: error.message,
    });
  }
});


// Helper function to get all employee phone numbers (unchanged)
// const getAllEmployeePhoneNumbers = async () => {
//   try {
//     const employees = await Employee.findAll({
//       attributes: ['EmployeePhone'],
//       where: {
//         EmployeePhone: {
//           [Op.ne]: null,
//         },
//       },
//       raw: true,
//     });

//     const numbers = employees.map((emp) => emp.EmployeePhone).filter((phone) => phone);
//     console.log(`📋 Loaded ${numbers.length} employee numbers from database`);
//     return numbers;
//   } catch (error) {
//     console.error('Error fetching employee phone numbers:', error);
//     return [];
//   }
// };
const getAllEmployeePhoneNumbers = async () => {
  try {
    const employees = await Employee.findAll({
      attributes: ['EmployeePhone'],
      where: {
        EmployeePhone: {
          [Op.ne]: null,
        },
      },
      raw: true,
    });

    const numbers = employees.map((emp) => emp.EmployeePhone).filter((phone) => phone);
    
    // Enhanced logging to see exact values and their normalized forms
    console.log(`📋 Loaded ${numbers.length} employee numbers from database:`);
    numbers.forEach((num, idx) => {
      const normalized = String(num).replace(/\D/g, '');
      console.log(`   [${idx}] "${num}" → normalized: "${normalized}" (type: ${typeof num}, length: ${num.length})`);
    });
    
    return numbers;
  } catch (error) {
    console.error('Error fetching employee phone numbers:', error);
    return [];
  }
};

// API endpoint to get session data (for debugging)
router.get('/webhook/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const sessionData = getSessionData(sessionId);

  res.json({
    success: true,
    data: sessionData,
    exists: callSessions.has(sessionId),
  });
});

// API endpoint to get all active sessions (for monitoring)
router.get('/webhook/sessions', (req, res) => {
  const sessions = Array.from(callSessions.entries()).map(([id, data]) => ({
    sessionId: id,
    ...data,
  }));

  res.json({
    success: true,
    count: sessions.length,
    data: sessions,
  });
});

// Post-call data webhook
router.post('/webhook/call-end', async (req, res) => {
  try {
    const data = req.body;
    console.log('=== POST-CALL DATA WEBHOOK RECEIVED ===');
    console.log('Received post-call data:', data);
    // res.json({ success: true, message: 'Post-call data webhook received', data: data });

    // Validate required fields
    const caller = data.participants?.find((p) => p.participantType === 'From');
    const destination = data.participants?.find((p) => p.participantType === 'To');

    const callData = {
      Date: data.Date,
      Time: data.Time,
      CallId: data.Session_ID,
      Caller_ID: data.Caller_ID,
      Caller_Number: data.Caller_Number || caller?.participantAddress,
      Destination_CLI: data.Destination_CLI,
      Destination_Number: data.Destination_Number || destination?.participantAddress,
      Caller_Waiting_Time: data.Caller_Waiting_Time,
      Conversation_Duration: data.Conversation_Duration,
      Overall_Call_Status: data.Overall_Call_Status,
      Hangup_Cause: data.Hangup_Cause,
      Caller_Status: data.Caller_Status,
      Destination_Status: data.Destination_Status,
      Caller_Circle_Name: data.Caller_Circle_Name,
      Caller_Operator_Name: data.Caller_Operator_Name,
      Overall_Call_Duration: data.Overall_Call_Duration,
      Call_Type: data.Call_Type || data.callType,
      Destination_Name: data.Destination_Name || destination?.participantName,
      Caller_Name: data.Caller_Name,
      Caller_Status_Detail: data.Caller_Status_Detail,
      DTMF_Capture: data.DTMF_Capture,
      Destination_Status_Detail: data.Destination_Status_Detail,
      Destination_Circle_Name: data.Destination_Circle_Name,
      Destination_Operator_Name: data.Destination_Operator_Name,
      Caller_Retry_Count: data.Caller_Retry_Count?.toString() || caller?.retryCount?.toString(),
      Destination_Retry_Count:
        data.Destination_Retry_Count?.toString() || destination?.retryCount?.toString(),
      Caller_Duration: data.Caller_Duration || data.Billable_Duration,
      Pulse_Count: data.Pulse_Count?.toString() || caller?.pulse?.toString(),
      Recording: data.Recording,
      // c_party_number: destination?.participantAddress,
      // c_party_status: destination?.status,
      // extra: data.Customer_Name,
      // extra_1: data.customerId,
      // extra_2: data.overallCallStatus,
      // extra_3: data.startTime?.toString(),
    };

    // Check if call already exists
    const existingCall = await Call.findOne({ where: { CallId: callData.CallId } });

    if (existingCall) {
      await existingCall.update(callData);
      console.log(`✅ Call with ID ${callData.CallId} updated successfully.`);
    } else {
      await Call.create(callData);
      console.log(`✅ Call with ID ${callData.CallId} saved successfully.`);
    }

  
    return res.status(200).json({
      success: true,
      message: existingCall ? 'Call updated successfully.' : 'Call saved successfully.',
    });
  } catch (error) {
    console.error('Error saving call:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save call.',
      error: error.message,
    });
  }
});

router.post("/make-call", async (req, res) => {
  try {
    const payload = req.body;

    const AppId = "ABIS_PROTE_kAvtAXD5HLBa8Eq2ob2J";
    const APIKey = "{x601}f,%BFAoMwX8Q";
    const requestTimeStamp = new Date().toUTCString();

    const ssha = CryptoJS.SHA256(JSON.stringify(payload));
    const requestContentBase64String = CryptoJS.enc.Base64.stringify(ssha);
    const digestValue = "SHA-256=" + requestContentBase64String;

    const signatureRawData =
      "x-date: " + requestTimeStamp + "\n" + "digest: " + digestValue;

    const signature = CryptoJS.HmacSHA256(signatureRawData, APIKey);
    const encodeSignature = CryptoJS.enc.Base64.stringify(signature);

    const hmacKey =
      "hmac username=" +
      JSON.stringify(AppId) +
      ", algorithm=" +
      JSON.stringify("hmac-sha256") +
      ", headers=" +
      JSON.stringify("x-date digest") +
      ", signature=" +
      JSON.stringify(encodeSignature);

    const response = await axios.post(
      "https://iqvoice.airtel.in/gateway/airtel-xchange/v2/click-to-call",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: hmacKey,
          "X-Date": requestTimeStamp,
          Digest: digestValue,
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//webhook for C2C
router.post('/webhook/call-event', async (req, res) => {
  try {
    console.log('=== OUTGOING CALL WEBHOOK EVENT RECEIVED ===');
    console.log('Received webhook data:', JSON.stringify(req.body, null, 2));
    console.log('==============================');

    const data = req.body;
    const employeeNumbers = await getAllEmployeePhoneNumbers();

    // Process outgoing call events
    const processOutgoingCallEvent = (eventData) => {
      const { eventType, event, participantAddress, vmSessionId, metaData } = eventData;

      // --- RECORD EVENTS (keep your logic unchanged) ---
      if (eventType === 'RECORD') {
        const recordingEvent = {
          eventType: event.toLowerCase(),
          callId: vmSessionId,
          sessionId: vmSessionId,
          timestamp: metaData?.timestamp || Date.now(),
          recordingName: metaData?.recordingName,
          direction: 'outgoing',
          eventDetails: {
            originalEvent: `${eventType}/${event}`,
            recordingPath: metaData?.recordingName,
          },
          metadata: {
            asteriskId: metaData?.asteriskId,
            clientCorrelationId: eventData.clientCorrelationId,
            originalTimestamp: metaData?.timestamp,
            processedAt: Date.now(),
          },
        };
        return recordingEvent;
      }

      // --- CALL EVENTS ---
      if (eventType === 'CALL') {
        const allowedEvents = ['CalledNumber', 'Ringing', 'Answer', 'Disconnected', 'NotReachable'];
        if (!allowedEvents.includes(event)) return null;

        const sessionData = getSessionData(vmSessionId) || {};
        const isParticipantAgent = employeeNumbers.includes(participantAddress);

        let agentNumber = sessionData.agentPhoneNumber || null;
        let customerNumber = sessionData.customerPhoneNumber || null;

        if (event === 'CalledNumber' && isParticipantAgent) {
          agentNumber = participantAddress;
        } else if (event === 'CalledNumber' && !isParticipantAgent) {
          customerNumber = participantAddress;
        }

        // Update session state
        updateSessionData(vmSessionId, {
          agentPhoneNumber: agentNumber,
          customerPhoneNumber: customerNumber,
          direction: 'outgoing',
          ...(event === 'Ringing' && { callRinging: true }),
          ...(event === 'Answer' && { callAnswered: true, answerTime: metaData?.timestamp }),
          ...(event === 'Disconnected' && {
            callEnded: true,
            endTime: metaData?.timestamp,
            disconnectedBy: isParticipantAgent ? 'agent' : 'customer',
            causeCode: metaData?.causeCode,
            causeDescription: metaData?.causeCodeDescription,
          }),
          events: [
            ...(sessionData.events || []),
            { event, timestamp: metaData?.timestamp, participantAddress },
          ],
        });

        const finalSessionData = getSessionData(vmSessionId);

        return {
          eventType: event.toLowerCase(),
          callId: vmSessionId,
          sessionId: vmSessionId,
          timestamp: metaData?.timestamp || Date.now(),
          direction: 'outgoing',
          agentPhoneNumber: finalSessionData.agentPhoneNumber,
          customerPhoneNumber: finalSessionData.customerPhoneNumber,
          eventDetails: {
            participantAddress,
            participantType: isParticipantAgent ? 'agent' : 'customer',
            originalEvent: `${eventType}/${event}`,
          },
          ...(event === 'Disconnected' && {
            disconnectedBy: isParticipantAgent ? 'agent' : 'customer',
            causeCode: metaData?.causeCode,
            causeDescription: metaData?.causeCodeDescription,
            sipCode: metaData?.sipCode,
          }),
          sessionData: finalSessionData,
          metadata: {
            asteriskId: metaData?.asteriskId,
            clientCorrelationId: eventData.clientCorrelationId,
            originalTimestamp: metaData?.timestamp,
            processedAt: Date.now(),
          },
        };
      }

      return null;
    };

    // Process the webhook event
    const processedEvent = processOutgoingCallEvent(data);
    if (!processedEvent) {
      return res.status(200).json({ success: true, message: 'Event skipped' });
    }

    // --- SOCKET EMIT LOGIC ---
    const sendOutgoingEventToFrontend = (eventData) => {
      const { eventType, agentPhoneNumber, customerPhoneNumber, callId } = eventData;

      let socketEventType;
      let eventPayload = { ...eventData, timestamp: new Date().toISOString() };

      switch (eventType) {
        case 'answer': // 🔴 CONNECTED
          socketEventType = 'outgoing-call-connected';
          eventPayload = {
            ...eventPayload,
            message: `Outgoing call connected: ${agentPhoneNumber} ↔ ${customerPhoneNumber}`,
            callStatus: 'connected',
          };
          break;

        case 'disconnected': // 🔴 DISCONNECTED
          socketEventType = 'outgoing-call-disconnected';
          eventPayload = {
            ...eventPayload,
            message: `Outgoing call disconnected: ${agentPhoneNumber} ↔ ${customerPhoneNumber}`,
            callStatus: 'disconnected',
          };
          break;

        case 'notreachable': // 🔴 NOT REACHABLE
          socketEventType = 'outgoing-call-not-reachable';
          eventPayload = {
            ...eventPayload,
            message: `Outgoing call not reachable: ${agentPhoneNumber} → ${customerPhoneNumber}`,
            callStatus: 'not_reachable',
          };
          break;

        // Keep your existing handlers for ringing, initiated, recording, etc.
        case 'callednumber':
        case 'ringing':
        case 'recordingstarted':
        case 'recordingfinished':
          // leave as is from your code
          break;
      }

      if (socketEventType) {
        req.io.emit(socketEventType, eventPayload);
        console.log(`📡 Emitted '${socketEventType}'`, eventPayload);
      }
    };

    sendOutgoingEventToFrontend(processedEvent);

    // Clean up session if call ended
    if (processedEvent.eventType === 'disconnected') {
      setTimeout(() => {
        callSessions.delete(processedEvent.callId);
        console.log(`🗑️ Outgoing session ${processedEvent.callId} cleaned up after call end`);
      }, 5 * 60 * 1000);
    }

    return res.status(200).json({
      success: true,
      message: 'Outgoing call event processed successfully',
      data: processedEvent,
    });

  } catch (error) {
    console.error('❌ Error processing outgoing call webhook event:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});


// webhook for CDR data (post call details)
router.post('/webhook/cdr-event', async (req, res) => {
  try {
    console.log('=== CDR WEBHOOK EVENT RECEIVED ===');
    const payload = req.body;
    console.log('Received CDR data:', JSON.stringify(req.body, null, 2));
    console.log('==================================');

    // Map payload to DB structure
    const callLogData = mapCdrResponseToModel(payload);

    // Save to DB
    const savedLog = await CallLogs.create(callLogData);

    console.log('✅ Call Log saved:', savedLog.id);

    return res.status(200).json({ success: true, message: 'CDR Webhook received' });

  } catch (error) {
    console.error('❌ Error processing CDR webhook event:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing CDR webhook event',
      error: error.message,
    });
  }
});



module.exports = { router };
