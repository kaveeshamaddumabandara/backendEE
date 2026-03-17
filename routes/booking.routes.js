const express = require('express');
const router = express.Router();
const {
  getCaregiverBookings,
  getCareReceiverBookings,
  getPendingBookings,
  approveBooking,
  rejectBooking,
  createBooking,
  completeBooking,
} = require('../controllers/booking.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Caregiver routes
router.get('/bookings', authorize('caregiver'), getCaregiverBookings);
router.get('/bookings/pending', authorize('caregiver'), getPendingBookings);
router.post('/bookings/:id/approve', authorize('caregiver'), approveBooking);
router.post('/bookings/:id/reject', authorize('caregiver'), rejectBooking);
router.post('/bookings/:id/complete', authorize('caregiver'), completeBooking);

// Care receiver routes
router.get('/my-bookings', authorize('carereceiver'), getCareReceiverBookings);
router.post('/bookings', authorize('carereceiver'), createBooking);

module.exports = router;
