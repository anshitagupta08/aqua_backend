const { Router } = require('express');
const { asyncHandler } = require('../../utils/asyncHandler');
// const { userAuth } = require('../../middlewares/auth');
const { getAllProducts, getProductById } = require('../../controllers/Customer/productController');

const router = Router();

router.get('/products', asyncHandler(getAllProducts));
router.get('/product/:id', asyncHandler(getProductById));
// router.get('/order-items/:id', userAuth, asyncHandler(getOrderById));

module.exports = router;
