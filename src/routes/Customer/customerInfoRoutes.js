const { Router } = require('express');
const { asyncHandler } = require('../../utils/asyncHandler');
const { customersInfo } = require('../../controllers/Customer/CustomerInfoController');
const { userAuth } = require('../../middlewares/auth');

const router = Router();

router.get('/customer-info', asyncHandler(customersInfo));

module.exports = router;
