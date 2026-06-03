const express = require('express');
const router = express.Router();
const caregiverController = require('../controllers/caregiver.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const documentUpload = require('../middleware/documentUpload.middleware');

// All routes are protected and caregiver only
router.use(protect);
router.use(authorize('caregiver'));

// Dashboard routes
router.get('/dashboard/stats', caregiverController.getDashboardStats);
router.get('/dashboard/performance', caregiverController.getPerformanceMetrics);
router.get('/dashboard/satisfaction', caregiverController.getClientSatisfaction);
router.get('/dashboard/feedback', caregiverController.getRecentFeedback);

// Profile routes
router.get('/profile', caregiverController.getProfile);
router.put('/profile', caregiverController.updateProfile);

// Assignment routes
router.get('/assigned-receivers', caregiverController.getAssignedReceivers);

// Status routes
router.patch('/status', caregiverController.updateStatus);

// Document upload route
router.post(
  '/documents',
  documentUpload.fields([
    { name: 'idProof', maxCount: 1 },
    { name: 'policeVerification', maxCount: 1 },
    { name: 'medicalCertificate', maxCount: 1 },
    { name: 'qualificationDocs', maxCount: 5 },
  ]),
  caregiverController.uploadDocuments,
);

module.exports = router;
