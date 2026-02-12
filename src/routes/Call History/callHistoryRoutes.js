const express = require('express');
const { downloadAllCallHistoryReports ,downloadCallHistoryReportById, getCallHistoryReport } = require('../../controllers/Call History/callHistory');
// const { userAuth } = require('../../middlewares/auth');

const router = express.Router();

router.get('/call-history', getCallHistoryReport);
router.get('/call-history/download/:id', downloadCallHistoryReportById);
router.get('/call-history/download-all', downloadAllCallHistoryReports);

module.exports = router;
