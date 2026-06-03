const express = require('express');
const router = express.Router();
const {
  createPayment,
  getAllPayments,
  getPaymentById,
  getMyPayments,
  updatePaymentStatus,
  deletePayment,
  getPaymentStats,
  getStripeConfig,
} = require('../controllers/payment.controller');
const { protect, authorize, verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.get('/stripe/config', getStripeConfig);

// User routes
router.post('/', verifyToken, createPayment);
router.get('/my-payments', verifyToken, getMyPayments);
router.get('/:id', verifyToken, getPaymentById);

// Admin routes
router.get('/admin/all', verifyToken, isAdmin, getAllPayments);
router.get('/admin/stats', verifyToken, isAdmin, getPaymentStats);
router.put('/:id/status', verifyToken, isAdmin, updatePaymentStatus);
router.delete('/:id', verifyToken, isAdmin, deletePayment);

module.exports = router;
