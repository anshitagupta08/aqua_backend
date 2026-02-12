const express = require('express');
const { getAllCallSourceType } = require('../../controllers/Form/SourceTypeController');
// const { userAuth } = require('../../middlewares/auth');

const router = express.Router();

router.get('/source-types', getAllCallSourceType);

module.exports = router;
