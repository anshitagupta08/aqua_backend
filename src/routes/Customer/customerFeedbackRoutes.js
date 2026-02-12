const { Router } = require('express');
const { asyncHandler } = require('../../utils/asyncHandler');
const {
  createCustomerFeedback,
  getCustomerFeedback,
} = require('../../controllers/Customer/customerFeedbackController');
// const { userAuth } = require('../middlewares/auth');

const router = Router();

router.get('/all-feedback', asyncHandler(getCustomerFeedback));
router.post('/new-feedback', asyncHandler(createCustomerFeedback));

module.exports = router;
