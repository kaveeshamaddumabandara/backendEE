const express = require('express');
const router = express.Router();
const careReceiverController = require('../controllers/carereceiver.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes are protected and care receiver only
router.use(protect);
router.use(authorize('carereceiver'));

// Dashboard routes
router.get('/dashboard', careReceiverController.getDashboardStats);

// Profile routes
router.get('/profile', careReceiverController.getProfile);
router.put('/profile', careReceiverController.updateProfile);

// Caregiver routes
router.get('/assigned-caregivers', careReceiverController.getAssignedCaregivers);
router.get('/available-caregivers', careReceiverController.getAvailableCaregivers);

module.exports = router;
