const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUserGrowth,
  getUserDistribution,
  getRecentActivities,
  getPlatformActivity,
  getRevenueTrends,
} = require('../controllers/dashboard.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/user-growth', getUserGrowth);
router.get('/user-distribution', getUserDistribution);
router.get('/recent-activities', getRecentActivities);
router.get('/platform-activity', getPlatformActivity);
router.get('/revenue-trends', getRevenueTrends);

module.exports = router;
