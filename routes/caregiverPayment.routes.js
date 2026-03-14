const express = require('express');
const router = express.Router();
const {
  getRegistrationFeeDetails,
  processRegistrationFeePayment,
  getCommissionStatus,
  processCommissionPayment,
  getPaymentHistory,
  getPaymentAnalytics,
  updateBookingCount,
} = require('../controllers/caregiverPayment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication and caregiver role
router.use(protect);
router.use(authorize('caregiver'));

// Registration fee routes
router.get('/registration-fee', getRegistrationFeeDetails);
router.post('/registration-fee', processRegistrationFeePayment);

// Commission routes
router.get('/commission-status', getCommissionStatus);
router.post('/commission', processCommissionPayment);

// Payment history
router.get('/history', getPaymentHistory);

// Payment analytics
router.get('/analytics', getPaymentAnalytics);

// Update booking count (internal use)
router.post('/update-booking-count', updateBookingCount);

module.exports = router;
