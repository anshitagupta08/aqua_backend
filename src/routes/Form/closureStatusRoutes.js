const express = require('express');
const { getAllFinalClosureStatus } = require('../../controllers/Form/ClosureStatusController');
// const { userAuth } = require('../../middlewares/auth');

const router = express.Router();

router.get('/closure-status', getAllFinalClosureStatus);

module.exports = router;
