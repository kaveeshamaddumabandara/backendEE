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
    enum: ['alzheimer', 'dementia', 'mobility', 'medical', 'companionship', 'hospice', 'other'],
  }],
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    documentUrl: String,
  }],
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
