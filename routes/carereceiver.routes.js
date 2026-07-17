const express = require('express');
const router = express.Router();
const careReceiverController = require('../controllers/carereceiver.controller');
const bookingController = require('../controllers/booking.controller');
const bookingRequestController = require('../controllers/bookingRequest.controller');
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

// Booking routes
router.get('/my-bookings', bookingController.getCareReceiverBookings);
router.post('/bookings', bookingController.createBooking);
router.post('/booking-request', bookingRequestController.createBookingRequest);
router.get('/my-booking-requests', bookingRequestController.getMyBookingRequests);

module.exports = router;
