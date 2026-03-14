const express = require('express');
const router = express.Router();
const {
  getPendingRequests,
  approveRequest,
  rejectRequest,
  getAllRequests,
} = require('../controllers/bookingRequest.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Caregiver routes
router.get('/pending-requests', authorize('caregiver'), getPendingRequests);
router.get('/requests', authorize('caregiver'), getAllRequests);
router.post('/requests/:id/approve', authorize('caregiver'), approveRequest);
router.post('/requests/:id/reject', authorize('caregiver'), rejectRequest);

module.exports = router;
