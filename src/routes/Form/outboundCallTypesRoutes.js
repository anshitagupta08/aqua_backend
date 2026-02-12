const express = require('express');
const { getAllOutboundCallTypes } = require('../../controllers/Form/OutboundCallTypeController');
// const { userAuth } = require('../../middlewares/auth');

const router = express.Router();

router.get('/outbound-call-types', getAllOutboundCallTypes);

module.exports = router;
