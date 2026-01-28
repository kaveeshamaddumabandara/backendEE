const express = require('express');
const router = express.Router();
const careReceiverController = require('../controllers/carereceiver.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes are protected and care receiver only
router.use(protect);
router.use(authorize('carereceiver'));

// Profile routes
router.get('/profile', careReceiverController.getProfile);
router.put('/profile', careReceiverController.updateProfile);

// Caregiver routes
router.get('/assigned-caregivers', careReceiverController.getAssignedCaregivers);

module.exports = router;
