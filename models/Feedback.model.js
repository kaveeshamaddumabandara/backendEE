const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  feedbackType: {
    type: String,
    required: true,
    enum: ['General', 'Suggestion', 'Issue', 'Complaint'],
    default: 'General',
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Platform Experience',
      'Feature Request',
      'Technical Issue',
      'Service Quality',
      'Payment',
      'Customer Support',
      'Other',
    ],
    default: 'Other',
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending',
  },
  adminNotes: {
    type: String,
    maxlength: 500,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ category: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
