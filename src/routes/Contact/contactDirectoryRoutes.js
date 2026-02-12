const express = require('express');
const { getContactDirectory } = require('../../controllers/Contact/contactDirectoryController');
// const { userAuth } = require('../../middlewares/auth');

const router = express.Router();

router.get('/contact-directory', getContactDirectory);

module.exports = router;
