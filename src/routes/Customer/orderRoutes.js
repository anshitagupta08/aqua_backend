const { Router } = require('express');
const { asyncHandler } = require('../../utils/asyncHandler');
// const { userAuth } = require('../../middlewares/auth');
const { getAllOrders, getOrderById } = require('../../controllers/Customer/orderController');

const router = Router();

router.get('/orders', asyncHandler(getAllOrders));
router.get('/orders/:id', asyncHandler(getOrderById));

module.exports = router;
