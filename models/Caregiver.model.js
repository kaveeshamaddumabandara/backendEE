const mongoose = require('mongoose');

const caregiverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  qualification: {
    type: String,
    required: [true, 'Please provide qualification'],
  },
  experience: {
    type: Number,
    required: [true, 'Please provide years of experience'],
    min: 0,
  },
  specialization: [{
    type: String,
  }],
  skills: [{
    type: String,
  }],
  education: {
    type: String,
    default: '',
  },
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    documentUrl: String,
  }],
  certificationsText: {
    type: String,
    default: '',
  },
  availability: {
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    }],
    timeSlots: [{
      start: String,
      end: String,
    }],
  },
  availabilityType: {
    type: String,
    enum: ['full-time', 'part-time', 'weekends only', 'flexible'],
    default: 'flexible',
  },
  hasTransportation: {
    type: Boolean,
    default: false,
  },
  travelRadius: {
    type: String,
    default: '5',
  },
  hourlyRate: {
    type: Number,
    min: 0,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  assignedCareReceivers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CareReceiver',
  }],
  registrationFeePaid: {
    type: Boolean,
    default: false,
  },
  registrationFeeAmount: {
    type: Number,
    default: 1000, // LKR 1000
  },
  registrationFeePaymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  totalBookingsCompleted: {
    type: Number,
    default: 0,
  },
  lastCommissionPaymentDate: {
    type: Date,
  },
  lastCommissionPaymentBookingCount: {
    type: Number,
    default: 0,
  },
  commissionRate: {
    type: Number,
    default: 500, // LKR 500 per 20 bookings
  },
  commissionPaymentHistory: [{
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    amount: Number,
    bookingCount: Number,
    paidAt: Date,
  }],
  status: {
    type: String,
    enum: ['available', 'on-duty', 'unavailable'],
    default: 'available',
  },
  backgroundCheckStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed'],
    default: 'pending',
  },
  languages: [String],
  bio: {
    type: String,
    default: '',
  },
  idProof: {
    type: String,
    default: '',
  },
  policeVerification: {
    type: String,
    default: '',
  },
  medicalCertificate: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Caregiver', caregiverSchema);
