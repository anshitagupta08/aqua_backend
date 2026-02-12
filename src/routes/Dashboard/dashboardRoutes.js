const { Router } = require('express');
const { asyncHandler } = require('../../utils/asyncHandler');
const {
  getRecentCalls,
  getFollowUpCalls,
} = require('../../controllers/Dashboard/dashboardController');
// const { userAuth } = require('../../middlewares/auth');

const router = Router();

router.get('/recent-calls', asyncHandler(getRecentCalls));
router.get('/followup-calls', asyncHandler(getFollowUpCalls));

module.exports = router;
