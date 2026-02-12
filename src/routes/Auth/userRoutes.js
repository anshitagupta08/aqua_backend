const { Router } = require('express');
const { login, logout } = require('../../controllers/Auth/userController');
const { asyncHandler } = require('../../utils/asyncHandler');

const router = Router();

router.post('/login', asyncHandler(login));
router.post('/logout', asyncHandler(logout));

module.exports = router;
