const express = require('express');
const { getAllOutcomeTag } = require('../../controllers/Form/OutcomeTagsController');
// const { userAuth } = require('../../middlewares/auth');

const router = express.Router();

router.get('/outcome-tags', getAllOutcomeTag);

module.exports = router;
