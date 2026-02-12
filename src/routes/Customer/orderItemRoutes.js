const { Router } = require('express');
const { asyncHandler } = require('../../utils/asyncHandler');
// const { userAuth } = require('../../middlewares/auth');
const { getAllOrderItems } = require('../../controllers/Customer/orderItemController');

const router = Router();

router.get('/order-items', asyncHandler(getAllOrderItems));
// router.get('/order-items/:id', userAuth, asyncHandler(getOrderById));

module.exports = router;
