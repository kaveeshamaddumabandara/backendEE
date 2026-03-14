const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes are protected and admin only
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);
router.patch('/users/:id/status', adminController.updateUserStatus);

// Caregiver management
router.get('/caregivers', adminController.getAllCaregivers);

// Care receiver management
router.get('/carereceivers', adminController.getAllCareReceivers);

// Pending requests management
router.get('/pending-requests', adminController.getPendingRequests);
router.patch('/requests/:id/approve', adminController.approveRequest);
router.patch('/requests/:id/reject', adminController.rejectRequest);

module.exports = router;
