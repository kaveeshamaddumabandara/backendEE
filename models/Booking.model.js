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
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    advanceAmount: {
      type: Number,
      min: [0, 'Advance amount cannot be negative'],
      default: function defaultAdvanceAmount() {
        const total = Number(this.totalAmount || 0);
        return Number((total * 0.5).toFixed(2));
      },
    },
    remainingAmount: {
      type: Number,
      min: [0, 'Remaining amount cannot be negative'],
      default: function defaultRemainingAmount() {
        const total = Number(this.totalAmount || 0);
        return Number((total * 0.5).toFixed(2));
      },
    },
    advancePaymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    remainingPaymentStatus: {
      type: String,
      enum: ['pending_physical', 'completed_physical'],
      default: 'pending_physical',
    },
    advancePaymentIntentId: {
      type: String,
      default: '',
    },
    advancePaidAt: {
      type: Date,
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
