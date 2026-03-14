const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// User routes - authenticated users can submit and view their own feedback
router.post('/submit', verifyToken, feedbackController.submitFeedback);
router.get('/my-feedbacks', verifyToken, feedbackController.getMyFeedbacks);

// Admin routes - only admins can view all feedbacks and manage them
router.get('/all', verifyToken, isAdmin, feedbackController.getAllFeedbacks);
router.get('/stats', verifyToken, isAdmin, feedbackController.getFeedbackStats);
router.get('/:id', verifyToken, isAdmin, feedbackController.getFeedbackById);
router.put('/:id/status', verifyToken, isAdmin, feedbackController.updateFeedbackStatus);
router.delete('/:id', verifyToken, isAdmin, feedbackController.deleteFeedback);

module.exports = router;
