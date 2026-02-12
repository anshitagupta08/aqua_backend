const express = require('express');
const { getAllCallAttemptStatus } = require('../../controllers/Form/CallStatusController');
// const { userAuth } = require('../../middlewares/auth');

const router = express.Router();

router.get('/call-status', getAllCallAttemptStatus);

module.exports = router;
