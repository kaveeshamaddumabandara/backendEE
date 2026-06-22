const express = require('express');
const router = express.Router();
const {
  getCaregiverBookings,
  getCareReceiverBookings,
  getCaregiverBookedSlots,
  getPendingBookings,
  approveBooking,
  rejectBooking,
  createBooking,
  createBookingPaymentIntent,
  completeBooking,
} = require('../controllers/booking.controller');
const { markRemainingPaymentReceivedByCaregiver } = require('../controllers/bookingPayment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Caregiver routes
router.get('/bookings', authorize('caregiver'), getCaregiverBookings);
router.get('/bookings/pending', authorize('caregiver'), getPendingBookings);
router.post('/bookings/:id/approve', authorize('caregiver'), approveBooking);
router.post('/bookings/:id/reject', authorize('caregiver'), rejectBooking);
router.post('/bookings/:id/complete', authorize('caregiver'), completeBooking);
router.post('/bookings/:id/remaining-payment', authorize('caregiver'), markRemainingPaymentReceivedByCaregiver);

// Care receiver routes
router.get('/caregivers/:caregiverId/booked-slots', authorize('carereceiver'), getCaregiverBookedSlots);
router.get('/my-bookings', authorize('carereceiver'), getCareReceiverBookings);
router.post('/bookings/payment-intent', authorize('carereceiver'), createBookingPaymentIntent);
router.post('/bookings', authorize('carereceiver'), createBooking);

module.exports = router;
