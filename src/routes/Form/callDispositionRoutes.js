const express = require('express');
const { getAllCallDispositions } = require('../../controllers/Form/CallDispositionController');
// const { userAuth } = require('../../middlewares/auth');

const router = express.Router();

router.get('/call-dispositions', getAllCallDispositions);

module.exports = router;
