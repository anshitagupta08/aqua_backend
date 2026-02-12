const express = require('express');
const { getAllSupportTypes } = require('../../controllers/Form/supportTypeController');
// const { userAuth } = require('../../middlewares/auth');

const router = express.Router();

router.get('/support-types', getAllSupportTypes);

module.exports = router;
