const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  caregiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caregiver',
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  hoursWorked: {
    type: Number,
    default: 0,
    min: 0,
  },
  currency: {
    type: String,
    default: 'LKR',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'LKR']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['Credit Card', 'Debit Card', 'Bank Transfer']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    required: [true, 'Transaction ID is required']
  },
  description: {
    type: String,
    required: [true, 'Payment description is required']
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: ['Hourly Care', 'Care Package', 'Emergency Care', 'Subscription', 'Specialized Care', 'Companion Care']
  },
  paymentType: {
    type: String,
    required: true,
    enum: ['registration_fee', 'booking_commission', 'service_payment'],
    default: 'service_payment'
  },
  paidTo: {
    type: String,
    enum: ['admin', 'caregiver', 'platform'],
    default: 'platform'
  },
  bookingCount: {
    type: Number,
    default: 0,
    min: 0
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

// Generate unique transaction ID
paymentSchema.statics.generateTransactionId = function() {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TXN-${year}-${month}-${random}`;
};

module.exports = mongoose.model('Payment', paymentSchema);
