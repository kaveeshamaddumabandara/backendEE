const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'caregiver_registration',
        'registration_fee_paid',
        'new_booking',
        'booking_completed',
        'new_feedback',
        'new_contact',
        'other',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    // Optional reference to the triggering document
    relatedId: { type: mongoose.Schema.Types.ObjectId },
    relatedModel: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
