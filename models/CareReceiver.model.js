const mongoose = require('mongoose');

const careReceiverSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    notes: String,
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    prescribedBy: String,
    startDate: Date,
    endDate: Date,
  }],
  allergies: [String],
  mobilityLevel: {
    type: String,
    enum: ['independent', 'walker', 'wheelchair', 'bedridden'],
    default: 'independent',
  },
  cognitiveStatus: {
    type: String,
    enum: ['normal', 'mild-impairment', 'moderate-impairment', 'severe-impairment'],
    default: 'normal',
  },
  dietaryRestrictions: [String],
  assignedCaregivers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caregiver',
  }],
  primaryCaregiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caregiver',
  },
  careNeeds: [{
    type: String,
    enum: ['medication', 'bathing', 'feeding', 'mobility', 'companionship', 'medical-monitoring', 'housekeeping'],
  }],
  insuranceInfo: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    expiryDate: Date,
  },
  doctorInfo: {
    name: String,
    phone: String,
    email: String,
    specialization: String,
    hospital: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('CareReceiver', careReceiverSchema);
