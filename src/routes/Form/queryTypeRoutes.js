const express = require('express');
const { getAllQueryTypes } = require('../../controllers/Form/queryTypeController');
// const { userAuth } = require('../../middlewares/auth');

const router = express.Router();

router.get('/query-types', getAllQueryTypes);

module.exports = router;
