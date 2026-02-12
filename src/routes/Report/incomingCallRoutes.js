const express = require('express');
const { getIncomingCalls, exportIncomingCalls } = require('../../controllers/Report/IncomingCalls');
// const { userAuth } = require('../../middlewares/auth');

const router = express.Router();

// Get incoming calls with filters and pagination
router.get('/incoming-call-details', getIncomingCalls);

// Get call details by ID
// router.get('/:callId', callController.getCallById);

// Get available agents for dropdown
// router.get('/agents/list', callController.getAvailableAgents);

// Export calls data
router.get('/export/incoming-call', exportIncomingCalls);

module.exports = router;

// app.js or server.js - Register routes
// const callRoutes = require('./routes/callRoutes');
// app.use('/api/calls', callRoutes);