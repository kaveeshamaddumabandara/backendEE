const express = require('express');
const router = express.Router();
const {
  createOrUpdateDocumentation,
  getDocumentationByBooking,
  getCaregiverDocumentations,
  getCareReceiverDocumentations,
  deleteDocumentation,
  addTodoItem,
  updateTodoItem,
  deleteTodoItem,
  getTodoList,
} = require('../controllers/careDocumentation.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(protect);

// Care documentation routes
router.post(
  '/bookings/:bookingId/documentation',
  authorize('caregiver'),
  createOrUpdateDocumentation
);

router.get(
  '/bookings/:bookingId/documentation',
  authorize('caregiver', 'carereceiver'),
  getDocumentationByBooking
);

router.get(
  '/caregiver/documentations',
  authorize('caregiver'),
  getCaregiverDocumentations
);

router.get(
  '/carereceiver/documentations',
  authorize('carereceiver'),
  getCareReceiverDocumentations
);

router.delete(
  '/documentations/:documentationId',
  authorize('caregiver'),
  deleteDocumentation
);

// Todo list routes
router.get(
  '/bookings/:bookingId/todos',
  authorize('caregiver', 'carereceiver'),
  getTodoList
);

router.post(
  '/bookings/:bookingId/todos',
  authorize('caregiver'),
  addTodoItem
);

router.put(
  '/bookings/:bookingId/todos/:todoId',
  authorize('caregiver'),
  updateTodoItem
);

router.delete(
  '/bookings/:bookingId/todos/:todoId',
  authorize('caregiver'),
  deleteTodoItem
);

module.exports = router;
