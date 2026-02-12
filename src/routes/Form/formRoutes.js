const express = require('express');
const { test, createFormDetail } = require('../../controllers/Form/FormController');
const { createOutboundCall } = require('../../controllers/Form/OutboundFormController');
const upload = require('../../middlewares/upload');

const router = express.Router();

router.post('/form-details', upload.array('attachments', 10), createFormDetail);

router.post('/outbound-form-details', createOutboundCall);

module.exports = router;
