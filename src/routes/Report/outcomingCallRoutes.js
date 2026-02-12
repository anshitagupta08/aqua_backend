const express = require('express');
const { getOutcomingCallLogs, exportOutgoingCallLogs, getEmployeesByRole } = require('../../controllers/Report/OutcomingCall');
// const { userAuth } = require('../../middlewares/auth');

const router = express.Router();

// Get incoming calls with filters and pagination
router.get('/outcoming-call-details', getOutcomingCallLogs);

// Get call details by ID
// router.get('/:callId', callController.getCallById);

// Get available agents for dropdown
router.get('/agents/list/:roleId', getEmployeesByRole);

// Export calls data
router.get('/export/outgoing-call', exportOutgoingCallLogs);

module.exports = router;