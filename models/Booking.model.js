const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
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
      enum: [
        'Personal Care',
        'Medical Support',
        'Companionship',
        'Household Tasks',
        'Transportation',
        'Physical Therapy',
        'Meal Preparation',
        'Other',
      ],
      required: [true, 'Service type is required'],
    },
    date: {
      type: Date,
      required: [true, 'Booking date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    duration: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
    },
    needs: {
      type: String,
      default: '',
    },
    hourlyRate: {
      type: Number,
      required: [true, 'Hourly rate is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    responseDate: {
      type: Date,
    },
    completionDate: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
bookingSchema.index({ caregiverId: 1, status: 1 });
bookingSchema.index({ careReceiverId: 1, status: 1 });
bookingSchema.index({ date: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
