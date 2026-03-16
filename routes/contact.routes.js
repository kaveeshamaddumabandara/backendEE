const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');

// @route   POST /api/contact/send
// @desc    Submit contact form
// @access  Public
router.post('/send', contactController.submitContactForm);

module.exports = router;
