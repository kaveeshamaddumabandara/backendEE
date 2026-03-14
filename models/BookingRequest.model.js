const mongoose = require('mongoose');

const bookingRequestSchema = new mongoose.Schema({
  caregiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Caregiver ID is required'],
  },
  careReceiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Care receiver ID is required'],
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: ['Medical Support', 'Personal Care', 'Physical Therapy', 'Companionship', 'Other'],
  },
  requestedDate: {
    type: Date,
    required: [true, 'Requested date is required'],
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
  },
  specialNeeds: {
    type: String,
    default: '',
  },
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly rate is required'],
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  responseDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for faster queries
bookingRequestSchema.index({ caregiverId: 1, status: 1 });
bookingRequestSchema.index({ careReceiverId: 1, status: 1 });

module.exports = mongoose.model('BookingRequest', bookingRequestSchema);
