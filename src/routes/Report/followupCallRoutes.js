const express = require('express');
const { getFollowUpCalls, getHistoryByNumber, updateFollowUpById } = require('../../controllers/Report/FollowUpCalls');
// const { userAuth } = require('../../middlewares/auth');

const router = express.Router();

// Get incoming calls with filters and pagination
router.get('/followup-call-details', getFollowUpCalls);

router.get('/call-history-details', getHistoryByNumber);

router.post('/follow-up-update/:type/:id', updateFollowUpById);

module.exports = router;