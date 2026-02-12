const { Router } = require('express');
const { asyncHandler } = require('../../utils/asyncHandler');
const {
  customers,
  getCustomerOrders,
  getCustomerStats,
  getCustomerSummary,
  getDashboardSummary,
  createCustomer,
  checkCustomerByPhone,
  getCustomerById,
} = require('../../controllers/Customer/customerController');
// const { userAuth } = require('../../middlewares/auth');

const router = Router();

router.get('/customer', asyncHandler(customers));
router.get('/customer/:id', asyncHandler(getCustomerById));
router.get('/:id/orders', asyncHandler(getCustomerOrders));
router.get('/customer-stats', asyncHandler(getCustomerStats));
router.get('/customer-summary/:id', asyncHandler(getCustomerSummary));
router.get('/dashboard-summary', asyncHandler(getDashboardSummary));

router.post('/customer', asyncHandler(createCustomer));
router.get('/check-phone', asyncHandler(checkCustomerByPhone));

module.exports = router;
