const mongoose = require('mongoose');

const addressSchema = {
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: String,
};

const caregiverProfileChangeRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pendingPhone: {
      type: String,
      trim: true,
    },
    pendingAddress: addressSchema,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

caregiverProfileChangeRequestSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model(
  'CaregiverProfileChangeRequest',
  caregiverProfileChangeRequestSchema,
);
