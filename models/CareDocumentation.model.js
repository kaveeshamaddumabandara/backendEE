const mongoose = require('mongoose');

const todoItemSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Todo text is required'],
  },
  completed: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const careDocumentationSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
    },
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
    servicesProvided: [{
      type: String,
      enum: [
        'Medication Administration',
        'Vital Signs Monitoring',
        'Personal Hygiene',
        'Meal Preparation',
        'Mobility Assistance',
        'Companionship',
        'Physical Therapy',
        'Wound Care',
      ],
    }],
    vitalSigns: {
      bloodPressure: {
        type: String,
        default: '',
      },
      temperature: {
        type: String,
        default: '',
      },
      heartRate: {
        type: String,
        default: '',
      },
      oxygenLevel: {
        type: String,
        default: '',
      },
    },
    medicationAdministered: [{
      type: String,
    }],
    mealsProvided: [{
      type: String,
    }],
    activitiesPerformed: [{
      type: String,
    }],
    behavioralObservations: {
      type: String,
      default: '',
    },
    incidents: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    todoList: [todoItemSchema],
    documentedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
careDocumentationSchema.index({ bookingId: 1 });
careDocumentationSchema.index({ caregiverId: 1 });
careDocumentationSchema.index({ careReceiverId: 1 });
careDocumentationSchema.index({ documentedAt: -1 });

module.exports = mongoose.model('CareDocumentation', careDocumentationSchema);
